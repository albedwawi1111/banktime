import React, { useRef } from 'react';
import type { Correspondence } from '../types';
import Modal from './Modal';
import { PrinterIcon, ArrowDownTrayIcon } from './icons';

declare const html2pdf: any;

interface CorrespondenceLetterProps {
    correspondence: Correspondence;
    onClose: () => void;
}

const CorrespondenceLetter: React.FC<CorrespondenceLetterProps> = ({ correspondence, onClose }) => {
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
            margin: 0.75,
            filename: `Correspondence_${correspondence.recipient}.pdf`,
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

    const gregorianDate = correspondence.createdAt ? new Date(correspondence.createdAt.seconds * 1000) : new Date();

    const gregorianFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedGregorianDate = gregorianFormatter.format(gregorianDate);

    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-civil', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const formattedHijriDate = hijriFormatter.format(gregorianDate);
    
    let bodyText = '';
    switch (correspondence.type) {
        case 'permanent':
            bodyText = 'بالإشارة إلى الموضوع أعلاه، يرجى التكرم بتسهيل دخول الموظفين المذكورين أدناه إلى ميناء صحار لإنجاز الأعمال الموكلة إليهم:';
            break;
        case 'temporary':
            bodyText = 'بالإشارة إلى الموضوع أعلاه، يرجى التكرم بالموافقة على إصدار تصريح دخول مؤقت للموظفين المذكورة أسمائهم أدناه وذلك لإنجاز الأعمال الموكلة إليهم:';
            break;
        case 'temporary_period':
            bodyText = `بالإشارة إلى الموضوع أعلاه، يرجى التكرم بالموافقة على إصدار تصريح دخول مؤقت للموظفين المذكورة أسمائهم أدناه وذلك خلال الفترة من ${correspondence.startDate} إلى ${correspondence.endDate} لإنجاز الأعمال الموكلة إليهم:`;
            break;
        case 'nutrition_card':
            bodyText = 'بالإشارة إلى الموضوع أعلاه، يرجى التكرم بالموافقة على استخراج بطاقة تغذية للموظفين المذكورة أسمائهم أدناه وذلك حسب الإجراءات المتبعة لديكم:';
            break;
        default:
            bodyText = 'بالإشارة إلى الموضوع أعلاه، يرجى التكرم بتسهيل دخول الموظفين المذكورين أدناه إلى ميناء صحار لإنجاز الأعمال الموكلة إليهم:';
    }


    return (
        <Modal isOpen={true} onClose={onClose} title="معاينة الخطاب" maxWidth="max-w-4xl">
            <div id="print-area-container">
                <div ref={printAreaRef} className="bg-[var(--bg-secondary)] print:bg-white print:text-black px-8 pb-8 pt-24 max-h-[75vh] overflow-y-auto font-cairo" dir="rtl">
                    
                    <div className="mb-10 text-sm text-right">
                        <p><span className="font-bold">الرقم</span> {correspondence.referenceNumber.replace(/\//g, ' ')}</p>
                        <p><span className="font-bold">التاريخ</span> {formattedGregorianDate.replace(/\//g, ' ')} م</p>
                        <p><span className="font-bold">الموافق</span> {formattedHijriDate}</p>
                    </div>

                    <div className="mb-6 text-right">
                        <p className="font-bold">الفاضل {correspondence.recipient} المحترم</p>
                    </div>

                    <div className="mb-6 text-center">
                        <p className="font-bold underline">الموضوع {correspondence.subject}</p>
                    </div>

                    <div className="mb-6 text-right">
                        <p>تحية طيبة وبعد ،،،</p>
                        <p className="mt-4">{bodyText}</p>
                    </div>

                    <table className="w-full text-center border-collapse border border-current my-8 text-sm">
                        <thead className="bg-[var(--bg-tertiary)] print:bg-gray-200">
                            <tr>
                                <th className="border border-current p-2">م</th>
                                <th className="border border-current p-2">الاسم</th>
                                <th className="border border-current p-2">المسمى الوظيفي</th>
                                <th className="border border-current p-2">الرقم المدني</th>
                            </tr>
                        </thead>
                        <tbody>
                            {correspondence.persons.map((person, index) => (
                                <tr key={index}>
                                    <td className="border border-current p-2">{index + 1}</td>
                                    <td className="border border-current p-2">{person.name}</td>
                                    <td className="border border-current p-2">{person.jobTitle}</td>
                                    <td className="border border-current p-2">{person.nationalId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {correspondence.type === 'permanent' && (
                        <div className="mb-6 text-right">
                            <p>علماً بأن صلاحية التصريح لمدة سنتين.</p>
                        </div>
                    )}

                    <div className="mb-10 text-right">
                        <p>شاكرين لكم حسن تعاونكم معنا.</p>
                    </div>

                    <div className="mt-16">
                        <div className="text-right">
                            <p className="font-bold">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>
                        </div>
                        <div className="text-left mt-12">
                            <p>ماجد بن علي الشامسي</p>
                            <p>رئيس قسم الحجر وسلامة الغذاء بميناء صحار</p>
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

export default CorrespondenceLetter;