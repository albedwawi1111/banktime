import React, { useState, useMemo } from 'react';
import type { Employee, TrainingRecord, AppSettings } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from './icons';

interface TrainingManagerProps {
  employees: Employee[];
  trainingRecords: TrainingRecord[];
  settings: AppSettings;
  addTrainingRecord: (record: Omit<TrainingRecord, 'id'>) => void;
  updateTrainingRecord: (record: TrainingRecord) => void;
  deleteTrainingRecord: (id: string) => void;
  currentUser: Employee | null;
}

const EMPTY_TRAINING_STATE: Omit<TrainingRecord, 'id'> = {
  employeeIds: [],
  courseName: '',
  provider: '',
  location: '',
  startDate: '',
  endDate: '',
  status: 'Planned',
};

const TrainingManager: React.FC<TrainingManagerProps> = ({
  employees,
  trainingRecords,
  settings,
  addTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord,
  currentUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TrainingRecord | null>(null);
  const [formData, setFormData] = useState<Omit<TrainingRecord, 'id'>>(EMPTY_TRAINING_STATE);
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const canManageTraining = useMemo(() => 
    currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department',
    [currentUser]
  );

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  const filteredTrainingRecords = useMemo(() => {
    let records = trainingRecords;

    if (currentUser?.role === 'Employee') {
        records = records.filter(tr => tr.employeeIds.includes(currentUser.id));
    }

    if (statusFilter !== 'All') {
        records = records.filter(tr => tr.status === statusFilter);
    }
    
    if (searchTerm) {
        records = records.filter(tr => tr.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (dateFilter.start && dateFilter.end) {
        records = records.filter(tr => tr.startDate <= dateFilter.end && tr.endDate >= dateFilter.start);
    }
    
    return records.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [trainingRecords, currentUser, statusFilter, dateFilter, searchTerm]);

  const summaryCounts = useMemo(() => {
    return filteredTrainingRecords.reduce((acc, record) => {
        if (record.status === 'Planned') acc.planned++;
        else if (record.status === 'In Progress') acc.inProgress++;
        else if (record.status === 'Completed') acc.completed++;
        return acc;
    }, { planned: 0, inProgress: 0, completed: 0 });
  }, [filteredTrainingRecords]);


  const openModalForAdd = () => {
    setCurrentRecord(null);
    setFormData(EMPTY_TRAINING_STATE);
    setIsModalOpen(true);
  };

  const openModalForEdit = (record: TrainingRecord) => {
    setCurrentRecord(record);
    setFormData(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEmployeeSelectionChange = (employeeId: string) => {
    setFormData(prev => {
      const newEmployeeIds = prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter(id => id !== employeeId)
        : [...prev.employeeIds, employeeId];
      return { ...prev, employeeIds: newEmployeeIds };
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = employees.map(e => e.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => formData.employeeIds.includes(id));
    
    if (allFilteredSelected) {
        setFormData(prev => ({
            ...prev,
            employeeIds: prev.employeeIds.filter(id => !filteredIds.includes(id))
        }));
    } else {
        const newIds = [...new Set([...formData.employeeIds, ...filteredIds])];
         setFormData(prev => ({ ...prev, employeeIds: newIds }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.employeeIds.length === 0 || !formData.courseName) return;

    if (currentRecord) {
      updateTrainingRecord({ ...formData, id: currentRecord.id });
    } else {
      addTrainingRecord(formData);
    }
    handleCloseModal();
  };

  const StatusBadge = ({ status }: { status: 'Completed' | 'In Progress' | 'Planned' }) => {
    const statusInfo = {
      Completed: { text: 'مكتملة', classes: 'bg-[var(--success-bg)] text-[var(--success-text)]' },
      'In Progress': { text: 'قيد التنفيذ', classes: 'bg-[var(--warning-bg)] text-[var(--warning-text)]' },
      Planned: { text: 'مخطط لها', classes: 'bg-[var(--accent-color)]/20 text-[var(--accent-text)]' },
    };
    const { text, classes } = statusInfo[status];
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${classes}`}>{text}</span>;
  };

  const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
  const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
  
  const TrainingCard: React.FC<{ record: TrainingRecord }> = ({ record }) => {
        const [participantsVisible, setParticipantsVisible] = useState(false);
        const participantNames = record.employeeIds.map(id => employeeMap.get(id)).filter(Boolean);

        return (
            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg flex flex-col p-5 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold text-[var(--text-primary)] pr-2">{record.courseName}</h4>
                    <StatusBadge status={record.status} />
                </div>
                <div className="text-sm space-y-2 text-[var(--text-secondary)] mb-4 flex-grow">
                    <p><span className="font-semibold">المؤسسة:</span> {record.provider}</p>
                    <p><span className="font-semibold">المكان:</span> {record.location || '-'}</p>
                    <p><span className="font-semibold">التاريخ:</span> {record.startDate} إلى {record.endDate}</p>
                </div>
                
                <div className="border-t border-[var(--border-color)] pt-3">
                    <button 
                        onClick={() => setParticipantsVisible(!participantsVisible)}
                        className="w-full flex justify-between items-center text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        <span className="flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5"/>
                            المشاركون ({participantNames.length})
                        </span>
                        <svg className={`w-5 h-5 transform transition-transform ${participantsVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {participantsVisible && (
                        <div className="mt-2 pl-4 text-xs space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {participantNames.map((name, index) => <p key={index}>{name}</p>)}
                        </div>
                    )}
                </div>

                {canManageTraining && (
                    <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex justify-end gap-2">
                        <button onClick={() => openModalForEdit(record)} className="p-2 text-[var(--accent-text)] hover:bg-[var(--accent-color)]/10 rounded-full transition-colors"><PencilIcon /></button>
                        <button onClick={() => deleteTrainingRecord(record.id)} className="p-2 text-[var(--danger-text)] hover:bg-[var(--danger-text)]/10 rounded-full transition-colors"><TrashIcon /></button>
                    </div>
                )}
            </div>
        );
    };


  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]">التدريب والتطوير</h2>
        {canManageTraining && (
            <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
            <PlusIcon />
            إضافة سجل تدريبي
            </button>
        )}
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                  <label htmlFor="search-course" className={labelClasses}>بحث باسم الدورة</label>
                  <input id="search-course" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث..." className={inputClasses} />
              </div>
              <div>
                  <label htmlFor="status-filter" className={labelClasses}>الحالة</label>
                  <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputClasses}>
                      <option value="All">الكل</option>
                      <option value="Planned">مخطط لها</option>
                      <option value="In Progress">قيد التنفيذ</option>
                      <option value="Completed">مكتملة</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="start-date-filter" className={labelClasses}>من تاريخ</label>
                  <input id="start-date-filter" type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({...p, start: e.target.value}))} className={inputClasses} />
              </div>
              <div>
                  <label htmlFor="end-date-filter" className={labelClasses}>إلى تاريخ</label>
                  <input id="end-date-filter" type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({...p, end: e.target.value}))} className={inputClasses} />
              </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mt-4 pt-4 border-t border-[var(--border-color)]">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">مخطط لها</p>
                  <p className="text-2xl font-bold text-[var(--accent-text)]">{summaryCounts.planned}</p>
              </div>
              <div>
                  <p className="text-sm text-[var(--text-secondary)]">قيد التنفيذ</p>
                  <p className="text-2xl font-bold text-[var(--warning-text)]">{summaryCounts.inProgress}</p>
              </div>
              <div>
                  <p className="text-sm text-[var(--text-secondary)]">مكتملة</p>
                  <p className="text-2xl font-bold text-[var(--success-text)]">{summaryCounts.completed}</p>
              </div>
          </div>
      </div>

        {filteredTrainingRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainingRecords.map(record => (
                    <TrainingCard key={record.id} record={record} />
                ))}
            </div>
        ) : (
            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-8 text-center">
                <p className="text-[var(--text-muted)]">لا توجد سجلات تدريبية تطابق معايير البحث.</p>
            </div>
        )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentRecord ? 'تعديل سجل تدريبي' : 'إضافة سجل تدريبي جديد'} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          <div>
            <label htmlFor="courseName" className={labelClasses}>اسم الدورة/الورشة</label>
            <input type="text" name="courseName" id="courseName" value={formData.courseName} onChange={handleChange} required className={inputClasses}/>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">الموظفون المشاركون</label>
                {employees.length > 0 && (
                    <button type="button" onClick={handleSelectAllFiltered} className="text-xs text-[var(--accent-text)] hover:underline">
                        {employees.every(e => formData.employeeIds.includes(e.id)) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                )}
            </div>
            <div className="w-full h-40 bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md p-2 overflow-y-auto space-y-1">
                {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--bg-tertiery)] cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        checked={formData.employeeIds.includes(emp.id)}
                        onChange={() => handleEmployeeSelectionChange(emp.id)}
                        className="form-checkbox h-4 w-4 bg-[var(--bg-tertiary)] border-[var(--border-color-light)] rounded text-[var(--accent-color)] focus:ring-[var(--accent-color)] focus:ring-offset-[var(--bg-secondary)]"
                    />
                    <span className="text-[var(--text-primary)]">{emp.name}</span>
                    </label>
                ))}
                {employees.length === 0 && <p className="text-center text-[var(--text-muted)] pt-12">لا يوجد موظفين.</p>}
            </div>

          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="provider" className={labelClasses}>المؤسسة التدريبية</label>
              <input type="text" name="provider" id="provider" value={formData.provider} onChange={handleChange} required className={inputClasses}/>
            </div>
            <div>
              <label htmlFor="location" className={labelClasses}>مكان الدورة</label>
              <input type="text" name="location" id="location" value={formData.location || ''} onChange={handleChange} className={inputClasses}/>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className={labelClasses}>تاريخ البدء</label>
              <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className={inputClasses}/>
            </div>
            <div>
              <label htmlFor="endDate" className={labelClasses}>تاريخ الانتهاء</label>
              <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} required className={inputClasses}/>
            </div>
          </div>
          <div>
            <label htmlFor="status" className={labelClasses}>الحالة</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange} className={inputClasses}>
              <option value="Planned">مخطط لها</option>
              <option value="In Progress">قيد التنفيذ</option>
              <option value="Completed">مكتملة</option>
            </select>
          </div>

          <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
            <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
            <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrainingManager;