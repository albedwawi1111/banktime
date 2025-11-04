import React from 'react';
import { UserCircleIcon, Cog6ToothIcon, UsersIcon } from './icons';
import { QFSIcon } from './icons';

interface AdminLoginChoiceModalProps {
    onChoice: (role: 'Admin' | 'Employee' | 'Head of Department') => void;
    employeeName: string;
}

const AdminLoginChoiceModal: React.FC<AdminLoginChoiceModalProps> = ({ onChoice, employeeName }) => {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[var(--bg-secondary)] rounded-2xl shadow-2xl p-8 border border-[var(--border-color)] text-center">
                <QFSIcon className="w-24 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">مرحباً, {employeeName}</h1>
                <p className="text-[var(--text-secondary)] mb-8">اختر الطريقة التي تود تسجيل الدخول بها:</p>

                <div className="space-y-4">
                    <button
                        onClick={() => onChoice('Admin')}
                        className="w-full flex items-center justify-center gap-4 p-4 border border-[var(--border-color-light)] rounded-lg text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors transform hover:scale-105"
                    >
                        <Cog6ToothIcon className="w-10 h-10 text-[var(--accent-text)]" />
                        <div>
                            <p className="font-bold text-lg text-[var(--text-primary)]">مدير النظام</p>
                            <p className="text-sm text-[var(--text-secondary)]">الوصول الكامل لجميع ميزات النظام.</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onChoice('Head of Department')}
                        className="w-full flex items-center justify-center gap-4 p-4 border border-[var(--border-color-light)] rounded-lg text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors transform hover:scale-105"
                    >
                        <UsersIcon className="w-10 h-10 text-blue-500" />
                        <div>
                            <p className="font-bold text-lg text-[var(--text-primary)]">رئيس قسم</p>
                            <p className="text-sm text-[var(--text-secondary)]">تجربة النظام بصلاحيات رئيس قسم.</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onChoice('Employee')}
                        className="w-full flex items-center justify-center gap-4 p-4 border border-[var(--border-color-light)] rounded-lg text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors transform hover:scale-105"
                    >
                        <UserCircleIcon className="w-10 h-10 text-[var(--success-text)]" />
                        <div>
                            <p className="font-bold text-lg text-[var(--text-primary)]">موظف</p>
                            <p className="text-sm text-[var(--text-secondary)]">عرض الواجهة الخاصة بالموظفين فقط.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginChoiceModal;