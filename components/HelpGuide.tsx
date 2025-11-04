import React, { useState } from 'react';
import type { Employee } from '../types';

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors"
            >
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <svg
                    className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 bg-[var(--bg-secondary)]">
                    <div className="prose prose-invert max-w-none text-[var(--text-secondary)]">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminGuide = () => (
    <>
        <AccordionItem title="لوحة التحكم">
            <p>توفر لوحة التحكم نظرة عامة شاملة على النظام. يمكنك رؤية:</p>
            <ul>
                <li><strong>الإحصائيات الرئيسية:</strong> مثل إجمالي عدد الموظفين، الحاضرين اليوم، والموظفين في إجازة.</li>
                <li><strong>الإشعارات والتنبيهات:</strong> تذكيرات بأعياد الميلاد القادمة للموظفين والمستندات التي قاربت صلاحيتها على الانتهاء.</li>
                <li><strong>طلبات الإجازة المعلقة:</strong> قائمة بالطلبات التي تنتظر موافقتك، مع إمكانية قبولها أو رفضها مباشرة.</li>
                <li><strong>من على رأس العمل اليوم:</strong> قائمة بالموظفين الحاضرين مع تفاصيل مناوباتهم.</li>
                <li><strong>تخصيص لوحة التحكم:</strong> يمكنك الآن تخصيص لوحة التحكم بالضغط على زر "تخصيص". قم بسحب وإفلات الوحدات لترتيبها، أو إخفائها وإظهارها لتناسب أولويات عملك.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="إدارة الموظفين">
            <p>هنا يمكنك إدارة جميع بيانات الموظفين بشكل مركزي.</p>
            <ul>
                <li><strong>إضافة موظف:</strong> انقر على زر "إضافة موظف" واملأ البيانات في النموذج المقسم إلى تبويبات (شخصية، وظيفية، مالية، تعليمية، ومستندات).</li>
                <li><strong>تعديل موظف:</strong> انقر على أيقونة القلم بجانب اسم الموظف لتحديث بياناته.</li>
                <li><strong>حذف موظف:</strong> انقر على أيقونة سلة المهملات (متاح لمدير النظام فقط).</li>
                <li><strong>الإجراءات الجماعية:</strong> يمكنك الآن تحديد عدة موظفين دفعة واحدة. عند تحديدهم، سيظهر شريط في الأسفل يتيح لك تنفيذ إجراءات جماعية مثل تغيير الحالة، التعيين لتدريب، أو الحذف.</li>
                <li><strong>إدارة الصلاحيات:</strong> يمكنك تغيير دور الموظف (موظف، رئيس قسم، مدير) من القائمة المنسدلة في صف الموظف.</li>
                <li><strong>إعادة تعيين كلمة المرور:</strong> انقر على أيقونة المفتاح لإعادة كلمة مرور الموظف إلى القيمة الافتراضية.</li>
                <li><strong>عرض السيرة الذاتية (CV):</strong> انقر على أيقونة الهوية لعرض وطباعة السيرة الذاتية الكاملة للموظف.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="إدارة المناوبات">
            <p>تتيح لك هذه الصفحة إنشاء جداول المناوبات وتعيين الموظفين لها.</p>
            <ul>
                <li><strong>إدارة المناوبات (تبويب):</strong> يمكنك إضافة، تعديل، أو حذف أنواع المناوبات المختلفة لكل قسم، وتحديد أوقاتها ولونها المميز.</li>
                <li><strong>جدول المناوبات (تبويب):</strong>
                    <ul>
                        <li><strong>عرض الجدول:</strong> يعرض جدول شهري حيث يمكنك تعيين الموظفين للمناوبات في أيام محددة. انقر على الخلية لإضافة مناوبة بسرعة أو لتعديلها يدويًا.</li>
                        <li><strong>عرض التقويم:</strong> يعرض جدول المناوبات لموظف محدد على شكل تقويم شهري.</li>
                        <li><strong>السجل اليومي:</strong> يعرض جدولاً يوضح الموظفين المناوبين لكل مناوبة في كل يوم من أيام الشهر.</li>
                    </ul>
                </li>
            </ul>
        </AccordionItem>
         <AccordionItem title="إدارة الإجازات">
            <p>هنا يمكنك إدارة طلبات الإجازات للموظفين والإجازات الرسمية.</p>
            <ul>
                <li><strong>طلبات الإجازة:</strong> يمكنك عرض جميع طلبات الإجازات، والموافقة عليها أو رفضها. كما يمكنك إضافة طلب إجازة نيابة عن موظف.</li>
                <li><strong>الإجازات الرسمية:</strong> يمكنك إضافة وتعديل وحذف الإجازات الرسمية للدولة.</li>
                <li><strong>تحديد شهر رمضان:</strong> يمكنك تحديد تاريخ بداية ونهاية شهر رمضان لكل سنة، حيث يتم احتساب ساعات العمل بشكل مختلف خلاله.</li>
                <li><strong>طباعة النماذج:</strong> انقر على أيقونة الطابعة لطباعة نموذج طلب الإجازة الرسمي.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="تقارير الساعات الإضافية">
            <p>تقوم هذه الصفحة بحساب وعرض تقارير الساعات الإضافية وأيام بدل الراحات بشكل تلقائي بناءً على سجلات الحضور والمناوبات.</p>
            <ul>
                <li><strong>ملخص الإضافي:</strong> يعرض ملخصًا ورسومًا بيانية للساعات الإضافية وأيام الراحات لجميع الموظفين.</li>
                <li><strong>مراجعة الأقسام:</strong> يقدم مقارنة بين أداء الأقسام المختلفة من حيث الحضور والساعات الإضافية.</li>
                <li><strong>السجل الشهري:</strong> جدول مفصل لكل موظف يوضح الساعات المطلوبة، الفعلية، الإضافية، والأيام المستحقة. يمكن تصديره كملف PDF.</li>
                <li><strong>السجل السنوي:</strong> جدول يلخص أيام بدل الراحات المستحقة لكل موظف على مدار السنة. يمكن تصديره كملف PDF.</li>
            </ul>
        </AccordionItem>
         <AccordionItem title="الإعدادات">
            <p>تسمح هذه الصفحة (لمدير النظام فقط) بتخصيص القوائم المنسدلة المستخدمة في جميع أنحاء النظام.</p>
            <ul>
                <li>يمكنك إضافة، تعديل، أو حذف عناصر من قوائم مثل: الجنسيات، المسميات الوظيفية، الأقسام، المؤهلات العلمية، أنواع الإجازات، جهات المراسلات، والمركبات.</li>
            </ul>
        </AccordionItem>
    </>
);

