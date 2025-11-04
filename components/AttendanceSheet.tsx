import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Employee, TimeLog, Shift, PublicHoliday, LeaveRequest, RamadanDates } from '../types';
import { PrinterIcon, ArrowDownTrayIcon } from './icons';

// Make sure html2pdf is declared if you're using it as a global script
declare const html2pdf: any;

interface AttendanceSheetProps {
  employees: Employee[];
  timeLogs: TimeLog[];
  shifts: Shift[];
  publicHolidays: PublicHoliday[];
  leaveRequests: LeaveRequest[];
  ramadanDates: RamadanDates;
  initialEmployeeId?: string;
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

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ employees, timeLogs, shifts, publicHolidays, leaveRequests, ramadanDates, initialEmployeeId, currentUser }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const reportContentRef = useRef<HTMLDivElement>(null);

  const shiftMap = useMemo(() => new Map(shifts.map(s => [s.id, s])), [shifts]);

  useEffect(() => {
    if (currentUser?.role === 'Employee') {
        setSelectedEmployeeId(currentUser.id);
    } else if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
    } else if (employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [initialEmployeeId, employees, currentUser]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const reportData = useMemo(() => {
    if (!selectedEmployeeId) return { rows: [], totals: {} };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return { rows: [], totals: {} };

    let totalActualHours = 0;
    let totalRequiredHours = 0;
    let workDaysOnHolidays = 0;

    const currentYearRamadan = ramadanDates[year];

    const rows = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const log = timeLogs.find(l => l.employeeId === selectedEmployeeId && l.date === dateStr);
        const shift = log?.shiftId ? shiftMap.get(log.shiftId) : null;
        
        const dayOfWeek = date.toLocaleDateString('ar-EG', { weekday: 'long' });
        const dayIndex = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
        const isWeekend = dayIndex === 5 || dayIndex === 6;
        const isHoliday = publicHolidays.some(h => h.date === dateStr);
        
        const approvedLeave = leaveRequests.find(lr => 
            lr.employeeId === selectedEmployeeId && 
            lr.status === 'Approved' && 
            dateStr >= lr.startDate && 
            dateStr <= lr.endDate
        );
        const isLeaveDay = !!approvedLeave;

        // Calculate required hours
        if (!isWeekend && !isHoliday && !isLeaveDay) {
            const isRamadan = currentYearRamadan && dateStr >= currentYearRamadan.start && dateStr <= currentYearRamadan.end;
            const dailyRequiredHours = isRamadan ? 5 : 7;
            totalRequiredHours += dailyRequiredHours;
        }

        let workedHours = 0;

        if (log) {
            workedHours = calculateHours(log.clockIn, log.clockOut);
            totalActualHours += workedHours;

            if (isHoliday || isWeekend) {
                workDaysOnHolidays++;
            }
        }
        
        let displayShift = shift?.name || '-';
        if (isHoliday) displayShift = 'إجازة رسمية';
        if (approvedLeave) {
            displayShift = approvedLeave.leaveType;
        }

        return {
            date: dateStr,
            day: dayOfWeek,
            scheduledShift: displayShift,
            clockIn: log?.clockIn ?? '-',
            clockOut: log?.clockOut ?? '-',
            workedHours: workedHours > 0 ? workedHours.toFixed(2) : '-',
        };
    });

    const totalOvertime = Math.max(0, totalActualHours - totalRequiredHours);

    return { 
      rows, 
      totals: {
        totalRequiredHours: totalRequiredHours.toFixed(2),
        totalActualHours: totalActualHours.toFixed(2),
        totalOvertime: totalOvertime.toFixed(2),
        workDaysOnHolidays,
      }
    };
  }, [selectedEmployeeId, year, month, employees, timeLogs, shifts, shiftMap, publicHolidays, leaveRequests, ramadanDates]);

  const handleExportPDF = () => {
    const element = reportContentRef.current;
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (element && employee) {
        const originalTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'light');

        const opt = {
          margin: 0.5,
          filename: `Attendance_${employee.name}_${year}-${month+1}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };
        
        html2pdf().from(element).set(opt).save().then(() => {
            if (originalTheme) {
                document.documentElement.setAttribute('data-theme', originalTheme);
            }
        });
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 print:hidden">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]">كشف الحضور والانصراف</h2>
        <div className="flex items-center gap-4">
            <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                disabled={currentUser?.role === 'Employee'}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] disabled:opacity-70"
            >
                {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
            </select>
            <input 
                type="month" 
                value={`${year}-${String(month + 1).padStart(2, '0')}`}
                onChange={e => setCurrentDate(new Date(e.target.value + '-02'))}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"
            />
             <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-3 rounded-lg transition-colors">
                <PrinterIcon />
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg transition-colors">
                <ArrowDownTrayIcon />
            </button>
        </div>
      </div>

      <div id="attendance-report" ref={reportContentRef} className="print:bg-white print:text-black font-cairo">
          <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden p-6 print:bg-white print:shadow-none">
              <div className="mb-6 text-center print:text-black">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] print:text-black">كشف حضور وانصراف الموظف</h3>
                <p className="text-lg text-[var(--text-secondary)] print:text-gray-700">{selectedEmployee?.name}</p>
                <p className="text-md text-[var(--text-muted)] print:text-gray-600">{`عن شهر ${currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric'})}`}</p>
              </div>
              
              <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg mb-6 print:border print:border-gray-300">
                  <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-3 print:text-black">ملخص الشهر</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                          <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">ساعات العمل المطلوبة</p>
                          <p className="text-xl font-bold">{reportData.totals.totalRequiredHours}</p>
                      </div>
                      <div>
                          <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">ساعات العمل الفعلية</p>
                          <p className="text-xl font-bold">{reportData.totals.totalActualHours}</p>
                      </div>
                      <div>
                          <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">الساعات الإضافية</p>
                          <p className="text-xl font-bold text-[var(--warning-text)]">{reportData.totals.totalOvertime}</p>
                      </div>
                      <div>
                          <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">أيام عمل (إجازة/عطلة)</p>
                          <p className="text-xl font-bold text-[var(--accent-text)]">{reportData.totals.workDaysOnHolidays}</p>
                      </div>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="min-w-full text-right text-sm">
                  <thead className="bg-[var(--bg-tertiary)] print:bg-gray-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-[var(--text-secondary)] print:text-black">اليوم</th>
                        <th className="py-2 px-3 font-semibold text-[var(--text-secondary)] print:text-black">التاريخ</th>
                        <th className="py-2 px-3 font-semibold text-[var(--text-secondary)] print:text-black">وقت الحضور</th>
                        <th className="py-2 px-3 font-semibold text-[var(--text-secondary)] print:text-black">وقت الانصراف</th>
                        <th className="py-2 px-3 font-semibold text-[var(--text-secondary)] print:text-black">عدد الساعات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] print:divide-gray-300">
                      {reportData.rows.map(row => (
                      <tr key={row.date} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors print:hover:bg-transparent">
                          <td className="py-2 px-3 whitespace-nowrap">{row.day}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row.date}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row.clockIn}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row.clockOut}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row.workedHours}</td>
                      </tr>
                      ))}
                  </tbody>
                  </table>
              </div>
          </div>
      </div>
      <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #attendance-report, #attendance-report * {
              visibility: visible;
            }
            #attendance-report {
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

export default AttendanceSheet;