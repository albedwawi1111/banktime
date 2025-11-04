import React, { useState, useEffect } from 'react';
import { QFSIcon, EyeIcon, EyeSlashIcon } from './icons';

interface LoginProps {
    onLogin: (nationalId: string, password: string) => Promise<void>;
    onForgotPasswordRequest: (nationalId: string) => Promise<{ success: boolean; message: string }>;
    error: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onForgotPasswordRequest, error }) => {
    const [nationalId, setNationalId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bgImage, setBgImage] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotNationalId, setForgotNationalId] = useState('');
    const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
    const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

     useEffect(() => {
        const images = [
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop', // Green hills
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop', // Forest path
            'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1920&auto=format&fit=crop', // Waterfall
            'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop', // Mountains and lake
            'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop', // River in forest
        ];
        
        let currentIndex = 0;
        setBgImage(images[currentIndex]); // Set initial image

        const intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            setBgImage(images[currentIndex]);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onLogin(nationalId, password);
        setIsLoading(false);
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingForgot(true);
        setModalMessage({ type: '', text: '' });
        const result = await onForgotPasswordRequest(forgotNationalId);
        if (result.success) {
            setModalMessage({ type: 'success', text: result.message });
        } else {
            setModalMessage({ type: 'error', text: result.message });
        }
        setIsSubmittingForgot(false);
    };


    return (
        <div 
            className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="relative max-w-md w-full bg-[var(--bg-glass)] backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                    <QFSIcon className="w-32 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">تسجيل الدخول</h1>
                    <p className="text-[var(--text-secondary)] mt-2">نظام شؤون الموظفين</p>
                    <p className="text-[var(--text-muted)] mt-1 text-sm">قسم الحجر وسلامة الغذاء بميناء صحار</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="nationalId" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            الرقم المدني
                        </label>
                        <input
                            id="nationalId"
                            name="nationalId"
                            type="text"
                            autoComplete="username"
                            required
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
                                كلمة المرور
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotModal(true);
                                    setModalMessage({ type: '', text: '' });
                                    setForgotNationalId('');
                                }}
                                className="text-xs font-medium text-[var(--accent-text)] hover:underline focus:outline-none"
                            >
                                نسيت كلمة المرور؟
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition pl-10"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 left-0 flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                aria-label={isPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                            >
                                {isPasswordVisible ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-[var(--danger-bg)] text-[var(--danger-text)] text-sm font-semibold p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color-hover)] disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                        >
                            {isLoading ? 'جاري التحقق...' : 'دخول'}
                        </button>
                    </div>
                </form>
            </div>
            
            {showForgotModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                     <div className="bg-[var(--bg-secondary)] rounded-lg shadow-2xl p-6 w-full m-4 max-w-sm">
                         <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4 text-center">طلب إعادة تعيين كلمة المرور</h3>
                         {!modalMessage.text || modalMessage.type === 'error' ? (
                            <form onSubmit={handleForgotSubmit}>
                                <p className="text-[var(--text-secondary)] text-sm mb-4">
                                    أدخل رقمك المدني وسنقوم بإرسال إشعار لمدير النظام لإعادة تعيين كلمة المرور الخاصة بك.
                                </p>
                                <div>
                                     <label htmlFor="forgotNationalId" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        الرقم المدني
                                    </label>
                                    <input
                                        id="forgotNationalId"
                                        type="text"
                                        required
                                        value={forgotNationalId}
                                        onChange={(e) => setForgotNationalId(e.target.value)}
                                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
                                    />
                                </div>

                                 {modalMessage.type === 'error' && (
                                     <div className="bg-[var(--danger-bg)] text-[var(--danger-text)] text-sm font-semibold p-3 mt-4 rounded-lg text-center">
                                        {modalMessage.text}
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        className="py-2 px-4 rounded-lg text-sm font-medium bg-[var(--bg-quaternary)] hover:opacity-80 transition"
                                    >
                                        إلغاء
                                    </button>
                                     <button
                                        type="submit"
                                        disabled={isSubmittingForgot}
                                        className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] disabled:opacity-50 transition"
                                    >
                                        {isSubmittingForgot ? 'جاري الإرسال...' : 'إرسال الطلب'}
                                    </button>
                                </div>
                            </form>
                         ) : (
                             <div>
                                <p className="bg-[var(--success-bg)] text-[var(--success-text)] text-sm font-semibold p-4 rounded-lg text-center">
                                    {modalMessage.text}
                                </p>
                                <div className="text-center mt-4">
                                    <button
                                        onClick={() => setShowForgotModal(false)}
                                        className="py-2 px-6 rounded-lg text-sm font-medium text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] transition"
                                    >
                                        حسناً
                                    </button>
                                </div>
                            </div>
                         )}
                     </div>
                 </div>
            )}
        </div>
    );
};

export default Login;