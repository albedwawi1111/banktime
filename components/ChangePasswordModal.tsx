import React, { useState } from 'react';

interface ChangePasswordModalProps {
    onClose: () => void; // Should not allow closing without changing
    onPasswordChange: (newPassword: string) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onPasswordChange }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('يجب أن لا تقل كلمة المرور عن 6 أحرف.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        setError('');
        setIsLoading(true);
        await onPasswordChange(newPassword);
        setIsLoading(false);
    };

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-2xl p-6 w-full m-4 max-w-md transform transition-all duration-300">
                <div className="text-center mb-4">
                    <h3 className="text-2xl font-semibold text-[var(--text-primary)]">تغيير كلمة المرور</h3>
                    <p className="text-[var(--text-secondary)] mt-2">لأسباب أمنية، يرجى تعيين كلمة مرور جديدة.</p>
                </div>
                <div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="newPassword" className={labelClasses}>كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className={labelClasses}>تأكيد كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className={inputClasses}
                            />
                        </div>
                        {error && (
                           <div className="bg-[var(--danger-bg)] text-[var(--danger-text)] text-sm font-semibold p-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color-hover)] disabled:opacity-50"
                            >
                                {isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