const HeadOfDepartmentGuide = () => (
     <>
        <AccordionItem title="لوحة التحكم">
            <p>توفر لوحة التحكم نظرة عامة على موظفي قسمك. يمكنك رؤية:</p>
            <ul>
                <li><strong>الإحصائيات الرئيسية:</strong> مثل إجمالي عدد الموظفين في قسمك، الحاضرين اليوم، والموظفين في إجازة.</li>
                <li><strong>الإشعارات والتنبيهات:</strong> تذكيرات بأعياد الميلاد والمستندات التي قاربت صلاحيتها على الانتهاء لموظفي قسمك.</li>
                <li><strong>طلبات الإجازة المعلقة:</strong> قائمة بالطلبات من موظفي قسمك والتي تنتظر موافقتك.</li>
                <li><strong>من على رأس العمل اليوم:</strong> قائمة بالموظفين الحاضرين في قسمك.</li>
                <li><strong>تخصيص لوحة التحكم:</strong> يمكنك الآن تخصيص لوحة التحكم بالضغط على زر "تخصيص". قم بسحب وإفلات الوحدات لترتيبها، أو إخفائها وإظهارها لتناسب أولويات عملك.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="إدارة الموظفين">
            <p>يمكنك إدارة بيانات الموظفين في قسمك فقط.</p>
            <ul>
                <li><strong>إضافة موظف:</strong> يمكنك إضافة موظفين جدد إلى قسمك.</li>
                <li><strong>تعديل موظف:</strong> يمكنك تحديث بيانات موظفي قسمك.</li>
                <li><strong>الإجراءات الجماعية:</strong> يمكنك الآن تحديد عدة موظفين دفعة واحدة. عند تحديدهم، سيظهر شريط في الأسفل يتيح لك تنفيذ إجراءات جماعية مثل تغيير الحالة، التعيين لتدريب، أو الحذف.</li>
                <li>لا يمكنك حذف الموظفين أو تغيير صلاحياتهم.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="إدارة المناوبات">
            <p>تتيح لك هذه الصفحة إنشاء جداول المناوبات لموظفي قسمك.</p>
            <ul>
                <li><strong>إدارة المناوبات:</strong> يمكنك إضافة وتعديل المناوبات الخاصة بقسمك.</li>
                <li><strong>جدول المناوبات:</strong> يمكنك تعيين موظفي قسمك للمناوبات في الجدول الشهري.</li>
            </ul>
        </AccordionItem>
         <AccordionItem title="إدارة الإجازات">
            <p>يمكنك إدارة طلبات الإجازات لموظفي قسمك.</p>
            <ul>
                <li><strong>طلبات الإجازة:</strong> يمكنك عرض جميع طلبات الإجازات لموظفي قسمك، والموافقة عليها أو رفضها.</li>
                <li>لا يمكنك إدارة الإجازات الرسمية.</li>
            </ul>
        </AccordionItem>
    </>
);

