import React, { useState, useMemo } from 'react';
import type { UserRequest, Employee } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons';

interface UserRequestManagerProps {
    userRequests: UserRequest[];
    currentUser: Employee;
    addRequest: (request: Omit<UserRequest, 'id' | 'employeeName' | 'createdAt' | 'status'>) => void;
    updateRequest: (request: Partial<UserRequest> & { id: string }) => void;
}

const formatTimestamp = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
};

const UserRequestManager: React.FC<UserRequestManagerProps> = ({ userRequests, currentUser, addRequest, updateRequest }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [viewingRequest, setViewingRequest] = useState<UserRequest | null>(null);

    const filteredRequests = useMemo(() => {
        const sorted = [...userRequests].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        if (currentUser.role === 'Admin') {
            return sorted;
        }
        return sorted.filter(req => req.employeeId === currentUser.id);
    }, [userRequests, currentUser]);

    const handleOpenModal = () => {
        setFormData({ title: '', description: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title.trim() && formData.description.trim()) {
            addRequest({
                employeeId: currentUser.id,
                title: formData.title,
                description: formData.description,
            });
            handleCloseModal();
        }
    };

    const handleStatusChange = (requestId: string, newStatus: UserRequest['status']) => {
        updateRequest({ id: requestId, status: newStatus });
    };

    const StatusBadge: React.FC<{ status: UserRequest['status'] }> = ({ status }) => {
        const styles = {
            Pending: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
            'In Progress': 'bg-[var(--accent-color)]/20 text-[var(--accent-text)]',
            Completed: 'bg-[var(--success-bg)] text-[var(--success-text)]',
        };
        const textMap: Record<UserRequest['status'], string> = { Pending: 'قيد الانتظار', 'In Progress': 'قيد التنفيذ', Completed: 'مكتمل' };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{textMap[status]}</span>;
    };
    
    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                    {currentUser.role === 'Admin' ? 'المقترحات والشكاوى' : 'مقترحاتي'}
                </h2>
                <button onClick={handleOpenModal} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    تقديم مقترح أو شكوى
                </button>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الموضوع</th>
                                {currentUser.role === 'Admin' && <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">مقدم الطلب</th>}
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">تاريخ الإنشاء</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredRequests.map(req => (
                                <tr key={req.id} onClick={() => setViewingRequest(req)} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors cursor-pointer">
                                    <td className="py-4 px-6 font-semibold">{req.title}</td>
                                    {currentUser.role === 'Admin' && <td className="py-4 px-6">{req.employeeName}</td>}
                                    <td className="py-4 px-6 text-xs text-[var(--text-secondary)]">{formatTimestamp(req.createdAt)}</td>
                                    <td className="py-4 px-6">
                                        {currentUser.role === 'Admin' ? (
                                            <select
                                                value={req.status}
                                                onChange={(e) => handleStatusChange(req.id, e.target.value as UserRequest['status'])}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-2 py-1 text-xs focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                                            >
                                                <option value="Pending">قيد الانتظار</option>
                                                <option value="In Progress">قيد التنفيذ</option>
                                                <option value="Completed">مكتمل</option>
                                            </select>
                                        ) : (
                                            <StatusBadge status={req.status} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredRequests.length === 0 && (
                        <p className="text-center text-[var(--text-muted)] p-8">لا توجد مقترحات لعرضها.</p>
                     )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="مقترح / شكوى جديدة">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className={labelClasses}>الموضوع</label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className={labelClasses}>التفاصيل</label>
                        <textarea
                            id="description"
                            rows={5}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            className={inputClasses}
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">إرسال</button>
                    </div>
                </form>
            </Modal>

            {viewingRequest && (
                <Modal isOpen={!!viewingRequest} onClose={() => setViewingRequest(null)} title={viewingRequest.title}>
                    <div className="space-y-4 text-sm">
                        <p><strong>مقدم المقترح:</strong> {viewingRequest.employeeName}</p>
                        <p><strong>التاريخ:</strong> {formatTimestamp(viewingRequest.createdAt)}</p>
                        <p><strong>الحالة:</strong> <StatusBadge status={viewingRequest.status} /></p>
                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <h4 className="font-semibold mb-2">التفاصيل:</h4>
                            <p className="bg-[var(--bg-tertiary)]/50 p-3 rounded-md whitespace-pre-wrap">{viewingRequest.description}</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default UserRequestManager;
