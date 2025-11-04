import React from 'react';
import { QFSIcon, UserGroupIcon, CalendarDaysIcon, ChartBarIcon, PaperAirplaneIcon, AdjustmentsHorizontalIcon, DocumentTextIcon, CarIcon, KeyIcon, ClipboardDocumentCheckIcon } from './icons';

const AboutPage: React.FC = () => {

    const features = [
        { icon: <UserGroupIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "إدارة شاملة للموظفين", description: "سجل مركزي لجميع بيانات الموظفين الشخصية، الوظيفية، المالية، والمستندات الرسمية." },
        { icon: <CalendarDaysIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "جدولة متقدمة للمناوبات", description: "نظام مرن لإنشاء جداول المناوبات الشهرية وتعيين الموظفين بسهولة." },
        { icon: <ChartBarIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "تقارير آلية للساعات الإضافية", description: "حساب تلقائي ودقيق للساعات الإضافية وأيام بدل الراحات مع تقارير شهرية وسنوية." },
        { icon: <PaperAirplaneIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "إدارة الإجازات والطلبات", description: "نظام متكامل لتقديم ومتابعة طلبات الإجازات والموافقات عليها." },
        { icon: <DocumentTextIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "إدارة المراسلات", description: "إنشاء وأرشفة المراسلات الرسمية وتصاريح الدخول بشكل إلكتروني." },
        { icon: <CarIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "إدارة تصاريح المركبات", description: "نظام لتسجيل ومتابعة تصاريح استخدام المركبات الحكومية مع تتبع عداد المسافات." },
        { icon: <KeyIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "نظام صلاحيات متكامل", description: "صلاحيات مخصصة لكل من مدير النظام، رئيس القسم، والموظف لضمان أمان البيانات." },
        { icon: <AdjustmentsHorizontalIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "لوحة تحكم قابلة للتخصيص", description: "إمكانية ترتيب وإخفاء الوحدات في لوحة التحكم لتناسب أولويات كل مدير." },
        { icon: <ClipboardDocumentCheckIcon className="w-8 h-8 text-[var(--accent-text)]"/>, title: "إجراءات جماعية", description: "توفير الوقت عبر تحديث أو حذف بيانات عدة موظفين دفعة واحدة." },
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <QFSIcon className="w-32 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">حول نظام شؤون الموظفين</h2>
                    <p className="text-md text-[var(--text-secondary)] mt-2">
                        نظام إلكتروني متكامل لإدارة وتنظيم العمليات المتعلقة بشؤون الموظفين في قسم الحجر وسلامة الغذاء بميناء صحار.
                    </p>
                </header>

                <section className="mb-12">
                    <h3 className="text-2xl font-semibold text-center text-[var(--text-primary)] mb-6">المميزات الرئيسية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                             <div key={index} className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg flex flex-col items-center text-center transition-transform transform hover:-translate-y-1">
                                {feature.icon}
                                <h4 className="text-lg font-bold text-[var(--text-primary)] mt-4 mb-2">{feature.title}</h4>
                                <p className="text-sm text-[var(--text-muted)]">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="text-center border-t border-[var(--border-color)] pt-6">
                    <p className="text-md text-[var(--text-secondary)]">تم تطوير هذا النظام بواسطة</p>
                    <p className="text-xl font-semibold text-[var(--text-primary)] mt-1">مبارك درويش</p>
                </footer>
            </div>
        </div>
    );
};

export default AboutPage;