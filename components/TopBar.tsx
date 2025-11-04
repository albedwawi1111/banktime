import React, { useState, useEffect, useRef } from 'react';
import type { Theme, Employee, PasswordResetRequest, UserRequestNotification, TrainingNotification, TopBarNotifications } from '../types';
import { View } from '../types';
import { CalendarDaysIcon, ClockIcon, PaintBrushIcon, BellIcon, CakeIcon, ExclamationTriangleIcon, ArrowLeftOnRectangleIcon, KeyIcon, ChatBubbleLeftRightIcon, AcademicCapIcon } from './icons';

interface TopBarProps {
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
    notifications: TopBarNotifications;
    currentUser: Employee | null;
    onLogout: () => void;
    onNavigate: (view: View, payload?: any) => void;
    onClearPasswordReset: (resetId: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ currentTheme, setTheme, notifications, currentUser, onLogout, onNavigate, onClearPasswordReset }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const notificationCount = (notifications.birthdays?.length || 0) + (notifications.expirations?.length || 0) + (notifications.resets?.length || 0) + (notifications.training?.length || 0) + (notifications.userRequests?.length || 0) + (notifications.schedule?.length || 0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popoverRef]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const gregorianFormatter = new Intl.DateTimeFormat('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    const formatDaysUntil = (days: number) => {
        if (days === 0) return 'اليوم';
        if (days === 1) return 'غدًا';
        return `بعد ${days} أيام`;
    };

    return (
        <header className="fixed top-4 left-4 right-4 md:right-72 bg-[var(--bg-glass)] backdrop-blur-sm border border-[var(--border-color)] z-30 flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="hidden md:block">
                     <h2 className="text-lg font-bold text-[var(--text-primary)]">قسم الحجر وسلامة الغذاء بميناء صحار</h2>
                </div>
                 {currentUser && (
                    <div className="text-sm">
                        <span className="text-[var(--text-secondary)]">مرحباً, </span>
                        <span className="font-semibold text-[var(--text-primary)]">{currentUser.name}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4 md:gap-6 text-sm text-[var(--text-secondary)]">
                <div className="relative" ref={popoverRef}>
                    <button 
                        onClick={() => setIsPopoverOpen(prev => !prev)} 
                        className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Notifications"
                    >
                        <BellIcon className="w-6 h-6"/>
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{notificationCount}</span>
                            </span>
                        )}
                    </button>
                    {isPopoverOpen && (
                        <div className="absolute top-full mt-3 -left-32 w-80 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-2xl z-40">
                           <div className="p-3 border-b border-[var(--border-color)]">
                                <h3 className="font-semibold text-[var(--text-primary)]">الإشعارات</h3>
                           </div>
                           <div className="max-h-80 overflow-y-auto">
                                {notificationCount > 0 ? (
                                    <>
                                        {notifications.schedule && notifications.schedule.length > 0 && notifications.schedule.map(notif => (
                                            <button
                                                key={`schedule-${notif.id}`}
                                                onClick={() => {
                                                    onNavigate(View.SCHEDULER);
                                                    setIsPopoverOpen(false);
                                                }}
                                                className="w-full text-right p-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]"
                                            >
                                                <CalendarDaysIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--text-primary)] font-semibold">تحديث جدول المناوبات</p>
                                                    <p className="text-xs text-[var(--text-secondary)]">{notif.message}</p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-1">مرسل من: {notif.createdBy}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {notifications.training.length > 0 && notifications.training.map(notif => (
                                            <button
                                                key={`training-${notif.recordId}`}
                                                onClick={() => {
                                                    onNavigate(View.TRAINING);
                                                    setIsPopoverOpen(false);
                                                }}
                                                className="w-full text-right p-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]"
                                            >
                                                <AcademicCapIcon className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--text-primary)]">تمت إضافتك إلى دورة تدريبية</p>
                                                    <p className="text-xs text-[var(--text-secondary)] font-semibold">{notif.courseName}</p>
                                                    {notif.employeeName && <p className="text-xs text-[var(--text-muted)]">للموظف: {notif.employeeName}</p>}
                                                </div>
                                            </button>
                                        ))}
                                        {notifications.userRequests && notifications.userRequests.length > 0 && notifications.userRequests.map(req => (
                                            <button
                                                key={req.requestId}
                                                onClick={() => {
                                                    onNavigate(View.USER_REQUESTS);
                                                    setIsPopoverOpen(false);
                                                }}
                                                className="w-full text-right p-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--text-primary)]">مقترح جديد من المستخدم</p>
                                                    <p className="text-xs text-[var(--text-secondary)] font-semibold">{req.title}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">مرسل من: {req.employeeName}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {notifications.resets.length > 0 && notifications.resets.map(reset => (
                                            <button 
                                                key={reset.id}
                                                onClick={() => onClearPasswordReset(reset.id)}
                                                className="w-full text-right p-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]"
                                            >
                                                <KeyIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--text-primary)]">طلب إعادة تعيين كلمة المرور</p>
                                                    <p className="text-xs text-[var(--text-secondary)] font-semibold">{reset.employeeName}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {notifications.expirations.length > 0 && notifications.expirations.map(exp => (
                                            <div key={`${exp.employeeId}-${exp.documentName}`} className="p-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]">
                                                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--text-primary)]">انتهاء صلاحية <span className="font-semibold">{exp.documentName}</span> لـ <span className="font-semibold">{exp.employeeName}</span></p>
                                                    <p className="text-xs text-yellow-400">{formatDaysUntil(exp.daysUntil)} - {exp.expiryDate}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {notifications.birthdays.length > 0 && notifications.birthdays.map(bday => (
                                            <div key={bday.employeeId} className="p-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)]">
                                                <CakeIcon className="w-6 h-6 text-pink-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-[var(--text-primary)]">عيد ميلاد <span className="font-semibold">{bday.employeeName}</span></p>
                                                    <p className="text-xs text-pink-400">{formatDaysUntil(bday.daysUntil)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p className="text-center text-[var(--text-muted)] p-6">لا توجد إشعارات جديدة.</p>
                                )}
                           </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <PaintBrushIcon className="w-5 h-5 text-[var(--accent-text)]" />
                    <select 
                        value={currentTheme}
                        onChange={(e) => setTheme(e.target.value as Theme)}
                        className="bg-transparent border-none text-[var(--text-secondary)] p-1 rounded-md focus:ring-0"
                        aria-label="Select Theme"
                    >
                        <option value="dark-blue" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">أزرق غامق</option>
                        <option value="light" className="bg-white text-black">فاتح</option>
                        <option value="forest" className="bg-green-900 text-white">غابة</option>
                        <option value="crimson" className="bg-red-900 text-white">قرمزي</option>
                        <option value="matrix" className="bg-[#020402] text-[#00ff41]">ماتريكس</option>
                    </select>
                </div>
                 <div className="hidden md:flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-[var(--accent-text)]" />
                    <span className="font-mono">{formatTime(currentTime)}</span>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5 text-[var(--success-text)]" />
                    <div className="text-right">
                        <p>{gregorianFormatter.format(currentTime)}</p>
                        <p className="text-xs text-[var(--text-muted)]">{hijriFormatter.format(currentTime)}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--danger-text)] transition-colors"
                    title="تسجيل الخروج"
                >
                    <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};

export default TopBar;