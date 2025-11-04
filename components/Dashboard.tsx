import React, { useMemo, useState, useRef } from 'react';
import type { Employee, LeaveRequest, TimeLog, Shift, TrainingRecord, Survey, SurveyQuestion, SurveyResponse, TopBarNotifications } from '../types';
import { View } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CakeIcon, ExclamationTriangleIcon, UserCircleIcon, AdjustmentsHorizontalIcon, TrashIcon, ChatBubbleLeftRightIcon, KeyIcon, AcademicCapIcon, CalendarDaysIcon } from './icons';
import SurveyTaker from './SurveyTaker';
import Modal from './Modal';


interface DashboardProps {
    employees: Employee[];
    leaveRequests: LeaveRequest[];
    timeLogs: TimeLog[];
    shifts: Shift[];
    updateLeaveRequest: (request: LeaveRequest) => void;
    notifications: TopBarNotifications;
    currentUser: Employee | null;
    trainingRecords: TrainingRecord[];
    surveys: Survey[];
    surveyQuestions: SurveyQuestion[];
    surveyResponses: SurveyResponse[];
    addSurveyResponses: (responses: Omit<SurveyResponse, 'id' | 'submittedAt'>[]) => Promise<void>;
    onNavigate: (view: View, payload?: any) => void;
    updateEmployee: (employee: Partial<Employee> & { id: string }) => void;
}

const WIDGETS = [
    { key: 'stats', title: 'الإحصائيات الرئيسية' },
    { key: 'notifications', title: 'الإشعارات والتنبيهات' },
    { key: 'requestsAndDuty', title: 'الطلبات والمناوبات' },
    { key: 'training', title: 'ملخص التدريب' },
    { key: 'charts', title: 'الرسوم البيانية' },
];
const DEFAULT_LAYOUT = WIDGETS.map(w => ({ key: w.key, visible: true }));

