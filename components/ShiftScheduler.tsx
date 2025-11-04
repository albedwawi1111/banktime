import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Employee, TimeLog, Shift, PublicHoliday, LeaveRequest, AppSettings, ScheduleNotification } from '../types';
import Modal from './Modal';
import { PlusIcon, Cog6ToothIcon, PencilIcon, TrashIcon, TableCellsIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, BellIcon } from './icons';
import SchedulerCalendarView from './SchedulerCalendarView';

declare const html2pdf: any;

const getFirstAndLastName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) {
        return fullName;
    }
    return `${parts[0]} ${parts[parts.length - 1]}`;
};

const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    let startMinutes = timeToMinutes(startTime);
    let endMinutes = timeToMinutes(endTime);
    let duration = endMinutes - startMinutes;
    if (duration < 0) {
        duration += 24 * 60; // Overnight shift
    }
    return parseFloat((duration / 60).toFixed(2));
};

// Helper function to determine text color based on background
const getTextColorForBackground = (hexColor: string): string => {
    if (!hexColor) return 'var(--text-primary)';
    let color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    if (color.length === 3) {
        color = color.split('').map(char => char + char).join('');
    }
    if (color.length !== 6) return 'var(--text-primary)';
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#111827' /* Dark Text */ : '#FFFFFF' /* Light Text */;
};

interface ShiftSchedulerProps {
    employees: Employee[];
    timeLogs: TimeLog[];
    addTimeLog: (log: Omit<TimeLog, 'id'>) => void;
    updateTimeLog: (log: TimeLog) => void;
    deleteTimeLog: (id: string) => void;
    shifts: Shift[];
    addShift: (shift: Omit<Shift, 'id'>) => void;
    updateShift: (shift: Shift) => void;
    deleteShift: (id: string) => void;
    publicHolidays: PublicHoliday[];
    leaveRequests: LeaveRequest[];
    settings: AppSettings;
    currentUser: Employee | null;
    bulkUpdateTimeLogs: (logsToDelete: string[], logsToAdd: Omit<TimeLog, 'id'>[]) => Promise<void>;
    addScheduleNotification: (notification: Omit<ScheduleNotification, 'id' | 'createdAt'>) => Promise<any>;
}

