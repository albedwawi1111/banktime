import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, TimeLog, Shift, PublicHoliday, LeaveRequest } from '../types';

interface SchedulerCalendarViewProps {
    currentDate: Date;
    currentUser: Employee | null;
    employees: Employee[];
    timeLogs: TimeLog[];
    shifts: Map<string, Shift>;
    publicHolidays: PublicHoliday[];
    leaveRequests: LeaveRequest[];
}

const SchedulerCalendarView: React.FC<SchedulerCalendarViewProps> = ({
    currentDate,
    currentUser,
    employees,
    timeLogs,
    shifts,
    publicHolidays,
    leaveRequests,
}) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [visibleEmployees, setVisibleEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        let employeesToShow: Employee[] = [];
        if (currentUser.role === 'Admin' || currentUser.role === 'Head of Department') {
            employeesToShow = employees;
        } else {
            employeesToShow = [currentUser];
        }
        setVisibleEmployees(employeesToShow);

        // Set initial selected employee
        if (currentUser.role === 'Employee') {
            setSelectedEmployeeId(currentUser.id);
        } else if (employeesToShow.length > 0) {
            // Check if the current selection is still valid, otherwise reset
            const currentSelectionIsValid = employeesToShow.some(e => e.id === selectedEmployeeId);
            if (!currentSelectionIsValid) {
                 setSelectedEmployeeId(employeesToShow[0].id);
            }
        }

    }, [currentUser, employees, selectedEmployeeId]);


    // 1. Calendar generation logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // 2. Data processing logic
    const employeeTimeLogs = timeLogs.filter(log => log.employeeId === selectedEmployeeId);
    const employeeLeaveRequests = leaveRequests.filter(req => req.employeeId === selectedEmployeeId && req.status === 'Approved');
    
    // 3. Render logic
    return (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg p-4">
             {(currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') && (
                <div className="mb-4">
                    <label htmlFor="employee-calendar-select" className="text-sm text-[var(--text-secondary)] mr-2">
                        عرض تقويم الموظف:
                    </label>
                    <select
                        id="employee-calendar-select"
                        value={selectedEmployeeId}
                        onChange={e => setSelectedEmployeeId(e.target.value)}
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                    >
                        {visibleEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                </div>
            )}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-[var(--text-secondary)] mb-2">
                {weekdays.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for previous month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-[var(--bg-tertiary)]/30 rounded-md"></div>)}

                {/* Month day cells */}
                {monthDays.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dateObj = new Date(dateStr);
                    // Adjust for timezone to avoid off-by-one day errors
                    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                    const dayOfWeek = dateObj.getDay();
                    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                    // Find events for this day
                    const log = employeeTimeLogs.find(l => l.date === dateStr);
                    const shift = log?.shiftId ? shifts.get(log.shiftId) : null;
                    const holiday = publicHolidays.find(h => h.date === dateStr);
                    const leave = employeeLeaveRequests.find(lr => dateStr >= lr.startDate && dateStr <= lr.endDate);

                    let cellBg = 'bg-[var(--bg-tertiary)]/60';
                    if (isWeekend) cellBg = 'bg-[var(--bg-tertiary)]/30';

                    let content = null;
                    if (leave) {
                        cellBg = 'bg-[var(--success-bg)]';
                        content = <div className="p-1 text-xs font-bold text-[var(--success-text)]">{leave.leaveType}</div>;
                    } else if (holiday) {
                        cellBg = 'bg-[var(--danger-bg)]';
                        content = <div className="p-1 text-xs font-bold text-[var(--danger-text)]">{holiday.name}</div>;
                    } else if (shift) {
                        content = (
                            <div style={{ borderRight: `4px solid ${shift.color}` }} className="h-full p-2 text-right">
                                <p className="font-bold text-xs">{shift.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1">{shift.startTime} - {shift.endTime}</p>
                            </div>
                        );
                    } else if (log) {
                        content = (
                            <div className="h-full p-2 text-right">
                                <p className="font-bold text-xs">إدخال يدوي</p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1">{log.clockIn} - {log.clockOut}</p>
                            </div>
                        );
                    }

                    return (
                        <div key={day} className={`rounded-md min-h-[7rem] flex flex-col ${cellBg} transition-colors`}>
                            <div className="text-sm font-semibold p-1.5 text-right">{day}</div>
                            <div className="flex-grow flex items-center justify-center text-center">{content}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SchedulerCalendarView;
