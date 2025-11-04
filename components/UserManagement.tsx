import React, { useMemo, useState } from 'react';
import type { Employee, UserSession, AppSettings } from '../types';

const formatLastSeen = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'أبداً';
    const now = new Date();
    const lastSeenDate = timestamp.toDate();
    const diffSeconds = Math.round((now.getTime() - lastSeenDate.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);

    if (diffSeconds < 60) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقائق`;
    
    if (now.toDateString() === lastSeenDate.toDateString()) {
        return `اليوم الساعة ${lastSeenDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === lastSeenDate.toDateString()) {
        return `أمس الساعة ${lastSeenDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return lastSeenDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

interface UserManagementProps {
    employees: Employee[];
    userSessions: UserSession[];
    settings: AppSettings;
}

const UserManagement: React.FC<UserManagementProps> = ({ employees, userSessions, settings }) => {
    const [departmentFilter, setDepartmentFilter] = useState('All');

    const sessionMap = useMemo(() => {
        return new Map(userSessions.map(session => [session.id, session]));
    }, [userSessions]);

    const usersWithStatus = useMemo(() => {
        const filteredEmployees = departmentFilter === 'All'
            ? employees
            : employees.filter(emp => emp.department === departmentFilter);

        return filteredEmployees.map(employee => {
            const session = sessionMap.get(employee.id);
            const now = new Date();
            let isOnline = false;

            if (session) {
                const lastSeenDate = session.lastSeen?.toDate();
                if (lastSeenDate) {
                    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
                    // Consider online if status is 'online' and last seen was within the last 2 minutes
                    if (session.status === 'online' && diffMinutes < 2) {
                        isOnline = true;
                    }
                }
            }
            
            return {
                ...employee,
                isOnline,
                lastSeen: session?.lastSeen
            };
        }).sort((a, b) => {
            // Sort by online status first, then by name
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return a.name.localeCompare(b.name, 'ar');
        });
    }, [employees, sessionMap, departmentFilter]);


    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المستخدمين</h2>
                 <div>
                    <label htmlFor="dept-filter" className="text-sm text-[var(--text-secondary)] ml-2">تصفية حسب القطاع:</label>
                    <select
                        id="dept-filter"
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"
                    >
                        <option value="All">الكل</option>
                        {/* The department is now fixed, so filtering is not really needed but we keep the UI for consistency if it changes back */}
                        <option value="قسم الحجر وسلامة الغذاء بميناء صحار">قسم الحجر وسلامة الغذاء بميناء صحار</option>
                    </select>
                </div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الموظف</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الحالة</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">آخر ظهور</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {usersWithStatus.map(user => (
                                <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <td className="py-4 px-6">{user.name}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                                            <span>{user.isOnline ? 'متصل' : 'غير متصل'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-[var(--text-secondary)]">
                                        {user.isOnline ? 'الآن' : formatLastSeen(user.lastSeen)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;