export const ShiftScheduler: React.FC<ShiftSchedulerProps> = ({ 
    employees, timeLogs, addTimeLog, updateTimeLog, deleteTimeLog,
    shifts, addShift, updateShift, deleteShift,
    publicHolidays, leaveRequests, settings, currentUser, bulkUpdateTimeLogs,
    addScheduleNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'admin'>('schedule');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'roster'>('table');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Partial<TimeLog> | null>(null);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [shiftFormData, setShiftFormData] = useState<Omit<Shift, 'id'>>({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      color: '#3b82f6',
      department: '',
  });

  const [adminDepartmentFilter, setAdminDepartmentFilter] = useState('All');
  const [scheduleDepartmentFilter, setScheduleDepartmentFilter] = useState('');
  
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const [popover, setPopover] = useState<{ employeeId: string; day: number; x: number; y: number; } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const rosterPrintRef = useRef<HTMLDivElement>(null);
  
  const shiftMap = useMemo<Map<string, Shift>>(() => new Map(shifts.map(s => [s.id, s])), [shifts]);
  
  const departments = useMemo(() => {
    return settings.departments || [];
  }, [settings.departments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setPopover(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
      // Set default department for new shifts if not already set
      if (!shiftFormData.department && departments.length > 0) {
          setShiftFormData(prev => ({ ...prev, department: departments[0] }));
      }
      
      if (currentUser?.role === 'Employee') {
          setScheduleDepartmentFilter(currentUser.department);
      } else if (!scheduleDepartmentFilter && departments.length > 0) {
        setScheduleDepartmentFilter(departments[0]);
      }
  }, [departments, shiftFormData.department, scheduleDepartmentFilter, currentUser]);


  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value + '-02'));
  };

  const getLogForCell = (employeeId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return timeLogs.find(log => log.employeeId === employeeId && log.date === dateStr);
  };

  const openLogModal = (employeeId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingLog = getLogForCell(employeeId, day);
    if (existingLog) {
      setSelectedLog(existingLog);
    } else {
      setSelectedLog({ employeeId, date: dateStr, clockIn: '', clockOut: '' });
    }
    setIsLogModalOpen(true);
  };
  
  const handleCloseLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedLog(null);
  };
  
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog || !selectedLog.employeeId || !selectedLog.date || !selectedLog.clockIn || !selectedLog.clockOut) return;

    const logData = {
      employeeId: selectedLog.employeeId,
      date: selectedLog.date,
      clockIn: selectedLog.clockIn,
      clockOut: selectedLog.clockOut,
      shiftId: selectedLog.shiftId,
    };

    if ('id' in selectedLog && selectedLog.id) {
        updateTimeLog({ ...logData, id: selectedLog.id });
    } else {
        addTimeLog(logData as Omit<TimeLog, 'id'>);
    }
    handleCloseLogModal();
  };

  const handleShiftSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shiftId = e.target.value;
    if (shiftId) {
        const selectedShift = shiftMap.get(shiftId);
        if (selectedShift) {
            setSelectedLog(prev => ({
                ...prev,
                shiftId: selectedShift.id,
                clockIn: selectedShift.startTime,
                clockOut: selectedShift.endTime,
            }));
        }
    } else {
        setSelectedLog(prev => ({ ...prev, shiftId: undefined, clockIn: '', clockOut: '' }));
    }
  };

  const openShiftModalForAdd = () => {
    setCurrentShift(null);
    let defaultDept = departments.length > 0 ? departments[0] : '';
    setShiftFormData({
        name: '',
        startTime: '09:00',
        endTime: '17:00',
        color: '#3b82f6',
        department: defaultDept,
    });
    setIsShiftModalOpen(true);
  };
  
  const openShiftModalForEdit = (shift: Shift) => {
    setCurrentShift(shift);
    setShiftFormData(shift);
    setIsShiftModalOpen(true);
  };
  
  const handleCloseShiftModal = () => {
    setIsShiftModalOpen(false);
    setCurrentShift(null);
  };
  
  const handleShiftFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShiftFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftFormData.name || !shiftFormData.department) return;
    if (currentShift) {
        updateShift({ ...shiftFormData, id: currentShift.id });
    } else {
        addShift(shiftFormData);
    }
    handleCloseShiftModal();
  };

  const handleCellClick = (e: React.MouseEvent, employeeId: string, day: number) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopover({
        employeeId,
        day,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY,
    });
  };

  const handleQuickAssign = (employeeId: string, day: number, shift: Shift) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingLog = getLogForCell(employeeId, day);
    const logData = {
        employeeId: employeeId,
        date: dateStr,
        clockIn: shift.startTime,
        clockOut: shift.endTime,
        shiftId: shift.id,
    };
    if (existingLog) {
        updateTimeLog({ ...logData, id: existingLog.id });
    } else {
        addTimeLog(logData);
    }
    setPopover(null);
  };

  const handleClearShift = (employeeId: string, day: number) => {
    const existingLog = getLogForCell(employeeId, day);
    if (existingLog) {
        deleteTimeLog(existingLog.id);
    }
    setPopover(null);
  };

  const handleManualEdit = (employeeId: string, day: number) => {
    openLogModal(employeeId, day);
    setPopover(null);
  };

  const handleExportRosterPDF = () => {
    const element = rosterPrintRef.current;
    if (element) {
        const originalTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'light');
        
        // Make the hidden element visible for capturing
        const originalParentDisplay = element.parentElement?.style.display;
        if(element.parentElement) {
            element.parentElement.style.display = 'block';
        }

        const fileName = `Roster_${scheduleDepartmentFilter}_${year}-${month + 1}.pdf`;
        const opt = {
            margin: 0.5,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            if (originalTheme) {
                document.documentElement.setAttribute('data-theme', originalTheme);
            }
            if(element.parentElement && originalParentDisplay !== undefined) {
                element.parentElement.style.display = originalParentDisplay;
            }
        });
    }
  };

  const handlePrintRoster = () => {
      window.print();
  };

  const filteredScheduleEmployees = useMemo(() => {
    if (!scheduleDepartmentFilter) return [];

    // All roles will now see employees based on the selected department filter.
    // Editing permissions are handled at the cell level, ensuring employees can only edit their own logs.
    return employees.filter(e => e.department === scheduleDepartmentFilter);
  }, [employees, scheduleDepartmentFilter]);

  const handleOpenNotifyModal = () => {
      const monthName = currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      setNotificationMessage(`تذكير: تم تحديث جدول المناوبات لقسم ${scheduleDepartmentFilter} لشهر ${monthName}. يرجى مراجعة الجدول.`);
      setIsNotifyModalOpen(true);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!notificationMessage.trim() || filteredScheduleEmployees.length === 0) return;

      const employeeIds = filteredScheduleEmployees.map(emp => emp.id);

      await addScheduleNotification({
          employeeIds,
          department: scheduleDepartmentFilter,
          message: notificationMessage,
          month: `${year}-${String(month + 1).padStart(2, '0')}`,
          createdBy: currentUser!.name,
      });
      
      setIsNotifyModalOpen(false);
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

  const renderTableView = () => (
    <div>
        {currentUser?.role !== 'Employee' && (
            <div className="mb-4">
                <label htmlFor="schedule-dept-filter" className="text-sm text-[var(--text-secondary)] mr-2">عرض قسم:</label>
                <select
                    id="schedule-dept-filter"
                    value={scheduleDepartmentFilter}
                    onChange={(e) => setScheduleDepartmentFilter(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] disabled:opacity-70"
                >
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
            </div>
        )}

        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-x-auto">
            <table className="min-w-full text-center text-sm border-collapse border border-[var(--border-color)]">
                <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                        <th className="sticky right-0 bg-[var(--bg-tertiary)] p-2 border border-[var(--border-color-light)] font-semibold">الموظف</th>
                        {monthDays.map(day => <th key={day} className="p-2 border border-[var(--border-color-light)] font-semibold w-28">{day}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredScheduleEmployees.map(emp => (
                        <tr key={emp.id} className="divide-x divide-[var(--border-color)]">
                            <td className="sticky right-0 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]/50 p-2 border border-[var(--border-color-light)] font-medium whitespace-nowrap">{emp.name}</td>
                            {monthDays.map(day => {
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dateObj = new Date(dateStr);
                                const dayOfWeek = dateObj.getDay();
                                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday=5, Saturday=6
                                
                                const log = getLogForCell(emp.id, day);
                                const shift = log?.shiftId ? shiftMap.get(log.shiftId) : null;
                                const isHoliday = publicHolidays.some(h => h.date === dateStr);
                                const approvedLeave = leaveRequests.find(lr => 
                                    lr.employeeId === emp.id && 
                                    lr.status === 'Approved' && 
                                    dateStr >= lr.startDate && 
                                    dateStr <= lr.endDate
                                );

                                let cellBgClass = 'hover:bg-[var(--accent-color)]/20';
                                let cellContent = null;
                                let isClickable = (currentUser?.role !== 'Employee') || (emp.id === currentUser?.id);
                                let cellStyle = {};

                                // Determine empty cell backgrounds first
                                if (approvedLeave) {
                                    cellBgClass = 'bg-[var(--success-bg)]';
                                    cellContent = <p className="text-xs font-semibold text-[var(--success-text)]">{approvedLeave.leaveType}</p>;
                                    isClickable = false;
                                } else if (isHoliday && !log) {
                                    cellBgClass = 'bg-[var(--danger-bg)]';
                                    cellContent = <p className="text-xs font-semibold text-[var(--danger-text)]">إجازة رسمية</p>;
                                } else if (isWeekend && !log) {
                                    cellBgClass = 'bg-[var(--bg-tertiary)]/50';
                                    cellContent = <p className="text-xs font-semibold text-[var(--text-muted)]">عطلة نهاية الأسبوع</p>;
                                }

                                // Determine final content and style for the cell
                                let finalCellContent;
                                if (log) {
                                    let textColor = 'var(--text-primary)';
                                    let secondaryTextColor = 'var(--text-secondary)';
                                    
                                    if (shift) {
                                        // Scheduled shift with a log
                                        textColor = getTextColorForBackground(shift.color);
                                        secondaryTextColor = textColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(17, 24, 39, 0.7)';
                                        cellStyle = { backgroundColor: shift.color };
                                        cellBgClass = 'shift-cell'; // Override background class for hover effect
                                    } else {
                                        // Manual entry with a log
                                        cellBgClass = 'bg-[var(--bg-quaternary)]/70 hover:bg-[var(--bg-quaternary)]';
                                    }

                                    finalCellContent = (
                                        <div className="text-xs flex flex-col justify-center h-full text-center p-1" style={{ color: textColor }}>
                                            <p className="font-semibold">{shift?.name || 'إدخال يدوي'}</p>
                                            <p style={{ color: secondaryTextColor }} className="mt-1 font-mono">{log.clockIn} - {log.clockOut}</p>
                                        </div>
                                    );
                                } else if (cellContent) { // Holiday, Leave, Weekend
                                    finalCellContent = <div className="flex justify-center items-center h-full text-center">{cellContent}</div>;
                                } else { // Empty clickable cell
                                    finalCellContent = isClickable && (
                                        <div className="flex justify-center items-center h-full">
                                            <PlusIcon className="w-5 h-5 text-[var(--text-muted)]"/>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <td 
                                        key={day} 
                                        onClick={(e) => isClickable && handleCellClick(e, emp.id, day)} 
                                        style={cellStyle}
                                        className={`p-1 border border-[var(--border-color-light)] h-20 transition-all duration-200 relative ${isClickable ? 'cursor-pointer' : 'cursor-default'} ${cellBgClass}`}
                                    >
                                        {finalCellContent}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderRosterView = () => {
    const departmentShifts = shifts
        .filter(s => s.department === scheduleDepartmentFilter)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const logsForMonthMap = new Map<string, string[]>(); // Key: "YYYY-MM-DD:shiftId", Value: employeeName array
    const usedShiftIdsInMonth = new Set<string>();

    timeLogs.forEach(log => {
        const logDate = new Date(log.date);
        if (log.shiftId && logDate.getFullYear() === year && logDate.getMonth() === month) {
            const employee = employees.find(e => e.id === log.employeeId);
            if (employee && employee.department === scheduleDepartmentFilter) {
                const fullName = employee.name;
                if (fullName) {
                    const key = `${log.date}:${log.shiftId}`;
                    const names = logsForMonthMap.get(key) || [];
                    names.push(getFirstAndLastName(fullName));
                    logsForMonthMap.set(key, names);
                    usedShiftIdsInMonth.add(log.shiftId);
                }
            }
        }
    });

    const activeDepartmentShifts = departmentShifts.filter(shift => usedShiftIdsInMonth.has(shift.id));

    return (
        <div>
             <div className="flex justify-between items-center mb-4 flex-wrap gap-4 print:hidden">
                {currentUser?.role !== 'Employee' ? (
                    <div>
                        <label htmlFor="schedule-dept-filter-roster" className="text-sm text-[var(--text-secondary)] mr-2">عرض قسم:</label>
                        <select
                            id="schedule-dept-filter-roster"
                            value={scheduleDepartmentFilter}
                            onChange={(e) => setScheduleDepartmentFilter(e.target.value)}
                            className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] disabled:opacity-70"
                        >
                            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                ) : <div />}
                <div className="flex gap-2">
                    <button onClick={handlePrintRoster} className="flex items-center gap-2 bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-3 rounded-lg transition-colors">
                        <PrinterIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={handleExportRosterPDF} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg transition-colors">
                        <ArrowDownTrayIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            <div className="print:hidden">
                {activeDepartmentShifts.length === 0 ? (
                    <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-8 text-center">
                        <p className="text-[var(--text-muted)]">لا توجد بيانات مناوبات مسجلة لهذا القسم في الشهر المحدد.</p>
                    </div>
                ) : (
                    <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-x-auto">
                        <table className="min-w-full text-center text-sm border-collapse border border-[var(--border-color)]">
                            <thead className="bg-[var(--bg-tertiary)]">
                                <tr>
                                    <th className="p-2 border border-[var(--border-color-light)] font-semibold">التاريخ</th>
                                    <th className="p-2 border border-[var(--border-color-light)] font-semibold">اليوم</th>
                                    {activeDepartmentShifts.map(shift => (
                                        <th key={shift.id} className="p-2 border border-[var(--border-color-light)] font-semibold">{shift.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {monthDays.map(day => {
                                    const date = new Date(year, month, day);
                                    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });

                                    return (
                                        <tr key={day} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                            <td className="p-2 border border-[var(--border-color-light)] whitespace-nowrap">{dateStr}</td>
                                            <td className="p-2 border border-[var(--border-color-light)] whitespace-nowrap">{dayName}</td>
                                            {activeDepartmentShifts.map(shift => {
                                                const employeeNames = logsForMonthMap.get(`${dateStr}:${shift.id}`);
                                                const cellContent = employeeNames && employeeNames.length > 0 ? employeeNames.join('، ') : '-';
                                                return (
                                                    <td key={shift.id} className="p-2 border border-[var(--border-color-light)] whitespace-nowrap">
                                                        {cellContent}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="hidden">
                 <div id="roster-print-area" ref={rosterPrintRef} className="p-4">
                    <h2 className="text-xl font-bold mb-4 text-center">
                        السجل اليومي للمناوبات - قسم {scheduleDepartmentFilter}
                        <br/>
                        {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric'})}
                    </h2>
                    <table className="w-full text-center text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-1 border border-gray-400 font-semibold">التاريخ</th>
                                <th className="p-1 border border-gray-400 font-semibold">اليوم</th>
                                {activeDepartmentShifts.map(shift => (
                                    <th key={shift.id} className="p-1 border border-gray-400 font-semibold">{shift.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {monthDays.map(day => {
                                const date = new Date(year, month, day);
                                date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });

                                return (
                                    <tr key={day}>
                                        <td className="p-1 border border-gray-400 whitespace-nowrap">{dateStr}</td>
                                        <td className="p-1 border border-gray-400 whitespace-nowrap">{dayName}</td>
                                        {activeDepartmentShifts.map(shift => {
                                            const employeeNames = logsForMonthMap.get(`${dateStr}:${shift.id}`);
                                            const cellContent = employeeNames && employeeNames.length > 0 ? employeeNames.join('، ') : '-';
                                            return (
                                                <td key={shift.id} className="p-1 border border-gray-400 whitespace-nowrap">
                                                    {cellContent}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  const filteredAdminShifts = useMemo(() => {
    if (adminDepartmentFilter === 'All') return shifts;
    return shifts.filter(s => s.department === adminDepartmentFilter);
  }, [shifts, adminDepartmentFilter]);

  const renderAdmin = () => (
    <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 flex-wrap gap-4">
             <div>
                <select 
                    value={adminDepartmentFilter}
                    onChange={(e) => setAdminDepartmentFilter(e.target.value)}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] disabled:opacity-70"
                >
                    <option value="All">جميع الأقسام</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
            </div>
            <button onClick={openShiftModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                <PlusIcon />
                إضافة مناوبة
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-right">
                <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">اللون</th>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">اسم المناوبة</th>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">القسم</th>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">وقت البدء</th>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">وقت الانتهاء</th>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">عدد الساعات</th>
                        <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredAdminShifts.map(shift => (
                        <tr key={shift.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                            <td className="py-4 px-6"><div className="w-6 h-6 rounded-full" style={{backgroundColor: shift.color}}></div></td>
                            <td className="py-4 px-6 font-medium">{shift.name}</td>
                            <td className="py-4 px-6">{shift.department}</td>
                            <td className="py-4 px-6">{shift.startTime}</td>
                            <td className="py-4 px-6">{shift.endTime}</td>
                            <td className="py-4 px-6 font-mono">{calculateHours(shift.startTime, shift.endTime)}</td>
                            <td className="py-4 px-6">
                                <button onClick={() => openShiftModalForEdit(shift)} className="text-[var(--accent-text)] hover:opacity-80 mr-4 transition-colors"><PencilIcon /></button>
                                <button onClick={() => deleteShift(shift.id)} className="text-[var(--danger-text)] hover:opacity-80 transition-colors"><TrashIcon /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderPopover = () => {
    if (!popover) return null;

    const { employeeId, day, x, y } = popover;
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const availableShifts = shifts.filter(s => s.department === employee.department);
    const existingLog = getLogForCell(employeeId, day);

    return (
        <div
            ref={popoverRef}
            style={{ top: y, left: x }}
            className="absolute z-50 bg-[var(--bg-tertiary)] rounded-lg shadow-2xl p-2 border border-[var(--border-color-light)] w-48 text-right"
        >
            <div className="text-xs text-[var(--text-secondary)] px-2 py-1 mb-1 border-b border-[var(--border-color)]">
                {employee.name} - يوم {day}
            </div>
            <ul className="text-sm">
                {availableShifts.map(shift => (
                    <li key={shift.id}>
                        <button
                            onClick={() => handleQuickAssign(employeeId, day, shift)}
                            className="w-full text-right px-2 py-1.5 rounded-md hover:bg-[var(--accent-color)]/20 flex items-center gap-2"
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }}></div>
                            {shift.name}
                        </button>
                    </li>
                ))}
                <li><hr className="my-1 border-[var(--border-color)]"/></li>
                 <li>
                    <button
                        onClick={() => handleManualEdit(employeeId, day)}
                        className="w-full text-right px-2 py-1.5 rounded-md hover:bg-[var(--bg-quaternary)]/50"
                    >
                        تعديل يدوي...
                    </button>
                </li>
                {existingLog && (
                     <li>
                        <button
                            onClick={() => handleClearShift(employeeId, day)}
                            className="w-full text-right px-2 py-1.5 rounded-md hover:bg-[var(--danger-bg)] text-[var(--danger-text)]"
                        >
                            مسح المناوبة
                        </button>
                    </li>
                )}
            </ul>
        </div>
    );
  };

  const employeeForLog = selectedLog?.employeeId ? employees.find(e => e.id === selectedLog.employeeId) : null;
  const availableShifts = employeeForLog
    ? shifts.filter(s => s.department === employeeForLog.department)
    : [];

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] disabled:opacity-50";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";


  return (
    <div className="p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المناوبات</h2>
            <div className="flex items-center gap-4">
                {activeTab === 'schedule' && (
                    <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg p-1">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} aria-label="عرض كجدول"><TableCellsIcon className="w-5 h-5" /></button>
                        <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} aria-label="عرض كتقويم"><CalendarDaysIcon className="w-5 h-5" /></button>
                        <button onClick={() => setViewMode('roster')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'roster' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} aria-label="عرض السجل اليومي"><ClipboardDocumentCheckIcon className="w-5 h-5" /></button>
                    </div>
                )}
                {currentUser?.role !== 'Employee' && activeTab === 'schedule' && (
                    <button onClick={handleOpenNotifyModal} className="flex items-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors" title="إرسال إشعار للموظفين">
                        <BellIcon className="w-5 h-5 text-[var(--accent-text)]" />
                        <span>إرسال إشعار</span>
                    </button>
                )}
                <label htmlFor="month-picker" className="text-[var(--text-secondary)]">اختر الشهر:</label>
                <input type="month" id="month-picker" value={`${year}-${String(month + 1).padStart(2, '0')}`} onChange={handleDateChange} className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"/>
            </div>
        </div>
      
        <div className="border-b border-[var(--border-color)] mb-6">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <TabButton label="جدول المناوبات" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                {currentUser?.role !== 'Employee' && <TabButton label="إدارة المناوبة" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
            </nav>
        </div>

        {activeTab === 'schedule' ? (
            viewMode === 'table' ? (
                renderTableView()
            ) : viewMode === 'calendar' ? (
                <SchedulerCalendarView 
                    currentDate={currentDate}
                    currentUser={currentUser}
                    employees={employees}
                    timeLogs={timeLogs}
                    shifts={shiftMap}
                    publicHolidays={publicHolidays}
                    leaveRequests={leaveRequests}
                />
            ) : (
                renderRosterView()
            )
        ) : renderAdmin()}

        {renderPopover()}

        <Modal isOpen={isLogModalOpen} onClose={handleCloseLogModal} title={selectedLog && 'id' in selectedLog ? 'تعديل سجل الدوام' : 'إضافة سجل دوام'}>
            {selectedLog && (
                <form onSubmit={handleLogSubmit} className="space-y-4">
                    <div>
                        <label className={labelClasses}>المناوبة (قسم: {employeeForLog?.department || 'غير محدد'})</label>
                        <select
                            value={selectedLog.shiftId || ''}
                            onChange={handleShiftSelect}
                            className={inputClasses}
                        >
                            <option value="">-- إدخال يدوي --</option>
                            {availableShifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="clockIn" className={labelClasses}>وقت الحضور</label>
                        <input type="time" name="clockIn" id="clockIn" value={selectedLog.clockIn || ''} onChange={e => setSelectedLog(p => ({...p, clockIn: e.target.value}))} required className={inputClasses}/>
                    </div>
                    <div>
                        <label htmlFor="clockOut" className={labelClasses}>وقت الانصراف</label>
                        <input type="time" name="clockOut" id="clockOut" value={selectedLog.clockOut || ''} onChange={e => setSelectedLog(p => ({...p, clockOut: e.target.value}))} required className={inputClasses}/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={handleCloseLogModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                    </div>
                </form>
            )}
        </Modal>

        <Modal isOpen={isShiftModalOpen} onClose={handleCloseShiftModal} title={currentShift ? 'تعديل المناوبة' : 'إضافة مناوبة جديدة'}>
            <form onSubmit={handleShiftSubmit} className="space-y-4">
                <div>
                    <label htmlFor="department" className={labelClasses}>القسم</label>
                     <select name="department" id="department" value={shiftFormData.department} onChange={handleShiftFormChange} required className={inputClasses}>
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="name" className={labelClasses}>اسم المناوبة</label>
                    <input type="text" name="name" id="name" value={shiftFormData.name} onChange={handleShiftFormChange} required className={inputClasses}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startTime" className={labelClasses}>وقت البدء</label>
                        <input type="time" name="startTime" id="startTime" value={shiftFormData.startTime} onChange={handleShiftFormChange} required className={inputClasses}/>
                    </div>
                    <div>
                        <label htmlFor="endTime" className={labelClasses}>وقت الانتهاء</label>
                        <input type="time" name="endTime" id="endTime" value={shiftFormData.endTime} onChange={handleShiftFormChange} required className={inputClasses}/>
                    </div>
                </div>
                 <div>
                    <label className={labelClasses}>مجموع الساعات</label>
                    <div className="w-full bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono">
                        {calculateHours(shiftFormData.startTime, shiftFormData.endTime)}
                    </div>
                </div>
                <div>
                    <label htmlFor="color" className={labelClasses}>اللون</label>
                    <input type="color" name="color" id="color" value={shiftFormData.color} onChange={handleShiftFormChange} className="w-full h-10 bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md p-1"/>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={handleCloseShiftModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                    <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                </div>
            </form>
        </Modal>
        <Modal isOpen={isNotifyModalOpen} onClose={() => setIsNotifyModalOpen(false)} title="إرسال إشعار للموظفين">
            <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                    <label htmlFor="notificationMessage" className={labelClasses}>نص الرسالة</label>
                    <textarea
                        id="notificationMessage"
                        rows={4}
                        value={notificationMessage}
                        onChange={e => setNotificationMessage(e.target.value)}
                        className={inputClasses}
                        required
                    />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">سيتم إرسال هذا الإشعار إلى جميع الموظفين ({filteredScheduleEmployees.length} موظفين) في قسم: {scheduleDepartmentFilter}.</p>
                <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                    <button type="button" onClick={() => setIsNotifyModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                    <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">إرسال</button>
                </div>
            </form>
        </Modal>
        <style>{`
            .shift-cell:hover {
                filter: brightness(1.1);
                transition: filter 0.2s ease-in-out;
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                #roster-print-area, #roster-print-area * {
                    visibility: visible;
                }
                #roster-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
            }
        `}</style>
    </div>
  );
};