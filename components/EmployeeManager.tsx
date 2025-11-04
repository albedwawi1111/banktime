import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Employee, Document, Education, AppSettings, TrainingRecord, WorkExperience, UserSession } from '../types';
import Modal from './Modal';
import EmployeeCV from './EmployeeCV';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, IdentificationIcon, ClipboardDocumentListIcon, ArrowDownTrayIcon, KeyIcon, XMarkIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, ClockIcon, TagIcon } from './icons';
import type { ToastMessage } from '../types';

interface EmployeeManagerProps {
  employees: Employee[];
  userSessions: UserSession[];
  settings: AppSettings;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<any>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  onViewAttendance: (employeeId: string) => void;
  currentUser: Employee | null;
  trainingRecords: TrainingRecord[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  bulkDeleteEmployees: (ids: string[]) => Promise<void>;
  bulkUpdateEmployees: (ids: string[], data: Partial<Omit<Employee, 'id'>>) => Promise<void>;
  updateTrainingRecord: (record: Partial<TrainingRecord> & { id: string }) => Promise<void>;
}

const EMPTY_EDUCATION_STATE: Education = {
    degree: '',
    institution: '',
    fieldOfStudy: '',
    graduationYear: ''
};

const getEmptyEmployeeState = (): Omit<Employee, 'id'> => ({
  name: '',
  department: 'قسم الحجر وسلامة الغذاء بميناء صحار',
  profilePicture: '',
  dateOfBirth: '',
  nationality: '',
  nationalId: '',
  address: '',
  phone: '',
  email: '',
  jobTitle: '',
  hireDate: '',
  contractType: 'Full-time',
  status: 'Active',
  annualLeaveBalance: 0,
  sickLeaveBalance: 0,
  bankName: '',
  documents: [],
  education: [],
  workExperience: [],
  skills: [],
  gender: 'Male',
  maritalStatus: 'Single',
  employeeNumber: '',
  financialGrade: '',
  basicSalary: 0,
  allowances: 0,
});

const financialGrades = [
  'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السبعة', 'الثامنة',
  'التاسعة', 'العاشرة', 'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة',
  'الخامسة عشرة', 'السادسة عشرة', 'السبعة عشرة', 'الثامنة عشرة'
];

const EMPTY_DOCUMENT_STATE = {
    name: '',
    documentNumber: '',
    expiryDate: '',
    file: null as File | null,
};

const TABS = ['basic', 'job', 'qualifications', 'documents'];
const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition";


const StatusBadge: React.FC<{ status: Employee['status'] }> = ({ status }) => {
    const statusInfo = {
      Active: { text: 'نشط', classes: 'bg-[var(--success-bg)] text-[var(--success-text)]' },
      Inactive: { text: 'غير نشط', classes: 'bg-[var(--danger-bg)] text-[var(--danger-text)]' },
      'On Leave': { text: 'في إجازة', classes: 'bg-[var(--warning-bg)] text-[var(--warning-text)]' },
    };
    const info = statusInfo[status || 'Inactive'];
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${info.classes}`}>{info.text}</span>;
};

// FIX: Add named export to the component
export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, userSessions, settings, addEmployee, updateEmployee, deleteEmployee, onViewAttendance, currentUser, trainingRecords, addToast, bulkDeleteEmployees, bulkUpdateEmployees, updateTrainingRecord }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(getEmptyEmployeeState());
  const [activeTab, setActiveTab] = useState('basic');
  const [newEducation, setNewEducation] = useState<Education>(EMPTY_EDUCATION_STATE);
  const [newDocument, setNewDocument] = useState(EMPTY_DOCUMENT_STATE);
  const [newWorkExperience, setNewWorkExperience] = useState<WorkExperience>({ company: '', jobTitle: '', startDate: '', endDate: '', description: '' });
  const [newSkill, setNewSkill] = useState('');
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [cvEmployee, setCvEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [jobTitleFilter, setJobTitleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // State for bulk actions
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToApply, setStatusToApply] = useState<Employee['status']>('Active');
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingToAssign, setTrainingToAssign] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionsMenu, setActionsMenu] = useState<{ [key: string]: boolean }>({});

  // Password change modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [employeeForPasswordChange, setEmployeeForPasswordChange] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'On Leave').length;
    return { total: employees.length, active, onLeave };
  }, [employees]);
    
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
        const searchMatch = !searchTerm || 
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (emp.employeeNumber && emp.employeeNumber.includes(searchTerm));
        
        const departmentMatch = departmentFilter === 'All' || emp.department === departmentFilter;
        
        const jobTitleMatch = jobTitleFilter === 'All' || emp.jobTitle === jobTitleFilter;
        
        const statusMatch = statusFilter === 'All' || emp.status === statusFilter;

        return searchMatch && departmentMatch && jobTitleMatch && statusMatch;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, departmentFilter, jobTitleFilter, statusFilter]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleModalKeyDown = (event: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        (document.getElementById('employee-form-submit-button') as HTMLButtonElement)?.click();
      }

      // Navigate tabs with Arrow keys, avoiding inputs
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = TABS.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % TABS.length;
        setActiveTab(TABS[nextIndex]);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const currentIndex = TABS.indexOf(activeTab);
        const nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [isModalOpen, activeTab]);

  // Shortcut for adding a new employee (Alt+N)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'n') {
        const target = event.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

        // Prevent opening if another modal is already active
        if (!isModalOpen && !cvEmployee) {
          event.preventDefault();
          openModalForAdd();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isModalOpen, cvEmployee]); // Rerun if modal states change

  const handleRoleChange = (employee: Employee, newRole: 'Admin' | 'Employee' | 'Head of Department') => {
      updateEmployee({ ...employee, role: newRole });
      addToast(`تم تحديث صلاحية ${employee.name} بنجاح.`, 'success');
  };

  const openChangePasswordModal = (employee: Employee) => {
    setEmployeeForPasswordChange(employee);
    setNewPassword('');
    setConfirmNewPassword('');
    setIsNewPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForPasswordChange) return;
    if (newPassword.length < 6) {
        addToast('يجب أن لا تقل كلمة المرور عن 6 أحرف.', 'error');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        addToast('كلمتا المرور غير متطابقتين.', 'error');
        return;
    }
    // FIX: Spread the employeeForPasswordChange object to pass a full Employee object, satisfying the updateEmployee function's type signature.
    await updateEmployee({ ...employeeForPasswordChange, password: newPassword, hasChangedPassword: true });
    addToast(`تم تغيير كلمة مرور ${employeeForPasswordChange.name} بنجاح.`, 'success');
    setIsPasswordModalOpen(false);
  };

  const openModalForAdd = () => {
    setCurrentEmployee(null);
    setFormData(getEmptyEmployeeState());
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const openModalForEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({ ...getEmptyEmployeeState(), ...employee });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file: File = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAddEducation = () => {
    if(newEducation.degree && newEducation.institution) {
        setFormData(prev => ({ ...prev, education: [...(prev.education || []), newEducation] }));
        setNewEducation(EMPTY_EDUCATION_STATE);
    }
  };

  const handleRemoveEducation = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          education: (prev.education || []).filter((_, index) => index !== indexToRemove)
      }));
  };
  
  const handleAddWorkExperience = () => {
      if(newWorkExperience.company && newWorkExperience.jobTitle && newWorkExperience.startDate) {
          setFormData(prev => ({ ...prev, workExperience: [...(prev.workExperience || []), newWorkExperience] }));
          setNewWorkExperience({ company: '', jobTitle: '', startDate: '', endDate: '' });
      }
  };

  const handleRemoveWorkExperience = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          workExperience: (prev.workExperience || []).filter((_, index) => index !== indexToRemove)
      }));
  };
  
  const handleAddSkill = () => {
    if (newSkill.trim()) {
        const skillsToAdd = newSkill.split(',').map(s => s.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, skills: [...new Set([...(prev.skills || []), ...skillsToAdd])] }));
        setNewSkill('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
      setFormData(prev => ({
          ...prev,
          skills: (prev.skills || []).filter(skill => skill !== skillToRemove)
      }));
  };

  const handleAddDocument = () => {
    if(newDocument.name && newDocument.file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const doc: Document = {
                name: newDocument.name,
                documentNumber: newDocument.documentNumber,
                expiryDate: newDocument.expiryDate,
                fileName: newDocument.file!.name,
                data: (reader.result as string).split(',')[1] // base64
            };
            setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), doc] }));
            setNewDocument(EMPTY_DOCUMENT_STATE);
            if(docFileInputRef.current) docFileInputRef.current.value = '';
        };
        reader.readAsDataURL(newDocument.file);
    }
  };
  
  const handleRemoveDocument = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          documents: (prev.documents || []).filter((_, index) => index !== indexToRemove)
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (currentEmployee) {
            await updateEmployee({ id: currentEmployee.id, ...formData });
            addToast(`تم تحديث بيانات ${formData.name} بنجاح.`, 'success');
        } else {
            await addEmployee(formData);
            addToast(`تمت إضافة ${formData.name} بنجاح.`, 'success');
        }
        handleCloseModal();
    } catch (err) {
        console.error(err);
        addToast('حدث خطأ أثناء حفظ البيانات.', 'error');
    }
  };

  const toggleActionsMenu = (employeeId: string) => {
    setActionsMenu(prev => ({ ...Object.keys(prev).reduce((acc, key) => ({...acc, [key]: false}), {}), [employeeId]: !prev[employeeId] }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedEmployeeIds(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };
  
  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
      setSelectedEmployeeIds(prev => [...prev, id]);
    } else {
      setSelectedEmployeeIds(prev => prev.filter(empId => empId !== id));
    }
  };

  const handleApplyStatusChange = async () => {
    await bulkUpdateEmployees(selectedEmployeeIds, { status: statusToApply });
    setIsStatusModalOpen(false);
    setSelectedEmployeeIds([]);
  };

  const handleAssignTraining = async () => {
      if (!trainingToAssign) return;
      const record = trainingRecords.find(t => t.id === trainingToAssign);
      if(record) {
          const newEmployeeIds = [...new Set([...record.employeeIds, ...selectedEmployeeIds])];
          await updateTrainingRecord({ id: record.id, employeeIds: newEmployeeIds });
          setIsTrainingModalOpen(false);
          setSelectedEmployeeIds([]);
          addToast(`تم تعيين الموظفين للدورة بنجاح.`, 'success');
      }
  };
  
  const handleDeleteSelected = async () => {
    await bulkDeleteEmployees(selectedEmployeeIds);
    setIsDeleteModalOpen(false);
    setSelectedEmployeeIds([]);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">إدارة الموظفين</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow flex items-center gap-4">
                <div className="p-3 bg-[var(--accent-color)]/20 rounded-lg"><UserGroupIcon className="w-6 h-6 text-[var(--accent-text)]"/></div>
                <div><p className="text-sm text-[var(--text-secondary)]">إجمالي الموظفين</p><p className="text-2xl font-bold">{stats.total}</p></div>
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow flex items-center gap-4">
                 <div className="p-3 bg-[var(--success-bg)] rounded-lg"><CheckCircleIcon className="w-6 h-6 text-[var(--success-text)]"/></div>
                <div><p className="text-sm text-[var(--text-secondary)]">الموظفون النشطون</p><p className="text-2xl font-bold">{stats.active}</p></div>
            </div>
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow flex items-center gap-4">
                <div className="p-3 bg-[var(--warning-bg)] rounded-lg"><ClockIcon className="w-6 h-6 text-[var(--warning-text)]"/></div>
                <div><p className="text-sm text-[var(--text-secondary)]">الموظفون في إجازة</p><p className="text-2xl font-bold">{stats.onLeave}</p></div>
            </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative">
                         <input
                            type="text"
                            placeholder="بحث بالاسم أو الرقم الوظيفي..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
                        />
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    </div>
                     <select 
                        value={departmentFilter} 
                        onChange={e => setDepartmentFilter(e.target.value)} 
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg px-4 py-2 text-[var(--text-primary)]">
                        <option value="All">كل الأقسام</option>
                        {settings.departments?.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <select 
                        value={jobTitleFilter} 
                        onChange={e => setJobTitleFilter(e.target.value)} 
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg px-4 py-2 text-[var(--text-primary)]">
                        <option value="All">كل المسميات الوظيفية</option>
                        {settings.jobTitles?.map(title => (
                            <option key={title} value={title}>{title}</option>
                        ))}
                    </select>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg px-4 py-2 text-[var(--text-primary)]">
                        <option value="All">كل الحالات</option>
                        <option value="Active">نشط</option>
                        <option value="On Leave">في إجازة</option>
                        <option value="Inactive">غير نشط</option>
                    </select>
                </div>
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إضافة موظف
                </button>
            </div>
        </div>

        {selectedEmployeeIds.length > 0 && (
             <div className="fixed bottom-4 right-4 md:right-72 left-4 bg-[var(--bg-secondary)] p-3 rounded-xl shadow-2xl z-20 flex justify-between items-center gap-4 animate-fade-in-scale">
                <p className="text-sm font-semibold">تم تحديد {selectedEmployeeIds.length} موظف</p>
                <div className="flex gap-2">
                    <button onClick={() => setIsStatusModalOpen(true)} className="text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] px-3 py-1.5 rounded-md">تغيير الحالة</button>
                    <button onClick={() => setIsTrainingModalOpen(true)} className="text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] px-3 py-1.5 rounded-md">تعيين لتدريب</button>
                    {currentUser?.role === 'Admin' && <button onClick={() => setIsDeleteModalOpen(true)} className="text-sm bg-[var(--danger-bg)] text-[var(--danger-text)] hover:opacity-80 px-3 py-1.5 rounded-md">حذف</button>}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
                 <div key={emp.id} className="bg-[var(--bg-secondary)] rounded-xl shadow-lg p-5 flex flex-col transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <input
                                type="checkbox"
                                checked={selectedEmployeeIds.includes(emp.id)}
                                onChange={(e) => handleSelectOne(e, emp.id)}
                                className="form-checkbox h-5 w-5 bg-[var(--bg-tertiary)] border-[var(--border-color-light)] rounded text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                                onClick={e => e.stopPropagation()}
                            />
                             {emp.profilePicture ?
                                <img src={emp.profilePicture} alt={emp.name} className="w-16 h-16 rounded-full object-cover" />
                                : <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center"><UserGroupIcon className="w-8 h-8 text-[var(--text-muted)]"/></div>
                            }
                            <div>
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{emp.name}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{emp.employeeNumber || '-'}</p>
                            </div>
                        </div>
                         <div className="relative">
                            <button onClick={() => toggleActionsMenu(emp.id)} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><EllipsisVerticalIcon /></button>
                            {actionsMenu[emp.id] && (
                                <div className="absolute left-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md shadow-lg z-10">
                                    <button onClick={() => { openModalForEdit(emp); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]">تعديل</button>
                                    <button onClick={() => { setCvEmployee(emp); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]">عرض السيرة الذاتية</button>
                                    <button onClick={() => { onViewAttendance(emp.id); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]">عرض كشف الحضور</button>
                                    {(currentUser?.role === 'Admin' || (currentUser?.role === 'Head of Department' && currentUser?.department === emp.department)) && emp.role !== 'Admin' && (
                                      <button onClick={() => { openChangePasswordModal(emp); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]">تغيير كلمة المرور</button>
                                    )}
                                    {currentUser?.role === 'Admin' && emp.id !== currentUser.id && (
                                        <button onClick={() => { if(window.confirm('هل أنت متأكد؟')) { deleteEmployee(emp.id); setActionsMenu({}); } }} className="block w-full text-right px-4 py-2 text-sm text-[var(--danger-text)] hover:bg-[var(--danger-bg)]">حذف</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-[var(--border-color)] my-4"></div>
                    <div className="space-y-3 text-sm flex-grow">
                        <p><span className="font-semibold text-[var(--text-muted)] w-24 inline-block">المسمى:</span> {emp.jobTitle || '-'}</p>
                        <p><span className="font-semibold text-[var(--text-muted)] w-24 inline-block">القطاع:</span> {emp.department}</p>
                        <p className="flex items-center"><span className="font-semibold text-[var(--text-muted)] w-24 inline-block">الحالة:</span> <StatusBadge status={emp.status} /></p>
                    </div>
                     <div className="border-t border-[var(--border-color)] mt-4 pt-3">
                       {currentUser?.role === 'Admin' ? (
                          <select
                            value={emp.role || 'Employee'}
                            onChange={(e) => handleRoleChange(emp, e.target.value as any)}
                            disabled={emp.id === currentUser.id}
                            className="w-full bg-[var(--bg-tertiary)] border-none rounded-md px-3 py-1.5 text-sm"
                          >
                            <option value="Employee">موظف</option>
                            <option value="Head of Department">رئيس قسم</option>
                            <option value="Admin">مدير النظام</option>
                          </select>
                        ) : (
                          <p className="text-sm"><span className="font-semibold text-[var(--text-muted)]">الصلاحية:</span> {emp.role === 'Admin' ? 'مدير' : emp.role === 'Head of Department' ? 'رئيس قسم' : 'موظف'}</p>
                        )}
                    </div>
                 </div>
            ))}
        </div>
        
        {cvEmployee && <EmployeeCV employee={cvEmployee} onClose={() => setCvEmployee(null)} trainingRecords={trainingRecords} />}
        
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentEmployee ? "تعديل موظف" : "إضافة موظف جديد"} maxWidth="max-w-4xl">
             <div className="border-b border-[var(--border-color)] mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {[{key:'basic', label:'البيانات الأساسية'}, {key:'job', label:'البيانات الوظيفية'}, {key:'qualifications', label:'المؤهلات والخبرات'}, {key:'documents', label:'المستندات'}].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? 'border-[var(--accent-color)] text-[var(--accent-text)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-light)]'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
            <form id="employee-form" onSubmit={handleSubmit} className="flex flex-col h-[70vh] md:h-[80vh]">
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === 'basic' && (
                         <div className="space-y-6">
                             <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-[var(--bg-tertiary)]/30 rounded-lg">
                                 <div className="flex-shrink-0 relative">
                                     {formData.profilePicture ?
                                         <img src={formData.profilePicture} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-[var(--border-color-light)]" /> :
                                         <div className="w-28 h-28 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border-4 border-[var(--border-color-light)]"><UserGroupIcon className="w-12 h-12 text-[var(--text-muted)]" /></div>
                                     }
                                     <label htmlFor="profilePicture" className="absolute -bottom-2 -right-2 bg-[var(--accent-color)] text-white p-2 rounded-full cursor-pointer hover:bg-[var(--accent-color-hover)] transition-colors">
                                        <PencilIcon className="w-4 h-4" />
                                        <input type="file" id="profilePicture" name="profilePicture" onChange={handleFileChange} accept="image/*" className="hidden" />
                                     </label>
                                 </div>
                                 <div className="w-full space-y-4">
                                     <div>
                                         <label htmlFor="name" className={labelClasses}>الاسم الكامل</label>
                                         <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClasses} />
                                     </div>
                                      <div>
                                         <label htmlFor="employeeNumber" className={labelClasses}>الرقم الوظيفي</label>
                                         <input type="text" id="employeeNumber" name="employeeNumber" value={formData.employeeNumber || ''} onChange={handleChange} className={inputClasses} />
                                     </div>
                                 </div>
                             </div>

                             <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">البيانات الشخصية</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div><label htmlFor="dateOfBirth" className={labelClasses}>تاريخ الميلاد</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className={inputClasses}/></div>
                                    <div><label htmlFor="gender" className={labelClasses}>الجنس</label><select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}><option value="Male">ذكر</option><option value="Female">أنثى</option></select></div>
                                    <div><label htmlFor="maritalStatus" className={labelClasses}>الحالة الاجتماعية</label><select id="maritalStatus" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={inputClasses}><option value="Single">أعزب</option><option value="Married">متزوج</option><option value="Divorced">مطلق</option><option value="Widowed">أرمل</option></select></div>
                                    <div><label htmlFor="nationality" className={labelClasses}>الجنسية</label><input type="text" id="nationality" name="nationality" value={formData.nationality || ''} onChange={handleChange} list="nationalities-list" className={inputClasses}/><datalist id="nationalities-list">{settings.nationalities.map(n => <option key={n} value={n}/>)}</datalist></div>
                                    <div className="lg:col-span-2"><label htmlFor="nationalId" className={labelClasses}>الرقم المدني</label><input type="text" id="nationalId" name="nationalId" value={formData.nationalId || ''} onChange={handleChange} className={inputClasses}/></div>
                                </div>
                            </fieldset>
                             
                             <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">معلومات الاتصال</legend>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div><label htmlFor="phone" className={labelClasses}>رقم الهاتف</label><input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClasses}/></div>
                                     <div><label htmlFor="email" className={labelClasses}>البريد الإلكتروني</label><input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClasses}/></div>
                                 </div>
                                 <div className="mt-4"><label htmlFor="address" className={labelClasses}>العنوان</label><input type="text" id="address" name="address" value={formData.address || ''} onChange={handleChange} className={inputClasses}/></div>
                            </fieldset>
                         </div>
                    )}

                    {activeTab === 'job' && (
                        <div className="space-y-6">
                             <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">البيانات الوظيفية</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div><label htmlFor="department" className={labelClasses}>القطاع</label><select id="department" name="department" value={formData.department} onChange={handleChange} className={inputClasses}>{settings.departments?.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                                    <div><label htmlFor="jobTitle" className={labelClasses}>المسمى الوظيفي</label><input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} list="jobtitles-list" className={inputClasses}/><datalist id="jobtitles-list">{settings.jobTitles.map(j=><option key={j} value={j}/>)}</datalist></div>
                                    <div><label htmlFor="hireDate" className={labelClasses}>تاريخ التعيين</label><input type="date" id="hireDate" name="hireDate" value={formData.hireDate || ''} onChange={handleChange} className={inputClasses}/></div>
                                    <div><label htmlFor="contractType" className={labelClasses}>نوع العقد</label><select id="contractType" name="contractType" value={formData.contractType} onChange={handleChange} className={inputClasses}><option value="Full-time">دوام كامل</option><option value="Part-time">دوام جزئي</option><option value="Contract">عقد</option></select></div>
                                    <div><label htmlFor="status" className={labelClasses}>حالة الموظف</label><select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClasses}><option value="Active">نشط</option><option value="On Leave">في إجازة</option><option value="Inactive">غير نشط</option></select></div>
                                </div>
                            </fieldset>
                            <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">البيانات المالية</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div><label htmlFor="financialGrade" className={labelClasses}>الدرجة المالية</label><select id="financialGrade" name="financialGrade" value={formData.financialGrade || ''} onChange={handleChange} className={inputClasses}><option value="">-- اختر --</option>{financialGrades.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
                                    <div><label htmlFor="basicSalary" className={labelClasses}>الراتب الأساسي</label><input type="number" id="basicSalary" name="basicSalary" value={formData.basicSalary || ''} onChange={handleChange} className={inputClasses}/></div>
                                    <div><label htmlFor="allowances" className={labelClasses}>العلاوات</label><input type="number" id="allowances" name="allowances" value={formData.allowances || ''} onChange={handleChange} className={inputClasses}/></div>
                                    <div className="md:col-span-2"><label htmlFor="bankName" className={labelClasses}>اسم البنك</label><input type="text" id="bankName" name="bankName" value={formData.bankName || ''} onChange={handleChange} className={inputClasses}/></div>
                                </div>
                            </fieldset>
                             <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">أرصدة الإجازات</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="annualLeaveBalance" className={labelClasses}>رصيد الإجازة السنوية</label><input type="number" id="annualLeaveBalance" name="annualLeaveBalance" value={formData.annualLeaveBalance || ''} onChange={handleChange} className={inputClasses}/></div>
                                    <div><label htmlFor="sickLeaveBalance" className={labelClasses}>رصيد الإجازة المرضية</label><input type="number" id="sickLeaveBalance" name="sickLeaveBalance" value={formData.sickLeaveBalance || ''} onChange={handleChange} className={inputClasses}/></div>
                                </div>
                            </fieldset>
                        </div>
                    )}
                    
                    {activeTab === 'qualifications' && (
                        <div className="space-y-6">
                            {/* Education */}
                            <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">المؤهلات التعليمية</legend>
                                <div className="space-y-2 mb-4">
                                    {formData.education?.map((edu, index) => (
                                        <div key={index} className="flex justify-between items-start bg-[var(--bg-tertiary)]/50 p-2 rounded-md">
                                            <div><p className="font-semibold">{edu.degree} - {edu.fieldOfStudy}</p><p className="text-sm text-[var(--text-muted)]">{edu.institution} ({edu.graduationYear})</p></div>
                                            <button type="button" onClick={() => handleRemoveEducation(index)} className="text-[var(--danger-text)] hover:opacity-80 p-1"><TrashIcon /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-2 border-t border-[var(--border-color-light)]">
                                    <div><label className={labelClasses}>المؤهل</label><select value={newEducation.degree} onChange={e => setNewEducation(p => ({...p, degree: e.target.value}))} className={inputClasses}><option value="">-- اختر --</option>{settings.educationDegrees.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                                    <div><label className={labelClasses}>المؤسسة</label><input type="text" value={newEducation.institution} onChange={e => setNewEducation(p => ({...p, institution: e.target.value}))} className={inputClasses}/></div>
                                    <div><label className={labelClasses}>التخصص</label><input type="text" value={newEducation.fieldOfStudy} onChange={e => setNewEducation(p => ({...p, fieldOfStudy: e.target.value}))} className={inputClasses}/></div>
                                    <div><label className={labelClasses}>سنة التخرج</label><input type="text" value={newEducation.graduationYear} onChange={e => setNewEducation(p => ({...p, graduationYear: e.target.value}))} className={inputClasses}/></div>
                                    <div className="md:col-span-2"><button type="button" onClick={handleAddEducation} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"><PlusIcon className="w-4 h-4"/>إضافة مؤهل</button></div>
                                </div>
                            </fieldset>

                             {/* Work Experience */}
                            <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">الخبرة العملية</legend>
                                 <div className="space-y-2 mb-4">
                                    {formData.workExperience?.map((exp, index) => (
                                        <div key={index} className="flex justify-between items-start bg-[var(--bg-tertiary)]/50 p-2 rounded-md">
                                            <div><p className="font-semibold">{exp.jobTitle} - {exp.company}</p><p className="text-sm text-[var(--text-muted)]">{exp.startDate} to {exp.endDate}</p></div>
                                            <button type="button" onClick={() => handleRemoveWorkExperience(index)} className="text-[var(--danger-text)] hover:opacity-80 p-1"><TrashIcon /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-2 border-t border-[var(--border-color-light)]">
                                    <div><label className={labelClasses}>الشركة</label><input type="text" value={newWorkExperience.company} onChange={e => setNewWorkExperience(p => ({...p, company: e.target.value}))} className={inputClasses}/></div>
                                    <div><label className={labelClasses}>المسمى الوظيفي</label><input type="text" value={newWorkExperience.jobTitle} onChange={e => setNewWorkExperience(p => ({...p, jobTitle: e.target.value}))} className={inputClasses}/></div>
                                    <div><label className={labelClasses}>تاريخ البدء</label><input type="date" value={newWorkExperience.startDate} onChange={e => setNewWorkExperience(p => ({...p, startDate: e.target.value}))} className={inputClasses}/></div>
                                    <div><label className={labelClasses}>تاريخ الانتهاء</label><input type="text" value={newWorkExperience.endDate} onChange={e => setNewWorkExperience(p => ({...p, endDate: e.target.value}))} placeholder="YYYY-MM-DD أو 'الحالي'" className={inputClasses}/></div>
                                    <div className="md:col-span-2"><button type="button" onClick={handleAddWorkExperience} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"><PlusIcon className="w-4 h-4"/>إضافة خبرة</button></div>
                                </div>
                            </fieldset>
                            
                             {/* Skills */}
                            <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                                <legend className="px-2 font-semibold text-[var(--accent-text)]">المهارات</legend>
                                 <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-tertiary)]/30 rounded-lg min-h-[4rem] mb-4">
                                    {formData.skills?.map((skill) => (
                                        <span key={skill} className="flex items-center gap-2 bg-[var(--accent-color)]/20 text-[var(--accent-text)] text-sm font-medium px-3 py-1 rounded-full">
                                            {skill}
                                            <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-[var(--accent-text)] hover:text-red-400"><XMarkIcon className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="أضف مهارة (أو عدة مهارات مفصولة بفاصلة)" onKeyDown={e=>{if(e.key === 'Enter'){e.preventDefault(); handleAddSkill();}}} className={inputClasses + ' flex-grow'}/>
                                    <button type="button" onClick={handleAddSkill} className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg transition-colors"><PlusIcon /></button>
                                </div>
                            </fieldset>
                        </div>
                    )}
                    
                    {activeTab === 'documents' && (
                         <fieldset className="border border-[var(--border-color-light)] rounded-lg p-4">
                            <legend className="px-2 font-semibold text-[var(--accent-text)]">المستندات والوثائق</legend>
                             <div className="space-y-2 mb-4">
                                {formData.documents?.map((doc, index) => (
                                    <div key={index} className="flex justify-between items-center bg-[var(--bg-tertiary)]/50 p-2 rounded-md">
                                        <div>
                                            <p className="font-semibold">{doc.name} <span className="text-xs text-[var(--text-muted)]">({doc.documentNumber})</span></p>
                                            <p className="text-sm text-[var(--text-muted)]">ينتهي في: {doc.expiryDate || 'N/A'}</p>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveDocument(index)} className="text-[var(--danger-text)] hover:opacity-80 p-1"><TrashIcon /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-2 border-t border-[var(--border-color-light)]">
                                <div><label className={labelClasses}>اسم المستند</label><input type="text" value={newDocument.name} onChange={e=>setNewDocument(p=>({...p, name: e.target.value}))} className={inputClasses}/></div>
                                <div><label className={labelClasses}>رقم المستند</label><input type="text" value={newDocument.documentNumber} onChange={e=>setNewDocument(p=>({...p, documentNumber: e.target.value}))} className={inputClasses}/></div>
                                <div><label className={labelClasses}>تاريخ الانتهاء</label><input type="date" value={newDocument.expiryDate} onChange={e=>setNewDocument(p=>({...p, expiryDate: e.target.value}))} className={inputClasses}/></div>
                                <div><label className={labelClasses}>ملف المستند</label><input type="file" ref={docFileInputRef} onChange={e=>setNewDocument(p=>({...p, file: e.target.files?.[0] || null}))} className={inputClasses + " p-1.5"}/></div>
                                <div className="md:col-span-2"><button type="button" onClick={handleAddDocument} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"><PlusIcon className="w-4 h-4"/>إضافة مستند</button></div>
                            </div>
                        </fieldset>
                    )}
                </div>
                <div className="flex-shrink-0 flex justify-end gap-3 p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-b-lg">
                    <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg transition-colors">إلغاء</button>
                    <button type="submit" id="employee-form-submit-button" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                </div>
            </form>
        </Modal>

        <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={`تغيير كلمة مرور ${employeeForPasswordChange?.name}`}>
            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">كلمة المرور الجديدة</label>
                    <div className="relative">
                       <input type={isNewPasswordVisible ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"/>
                       <button type="button" onClick={() => setIsNewPasswordVisible(p => !p)} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{isNewPasswordVisible ? <EyeSlashIcon/> : <EyeIcon/>}</button>
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">تأكيد كلمة المرور</label>
                    <div className="relative">
                       <input type={isConfirmPasswordVisible ? "text" : "password"} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"/>
                       <button type="button" onClick={() => setIsConfirmPasswordVisible(p => !p)} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{isConfirmPasswordVisible ? <EyeSlashIcon/> : <EyeIcon/>}</button>
                    </div>
                </div>
                 <div className="flex justify-end pt-4"><button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">تغيير</button></div>
            </form>
        </Modal>

        {/* Bulk action modals */}
        <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="تغيير حالة الموظفين">
          <select value={statusToApply} onChange={e => setStatusToApply(e.target.value as any)} className="w-full bg-[var(--bg-tertiary)] p-2 rounded-md mb-4">
            <option value="Active">نشط</option>
            <option value="On Leave">في إجازة</option>
            <option value="Inactive">غير نشط</option>
          </select>
          <div className="flex justify-end"><button onClick={handleApplyStatusChange} className="bg-[var(--accent-color)] text-white px-4 py-2 rounded-md">تطبيق</button></div>
        </Modal>
        <Modal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} title="تعيين الموظفين لتدريب">
          <select value={trainingToAssign} onChange={e => setTrainingToAssign(e.target.value)} className="w-full bg-[var(--bg-tertiary)] p-2 rounded-md mb-4">
            <option value="">-- اختر دورة تدريبية --</option>
            {trainingRecords.filter(t => t.status !== 'Completed').map(t => <option key={t.id} value={t.id}>{t.courseName}</option>)}
          </select>
          <div className="flex justify-end"><button onClick={handleAssignTraining} className="bg-[var(--accent-color)] text-white px-4 py-2 rounded-md">تعيين</button></div>
        </Modal>
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="حذف الموظفين المحددين">
          <p>هل أنت متأكد من حذف {selectedEmployeeIds.length} موظف؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="bg-[var(--bg-quaternary)] px-4 py-2 rounded-md">إلغاء</button>
            <button onClick={handleDeleteSelected} className="bg-[var(--danger-bg)] text-[var(--danger-text)] px-4 py-2 rounded-md">تأكيد الحذف</button>
          </div>
        </Modal>
    </div>
  );
};