const EmployeeGuide = () => (
     <>
        <AccordionItem title="لوحة التحكم">
            <p>هي صفحتك الرئيسية، حيث يمكنك رؤية ملخص سريع لمعلوماتك.</p>
            <ul>
                <li><strong>ملخص اليوم:</strong> يعرض حالتك الحالية (على رأس العمل، في إجازة، إلخ).</li>
                <li><strong>أرصدة الإجازات:</strong> يعرض رصيدك المتبقي من الإجازات السنوية والمرضية.</li>
                <li><strong>ملخص التدريب:</strong> يعرض عدد الدورات التدريبية التي شاركت بها.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="ملفي الشخصي">
            <p>هنا يمكنك عرض وتحديث بعض بياناتك الشخصية وتغيير كلمة المرور.</p>
            <ul>
                <li><strong>تعديل البيانات:</strong> يمكنك تحديث رقم هاتفك، بريدك الإلكتروني، عنوانك، وحالتك الاجتماعية.</li>
                <li><strong>تغيير كلمة المرور:</strong> يمكنك تغيير كلمة المرور الخاصة بك عن طريق إدخال كلمة المرور الحالية ثم الجديدة.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="جدول المناوبات">
            <p>يمكنك عرض جدول مناوباتك الشهري.</p>
            <ul>
                <li><strong>عرض الجدول:</strong> يعرض لك المناوبات المعينة لك في جدول شهري.</li>
                <li><strong>عرض التقويم:</strong> يعرض جدولك على شكل تقويم.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="كشف الحضور وتقاريري">
            <ul>
                <li><strong>كشف الحضور:</strong> يمكنك عرض سجل حضورك وانصرافك لأي شهر، مع ملخص للساعات.</li>
                <li><strong>تقاريري:</strong> يمكنك عرض تقارير الساعات الإضافية وأيام بدل الراحات الخاصة بك.</li>
            </ul>
        </AccordionItem>
        <AccordionItem title="الإجازات وطلباتي">
             <ul>
                <li><strong>الإجازات:</strong> يمكنك تقديم طلب إجازة جديد ومتابعة حالة طلباتك السابقة.</li>
                <li><strong>طلباتي:</strong> يمكنك تقديم طلبات عامة (مثل طلب مساعدة، اقتراح، إلخ) إلى مدير النظام ومتابعة حالتها.</li>
            </ul>
        </AccordionItem>
    </>
);

interface HelpGuideProps {
    currentUser: Employee;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ currentUser }) => {

    const renderGuide = () => {
        switch (currentUser.role) {
            case 'Admin':
                return <AdminGuide />;
            case 'Head of Department':
                return <HeadOfDepartmentGuide />;
            case 'Employee':
            default:
                return <EmployeeGuide />;
        }
    };

    const getRoleName = () => {
         switch (currentUser.role) {
            case 'Admin': return 'مدير النظام';
            case 'Head of Department': return 'رئيس القسم';
            case 'Employee':
            default: return 'الموظف';
        }
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">دليل الاستخدام</h2>
            <p className="text-md text-[var(--text-secondary)] mb-6">يتم عرض الدليل المخصص لصلاحياتك كـ <span className="font-bold text-[var(--accent-text)]">{getRoleName()}</span>.</p>
            
            <div className="space-y-4">
                {renderGuide()}
            </div>
            
            <style>{`
                .prose ul { list-style-type: disc; padding-right: 1.5rem; }
                .prose li { margin-bottom: 0.5rem; }
                .prose ul ul { margin-top: 0.5rem; }
                .prose p { margin-bottom: 1rem; }
            `}</style>
        </div>
    );
};

export default HelpGuide;