import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, LeaveRequest, PublicHoliday, RamadanDates, AppSettings } from '../types';
import Modal from './Modal';
import LeaveRequestForm from './LeaveRequestForm';
import ShortLeaveRequestForm from './ShortLeaveRequestForm';
import { PlusIcon, PencilIcon, TrashIcon, PrinterIcon } from './icons';

interface LeaveManagerProps {
    employees: Employee[];
    leaveRequests: LeaveRequest[];
    addLeaveRequest: (request: Omit<LeaveRequest, 'id'>) => void;
    updateLeaveRequest: (request: LeaveRequest) => void;
    deleteLeaveRequest: (id: string) => void;
    publicHolidays: PublicHoliday[];
    addPublicHoliday: (holiday: Omit<PublicHoliday, 'id'>) => void;
    updatePublicHoliday: (holiday: PublicHoliday) => void;
    deletePublicHoliday: (id: string) => void;
    ramadanDates: RamadanDates;
    updateRamadanDatesForYear: (year: number, dates: { start: string; end: string }) => void;
    settings: AppSettings;
    currentUser: Employee | null;
    initialStatusFilter?: string;
}

const EMPTY_LEAVE_REQUEST: Omit<LeaveRequest, 'id'> = {
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
};

const EMPTY_PUBLIC_HOLIDAY: Omit<PublicHoliday, 'id'> = {
    name: '',
    date: '',
};

const calculateDuration = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
    return diffDays;
};


