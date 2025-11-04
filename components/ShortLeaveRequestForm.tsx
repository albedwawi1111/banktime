import React, { useRef } from 'react';
import type { Employee, LeaveRequest } from '../types';
import Modal from './Modal';
import { PrinterIcon, ArrowDownTrayIcon } from './icons';

declare const html2pdf: any;

interface ShortLeaveRequestFormProps {
    leaveRequest: LeaveRequest;
    employee: Employee;
    onClose: () => void;
}

const ShortLeaveRequestForm: React.FC<ShortLeaveRequestFormProps> = ({ leaveRequest, employee, onClose }) => {
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
            filename: `ShortLeaveRequest_${employee.name}_${leaveRequest.startDate}.pdf`,
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
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    const today = new Date().toLocaleDateString('en-CA');

    return (
        <Modal isOpen={true} onClose={onClose} title="نموذج طلب إجازة (5 أيام فأقل)" maxWidth="max-w-4xl">
            <div id="print-area-container">
                <div ref={printAreaRef} className="bg-[var(--bg-secondary)] print:bg-white print:text-black p-8 max-h-[75vh] overflow-y-auto font-cairo" dir="rtl">
                    <div className="text-center font-bold mb-8">
                        {/* Placeholder for the emblem */}
                        <div className="text-2xl mb-4">✥</div> 
                        <p>وزارة الثروة الزراعية والسمكية وموارد المياه</p>
                    </div>

                    <h2 className="text-center font-bold text-xl mb-10 border-b-2 border-current w-fit mx-auto px-4">
                        طلب إجازة من الرصيد (خمسة أيام فأقل)
                    </h2>

                    <div className="mb-6">
                        <p className="mb-2">الفاضل/ المهندس: مدير دائرة الشؤون الإدارية والمالية المحترم</p>
                        <p className="mb-4">تحية طيبة وبعد،،</p>
                        <p>
                            أرجو التكرم بالموافقة على منحي إجازة لمدة ( {calculateDuration()} ) يوم / أيــــــــام 
                            وذلك اعتبارا من : {leaveRequest.startDate} م وحتى نهاية : {leaveRequest.endDate} م خصما من رصيد إجازتي السنوية بسبب: ظروف خاصة.
                        </p>
                    </div>

                    <div className="mb-10">
                        <p>وتفضلوا بقبول فائق الاحترام ،،،</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-12">
                        <div>
                            <p><span className="font-semibold">جهة العمل:</span> قسم الحجر وسلامة الغذاء بميناء صحار</p>
                            <p><span className="font-semibold">التاريخ:</span> {today} م</p>
                        </div>
                        <div className="text-left">
                            <p><span className="font-semibold">مقدم الطلب:</span> {employee.name}</p>
                            <p><span className="font-semibold">الرقم الوظيفي:</span> {employee.employeeNumber}</p>
                            <p className="mt-4"><span className="font-semibold">التوقيع</span> ..............................</p>
                        </div>
                    </div>
                    
                    {/* Approval Sections */}
                    <div className="border-t-2 border-current pt-4 mb-6">
                        <p className="mb-2">الفاضل/ مدير دائرة الشؤون الإدارية والمالية المحترم</p>
                        <p>نود الإحاطة بأنه لا مانع من منح المذكور الإجازة المطلوبة.</p>
                        <div className="flex justify-between mt-8">
                            <div><p><span className="font-semibold">التاريخ:</span> ..............................</p></div>
                            <div><p><span className="font-semibold">لوظيفة:</span> ..............................</p></div>
                            <div><p><span className="font-semibold">التوقيع</span> ..............................</p></div>
                        </div>
                    </div>
                    
                    <div className="border-t-2 border-current pt-4 mb-6">
                        <p className="mb-2">الفاضل/ رئيس قسم الموارد البشرية المحترم</p>
                        <p>يرجى التكرم بالإفادة / باتخاذ اللازم.</p>
                         <div className="flex justify-between mt-8">
                            <div><p><span className="font-semibold">الوظيفة:</span> مدير دائرة الشؤون الإدارية والمالية بمحافظتي الباطنة</p></div>
                            <div><p><span className="font-semibold">التوقيع</span> ..............................</p></div>
                        </div>
                    </div>
                    
                    <div className="border-t-2 border-current pt-4">
                        <h3 className="font-bold underline mb-2">قسم الموارد البشرية</h3>
                        <p>تم الإجراء باتخاذ اللازم وخصم الفترة من: &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp; م إلى : &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp; م من رصيد إجازته السنوية بالمستند رقم : ..............</p>
                        <div className="text-left mt-8">
                            <p>رئيس قسم الموارد البشرية</p>
                        </div>
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
                    .border-current {
                        border-color: black !important;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default ShortLeaveRequestForm;