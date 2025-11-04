import React, { useRef } from 'react';
import type { VehiclePermit, Vehicle } from '../types';
import Modal from './Modal';
import { PrinterIcon, ArrowDownTrayIcon } from './icons';

declare const html2pdf: any;

interface VehiclePermitPrintProps {
    permit: VehiclePermit;
    vehicles: Vehicle[];
    onClose: () => void;
}

const VehiclePermitPrint: React.FC<VehiclePermitPrintProps> = ({ permit, vehicles, onClose }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    const vehicle = vehicles.find(v => v.id === permit.vehicleId);

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
            filename: `VehiclePermit_${permit.employeeName}.pdf`,
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

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: '-', time: '-' };
        const d = new Date(isoString);
        const date = d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        return { date, time };
    };

    const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
        <div className="flex items-end gap-2 py-2">
            <span className="font-bold w-48">{label}:</span>
            <span className="border-b border-dotted border-current flex-grow text-center pb-1">{value || '-'}</span>
        </div>
    );

    const distance = permit.odometerIn != null && permit.odometerIn > permit.odometerOut
        ? `${permit.odometerIn - permit.odometerOut} كم`
        : undefined;


    return (
        <Modal isOpen={true} onClose={onClose} title="طباعة تصريح مركبة" maxWidth="max-w-4xl">
            <div id="print-area-container">
                <div ref={printAreaRef} className="bg-[var(--bg-secondary)] print:bg-white print:text-black p-8 max-h-[75vh] overflow-y-auto text-right font-cairo" dir="rtl">
                    <div className="text-center font-bold mb-8">
                        <p>سلطنة عمان</p>
                        <p>وزارة الثروة الزراعية والسمكية وموارد المياه</p>
                        <p>المديرية العامة للثروة الزراعية والسمكية وموارد المياه بمحافظتي الباطنة</p>
                        <p>قسم الحجر وسلامة الغذاء بميناء صحار</p>
                    </div>
                    
                    <div className="text-left text-sm font-semibold mb-4">
                        رقم التصريح: {permit.permitNumber}
                    </div>

                    <h2 className="text-center font-bold text-xl mb-10 border-b-2 border-double border-current w-fit mx-auto px-4">
                        نموذج تصريح استخدام سيارة حكومية
                    </h2>

                    <div className="space-y-3 text-md mb-8">
                        <InfoRow label="اسم الموظف" value={permit.employeeName} />
                        <div className="grid grid-cols-2 gap-x-8">
                            <InfoRow label="نوع المركبة" value={vehicle?.type} />
                            <InfoRow label="رقم اللوحة" value={vehicle?.plateNumber} />
                        </div>
                        <InfoRow label="جهة الاستخدام" value={permit.destination} />
                        <InfoRow label="الغرض من الاستخدام" value={permit.purpose} />

                        <div className="grid grid-cols-2 gap-x-8 pt-4">
                           <div className="flex items-end gap-2 py-2">
                                <span className="font-bold">اعتباراً من تاريخ:</span>
                                <span className="border-b border-dotted border-current flex-grow text-center pb-1">{formatDateTime(permit.startDate).date}</span>
                                <span className="font-bold">الساعة:</span>
                                <span className="border-b border-dotted border-current flex-grow text-center pb-1">{formatDateTime(permit.startDate).time}</span>
                           </div>
                           <div className="flex items-end gap-2 py-2">
                                <span className="font-bold">وحتى تاريخ:</span>
                                <span className="border-b border-dotted border-current flex-grow text-center pb-1">{formatDateTime(permit.endDate).date}</span>
                                <span className="font-bold">الساعة:</span>
                                <span className="border-b border-dotted border-current flex-grow text-center pb-1">{formatDateTime(permit.endDate).time}</span>
                           </div>
                           <InfoRow label="رقم عداد السيارة عند الخروج" value={permit.odometerOut} />
                           <InfoRow label="رقم عداد السيارة عند العودة" value={permit.odometerIn} />
                           <div className="col-span-2">
                               <InfoRow label="المسافة المقطوعة" value={distance} />
                           </div>
                        </div>
                    </div>
                    
                    <div className="mt-20">
                        <p className="mb-12">تمت الموافقة على التصريح المذكور أعلاه للقيام بالمهمة الموكلة إليه.</p>

                        <div className="flex justify-around items-end">
                            <div className="text-center">
                                <p className="font-bold">توقيع الموظف،</p>
                                <div className="border-b border-dotted border-current w-48 mt-12"></div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold">رئيس القسم،</p>
                                <div className="border-b border-dotted border-current w-48 mt-12"></div>
                            </div>
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

export default VehiclePermitPrint;