const LeaveManager: React.FC<LeaveManagerProps> = ({
    employees,
    leaveRequests, addLeaveRequest, updateLeaveRequest, deleteLeaveRequest,
    publicHolidays, addPublicHoliday, updatePublicHoliday, deletePublicHoliday,
    ramadanDates, updateRamadanDatesForYear,
    settings,
    currentUser,
    initialStatusFilter
}) => {
    const [activeTab, setActiveTab] = useState<'requests' | 'holidays'>('requests');
    
    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<LeaveRequest | null>(null);
    const [requestFormData, setRequestFormData] = useState<Omit<LeaveRequest, 'id'>>(EMPTY_LEAVE_REQUEST);

    const [isHolidayModalOpen, setHolidayModalOpen] = useState(false);
    const [currentHoliday, setCurrentHoliday] = useState<PublicHoliday | null>(null);
    const [holidayFormData, setHolidayFormData] = useState<Omit<PublicHoliday, 'id'>>(EMPTY_PUBLIC_HOLIDAY);
    
    const [ramadanYear, setRamadanYear] = useState(new Date().getFullYear());
    const [currentRamadanDates, setCurrentRamadanDates] = useState({ start: '', end: '' });

    const [printableRequest, setPrintableRequest] = useState<{leaveRequest: LeaveRequest, employee: Employee} | null>(null);
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'All');

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

    useEffect(() => {
        setStatusFilter(initialStatusFilter || 'All');
    }, [initialStatusFilter]);

    const visibleLeaveRequests = useMemo(() => {
        const sorted = [...leaveRequests].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        
        let roleFiltered = sorted;
        if (currentUser?.role === 'Employee') {
            roleFiltered = sorted.filter(lr => lr.employeeId === currentUser.id);
        }
        
        if (statusFilter === 'All') {
            return roleFiltered;
        }
        
        return roleFiltered.filter(req => req.status === statusFilter);

    }, [leaveRequests, currentUser, statusFilter]);

    useEffect(() => {
        const datesForYear = ramadanDates[ramadanYear];
        if (datesForYear) {
            setCurrentRamadanDates(datesForYear);
        } else {
            setCurrentRamadanDates({ start: '', end: '' });
        }
    }, [ramadanYear, ramadanDates]);

    const handleRamadanDatesSave = () => {
        if (currentRamadanDates.start && currentRamadanDates.end) {
            updateRamadanDatesForYear(ramadanYear, currentRamadanDates);
        }
    };


    // --- Leave Request Handlers ---
    const openRequestModalForAdd = () => {
        setCurrentRequest(null);
        setRequestFormData({ 
            ...EMPTY_LEAVE_REQUEST, 
            employeeId: currentUser?.role === 'Employee' ? currentUser.id : (employees.length > 0 ? employees[0].id : ''),
            leaveType: settings.leaveTypes?.[0] || ''
        });
        setRequestModalOpen(true);
    };

    const openRequestModalForEdit = (request: LeaveRequest) => {
        setCurrentRequest(request);
        setRequestFormData({
            employeeId: request.employeeId,
            leaveType: request.leaveType,
            startDate: request.startDate,
            endDate: request.endDate,
            reason: request.reason || '',
            status: request.status,
        });
        setRequestModalOpen(true);
    };

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestFormData.employeeId || !requestFormData.startDate || !requestFormData.endDate) return;
        if (currentRequest) {
            updateLeaveRequest({ ...requestFormData, id: currentRequest.id });
        } else {
            addLeaveRequest(requestFormData);
        }
        setRequestModalOpen(false);
    };

    const handleStatusChange = (id: string, status: 'Pending' | 'Approved' | 'Rejected') => {
        const request = leaveRequests.find(r => r.id === id);
        if (request && request.status !== status) {
            updateLeaveRequest({ ...request, status });
        }
    };
    
    const handlePrintRequest = (request: LeaveRequest) => {
      const employee = employees.find(e => e.id === request.employeeId);
      if (employee) {
        setPrintableRequest({ leaveRequest: request, employee });
      } else {
        alert('لم يتم العثور على الموظف.');
      }
    };

    // --- Public Holiday Handlers ---
    const openHolidayModalForAdd = () => {
        setCurrentHoliday(null);
        setHolidayFormData(EMPTY_PUBLIC_HOLIDAY);
        setHolidayModalOpen(true);
    };
    
    const openHolidayModalForEdit = (holiday: PublicHoliday) => {
        setCurrentHoliday(holiday);
        setHolidayFormData(holiday);
        setHolidayModalOpen(true);
    };

    const handleHolidaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!holidayFormData.name || !holidayFormData.date) return;
        if (currentHoliday) {
            updatePublicHoliday({ ...holidayFormData, id: currentHoliday.id });
        } else {
            addPublicHoliday(holidayFormData);
        }
        setHolidayModalOpen(false);
    };

    const TabButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                active ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-[var(--border-color-light)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
            }`}
        >
            {label}
        </button>
    );

    const StatusBadge = ({ status }: { status: 'Pending' | 'Approved' | 'Rejected' }) => {
        const styles = {
            Pending: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
            Approved: 'bg-[var(--success-bg)] text-[var(--success-text)]',
            Rejected: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
        };
        const textMap = { Pending: 'قيد الانتظار', Approved: 'مقبول', Rejected: 'مرفوض' };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{textMap[status]}</span>;
    };

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
    
    const renderLeaveRequests = () => (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 flex-wrap gap-4">
                 <div>
                    <label htmlFor="status-filter" className="text-sm font-medium text-[var(--text-secondary)] ml-2">
                        تصفية حسب الحالة:
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                    >
                        <option value="All">الكل</option>
                        <option value="Pending">قيد الانتظار</option>
                        <option value="Approved">مقبول</option>
                        <option value="Rejected">مرفوض</option>
                    </select>
                </div>
                <button onClick={openRequestModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    طلب إجازة جديد
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-right">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            {currentUser?.role !== 'Employee' && <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الموظف</th>}
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">نوع الإجازة</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">تاريخ البدء</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">تاريخ الانتهاء</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الحالة</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {visibleLeaveRequests.map(req => (
                            <tr key={req.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                {currentUser?.role !== 'Employee' && <td className="py-4 px-6">{employeeMap.get(req.employeeId) || 'غير معروف'}</td>}
                                <td className="py-4 px-6">{req.leaveType}</td>
                                <td className="py-4 px-6">{req.startDate}</td>
                                <td className="py-4 px-6">{req.endDate}</td>
                                <td className="py-4 px-6">
                                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') ? (
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleStatusChange(req.id, e.target.value as 'Pending' | 'Approved' | 'Rejected')}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`border-none rounded-md px-2.5 py-1 text-xs font-semibold appearance-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-color)] ${
                                                req.status === 'Approved' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' :
                                                req.status === 'Rejected' ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]' :
                                                'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                                            }`}
                                        >
                                            <option value="Pending" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>قيد الانتظار</option>
                                            <option value="Approved" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>مقبول</option>
                                            <option value="Rejected" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>مرفوض</option>
                                        </select>
                                    ) : (
                                        <StatusBadge status={req.status} />
                                    )}
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <button onClick={() => handlePrintRequest(req)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] mx-2" title="طباعة النموذج"><PrinterIcon /></button>
                                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') && (
                                        <button onClick={() => openRequestModalForEdit(req)} className="text-[var(--accent-text)] hover:opacity-80 mx-2" title="تعديل"><PencilIcon /></button>
                                    )}
                                    {((currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') || (currentUser?.id === req.employeeId && req.status === 'Pending')) && (
                                        <button onClick={() => {if(window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) deleteLeaveRequest(req.id)}} className="text-[var(--danger-text)] hover:opacity-80 mx-2" title="حذف"><TrashIcon /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPublicHolidays = () => (
         <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">تحديد شهر رمضان</h3>
                <div className="flex items-end gap-4">
                    <div>
                        <label htmlFor="ramadanYear" className={labelClasses}>السنة</label>
                        <input 
                            type="number" 
                            id="ramadanYear"
                            value={ramadanYear}
                            onChange={e => setRamadanYear(parseInt(e.target.value))}
                            className={`${inputClasses} w-32`}
                        />
                    </div>
                    <div>
                        <label htmlFor="ramadanStart" className={labelClasses}>تاريخ البدء</label>
                        <input 
                            type="date" 
                            id="ramadanStart"
                            value={currentRamadanDates.start}
                            onChange={e => setCurrentRamadanDates(p => ({...p, start: e.target.value}))}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="ramadanEnd" className={labelClasses}>تاريخ الانتهاء</label>
                        <input 
                            type="date" 
                            id="ramadanEnd"
                            value={currentRamadanDates.end}
                            onChange={e => setCurrentRamadanDates(p => ({...p, end: e.target.value}))}
                            className={inputClasses}
                        />
                    </div>
                    <button onClick={handleRamadanDatesSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                </div>
            </div>
            <div className="flex justify-between items-center p-4">
                 <h3 className="text-lg font-semibold text-[var(--text-primary)]">قائمة الإجازات الرسمية</h3>
                <button onClick={openHolidayModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إضافة إجازة رسمية
                </button>
            </div>
            <div className="overflow-x-auto">
                 <table className="min-w-full text-right">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">اسم الإجازة</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">التاريخ</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {[...publicHolidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(hol => (
                            <tr key={hol.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                <td className="py-4 px-6">{hol.name}</td>
                                <td className="py-4 px-6">{hol.date}</td>
                                <td className="py-4 px-6">
                                    <button onClick={() => openHolidayModalForEdit(hol)} className="text-[var(--accent-text)] hover:opacity-80 mr-4"><PencilIcon /></button>
                                    <button onClick={() => deletePublicHoliday(hol.id)} className="text-[var(--danger-text)] hover:opacity-80"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Conditional rendering for the correct print form
    const renderPrintableForm = () => {
        if (!printableRequest) return null;

        const duration = calculateDuration(printableRequest.leaveRequest.startDate, printableRequest.leaveRequest.endDate);

        if (duration <= 5) {
            return (
                <ShortLeaveRequestForm
                    leaveRequest={printableRequest.leaveRequest}
                    employee={printableRequest.employee}
                    onClose={() => setPrintableRequest(null)}
                />
            );
        } else {
            return (
                <LeaveRequestForm
                    leaveRequest={printableRequest.leaveRequest}
                    employee={printableRequest.employee}
                    onClose={() => setPrintableRequest(null)}
                />
            );
        }
    };


    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">إدارة الإجازات</h2>
            <div className="border-b border-[var(--border-color)] mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="طلبات الإجازة" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
                    {currentUser?.role !== 'Employee' && <TabButton label="الإجازات الرسمية" active={activeTab === 'holidays'} onClick={() => setActiveTab('holidays')} />}
                </nav>
            </div>

            {activeTab === 'requests' ? renderLeaveRequests() : renderPublicHolidays()}
            
            {/* Leave Request Modal */}
            <Modal isOpen={isRequestModalOpen} onClose={() => setRequestModalOpen(false)} title={currentRequest ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'}>
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="employeeId" className={labelClasses}>الموظف</label>
                        <select id="employeeId" name="employeeId" value={requestFormData.employeeId} onChange={e => setRequestFormData(p => ({...p, employeeId: e.target.value}))} className={inputClasses} disabled={currentUser?.role === 'Employee'}>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="leaveType" className={labelClasses}>نوع الإجازة</label>
                        <select id="leaveType" name="leaveType" value={requestFormData.leaveType} onChange={e => setRequestFormData(p => ({...p, leaveType: e.target.value as any}))} className={inputClasses}>
                            {(settings.leaveTypes || []).map(lt => (
                                <option key={lt} value={lt}>{lt}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className={labelClasses}>تاريخ البدء</label>
                            <input type="date" id="startDate" name="startDate" value={requestFormData.startDate} onChange={e => setRequestFormData(p => ({...p, startDate: e.target.value}))} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="endDate" className={labelClasses}>تاريخ الانتهاء</label>
                            <input type="date" id="endDate" name="endDate" value={requestFormData.endDate} onChange={e => setRequestFormData(p => ({...p, endDate: e.target.value}))} className={inputClasses} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="reason" className={labelClasses}>السبب (اختياري)</label>
                        <textarea
                            id="reason"
                            name="reason"
                            rows={2}
                            value={requestFormData.reason}
                            onChange={e => setRequestFormData(p => ({...p, reason: e.target.value}))}
                            className={inputClasses}
                        />
                    </div>
                     <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setRequestModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">حفظ</button>
                    </div>
                </form>
            </Modal>

            {/* Public Holiday Modal */}
             <Modal isOpen={isHolidayModalOpen} onClose={() => setHolidayModalOpen(false)} title={currentHoliday ? "تعديل إجازة رسمية" : "إضافة إجازة رسمية"}>
                <form onSubmit={handleHolidaySubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelClasses}>اسم الإجازة</label>
                        <input type="text" id="name" name="name" value={holidayFormData.name} onChange={e => setHolidayFormData(p => ({...p, name: e.target.value}))} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="date" className={labelClasses}>التاريخ</label>
                        <input type="date" id="date" name="date" value={holidayFormData.date} onChange={e => setHolidayFormData(p => ({...p, date: e.target.value}))} className={inputClasses} />
                    </div>
                     <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setHolidayModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">حفظ</button>
                    </div>
                </form>
            </Modal>

            {renderPrintableForm()}
        </div>
    );
};

export default LeaveManager;