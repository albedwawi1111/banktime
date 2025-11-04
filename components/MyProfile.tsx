import React, { useState, useEffect } from 'react';
import type { Employee, Education, WorkExperience, AppSettings, LeaveRequest, TimeLog, Shift, TrainingRecord, ToastMessage } from '../types';
import { UserCircleIcon, PlusIcon, TrashIcon, XMarkIcon, CalendarDaysIcon, ArrowDownTrayIcon, IdentificationIcon, AcademicCapIcon, ClipboardDocumentListIcon, EyeIcon, EyeSlashIcon } from './icons';
import EmployeeCV from './EmployeeCV';

interface MyProfileProps {
    currentUser: Employee;
    settings: AppSettings;
    updateEmployee: (employee: Partial<Employee> & { id: string }) => void;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
    leaveRequests: LeaveRequest[];
    timeLogs: TimeLog[];
    shifts: Shift[];
    trainingRecords: TrainingRecord[];
    addToast: (message: string, type: ToastMessage['type']) => void;
}

const EMPTY_EDUCATION_STATE: Education = {
    degree: '',
    institution: '',
    fieldOfStudy: '',
    graduationYear: ''
};

const MyProfile: React.FC<MyProfileProps> = ({ currentUser, settings, updateEmployee, updatePassword, leaveRequests, timeLogs, shifts, trainingRecords, addToast }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState({
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        address: currentUser.address || '',
        maritalStatus: currentUser.maritalStatus || 'Single',
        education: currentUser.education || [],
        workExperience: currentUser.workExperience || [],
        skills: currentUser.skills || [],
    });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [newEducation, setNewEducation] = useState<Education>(EMPTY_EDUCATION_STATE);
    const [newWorkExperience, setNewWorkExperience] = useState<WorkExperience>({ company: '', jobTitle: '', startDate: '', endDate: '', description: '' });
    const [newSkill, setNewSkill] = useState('');
    
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isCvOpen, setIsCvOpen] = useState(false);

    useEffect(() => {
        setFormData({
            phone: currentUser.phone || '',
            email: currentUser.email || '',
            address: currentUser.address || '',
            maritalStatus: currentUser.maritalStatus || 'Single',
            education: currentUser.education || [],
            workExperience: currentUser.workExperience || [],
            skills: currentUser.skills || [],
        });
    }, [currentUser]);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleAddEducation = () => {
        if (newEducation.degree && newEducation.institution) {
            setFormData(prev => ({ ...prev, education: [...prev.education, newEducation] }));
            setNewEducation(EMPTY_EDUCATION_STATE);
        }
    };
    const removeEducation = (eduIndex: number) => {
        setFormData(prev => ({ ...prev, education: prev.education.filter((_, index) => index !== eduIndex) }));
    };

    const handleAddWorkExperience = () => {
        if (newWorkExperience.company && newWorkExperience.jobTitle && newWorkExperience.startDate) {
            setFormData(prev => ({ ...prev, workExperience: [...prev.workExperience, newWorkExperience] }));
            setNewWorkExperience({ company: '', jobTitle: '', startDate: '', endDate: '', description: '' });
        }
    };
    const removeWorkExperience = (expIndex: number) => {
        setFormData(prev => ({ ...prev, workExperience: prev.workExperience.filter((_, index) => index !== expIndex) }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            const skillsToAdd = newSkill.split(',').map(s => s.trim()).filter(s => s && !formData.skills.includes(s));
            if (skillsToAdd.length > 0) {
                setFormData(prev => ({ ...prev, skills: [...prev.skills, ...skillsToAdd] }));
            }
            setNewSkill('');
        }
    };
    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
    };

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            updateEmployee({ id: currentUser.id, ...formData });
            addToast('تم تحديث البيانات بنجاح.', 'success');
        } catch (error) {
            addToast('حدث خطأ أثناء تحديث البيانات.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 6) {
            addToast('يجب أن لا تقل كلمة المرور عن 6 أحرف.', 'error');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast('كلمتا المرور غير متطابقتين.', 'error');
            return;
        }
        
        setIsSavingPassword(true);
        const result = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
        addToast(result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsCurrentPasswordVisible(false);
            setIsNewPasswordVisible(false);
            setIsConfirmPasswordVisible(false);
        }
        setIsSavingPassword(false);
    };

    const handleCalendarExport = () => {
        // FIX: Explicitly type shiftMap to ensure correct type inference for shift.
        const shiftMap: Map<string, Shift> = new Map(shifts.map(s => [s.id, s]));
        const approvedLeaves = leaveRequests.filter(lr => lr.employeeId === currentUser.id && lr.status === 'Approved');
        const userTimeLogs = timeLogs.filter(log => log.employeeId === currentUser.id);

        const formatDateTimeForUTC = (dateStr: string, timeStr: string) => {
            try {
                const date = new Date(`${dateStr}T${timeStr}`);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            } catch { return ''; }
        };

        let icsString = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BankTimeApp//EN', 'CALSCALE:GREGORIAN',
        ];

        approvedLeaves.forEach(leave => {
            const endDate = new Date(leave.endDate + 'T00:00:00');
            endDate.setDate(endDate.getDate() + 1);
            const endDateStrForIcs = endDate.toISOString().slice(0, 10).replace(/-/g, '');
            icsString.push(
                'BEGIN:VEVENT', `UID:${leave.id}@banktime.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
                `DTSTART;VALUE=DATE:${leave.startDate.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${endDateStrForIcs}`,
                `SUMMARY:إجازة: ${leave.leaveType}`, 'END:VEVENT'
            );
        });

        userTimeLogs.forEach(log => {
            const shift = log.shiftId ? shiftMap.get(log.shiftId) : null;
            const startTime = shift ? shift.startTime : log.clockIn;
            const endTime = shift ? shift.endTime : log.clockOut;

            if (startTime && endTime) {
                const startDateTime = formatDateTimeForUTC(log.date, startTime);
                const start = new Date(`${log.date}T${startTime}`);
                const end = new Date(`${log.date}T${endTime}`);
                if (end < start) { end.setDate(end.getDate() + 1); }
                const endDateTime = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

                if (startDateTime && endDateTime) {
                    icsString.push(
                        'BEGIN:VEVENT', `UID:${log.id}@banktime.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
                        `DTSTART:${startDateTime}`, `DTEND:${endDateTime}`,
                        `SUMMARY:مناوبة: ${shift ? shift.name : 'دوام مسجل'}`, `LOCATION:${currentUser.department}`, 'END:VEVENT'
                    );
                }
            }
        });

        icsString.push('END:VCALENDAR');
        const icsContent = icsString.join('\r\n');
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_schedule_${currentUser.name.replace(/\s+/g, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const InfoField: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-[var(--text-secondary)] font-semibold">{label}</p>
            <p className="text-md text-[var(--text-primary)]">{value || '-'}</p>
        </div>
    );
    
    const TabButton: React.FC<{ tab: string, label: string, icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tab ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'}`}
        >
            {icon}
            {label}
        </button>
    );

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)] disabled:opacity-50";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
    
    const StatusBadge: React.FC<{ status: TrainingRecord['status'] }> = ({ status }) => {
        const statusInfo = {
            Completed: { text: 'مكتملة', classes: 'bg-[var(--success-bg)] text-[var(--success-text)]' },
            'In Progress': { text: 'قيد التنفيذ', classes: 'bg-[var(--warning-bg)] text-[var(--warning-text)]' },
            Planned: { text: 'مخطط لها', classes: 'bg-[var(--accent-color)]/20 text-[var(--accent-text)]' },
        };
        const { text, classes } = statusInfo[status];
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${classes}`}>{text}</span>;
    };

    const renderFormContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField label="الرقم الوظيفي" value={currentUser.employeeNumber} />
                        <InfoField label="القطاع" value={currentUser.department} />
                        <InfoField label="الرقم المدني" value={currentUser.nationalId} />
                        <InfoField label="تاريخ التعيين" value={currentUser.hireDate} />
                        <div>
                            <label htmlFor="phone" className={labelClasses}>رقم الهاتف</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInfoChange} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="email" className={labelClasses}>البريد الإلكتروني</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleInfoChange} className={inputClasses} />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="address" className={labelClasses}>العنوان</label>
                            <input type="text" id="address" name="address" value={formData.address} onChange={handleInfoChange} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="maritalStatus" className={labelClasses}>الحالة الاجتماعية</label>
                            <select id="maritalStatus" name="maritalStatus" value={formData.maritalStatus} onChange={handleInfoChange} className={inputClasses}>
                                <option value="Single">أعزب</option>
                                <option value="Married">متزوج</option>
                                <option value="Divorced">مطلق</option>
                                <option value="Widowed">أرمل</option>
                            </select>
                        </div>
                    </div>
                );
            case 'education':
                return (
                    <div>
                        <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className={labelClasses}>المؤهل</label>
                                <select name="degree" value={newEducation.degree} onChange={e => setNewEducation(p => ({...p, degree: e.target.value}))} className={inputClasses} required>
                                    <option value="">-- اختر --</option>
                                    {(settings.educationDegrees || []).map(deg => <option key={deg} value={deg}>{deg}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>المؤسسة التعليمية</label>
                                <input type="text" name="institution" value={newEducation.institution} onChange={e => setNewEducation(p => ({...p, institution: e.target.value}))} className={inputClasses}/>
                            </div>
                            <div>
                                <label className={labelClasses}>التخصص</label>
                                <input type="text" name="fieldOfStudy" value={newEducation.fieldOfStudy} onChange={e => setNewEducation(p => ({...p, fieldOfStudy: e.target.value}))} className={inputClasses}/>
                            </div>
                            <div>
                                <label className={labelClasses}>سنة التخرج</label>
                                <input type="text" name="graduationYear" value={newEducation.graduationYear} onChange={e => setNewEducation(p => ({...p, graduationYear: e.target.value}))} className={inputClasses}/>
                            </div>
                            <div className="md:col-span-2 text-right">
                                 <button type="button" onClick={handleAddEducation} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                                    <PlusIcon className="w-4 h-4" />
                                    إضافة مؤهل
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {formData.education?.map((edu, index) => (
                                <div key={index} className="flex justify-between items-start bg-[var(--bg-tertiary)] p-3 rounded-md">
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{edu.degree} - {edu.fieldOfStudy}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">{edu.institution} ({edu.graduationYear})</p>
                                    </div>
                                    <button type="button" onClick={() => removeEducation(index)} className="text-[var(--danger-text)] hover:opacity-80"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                             {formData.education?.length === 0 && <p className="text-center text-[var(--text-muted)]">لم تتم إضافة أي مؤهلات.</p>}
                        </div>
                    </div>
                );
            case 'experience':
                return (
                     <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">الخبرة العملية</h4>
                            <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className={labelClasses}>الشركة</label>
                                    <input type="text" name="company" value={newWorkExperience.company} onChange={e => setNewWorkExperience(p => ({...p, company: e.target.value}))} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>المسمى الوظيفي</label>
                                    <input type="text" name="jobTitle" value={newWorkExperience.jobTitle} onChange={e => setNewWorkExperience(p => ({...p, jobTitle: e.target.value}))} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>تاريخ البدء</label>
                                    <input type="date" name="startDate" value={newWorkExperience.startDate} onChange={e => setNewWorkExperience(p => ({...p, startDate: e.target.value}))} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>تاريخ الانتهاء</label>
                                    <input type="text" name="endDate" value={newWorkExperience.endDate} onChange={e => setNewWorkExperience(p => ({...p, endDate: e.target.value}))} className={inputClasses} placeholder="YYYY-MM-DD أو الحالي"/>
                                </div>
                                <div className="md:col-span-2 text-right">
                                    <button type="button" onClick={handleAddWorkExperience} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                                        <PlusIcon className="w-4 h-4" />
                                        إضافة خبرة
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {formData.workExperience?.map((exp, index) => (
                                    <div key={index} className="flex justify-between items-start bg-[var(--bg-tertiary)] p-3 rounded-md">
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">{exp.jobTitle} في {exp.company}</p>
                                            <p className="text-sm text-[var(--text-secondary)]">{exp.startDate} - {exp.endDate}</p>
                                        </div>
                                        <button type="button" onClick={() => removeWorkExperience(index)} className="text-[var(--danger-text)] hover:opacity-80"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {(!formData.workExperience || formData.workExperience.length === 0) && <p className="text-center text-[var(--text-muted)]">لم تتم إضافة أي خبرات.</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">المهارات</h4>
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    placeholder="أضف مهارة (يمكن إضافة عدة مهارات بفصلها بفاصلة)"
                                    className={inputClasses + ' flex-grow'}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                />
                                <button type="button" onClick={handleAddSkill} className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg transition-colors">
                                    <PlusIcon />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-tertiary)]/50 rounded-lg min-h-[4rem]">
                                {formData.skills?.map((skill, index) => (
                                    <span key={index} className="flex items-center gap-2 bg-[var(--accent-color)]/20 text-[var(--accent-text)] text-sm font-medium px-3 py-1 rounded-full">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)} className="text-[var(--accent-text)] hover:text-red-400">
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                {(!formData.skills || formData.skills.length === 0) && <p className="text-sm text-center w-full self-center text-[var(--text-muted)]">لم تتم إضافة أي مهارات.</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'training': {
                const userTrainingRecords = trainingRecords.filter(tr => tr.employeeIds.includes(currentUser.id));
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">السجل التدريبي</h3>
                        {userTrainingRecords.length > 0 ? (
                            <div className="space-y-4">
                                {userTrainingRecords.map(record => (
                                    <div key={record.id} className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-md text-[var(--text-primary)]">{record.courseName}</p>
                                                <p className="text-sm text-[var(--text-secondary)]">المؤسسة: {record.provider}</p>
                                                <p className="text-xs text-[var(--text-muted)]">المكان: {record.location || '-'}</p>
                                                <p className="text-xs text-[var(--text-muted)]">التاريخ: {record.startDate} - {record.endDate}</p>
                                            </div>
                                            <StatusBadge status={record.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[var(--text-muted)] py-8">لا توجد سجلات تدريبية لعرضها.</p>
                        )}
                    </div>
                );
            }
            case 'calendar':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">تصدير إلى التقويم الخارجي</h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            يمكنك تصدير جدول مناوباتك وإجازاتك المعتمدة إلى ملف تقويم (بتنسيق .ics) يمكنك استيراده في تطبيقات التقويم المفضلة لديك مثل تقويم جوجل، آوتلوك، وتقويم أبل. هذا الملف يحتوي على جدولك الحالي.
                        </p>
                        <button
                            type="button"
                            onClick={handleCalendarExport}
                            className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            <ArrowDownTrayIcon />
                            تنزيل ملف التقويم (.ics)
                        </button>
                        <div className="mt-6 prose prose-invert max-w-none text-sm text-[var(--text-muted)]">
                            <h4 className="font-semibold text-[var(--text-secondary)]">تعليمات الاستيراد:</h4>
                            <ul>
                                <li><strong>تقويم جوجل (Google Calendar):</strong> اذهب إلى الإعدادات {'>'} استيراد وتصدير {'>'} اختر الملف من جهازك.</li>
                                <li><strong>آوتلوك (Outlook):</strong> اذهب إلى التقويم {'>'} إضافة تقويم {'>'} تحميل من ملف.</li>
                                <li><strong>تقويم أبل (Apple Calendar):</strong> اذهب إلى ملف {'>'} استيراد {'>'} استيراد... واختر الملف.</li>
                            </ul>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="flex items-center justify-between gap-6 mb-8 pb-6 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-6">
                    {currentUser.profilePicture 
                        ? <img src={currentUser.profilePicture} alt={currentUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-[var(--border-color-light)]"/>
                        : <div className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border-4 border-[var(--border-color-light)]"><UserCircleIcon className="w-12 h-12 text-[var(--text-muted)]"/></div>
                    }
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--text-primary)]">{currentUser.name}</h2>
                        <p className="text-lg text-[var(--text-secondary)]">{currentUser.jobTitle}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCvOpen(true)}
                    className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <IdentificationIcon className="w-5 h-5" />
                    <span>عرض السيرة الذاتية</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg">
                         <nav className="border-b border-[var(--border-color)] mb-4">
                            <div className="-mb-px flex space-x-1" aria-label="Tabs">
                                <TabButton tab="personal" label="المعلومات الشخصية" icon={<UserCircleIcon className="w-5 h-5" />} />
                                <TabButton tab="education" label="البيانات التعليمية" icon={<AcademicCapIcon className="w-5 h-5" />} />
                                <TabButton tab="experience" label="الخبرة والمهارات" icon={<ClipboardDocumentListIcon className="w-5 h-5" />} />
                                <TabButton tab="training" label="السجل التدريبي" icon={<AcademicCapIcon className="w-5 h-5" />} />
                                <TabButton tab="calendar" label="مزامنة التقويم" icon={<CalendarDaysIcon className="w-5 h-5" />} />
                            </div>
                        </nav>
                        
                        <form onSubmit={handleInfoSubmit}>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                                {renderFormContent()}
                            </div>
                            {activeTab !== 'calendar' && activeTab !== 'training' && (
                                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border-color)]">
                                    <button type="submit" disabled={isSavingProfile} className="py-2 px-6 rounded-lg text-sm font-semibold text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] disabled:opacity-50">
                                        {isSavingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-1">
                     <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">تغيير كلمة المرور</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="currentPassword" className={labelClasses}>كلمة المرور الحالية</label>
                                <div className="relative">
                                    <input type={isCurrentPasswordVisible ? 'text' : 'password'} id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required className={inputClasses + " pl-10"} />
                                    <button
                                        type="button"
                                        onClick={() => setIsCurrentPasswordVisible(prev => !prev)}
                                        className="absolute inset-y-0 left-0 flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        aria-label={isCurrentPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                    >
                                        {isCurrentPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="newPassword" className={labelClasses}>كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <input type={isNewPasswordVisible ? 'text' : 'password'} id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required className={inputClasses + " pl-10"} />
                                    <button
                                        type="button"
                                        onClick={() => setIsNewPasswordVisible(prev => !prev)}
                                        className="absolute inset-y-0 left-0 flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        aria-label={isNewPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                    >
                                        {isNewPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="confirmPassword" className={labelClasses}>تأكيد كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <input type={isConfirmPasswordVisible ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className={inputClasses + " pl-10"} />
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirmPasswordVisible(prev => !prev)}
                                        className="absolute inset-y-0 left-0 flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        aria-label={isConfirmPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                    >
                                        {isConfirmPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" disabled={isSavingPassword} className="w-full py-2 px-4 rounded-lg text-sm font-semibold text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] disabled:opacity-50">
                                    {isSavingPassword ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {isCvOpen && (
                <EmployeeCV
                    employee={currentUser}
                    onClose={() => setIsCvOpen(false)}
                    trainingRecords={trainingRecords}
                />
            )}
             <style>{`
                .prose ul { list-style-type: disc; padding-right: 1.5rem; }
                .prose li { margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
};

export default MyProfile;