const getColSpanClass = (count: number): string => {
    if (count >= 7) return 'lg:col-span-12'; // Full width for very large teams
    if (count >= 5) return 'lg:col-span-6';  // Half width for large teams
    if (count >= 3) return 'lg:col-span-4';  // One-third for medium teams
    return 'lg:col-span-3';                 // Quarter width for small teams
};

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { employees, leaveRequests, timeLogs, shifts, updateLeaveRequest, notifications, currentUser, trainingRecords, surveys, surveyQuestions, surveyResponses, addSurveyResponses, onNavigate, updateEmployee } = props;
    
    const [surveyToTake, setSurveyToTake] = useState<{ survey: Survey; questions: SurveyQuestion[] } | null>(null);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [layoutForEditing, setLayoutForEditing] = useState(currentUser?.dashboardLayout || DEFAULT_LAYOUT);

    const todayStr = new Date().toISOString().slice(0, 10);
    
    const visibleEmployees = useMemo(() => {
        if (currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') {
            return employees;
        }
        return employees.filter(e => e.id === currentUser?.id);
    }, [employees, currentUser]);

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
    const shiftMap = useMemo(() => new Map(shifts.map(s => [s.id, s])), [shifts]);
    
    const visibleLeaveRequests = useMemo(() => {
        if (currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') {
            return leaveRequests;
        }
        return leaveRequests.filter(lr => lr.employeeId === currentUser?.id);
    }, [leaveRequests, currentUser]);

    const visibleTimeLogs = useMemo(() => {
        if (currentUser?.role === 'Admin' || currentUser?.role === 'Head of Department') {
            return timeLogs;
        }
        return timeLogs.filter(log => log.employeeId === currentUser?.id);
    }, [timeLogs, currentUser]);

    const availableSurveys = useMemo(() => {
        if (!currentUser) return [];
        const userResponses = surveyResponses.filter(r => r.employeeId === currentUser.id);
        const respondedSurveyIds = new Set(userResponses.map(r => r.surveyId));

        return surveys.filter(s => s.status === 'active' && !respondedSurveyIds.has(s.id));
    }, [surveys, surveyResponses, currentUser]);

    const handleStartSurvey = (survey: Survey) => {
        const questionsForSurvey = surveyQuestions
            .filter(q => q.surveyId === survey.id)
            .sort((a, b) => a.order - b.order);
        setSurveyToTake({ survey, questions: questionsForSurvey });
    };

    const handleSubmitSurvey = async (responses: Omit<SurveyResponse, 'id' | 'submittedAt'>[]) => {
        await addSurveyResponses(responses);
        setSurveyToTake(null);
    };

    // Employee-specific dashboard
    if (currentUser?.role === 'Employee') {
        const onDutyTodayList = visibleTimeLogs.filter(log => log.date === todayStr);
        const userOnDutyLog = onDutyTodayList.find(log => log.employeeId === currentUser.id);
        const userOnDutyShift = userOnDutyLog?.shiftId ? shiftMap.get(userOnDutyLog.shiftId) : null;
        const userOnLeave = leaveRequests.find(lr => lr.employeeId === currentUser.id && lr.status === 'Approved' && todayStr >= lr.startDate && todayStr <= lr.endDate);
        
        const trainingStats = {
            planned: trainingRecords.filter(tr => tr.employeeIds.includes(currentUser.id) && tr.status === 'Planned').length,
            inProgress: trainingRecords.filter(tr => tr.employeeIds.includes(currentUser.id) && tr.status === 'In Progress').length,
            completed: trainingRecords.filter(tr => tr.employeeIds.includes(currentUser.id) && tr.status === 'Completed').length,
        };
        
        let statusText = "خارج الخدمة";
        let statusColor = "text-[var(--danger-text)]";
        if (userOnDutyLog) {
            statusText = userOnDutyShift ? `على رأس العمل - ${userOnDutyShift.name}` : `على رأس العمل - ${userOnDutyLog.clockIn}`;
            statusColor = "text-[var(--success-text)]";
        } else if (userOnLeave) {
            statusText = `في إجازة - ${userOnLeave.leaveType}`;
            statusColor = "text-[var(--warning-text)]";
        }

        return (
            <div className="p-4 sm:p-6 md:p-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">مرحباً, {currentUser.name}!</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg flex flex-col items-center text-center">
                        {currentUser.profilePicture ? 
                            <img src={currentUser.profilePicture} alt={currentUser.name} className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-color-light)] mb-4" /> :
                            <div className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4"><UserCircleIcon className="w-12 h-12 text-[var(--text-muted)]"/></div>
                        }
                        <h3 className="text-xl font-bold">{currentUser.name}</h3>
                        <p className="text-[var(--text-secondary)]">{currentUser.jobTitle}</p>
                    </div>
                    <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">ملخص اليوم</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[var(--bg-tertiary)]/50 p-3 rounded-lg">
                                <span className="font-semibold text-[var(--text-secondary)]">حالة الدوام اليوم</span>
                                <span className={`font-bold ${statusColor}`}>{statusText}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--bg-tertiary)]/50 p-3 rounded-lg">
                                <span className="font-semibold text-[var(--text-secondary)]">رصيد الإجازة السنوية</span>
                                <span className="font-bold">{currentUser.annualLeaveBalance || 0} يوم</span>
                            </div>
                             <div className="flex justify-between items-center bg-[var(--bg-tertiary)]/50 p-3 rounded-lg">
                                <span className="font-semibold text-[var(--text-secondary)]">رصيد الإجازة المرضية</span>
                                <span className="font-bold">{currentUser.sickLeaveBalance || 0} يوم</span>
                            </div>
                        </div>
                    </div>
                     <div className="lg:col-span-3 bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">ملخص التدريب الخاص بي</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">دورات مخطط لها</p>
                                <p className="text-2xl font-bold text-[var(--accent-text)]">{trainingStats.planned}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">دورات قيد التنفيذ</p>
                                <p className="text-2xl font-bold text-[var(--warning-text)]">{trainingStats.inProgress}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">دورات مكتملة</p>
                                <p className="text-2xl font-bold text-[var(--success-text)]">{trainingStats.completed}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-3 bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">استطلاعات متاحة للمشاركة</h3>
                        {availableSurveys.length > 0 ? (
                            <div className="space-y-3">
                                {availableSurveys.map(survey => (
                                    <div key={survey.id} className="bg-[var(--bg-tertiary)]/50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{survey.title}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{survey.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleStartSurvey(survey)}
                                            className="bg-[var(--accent-color)] text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-color-hover)]"
                                        >
                                            بدء
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[var(--text-muted)] py-4">لا توجد استطلاعات جديدة متاحة لك حالياً.</p>
                        )}
                    </div>
                </div>
                {surveyToTake && currentUser && (
                    <SurveyTaker
                        survey={surveyToTake.survey}
                        questions={surveyToTake.questions}
                        currentUser={currentUser}
                        onClose={() => setSurveyToTake(null)}
                        onSubmit={handleSubmitSurvey}
                    />
                )}
            </div>
        );
    }
    
    // --- Admin/HoD Customizable Dashboard ---

    const stats = {
        totalEmployees: visibleEmployees.length,
        onDutyToday: visibleTimeLogs.filter(log => log.date === todayStr).length,
        onLeaveToday: visibleLeaveRequests.filter(lr => lr.status === 'Approved' && todayStr >= lr.startDate && todayStr <= lr.endDate).length,
        pendingRequests: visibleLeaveRequests.filter(lr => lr.status === 'Pending').length
    };

    // --- Widget Components ---
    const StatsWidget = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => onNavigate(View.EMPLOYEES)} className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg text-right w-full cursor-pointer transition-transform transform hover:-translate-y-1">
                <p className="text-sm text-[var(--text-secondary)]">إجمالي الموظفين</p>
                <p className="text-3xl font-bold">{stats.totalEmployees}</p>
            </button>
            <button onClick={() => onNavigate(View.SCHEDULER)} className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg text-right w-full cursor-pointer transition-transform transform hover:-translate-y-1">
                <p className="text-sm text-[var(--text-secondary)]">موظفون على رأس العمل اليوم</p>
                <p className="text-3xl font-bold text-[var(--success-text)]">{stats.onDutyToday}</p>
            </button>
            <button className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg text-right w-full">
                <p className="text-sm text-[var(--text-secondary)]">موظفون في إجازة اليوم</p>
                <p className="text-3xl font-bold text-[var(--warning-text)]">{stats.onLeaveToday}</p>
            </button>
            <button onClick={() => onNavigate(View.LEAVES, { status: 'Pending' })} className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg text-right w-full cursor-pointer transition-transform transform hover:-translate-y-1">
                <p className="text-sm text-[var(--text-secondary)]">طلبات إجازة معلقة</p>
                <p className="text-3xl font-bold text-[var(--danger-text)]">{stats.pendingRequests}</p>
            </button>
        </div>
    );
    
    // FIX: Replaced direct access to `notifications` properties with safe, array-guaranteed local variables. This prevents runtime errors if notification data is missing or malformed.
    const NotificationsWidget = () => {
        const formatDaysUntil = (days: number) => days === 0 ? 'اليوم' : (days === 1 ? 'غدًا' : `خلال ${days} أيام`);

        // FIX: Safely access notification arrays by providing an empty array `[]` as a fallback.
        const birthdays = notifications.birthdays ?? [];
        const expirations = notifications.expirations ?? [];
        const resets = notifications.resets ?? [];
        const trainingNotifs = notifications.training ?? [];
        const userRequestNotifs = notifications.userRequests ?? [];
        const scheduleNotifs = notifications.schedule ?? [];

        const totalNotifications = birthdays.length + expirations.length + resets.length + trainingNotifs.length + userRequestNotifs.length + scheduleNotifs.length;
        
        if (totalNotifications === 0) return null;

        return (
             <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">الإشعارات والتنبيهات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scheduleNotifs.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-green-400 mb-3">تحديثات المناوبات</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {scheduleNotifs.map(notif => (
                                    <button
                                        key={`schedule-${notif.id}`}
                                        onClick={() => onNavigate(View.SCHEDULER)}
                                        className="w-full text-right p-2 flex items-start gap-3 bg-[var(--bg-tertiary)]/50 rounded-lg hover:bg-[var(--bg-tertiary)]"
                                    >
                                        <CalendarDaysIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold">تحديث جدول المناوبات</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{notif.message}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {trainingNotifs.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-purple-400 mb-3">تسجيلات تدريب جديدة</h4>
                             <div className="space-y-3 max-h-48 overflow-y-auto">
                                {trainingNotifs.map(notif => (
                                    <button
                                        key={`training-${notif.recordId}`}
                                        onClick={() => onNavigate(View.TRAINING)}
                                        className="w-full text-right p-3 flex items-start gap-3 bg-[var(--bg-tertiary)]/50 rounded-lg hover:bg-[var(--bg-tertiary)]"
                                    >
                                        <AcademicCapIcon className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-[var(--text-primary)]">تمت إضافتك إلى دورة تدريبية</p>
                                            <p className="text-xs text-[var(--text-secondary)] font-semibold">{notif.courseName}</p>
                                            {notif.employeeName && <p className="text-xs text-[var(--text-muted)]">للموظف: {notif.employeeName}</p>}
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                    {userRequestNotifs.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-cyan-400 mb-3">مقترحات جديدة</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {userRequestNotifs.map(req => (
                                    <button
                                        key={req.requestId}
                                        onClick={() => onNavigate(View.USER_REQUESTS)}
                                        className="w-full text-right p-2 flex items-start gap-3 bg-[var(--bg-tertiary)]/50 rounded-lg hover:bg-[var(--bg-tertiary)]"
                                    >
                                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold">{req.title}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">من: {req.employeeName}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {currentUser?.role === 'Admin' && resets.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-blue-400 mb-3">طلبات إعادة تعيين كلمة المرور</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">{resets.map(reset => (
                                <button 
                                    key={reset.id}
                                    onClick={() => onNavigate(View.EMPLOYEES)}
                                    className="w-full text-right p-2 flex items-start gap-3 bg-[var(--bg-tertiary)]/50 rounded-lg hover:bg-[var(--bg-tertiary)]"
                                >
                                    <KeyIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div><p className="text-sm font-semibold">{reset.employeeName}</p><p className="text-xs text-[var(--text-secondary)]">طلب إعادة تعيين كلمة المرور</p></div>
                                </button>
                            ))}</div>
                        </div>
                    )}
                    {expirations.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-[var(--warning-text)] mb-3">مستندات قاربت على الانتهاء</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">{expirations.map(exp => (
                                <div key={`${exp.employeeId}-${exp.documentName}`} className="flex items-start gap-3 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div><p className="text-sm font-semibold">{exp.employeeName}</p><p className="text-xs text-[var(--text-secondary)]">{exp.documentName} - <span className="text-yellow-400">{formatDaysUntil(exp.daysUntil)}</span></p></div>
                                </div>
                            ))}</div>
                        </div>
                    )}
                    {birthdays.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-[var(--accent-text)] mb-3">أعياد ميلاد قادمة</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">{birthdays.map(bday => (
                                <div key={bday.employeeId} className="flex items-start gap-3 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg">
                                    <CakeIcon className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
                                    <div><p className="text-sm font-semibold">{bday.employeeName}</p><p className="text-xs text-pink-400">{formatDaysUntil(bday.daysUntil)}</p></div>
                                </div>
                            ))}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const RequestsAndDutyWidget = () => {
        const pendingLeaveRequests = useMemo(() => visibleLeaveRequests.filter(lr => lr.status === 'Pending'), [visibleLeaveRequests]);
        const onDutyTodayList = useMemo(() => visibleTimeLogs.filter(log => log.date === todayStr), [visibleTimeLogs, todayStr]);
    
        const onDutyByDepartment = useMemo(() => onDutyTodayList.reduce((acc, log) => {
            const employee = employeeMap.get(log.employeeId);
            if (employee) {
                (acc[employee.department] = acc[employee.department] || []).push({employee, log, shift: log.shiftId ? shiftMap.get(log.shiftId) : null});
            }
            return acc;
        }, {} as Record<string, { employee: Employee; shift: Shift | null | undefined; log: TimeLog }[]>), [onDutyTodayList, employeeMap, shiftMap]);
    
        return (
            <div className="space-y-6">
                {/* Pending Requests Card */}
                {pendingLeaveRequests.length > 0 && (
                    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg flex flex-col">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex-shrink-0">طلبات الإجازة المعلقة</h3>
                        <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                            {pendingLeaveRequests.map(req => (
                                <div key={req.id} className="bg-[var(--bg-tertiary)]/50 p-3 rounded-lg">
                                    <p className="font-semibold">{employeeMap.get(req.employeeId)?.name}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">{req.leaveType} | {req.startDate} إلى {req.endDate}</p>
                                    <div className="mt-2 text-right">
                                        <button onClick={() => updateLeaveRequest({...req, status: 'Approved'})} className="text-xs font-bold text-[var(--success-text)] hover:opacity-80 ml-2">قبول</button>
                                        <button onClick={() => updateLeaveRequest({...req, status: 'Rejected'})} className="text-xs font-bold text-[var(--danger-text)] hover:opacity-80">رفض</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
    
                {/* On Duty Section */}
                <div>
                     <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">من على رأس العمل اليوم؟</h3>
                    {Object.keys(onDutyByDepartment).length > 0 ? (
                        <div className="grid grid-cols-12 gap-6">
                            {Object.entries(onDutyByDepartment).map(([department, duties]) => {
                                 const colSpanClass = getColSpanClass(duties.length);
                                 const sortedDuties = [...duties].sort((a, b) => {
                                    const aTime = a.shift?.startTime || a.log.clockIn;
                                    const bTime = b.shift?.startTime || b.log.clockIn;
                                    return aTime.localeCompare(bTime);
                                 });
                                 return (
                                    <div key={department} className={`col-span-12 md:col-span-6 ${colSpanClass} bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg flex flex-col`}>
                                        <h4 className="font-bold text-lg text-[var(--text-primary)] mb-3 flex-shrink-0">{department}</h4>
                                        <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                            {sortedDuties.map(({ employee, shift, log }) => (
                                                <div key={log.id} className="bg-[var(--bg-tertiary)]/50 rounded-lg p-3 flex items-center gap-3">
                                                    {employee.profilePicture ? (
                                                        <img src={employee.profilePicture} alt={employee.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] flex items-center justify-center flex-shrink-0">
                                                            <UserCircleIcon className="w-7 h-7 text-[var(--text-muted)]" />
                                                        </div>
                                                    )}
                                                    <div className="overflow-hidden">
                                                        <p className="font-semibold text-sm truncate text-[var(--text-primary)]">{employee.name}</p>
                                                        <p className="text-xs text-[var(--text-secondary)] truncate">{shift?.name || `${log.clockIn} - ${log.clockOut}`}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                 );
                            })}
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg flex flex-col items-center justify-center">
                            <p className="text-center text-[var(--text-muted)]">لا توجد سجلات دوام لليوم.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const TrainingWidget = () => (
         <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">ملخص التدريب والتطوير</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-sm text-[var(--text-secondary)]">مخطط لها</p><p className="text-2xl font-bold text-[var(--accent-text)]">{trainingRecords.filter(t=>t.status==='Planned').length}</p></div>
                    <div><p className="text-sm text-[var(--text-secondary)]">قيد التنفيذ</p><p className="text-2xl font-bold text-[var(--warning-text)]">{trainingRecords.filter(t=>t.status==='In Progress').length}</p></div>
                    <div><p className="text-sm text-[var(--text-secondary)]">مكتملة</p><p className="text-2xl font-bold text-[var(--success-text)]">{trainingRecords.filter(t=>t.status==='Completed').length}</p></div>
                </div>
                <div>
                     <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={Object.entries(trainingRecords.reduce((acc, r) => { if(r.status === 'Completed') r.employeeIds.forEach(id => { const emp=employeeMap.get(id); if(emp) acc[emp.department]=(acc[emp.department]||0)+1; }); return acc; }, {} as Record<string, number>)).map(([name, count]) => ({name, count}))}>
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none' }} cursor={{fill: 'var(--bg-tertiary)'}} />
                            <Bar dataKey="count" name="دورات مكتملة" fill="var(--success-text)" barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const ChartsWidget = () => {
        const COLORS = ['var(--accent-color)', 'var(--success-text)', 'var(--warning-text)', 'var(--danger-text)', '#8b5cf6'];
        const departmentDistributionData = Object.entries(visibleEmployees.reduce((acc, emp) => { if (emp.department) { acc[emp.department]=(acc[emp.department]||0)+1; } return acc; }, {} as Record<string, number>)).map(([name, count]) => ({name, count}));
        
        const statusMap = {'Active':'نشط','Inactive':'غير نشط','On Leave':'في إجازة'};
        const employeeStatusData = Object.entries(visibleEmployees.reduce<Record<string, number>>((acc, emp) => {
            const s = emp.status || 'Inactive';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {})).map(([name, value]) => ({
            name: statusMap[name as keyof typeof statusMap] || name,
            value
        }));

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">توزيع الموظفين حسب القسم</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis type="number" stroke="var(--text-secondary)" />
                            <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={100} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none' }} cursor={{fill: 'var(--bg-tertiary)'}} />
                            <Bar dataKey="count" name="عدد الموظفين" fill="var(--accent-color)" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
                     <h3 className="text-lg font-semibold mb-4">حالة الموظفين</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={employeeStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={110} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                                {employeeStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none' }} />
                             <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const widgetMap: Record<string, React.ReactNode> = {
        stats: <StatsWidget />,
        notifications: <NotificationsWidget />,
        requestsAndDuty: <RequestsAndDutyWidget />,
        training: <TrainingWidget />,
        charts: <ChartsWidget />,
    };

    const finalLayout = currentUser?.dashboardLayout || DEFAULT_LAYOUT;
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSort = () => {
        const newLayout = [...layoutForEditing];
        const draggedItemContent = newLayout.splice(dragItem.current!, 1)[0];
        newLayout.splice(dragOverItem.current!, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setLayoutForEditing(newLayout);
    };

    const handleSaveLayout = () => {
        updateEmployee({ id: currentUser!.id, dashboardLayout: layoutForEditing });
        setIsCustomizeModalOpen(false);
    };

    const handleResetLayout = () => {
        setLayoutForEditing(DEFAULT_LAYOUT);
        updateEmployee({ id: currentUser!.id, dashboardLayout: DEFAULT_LAYOUT });
        setIsCustomizeModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h2>
                <button onClick={() => { setLayoutForEditing(currentUser?.dashboardLayout || DEFAULT_LAYOUT); setIsCustomizeModalOpen(true); }} className="flex items-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors">
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    تخصيص
                </button>
            </div>

            <div className="space-y-6">
                {finalLayout.map(({ key, visible }) => (
                    visible ? <div key={key}>{widgetMap[key]}</div> : null
                ))}
            </div>

            <Modal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} title="تخصيص لوحة التحكم" maxWidth="max-w-xl">
                <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">قم بسحب وإفلات الوحدات لترتيبها، أو قم بإخفائها حسب تفضيلاتك.</p>
                    <div className="space-y-2">
                        {layoutForEditing.map((widget, index) => (
                            <div
                                key={widget.key}
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg cursor-grab active:cursor-grabbing"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={widget.visible}
                                        onChange={() => {
                                            const newLayout = [...layoutForEditing];
                                            newLayout[index].visible = !newLayout[index].visible;
                                            setLayoutForEditing(newLayout);
                                        }}
                                        className="form-checkbox h-5 w-5 bg-[var(--bg-primary)] border-[var(--border-color-light)] rounded text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                                    />
                                    <span className="font-semibold">{WIDGETS.find(w => w.key === widget.key)?.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--border-color)]">
                        <button onClick={handleResetLayout} className="flex items-center gap-2 text-sm font-semibold text-[var(--danger-text)] hover:underline">
                            <TrashIcon className="w-4 h-4" />
                            إعادة التعيين للإفتراضي
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => setIsCustomizeModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg">إلغاء</button>
                            <button onClick={handleSaveLayout} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">حفظ التخطيط</button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
