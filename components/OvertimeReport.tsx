import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Employee, TimeLog, PublicHoliday, LeaveRequest, RamadanDates, OvertimeRecord, AppSettings } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MagnifyingGlassIcon, PrinterIcon, ArrowDownTrayIcon } from './icons';

declare const html2pdf: any;

interface OvertimeReportProps {
  employees: Employee[];
  timeLogs: TimeLog[];
  publicHolidays: PublicHoliday[];
  leaveRequests: LeaveRequest[];
  ramadanDates: RamadanDates;
  settings: AppSettings;
  currentUser: Employee | null;
}

const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    try {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    } catch (e) {
        return 0;
    }
};

const calculateHours = (startTime: string, endTime: string): number => {
    let startMinutes = timeToMinutes(startTime);
    let endMinutes = timeToMinutes(endTime);
    let duration = endMinutes - startMinutes;
    if (duration < 0) {
        duration += 24 * 60; // Overnight shift
    }
    return parseFloat((duration / 60).toFixed(2));
};

export const OvertimeReport: React.FC<OvertimeReportProps> = ({ employees, timeLogs, publicHolidays, leaveRequests, ramadanDates, settings, currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('summary');
    const [yearlyReportYear, setYearlyReportYear] = useState(new Date().getFullYear());
    const [monthlyLogDepartmentFilter, setMonthlyLogDepartmentFilter] = useState<string[]>([]);
    const [yearlySummaryDepartmentFilter, setYearlySummaryDepartmentFilter] = useState<string[]>([]);
    
    const monthlyLogPrintRef = useRef<HTMLDivElement>(null);
    const yearlySummaryPrintRef = useRef<HTMLDivElement>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const departments = useMemo(() => {
        return settings.departments || [];
    }, [settings.departments]);

    const visibleEmployees = useMemo(() => {
        if (currentUser?.role === 'Employee') {
            return employees.filter(e => e.id === currentUser.id);
        }
        return employees;
    }, [employees, currentUser]);

    const monthlyReportData = useMemo(() => {
        const report: OvertimeRecord[] = visibleEmployees.map(employee => {
            let totalRequiredHours = 0;
            let totalActualHours = 0;
            let workDaysOnHolidays = 0;
            let numberOfWorkDays = 0;
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const currentYearRamadan = ramadanDates[year];

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const dayIndex = date.getDay();
                const isWeekend = dayIndex === 5 || dayIndex === 6;
                const isHoliday = publicHolidays.some(h => h.date === dateStr);
                const isLeaveDay = leaveRequests.some(lr => lr.employeeId === employee.id && lr.status === 'Approved' && dateStr >= lr.startDate && dateStr <= lr.endDate);
                
                if (!isWeekend && !isHoliday && !isLeaveDay) {
                    numberOfWorkDays++;
                    const isRamadan = currentYearRamadan && dateStr >= currentYearRamadan.start && dateStr <= currentYearRamadan.end;
                    totalRequiredHours += isRamadan ? 5 : 7;
                }

                const log = timeLogs.find(l => l.employeeId === employee.id && l.date === dateStr);
                if (log) {
                    const actual = calculateHours(log.clockIn, log.clockOut);
                    totalActualHours += actual;
                    
                    if (isHoliday || isWeekend) {
                        workDaysOnHolidays++;
                    }
                }
            }

            const totalOvertimeHours = Math.max(0, totalActualHours - totalRequiredHours);
            const hoursPerDay = numberOfWorkDays > 0 ? (totalRequiredHours / numberOfWorkDays) : 7;
            const compensatoryDaysFromOvertime = hoursPerDay > 0 ? Math.floor(totalOvertimeHours / hoursPerDay) : 0;


            let compensatoryDaysDue = 0;
            if (totalActualHours >= totalRequiredHours) {
                compensatoryDaysDue = Math.max(compensatoryDaysFromOvertime, workDaysOnHolidays);
            }

            return {
                employeeId: employee.id,
                employeeName: employee.name,
                department: employee.department,
                totalRequiredHours,
                totalActualHours,
                totalOvertimeHours,
                compensatoryDays: compensatoryDaysDue, // Use the final due days for charts and summaries
                workDaysOnHolidays,
                compensatoryDaysDue,
            };
        });

        return report.filter(r => r.totalActualHours > 0 || r.totalRequiredHours > 0);

    }, [visibleEmployees, timeLogs, year, month, publicHolidays, leaveRequests, ramadanDates]);

    const filteredMonthlyReportData = useMemo(() => {
        if (currentUser?.role === 'Employee') return monthlyReportData;
        if (monthlyLogDepartmentFilter.length === 0) {
            return monthlyReportData;
        }
        return monthlyReportData.filter(record => monthlyLogDepartmentFilter.includes(record.department));
    }, [monthlyReportData, monthlyLogDepartmentFilter, currentUser]);

    const departmentReviewData = useMemo(() => {
        const departments: { [key: string]: { required: number; actual: number; overtime: number; days: number; } } = {};
        
        monthlyReportData.forEach(record => {
            if (!departments[record.department]) {
                departments[record.department] = { required: 0, actual: 0, overtime: 0, days: 0 };
            }
            departments[record.department].required += record.totalRequiredHours;
            departments[record.department].actual += record.totalActualHours;
            departments[record.department].overtime += record.totalOvertimeHours;
            departments[record.department].days += record.compensatoryDays;
        });

        const employeeCounts = employees.reduce((acc, emp) => {
            acc[emp.department] = (acc[emp.department] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});
        
        return Object.entries(departments).map(([name, data]) => ({
            name,
            ...data,
            employeeCount: employeeCounts[name] || 0,
            attendancePercentage: data.required > 0 ? (data.actual / data.required) * 100 : 0,
        }));
    }, [monthlyReportData, employees]);
    
    const yearlyEmployeeReportData = useMemo(() => {
        const employeesForReport = currentUser?.role === 'Employee' 
            ? visibleEmployees 
            : (yearlySummaryDepartmentFilter.length === 0 
                ? employees 
                : employees.filter(emp => yearlySummaryDepartmentFilter.includes(emp.department)));

        const months = Array.from({ length: 12 }, (_, i) => i);
        
        return employeesForReport.map(employee => {
            const monthlyDays: number[] = months.map(monthIndex => {
                let totalRequiredHours = 0;
                let totalActualHours = 0;
                let workDaysOnHolidays = 0;
                let numberOfWorkDays = 0;
                
                const daysInMonth = new Date(yearlyReportYear, monthIndex + 1, 0).getDate();
                const currentYearRamadan = ramadanDates[yearlyReportYear];

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(yearlyReportYear, monthIndex, day);
                    const dateStr = `${yearlyReportYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    const dayIndex = date.getDay();
                    const isWeekend = dayIndex === 5 || dayIndex === 6;
                    const isHoliday = publicHolidays.some(h => h.date === dateStr);
                    const isLeaveDay = leaveRequests.some(lr => lr.employeeId === employee.id && lr.status === 'Approved' && dateStr >= lr.startDate && dateStr <= lr.endDate);
                    
                    if (!isWeekend && !isHoliday && !isLeaveDay) {
                        numberOfWorkDays++;
                        const isRamadan = currentYearRamadan && dateStr >= currentYearRamadan.start && dateStr <= currentYearRamadan.end;
                        totalRequiredHours += isRamadan ? 5 : 7;
                    }

                    const log = timeLogs.find(l => l.employeeId === employee.id && l.date === dateStr);
                    if (log) {
                        const actual = calculateHours(log.clockIn, log.clockOut);
                        totalActualHours += actual;
                        
                        if (isHoliday || isWeekend) {
                            workDaysOnHolidays++;
                        }
                    }
                }

                const totalOvertimeHours = Math.max(0, totalActualHours - totalRequiredHours);
                const hoursPerDay = numberOfWorkDays > 0 ? (totalRequiredHours / numberOfWorkDays) : 7;
                const compensatoryDaysFromOvertime = hoursPerDay > 0 ? Math.floor(totalOvertimeHours / hoursPerDay) : 0;

                let compensatoryDaysDue = 0;
                if (totalActualHours >= totalRequiredHours) {
                    compensatoryDaysDue = Math.max(compensatoryDaysFromOvertime, workDaysOnHolidays);
                }

                return compensatoryDaysDue;
            });

            const totalYearlyDays = monthlyDays.reduce((acc, days) => acc + days, 0);

            return {
                employeeId: employee.id,
                employeeNumber: employee.employeeNumber,
                employeeName: employee.name,
                department: employee.department,
                monthlyDays,
                totalYearlyDays,
            };
        });

    }, [yearlyReportYear, employees, timeLogs, publicHolidays, leaveRequests, ramadanDates, yearlySummaryDepartmentFilter, currentUser, visibleEmployees]);


    const handleExportPDF = (elementRef: React.RefObject<HTMLDivElement>, fileName: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
        const element = elementRef.current;
        if (element) {
            const originalTheme = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', 'light');
            
            // Temporarily make the hidden element visible for capturing
            const originalDisplay = element.style.display;
            element.style.display = 'block';
            
            const opt = {
                margin: 0.5,
                filename: fileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation }
            };
            
            html2pdf().from(element).set(opt).save().then(() => {
                // Restore original theme and display
                if (originalTheme) {
                    document.documentElement.setAttribute('data-theme', originalTheme);
                }
                element.style.display = originalDisplay;
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const TabButton: React.FC<{ tab: string, label: string, active: boolean, onClick: () => void }> = ({ tab, label, active, onClick }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                active ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-[var(--border-color-light)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
            }`}
        >
            {label}
        </button>
    );

    const DepartmentMultiSelect: React.FC<{
        selectedDepartments: string[],
        onSelect: (depts: string[]) => void,
        departmentsList: string[]
    }> = ({ selectedDepartments, onSelect, departmentsList }) => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [ref]);
        
        const handleDeptChange = (dept: string) => {
            const newSelection = selectedDepartments.includes(dept)
                ? selectedDepartments.filter(d => d !== dept)
                : [...selectedDepartments, dept];
            onSelect(newSelection);
        };
        
        return (
            <div className="relative inline-block text-left" ref={ref}>
                <div>
                    <button type="button" onClick={() => setIsOpen(!isOpen)} className="inline-flex justify-center w-full rounded-md border border-[var(--border-color-light)] shadow-sm px-4 py-2 bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-quaternary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-color)]">
                        {selectedDepartments.length === 0 ? 'جميع الأقسام' : `${selectedDepartments.length} أقسام مختارة`}
                        <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                {isOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[var(--bg-secondary)] ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1 max-h-60 overflow-y-auto" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            {departmentsList.map(dept => (
                                <label key={dept} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedDepartments.includes(dept)}
                                        onChange={() => handleDeptChange(dept)}
                                        className="form-checkbox h-4 w-4 bg-[var(--bg-tertiary)] border-[var(--border-color-light)] rounded text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                                    />
                                    {dept}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const renderSummary = () => (
         <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-[var(--text-secondary)]">إجمالي الساعات المطلوبة</p>
                    <p className="text-2xl font-bold">{monthlyReportData.reduce((acc, r) => acc + r.totalRequiredHours, 0).toFixed(2)}</p>
                </div>
                <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-[var(--text-secondary)]">إجمالي الساعات الفعلية</p>
                    <p className="text-2xl font-bold">{monthlyReportData.reduce((acc, r) => acc + r.totalActualHours, 0).toFixed(2)}</p>
                </div>
                <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-[var(--text-secondary)]">إجمالي الساعات الإضافية</p>
                    <p className="text-2xl font-bold text-[var(--warning-text)]">{monthlyReportData.reduce((acc, r) => acc + r.totalOvertimeHours, 0).toFixed(2)}</p>
                </div>
                 <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-[var(--text-secondary)]">إجمالي أيام بدل الراحات</p>
                    <p className="text-2xl font-bold text-[var(--success-text)]">{monthlyReportData.reduce((acc, r) => acc + r.compensatoryDays, 0)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">الساعات الإضافية حسب الموظف</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyReportData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="employeeName" stroke="var(--text-secondary)" angle={-15} textAnchor="end" height={50} />
                            <YAxis stroke="var(--text-secondary)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)' }} />
                            <Legend />
                            <Bar dataKey="totalOvertimeHours" fill="var(--warning-text)" name="ساعات إضافية" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">أيام بدل الراحات حسب الموظف</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyReportData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="employeeName" stroke="var(--text-secondary)" angle={-15} textAnchor="end" height={50} />
                            <YAxis stroke="var(--text-secondary)" allowDecimals={false}/>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)' }} />
                            <Legend />
                            <Bar dataKey="compensatoryDays" fill="var(--success-text)" name="أيام الراحات" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الموظف</th>
                                {currentUser?.role !== 'Employee' && <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">القسم</th>}
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات المطلوبة</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات الفعلية</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات الإضافية</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">أيام بدل الراحات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {monthlyReportData.map(record => (
                                <tr key={record.employeeId} className="hover:bg-[var(--bg-tertiary)]/50">
                                    <td className="py-4 px-6">{record.employeeName}</td>
                                    {currentUser?.role !== 'Employee' && <td className="py-4 px-6">{record.department}</td>}
                                    <td className="py-4 px-6">{record.totalRequiredHours.toFixed(2)}</td>
                                    <td className="py-4 px-6">{record.totalActualHours.toFixed(2)}</td>
                                    <td className="py-4 px-6 font-bold text-[var(--warning-text)]">{record.totalOvertimeHours.toFixed(2)}</td>
                                    <td className="py-4 px-6 font-bold text-[var(--success-text)]">{record.compensatoryDays}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderDepartmentReview = () => (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-right">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">القسم</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">عدد الموظفين</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات المطلوبة</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات الفعلية</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">نسبة الحضور</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات الإضافية</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">أيام بدل الراحات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {departmentReviewData.map(dept => (
                            <tr key={dept.name} className="hover:bg-[var(--bg-tertiary)]/50">
                                <td className="py-4 px-6 font-semibold">{dept.name}</td>
                                <td className="py-4 px-6">{dept.employeeCount}</td>
                                <td className="py-4 px-6">{dept.required.toFixed(2)}</td>
                                <td className="py-4 px-6">{dept.actual.toFixed(2)}</td>
                                <td className="py-4 px-6">{dept.attendancePercentage.toFixed(1)}%</td>
                                <td className="py-4 px-6 font-bold text-[var(--warning-text)]">{dept.overtime.toFixed(2)}</td>
                                <td className="py-4 px-6 font-bold text-[var(--success-text)]">{dept.days}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderMonthlyLog = () => (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center print:hidden">
                <div>
                    {currentUser?.role !== 'Employee' && (
                        <>
                            <label className="text-sm text-[var(--text-secondary)] ml-2">تصفية حسب الأقسام:</label>
                            <DepartmentMultiSelect
                                selectedDepartments={monthlyLogDepartmentFilter}
                                onSelect={setMonthlyLogDepartmentFilter}
                                departmentsList={departments}
                            />
                        </>
                    )}
                </div>
                 <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-3 rounded-lg transition-colors">
                        <PrinterIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleExportPDF(monthlyLogPrintRef, `Monthly_Log_${year}_${month + 1}.pdf`, 'portrait')} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg transition-colors">
                        <ArrowDownTrayIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto max-h-[60vh] print:hidden">
                <table className="min-w-full text-right">
                    <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                        <tr>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الرقم الوظيفي</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">اسم الموظف</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">ساعات العمل المطلوبة</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">ساعات العمل الفعلية</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الساعات الإضافية</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">أيام عمل (إجازة/عطلة)</th>
                            <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الأيام المستحقة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {filteredMonthlyReportData.map(record => {
                             const employee = employees.find(e => e.id === record.employeeId);
                             return (
                                <tr key={record.employeeId} className="hover:bg-[var(--bg-tertiary)]/50">
                                    <td className="py-3 px-6">{employee?.employeeNumber || '-'}</td>
                                    <td className="py-3 px-6">{record.employeeName}</td>
                                    <td className="py-3 px-6">{record.totalRequiredHours.toFixed(2)}</td>
                                    <td className="py-3 px-6">{record.totalActualHours.toFixed(2)}</td>
                                    <td className="py-3 px-6 font-semibold text-[var(--warning-text)]">{record.totalOvertimeHours.toFixed(2)}</td>
                                    <td className="py-3 px-6">{record.workDaysOnHolidays}</td>
                                    <td className="py-3 px-6 font-semibold text-[var(--success-text)]">{record.compensatoryDaysDue}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
             <div className="hidden">
                <div id="monthly-log-print-area" ref={monthlyLogPrintRef} className="p-4 font-cairo">
                     <h2 className="text-xl font-bold mb-4 text-center">السجل الشهري للساعات الإضافية - {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric'})}</h2>
                     <table className="w-full text-right text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2 border border-gray-400">الرقم الوظيفي</th>
                                <th className="p-2 border border-gray-400">اسم الموظف</th>
                                <th className="p-2 border border-gray-400">ساعات العمل المطلوبة</th>
                                <th className="p-2 border border-gray-400">ساعات العمل الفعلية</th>
                                <th className="p-2 border border-gray-400">الساعات الإضافية</th>
                                <th className="p-2 border border-gray-400">أيام عمل (إجازة/عطلة)</th>
                                <th className="p-2 border border-gray-400">الأيام المستحقة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMonthlyReportData.map(record => {
                                const employee = employees.find(e => e.id === record.employeeId);
                                return (
                                    <tr key={record.employeeId}>
                                        <td className="p-1 px-2 border border-gray-400">{employee?.employeeNumber || '-'}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.employeeName}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.totalRequiredHours.toFixed(2)}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.totalActualHours.toFixed(2)}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.totalOvertimeHours.toFixed(2)}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.workDaysOnHolidays}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.compensatoryDaysDue}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>
    );
    
    const renderYearlySummary = () => {
        const monthNames = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ];
        return (
            <div>
                <div className="mb-4 flex items-center gap-4 print:hidden">
                    <div>
                        <label htmlFor="year-picker" className="text-sm text-[var(--text-secondary)] mr-2">عرض سنة:</label>
                        <input
                            type="number"
                            id="year-picker"
                            value={yearlyReportYear}
                            onChange={(e) => setYearlyReportYear(parseInt(e.target.value))}
                            className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] w-32"
                        />
                    </div>
                    {currentUser?.role !== 'Employee' && (
                        <div>
                            <label className="text-sm text-[var(--text-secondary)] ml-2">تصفية حسب الأقسام:</label>
                            <DepartmentMultiSelect
                                selectedDepartments={yearlySummaryDepartmentFilter}
                                onSelect={setYearlySummaryDepartmentFilter}
                                departmentsList={departments}
                            />
                        </div>
                    )}
                     <div className="flex-grow flex justify-end gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-3 rounded-lg transition-colors">
                            <PrinterIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleExportPDF(yearlySummaryPrintRef, `Yearly_Summary_${yearlyReportYear}.pdf`, 'landscape')} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
                
                <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden print:hidden">
                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="min-w-full text-right text-sm">
                            <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                                <tr>
                                    <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] whitespace-nowrap">الرقم الوظيفي</th>
                                    <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] whitespace-nowrap">اسم الموظف</th>
                                    {monthNames.map(name => (
                                        <th key={name} className="py-3 px-4 font-semibold text-[var(--text-secondary)]">{name}</th>
                                    ))}
                                    <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] whitespace-nowrap">إجمالي الأيام المستحقة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {yearlyEmployeeReportData.map(record => (
                                    <tr key={record.employeeId} className="hover:bg-[var(--bg-tertiary)]/50">
                                        <td className="py-2 px-4 whitespace-nowrap">{record.employeeNumber || '-'}</td>
                                        <td className="py-2 px-4 whitespace-nowrap">{record.employeeName}</td>
                                        {record.monthlyDays.map((days, index) => (
                                            <td key={index} className="py-2 px-4 text-center">{days > 0 ? days : '-'}</td>
                                        ))}
                                        <td className="py-2 px-4 font-bold text-[var(--success-text)] text-center">{record.totalYearlyDays}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="hidden">
                    <div id="yearly-summary-print-area" ref={yearlySummaryPrintRef} className="p-4 font-cairo">
                        <h2 className="text-xl font-bold mb-4 text-center">السجل السنوي للساعات الإضافية - {yearlyReportYear}</h2>
                        <table className="w-full text-right text-xs border-collapse border border-gray-400">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-2 border border-gray-400">الرقم الوظيفي</th>
                                    <th className="p-2 border border-gray-400">اسم الموظف</th>
                                    {monthNames.map(name => <th key={name} className="p-2 border border-gray-400">{name}</th>)}
                                    <th className="p-2 border border-gray-400">إجمالي الأيام المستحقة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearlyEmployeeReportData.map(record => (
                                    <tr key={record.employeeId}>
                                        <td className="p-1 px-2 border border-gray-400">{record.employeeNumber || '-'}</td>
                                        <td className="p-1 px-2 border border-gray-400">{record.employeeName}</td>
                                        {record.monthlyDays.map((days, index) => <td key={index} className="p-1 px-2 border border-gray-400 text-center">{days > 0 ? days : '-'}</td>)}
                                        <td className="p-1 px-2 border border-gray-400 text-center font-bold">{record.totalYearlyDays}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">تقارير الساعات الإضافية</h2>
                {activeTab !== 'yearly' && (
                    <div className="flex items-center gap-4">
                        <label htmlFor="month-picker" className="text-[var(--text-secondary)]">اختر الشهر:</label>
                        <input
                            type="month"
                            id="month-picker"
                            value={`${year}-${String(month + 1).padStart(2, '0')}`}
                            onChange={e => setCurrentDate(new Date(e.target.value + '-02'))}
                            className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"
                        />
                    </div>
                )}
            </div>
             <div className="border-b border-[var(--border-color)] mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tab="summary" label="ملخص الإضافي" active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
                    {currentUser?.role !== 'Employee' && <TabButton tab="departments" label="مراجعة الأقسام" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />}
                    <TabButton tab="monthly_log" label="السجل الشهري" active={activeTab === 'monthly_log'} onClick={() => setActiveTab('monthly_log')} />
                    <TabButton tab="yearly" label="السجل السنوي" active={activeTab === 'yearly'} onClick={() => setActiveTab('yearly')} />
                </nav>
            </div>
            
            {activeTab === 'summary' && renderSummary()}
            {activeTab === 'departments' && currentUser?.role !== 'Employee' && renderDepartmentReview()}
            {activeTab === 'monthly_log' && renderMonthlyLog()}
            {activeTab === 'yearly' && renderYearlySummary()}
            
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #monthly-log-print-area, #monthly-log-print-area *,
                    #yearly-summary-print-area, #yearly-summary-print-area * {
                        visibility: visible;
                    }
                    #monthly-log-print-area, #yearly-summary-print-area {
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
