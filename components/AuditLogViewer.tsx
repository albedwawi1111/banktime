import React, { useState, useMemo } from 'react';
import type { AuditLog } from '../types';
import { MagnifyingGlassIcon } from './icons';

interface AuditLogViewerProps {
    auditLogs: AuditLog[];
}

const formatTimestamp = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ auditLogs }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const sortedAndFilteredLogs = useMemo(() => {
        const sorted = [...auditLogs].sort((a, b) => {
            const dateA = a.timestamp?.toDate() || 0;
            const dateB = b.timestamp?.toDate() || 0;
            return dateB - dateA;
        });

        if (!searchTerm.trim()) {
            return sorted;
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        return sorted.filter(log =>
            log.userName.toLowerCase().includes(lowercasedFilter) ||
            log.action.toLowerCase().includes(lowercasedFilter) ||
            log.details.toLowerCase().includes(lowercasedFilter)
        );
    }, [auditLogs, searchTerm]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">سجل النشاطات</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="بحث في السجل..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                </div>
            </div>
             <p className="text-sm text-[var(--text-muted)] mb-6">
                ملاحظة: يتم الاحتفاظ بسجلات النشاط لمدة أسبوع واحد فقط، ثم يتم حذفها تلقائيًا من النظام.
            </p>

            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">التاريخ والوقت</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">المستخدم</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الإجراء</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {sortedAndFilteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <td className="py-3 px-6 whitespace-nowrap text-xs">{formatTimestamp(log.timestamp)}</td>
                                    <td className="py-3 px-6 whitespace-nowrap">{log.userName}</td>
                                    <td className="py-3 px-6 whitespace-nowrap font-semibold">{log.action}</td>
                                    <td className="py-3 px-6 text-[var(--text-secondary)]">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedAndFilteredLogs.length === 0 && (
                        <p className="text-center text-[var(--text-muted)] p-8">لا توجد سجلات مطابقة للبحث.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;