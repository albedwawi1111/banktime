import React, { useRef } from 'react';
import type { Employee, LeaveRequest } from '../types';
import Modal from './Modal';
import { PrinterIcon, ArrowDownTrayIcon } from './icons';

declare const html2pdf: any;

interface LeaveRequestFormProps {
    leaveRequest: LeaveRequest;
    employee: Employee;
    onClose: () => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ leaveRequest, employee, onClose }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        const source = printAreaRef.current;
        if (!source) return;

        const originalTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'light');

        const opt = {
            margin: 0.5,
            filename: `LeaveRequest_${employee.name}_${leaveRequest.startDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        const clone = source.cloneNode(true) as HTMLElement;
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';
        
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0px';
        container.style.width = '210mm';

        container.appendChild(clone);
        document.body.appendChild(container);

        html2pdf().from(clone).set(opt).save().then(() => {
            document.body.removeChild(container);
            if (originalTheme) {
                document.documentElement.setAttribute('data-theme', originalTheme);
            }
        });
    };

    const calculateDuration = () => {
        if (!leaveRequest.startDate || !leaveRequest.endDate) return 0;
        const start = new Date(leaveRequest.startDate);
        const end = new Date(leaveRequest.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
        return diffDays;
    }

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    return (
        <Modal isOpen={true} onClose={onClose} title="نموذج طلب إجازة" maxWidth="max-w-4xl">
            <div id="print-area-container">
                <div ref={printAreaRef} className="bg-[var(--bg-secondary)] print:bg-white print:text-black p-8 max-h-[75vh] overflow-y-auto text-right font-cairo" dir="rtl">
                    <div className="text-center font-bold mb-8">
                        <p>سلطنة عمان</p>
                        <p>وزارة الثروة الزراعية والسمكية وموارد المياه</p>
                        <p>المديرية العامة للثروة الزراعية والسمكية</p>
                        <p>وموارد المياه بمحافظة شمال الباطنة</p>
                    </div>

                    <h2 className="text-center font-bold text-xl mb-10 border-b-2 border-double border-current w-fit mx-auto px-4">
                        نموذج طلب إجازة إعتياديــــــة
                    </h2>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
                        <div className="flex items-end gap-2"><span className="font-bold">الاســــم:</span><span className="border-b border-dotted border-current flex-grow text-center">{employee.name}</span></div>
                        <div className="flex items-end gap-2"><span className="font-bold">رقم الموظف:</span><span className="border-b border-dotted border-current flex-grow text-center">{employee.employeeNumber}</span></div>
                        
                        <div className="flex items-end gap-2"><span className="font-bold">الوظيفة:</span><span className="border-b border-dotted border-current flex-grow text-center">{employee.jobTitle}</span></div>
                        <div className="flex items-end gap-2"><span className="font-bold">الدرجـــــــة:</span><span className="border-b border-dotted border-current flex-grow text-center">{employee.financialGrade}</span></div>
                        
                        <div className="flex items-end gap-2"><span className="font-bold">تاريخ التعيين:</span><span className="border-b border-dotted border-current flex-grow text-center">{employee.hireDate}</span></div>
                        <div></div>

                        <div className="flex items-end gap-2"><span className="font-bold">مدة الاجازة:</span><span className="border-b border-dotted border-current flex-grow text-center">{`(${calculateDuration()}) يوما / أيام`}</span></div>
                        <div></div>

                        <div className="flex items-end gap-2"><span className="font-bold">تاريخ الابتداء:</span><span className="border-b border-dotted border-current flex-grow text-center">{leaveRequest.startDate}</span></div>
                        <div className="flex items-end gap-2"><span className="font-bold">تاريخ الانتهاء:</span><span className="border-b border-dotted border-current flex-grow text-center">{leaveRequest.endDate}</span></div>
                        
                        <div className="col-span-2 flex items-end gap-2"><span className="font-bold">عنوان الموظف خلال فترة الإجازة:</span><span className="border-b border-dotted border-current flex-grow text-center">{employee.address}</span></div>
                        
                        <div className="flex items-end gap-2"><span className="font-bold">التاريـــخ:</span><span className="border-b border-dotted border-current flex-grow text-center">{today} م</span></div>
                        <div className="flex items-end gap-2"><span className="font-bold">التوقيــــع:</span><span className="border-b border-dotted border-current flex-grow"></span></div>
                    </div>
                    
                    {/* Sections */}
                    <div className="border border-current p-3 mb-4">
                        <h3 className="font-bold underline mb-3">ملاحظات المسئول المباشر:-</h3>
                        <ol className="list-decimal list-outside mr-6 space-y-2 text-sm mb-4">
                            <li>أوافق على منح الإجازة للمدة المطلوبة أعـــــــــــــــلاه.</li>
                            <li>لا أوافق على منح الإجازة للمدة المطلوبة نظرا لظروف العمل.</li>
                            <li>أوافق على منح الإجازة لمدة ............. يوم وتعويضه نقدا لمدة ............. يوما إذا كان الاعتماد المالي يسمح بذلك.</li>
                            <li>أرى تأجيل إجازته حتى .......................... لظروف تقتضيها مصلحة العمل.</li>
                        </ol>
                         <div className="flex justify-around mt-6">
                            <div><p className="font-bold">التوقيــــع:</p></div>
                            <div><p className="font-bold">الوظيفة:</p></div>
                        </div>
                    </div>

                    <div className="border border-current p-3 mb-4">
                        <h3 className="font-bold underline mb-3">ملاحظات رئيس الوحدة:-</h3>
                         <div className="flex justify-around mt-6">
                            <div><p className="font-bold">التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2م</p></div>
                            <div><p className="font-bold">التوقيــــع:</p></div>
                        </div>
                    </div>

                    <div className="border border-current p-3">
                        <h3 className="font-bold underline mb-3">-تنبيه:</h3>
                        <ol className="list-decimal list-outside mr-6 space-y-2 text-xs">
                            <li>يسمح نظام الإجازات بصرف نصف الإجازة السنوية المحددة بالمادة (55) من قانون الخدمة المدنية نقدا إذا لم تسمح ظروف العمل بالتمتع بالرصيد بأكمله مرة واحدة خلال العام.</li>
                            <li>يقوم طالب الإجازة بتعبئة الجزء الأول من هذا الطلب ثم يقدمه لرئيسه المباشر للمصادقة عليه ثم يعرض على رئيس الوحدة لأخذ الموافقة النهائية ثم يحول إلى قسم الإجازات بشئون الموظفين في الوحدة لإجراء اللازم.</li>
                            <li>يحفظ الطلب بعد إصدار تصديق الإجازة في الملف الشخصي للموظف في وحدته.</li>
                            <li>يجب أن يقدم طلب الإجازة قبل موعدها بمدة لا تقل عن عشرين يوما حتى يمكن صرف مرتبها نقدا.</li>
                            <li>في الحالات المستعجلة يمكن أن تقدم الإجازة في أي وقت لكنه لا يشترط صرف راتب الإجازة مقدما.</li>
                        </ol>
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t border-[var(--border-color)] print:hidden">
                    <button onClick={onClose} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إغلاق</button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg mr-2 transition-colors">
                        <ArrowDownTrayIcon />
                        تصدير PDF
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <PrinterIcon />
                        طباعة
                    </button>
                </div>
            </div>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-area-container, #print-area-container * {
                        visibility: visible;
                    }
                    #print-area-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default LeaveRequestForm;