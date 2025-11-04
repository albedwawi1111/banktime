import React, { useRef } from 'react';
import type { RejectionNotice } from '../types';
import Modal from './Modal';
import { PrinterIcon, ArrowDownTrayIcon } from './icons';

declare const html2pdf: any;

interface RejectionNoticePrintProps {
    notice: RejectionNotice;
    onClose: () => void;
}

const InfoCell: React.FC<{ arabic: string, english: string, value?: string, className?: string, tall?: boolean }> = ({ arabic, english, value, className = '', tall = false }) => (
    <div className={`p-2 text-center ${className}`}>
        <p className="font-semibold">{arabic}</p>
        <p className="text-xs text-gray-500">{english}</p>
        <div className={`font-bold text-lg mt-2 break-words ${tall ? 'min-h-[6rem]' : 'min-h-[2.5rem]'}`}>
            {value || ''}
        </div>
    </div>
);


const RejectionNoticePrint: React.FC<RejectionNoticePrintProps> = ({ notice, onClose }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        const source = printAreaRef.current;
        if (!source) return;

        // 1. Clone the element to prevent issues with live component state during PDF generation
        const clone = source.cloneNode(true) as HTMLElement;
        
        // 2. IMPORTANT: Remove height and overflow restrictions from the clone to capture the entire content
        clone.classList.remove('max-h-[75vh]', 'overflow-y-auto');
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';

        // 3. Create an off-screen container for the clone to ensure all styles are applied
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0px';
        container.style.width = '210mm'; // A4 width helps with layouting
        container.appendChild(clone);
        document.body.appendChild(container);

        // 4. Temporarily switch to light theme for consistent PDF background
        const originalTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'light');

        const opt = {
            margin: 0.5,
            filename: `RejectionNotice_${notice.importerName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        // 5. Generate PDF from the prepared clone
        html2pdf().from(clone).set(opt).save().then(() => {
            // 6. Cleanup: remove container and restore original theme
            document.body.removeChild(container);
            if (originalTheme) {
                document.documentElement.setAttribute('data-theme', originalTheme);
            }
        });
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="معاينة إخطار الرفض" maxWidth="max-w-4xl">
            <div id="print-area-container">
                <div ref={printAreaRef} className="bg-[var(--bg-secondary)] print:bg-white print:text-black p-4 max-h-[75vh] overflow-y-auto font-cairo" dir="rtl">
                    <h2 className="text-center font-bold text-2xl mb-6">
                        إخطار رفض إرسالية سلامة غذاء واردة
                    </h2>

                    <div className="border border-current text-sm">
                        <div className="font-bold text-center p-2 border-b border-current bg-[var(--bg-tertiary)] print:bg-gray-200">
                           تفاصيل الإرسالية / Details of Consignment
                        </div>

                        <div className="grid grid-cols-2 border-b border-current">
                            <InfoCell arabic="اسم المستورد" english="Name of IMPORTER" value={notice.importerName} />
                            <InfoCell arabic="اسم المصدر" english="Name of Exporter" value={notice.exporterName} className="border-r border-current" />
                        </div>

                        <div className="grid grid-cols-3 border-b border-current">
                            <InfoCell arabic="رقم البيان الجمركي" english="Custom Declaration No." value={notice.customDeclarationNo} />
                            <InfoCell arabic="منفذ الدخول" english="Point of Entry" value={notice.pointOfEntry} className="border-r border-current"/>
                            <InfoCell arabic="بلد المنشأ" english="Country of Origin" value={notice.countryOfOrigin} className="border-r border-current"/>
                        </div>

                        <div className="grid grid-cols-12 border-b border-current">
                            <div className="col-span-3"><InfoCell arabic="السلعة" english="Commodity" value={notice.commodity} /></div>
                            <div className="col-span-3 border-r border-current"><InfoCell arabic="الاسم الشائع" english="Common Name" value={notice.commonName} /></div>
                            <div className="col-span-2 border-r border-current"><InfoCell arabic="الاسم العلمي" english="Scientific Name" value={notice.scientificName} /></div>
                            <div className="col-span-2 border-r border-current"><InfoCell arabic="الوزن" english="Weight" value={notice.weight} /></div>
                            <div className="col-span-2 border-r border-current"><InfoCell arabic="عدد الطرود" english="No. of Packages" value={notice.noOfPackages} /></div>
                        </div>

                        <div className="grid grid-cols-4">
                            <InfoCell arabic="سبب الرفض" english="Cause of Non-Compliance" value={notice.causeOfNonCompliance} tall />
                            <InfoCell arabic="الاجراء المتخذ" english="Action Taken" value={notice.actionTaken} tall className="border-r border-current"/>
                            <InfoCell arabic="تاريخ وصول الإرسالية" english="Date of Arrival" value={notice.arrivalDate} className="border-r border-current"/>
                            <InfoCell arabic="تاريخ الإخطار" english="Date of Notification" value={notice.notificationDate} className="border-r border-current"/>
                        </div>
                    </div>
                    
                    <div className="border border-t-0 border-current p-4 text-right">
                        <div className="space-y-2 inline-block">
                             <div className="flex items-center justify-start gap-2">
                                <p>أتعهد بإعادة تصدير الإرسالية إلى مصدرها الأصلي خلال أسبوع من تاريخه.</p>
                                <span className="w-4 h-4 border-2 border-current rounded-full inline-block print:border-black flex-shrink-0"></span>
                            </div>
                             <div className="flex items-center justify-start gap-2">
                                <p>أوافق على اتلاف الإرسالية حسب القانون</p>
                                <span className="w-4 h-4 border-2 border-current rounded-full inline-block print:border-black flex-shrink-0"></span>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <p>توقيع المستورد / أو مندوبه</p>
                            <p className="mt-8 border-b border-dotted border-current max-w-sm mx-auto">&nbsp;</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 border border-t-0 border-current">
                        <div className="p-3 text-center">
                            <p>اسم وتوقيع الموظف المختص</p>
                            <p className="text-xs">Name and Signature of Authorized Officer</p>
                            <div className="font-bold text-lg mt-12 min-h-[3rem]">{notice.authorizedOfficerName}</div>
                        </div>
                        <div className="p-3 text-center border-r border-current">
                            <p>اسم وتوقيع رئيس القسم</p>
                            <p className="text-xs">Name and Signature of Head Department</p>
                            <div className="font-bold text-lg mt-12 min-h-[3rem]">{notice.headDepartmentName}</div>
                        </div>
                    </div>
                </div>
                
                 <div className="flex justify-end p-4 border-t border-[var(--border-color)] print:hidden">
                    <button onClick={onClose} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg ml-2 transition-colors">إغلاق</button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg ml-2">
                        <ArrowDownTrayIcon />
                        تصدير PDF
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">
                        <PrinterIcon />
                        طباعة
                    </button>
                </div>
            </div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area-container, #print-area-container * { visibility: visible; }
                    #print-area-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
                    .border-current { border-color: black !important; }
                    .bg-current { background-color: black !important; }
                }
            `}</style>
        </Modal>
    );
};

export default RejectionNoticePrint;