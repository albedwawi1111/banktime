import React, { useRef } from 'react';
import type { Employee, TrainingRecord } from '../types';
import Modal from './Modal';
import { UserGroupIcon, PrinterIcon, ArrowDownTrayIcon } from './icons';

// Make sure html2pdf is declared if you're using it as a global script
declare const html2pdf: any;

interface EmployeeCVProps {
  employee: Employee;
  onClose: () => void;
  trainingRecords: TrainingRecord[];
}

const EmployeeCV: React.FC<EmployeeCVProps> = ({ employee, onClose, trainingRecords }) => {
  const cvContentRef = useRef<HTMLDivElement>(null);

  const employeeTrainingRecords = trainingRecords.filter(
    tr => Array.isArray(tr.employeeIds) && tr.employeeIds.includes(employee.id) && tr.status === 'Completed'
  );

  const handleExportPDF = () => {
    const source = cvContentRef.current;
    if (!source) return;

    // 1. Set theme for the entire document for correct colors.
    const originalTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');

    const opt = {
      margin: 0.5,
      filename: `${employee.name}_CV.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // 2. Clone the element to render off-screen, avoiding modal issues.
    const clone = source.cloneNode(true) as HTMLElement;

    // 3. Style the clone to ensure full content is captured.
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';

    // 4. Create an off-screen container.
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    container.style.width = '210mm'; // A4 width for layouting

    // 5. Append to body for rendering.
    container.appendChild(clone);
    document.body.appendChild(container);

    // 6. Generate PDF from the clone.
    html2pdf().from(clone).set(opt).save().then(() => {
        // 7. Cleanup DOM and restore theme.
        document.body.removeChild(container);
        if (originalTheme) {
            document.documentElement.setAttribute('data-theme', originalTheme);
        }
    });
  };
  
  const handlePrint = () => {
    window.print();
  };

  const CVSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="mb-6 break-inside-avoid">
      <h3 className="text-lg font-bold text-[var(--text-primary)] print:text-black border-b border-[var(--border-color-light)] print:border-gray-300 pb-2 mb-3">{title}</h3>
      <div className="text-sm text-[var(--text-secondary)] print:text-gray-700">{children}</div>
    </div>
  );

  const InfoPair: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 mb-1.5">
        <p className="col-span-1 text-[var(--text-muted)] print:text-gray-500 font-medium">{label}:</p>
        <p className="col-span-2">{value || '-'}</p>
    </div>
  );
  
  return (
    <Modal isOpen={true} onClose={onClose} title={`السيرة الذاتية - ${employee.name}`} maxWidth="max-w-4xl">
      <div id="cv-container">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg transition-colors">
                <PrinterIcon />
                طباعة
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <ArrowDownTrayIcon />
                تصدير PDF
            </button>
        </div>

        <div 
            ref={cvContentRef} 
            className="bg-[var(--bg-secondary)] p-8 rounded-lg max-h-[70vh] overflow-y-auto font-cairo
                       print:bg-white print:text-black print:shadow-none print:max-h-full print:overflow-visible"
        >
            <div className="text-center mb-8 print:text-black">
                <h1 className="text-2xl font-bold">السيرة الذاتية</h1>
                <p className="text-md text-[var(--text-secondary)]">قسم الحجر وسلامة الغذاء بميناء صحار</p>
            </div>

            {/* --- Header --- */}
            <header className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-6 border-b border-[var(--border-color)] print:border-gray-300">
                {employee.profilePicture 
                    ? <img src={employee.profilePicture} alt={employee.name} className="w-28 h-28 rounded-full object-cover border-4 border-[var(--border-color-light)] print:border-gray-400"/>
                    : <div className="w-28 h-28 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border-4 border-[var(--border-color-light)]"><UserGroupIcon className="w-16 h-16 text-[var(--text-muted)]"/></div>
                }
                <div className="text-center md:text-right flex-1">
                    <h2 className="text-3xl font-extrabold text-[var(--text-primary)] print:text-black">{employee.name}</h2>
                    <p className="text-lg text-[var(--text-secondary)] print:text-gray-600 mt-1">{employee.jobTitle || 'غير محدد'}</p>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <CVSection title="المعلومات الشخصية">
                        <InfoPair label="الرقم المدني" value={employee.nationalId} />
                        <InfoPair label="تاريخ الميلاد" value={employee.dateOfBirth} />
                        <InfoPair label="الجنسية" value={employee.nationality} />
                        <InfoPair label="الحالة الاجتماعية" value={employee.maritalStatus} />
                        <InfoPair label="رقم الهاتف" value={employee.phone} />
                        <InfoPair label="البريد الإلكتروني" value={employee.email} />
                        <InfoPair label="العنوان" value={employee.address} />
                    </CVSection>
                    <CVSection title="المعلومات الوظيفية">
                        <InfoPair label="الرقم الوظيفي" value={employee.employeeNumber} />
                        <InfoPair label="القطاع" value={employee.department} />
                        <InfoPair label="تاريخ التعيين" value={employee.hireDate} />
                        <InfoPair label="نوع العقد" value={employee.contractType} />
                        <InfoPair label="الحالة" value={employee.status} />
                    </CVSection>
                </div>

                <div className="md:col-span-2">
                    <CVSection title="المؤهلات التعليمية">
                        {employee.education && employee.education.length > 0 ? (
                            <ul className="space-y-4">
                                {employee.education.map((edu, index) => (
                                    <li key={index} className="pl-4 border-r-2 border-[var(--border-color-light)] print:border-gray-300 break-inside-avoid">
                                        <p className="font-bold text-md text-[var(--text-primary)] print:text-black">{edu.degree} في {edu.fieldOfStudy}</p>
                                        <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">{edu.institution}</p>
                                        <p className="text-xs text-[var(--text-muted)]">سنة التخرج: {edu.graduationYear}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-[var(--text-muted)]">لا توجد مؤهلات مسجلة.</p>}
                    </CVSection>
                    <CVSection title="التدريب والتطوير">
                        {employeeTrainingRecords.length > 0 ? (
                            <ul className="space-y-4">
                                {employeeTrainingRecords.map((tr) => (
                                    <li key={tr.id} className="pl-4 border-r-2 border-[var(--border-color-light)] print:border-gray-300 break-inside-avoid">
                                        <p className="font-bold text-md text-[var(--text-primary)] print:text-black">{tr.courseName}</p>
                                        <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">{tr.provider}</p>
                                        <p className="text-xs text-[var(--text-muted)]">التاريخ: {tr.startDate} - {tr.endDate}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[var(--text-muted)]">لا توجد دورات تدريبية مكتملة مسجلة.</p>
                        )}
                    </CVSection>
                    <CVSection title="الخبرة العملية">
                        {employee.workExperience && employee.workExperience.length > 0 ? (
                            <ul className="space-y-4">
                                {employee.workExperience.map((exp, index) => (
                                    <li key={index} className="pl-4 border-r-2 border-[var(--border-color-light)] print:border-gray-300 break-inside-avoid">
                                        <p className="font-bold text-md text-[var(--text-primary)] print:text-black">{exp.jobTitle}</p>
                                        <p className="text-sm text-[var(--text-secondary)] print:text-gray-600">{exp.company}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{exp.startDate} - {exp.endDate}</p>
                                        {exp.description && <p className="text-xs text-[var(--text-secondary)] print:text-gray-600 mt-1">{exp.description}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-[var(--text-muted)]">لا توجد خبرات عملية مسجلة.</p>}
                    </CVSection>

                    <CVSection title="المهارات">
                        {employee.skills && employee.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {employee.skills.map((skill, index) => (
                                    <span key={index} className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium px-3 py-1 rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : <p className="text-[var(--text-muted)]">لا توجد مهارات مسجلة.</p>}
                    </CVSection>
                </div>
            </main>
            <footer className="text-center text-xs text-[var(--text-muted)] mt-12 pt-4 border-t border-[var(--border-color)] print:border-gray-300">
                <p>تم إنشاء هذه الوثيقة بتاريخ {new Date().toLocaleDateString('ar-EG')}</p>
                <p>نظام شؤون الموظفين - قسم الحجر وسلامة الغذاء بميناء صحار</p>
            </footer>
        </div>
      </div>
      <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #cv-container, #cv-container * {
              visibility: visible;
            }
            #cv-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
      `}</style>
    </Modal>
  );
};

export default EmployeeCV;