import React, { useState, useMemo, useRef } from 'react';
import type { Employee, AppSettings } from '../types';
import { PrinterIcon, ArrowDownTrayIcon as ExportIcon } from './icons';

declare const html2pdf: any;

interface EmployeeExporterProps {
    employees: Employee[];
    settings: AppSettings;
}

type EmployeeKeys = keyof Employee;

const EXPORTABLE_FIELDS: { key: EmployeeKeys; label: string; group: string }[] = [
    // Personal Info
    { key: 'name', label: 'الاسم الكامل', group: 'البيانات الشخصية' },
    { key: 'employeeNumber', label: 'الرقم الوظيفي', group: 'البيانات الشخصية' },
    { key: 'nationalId', label: 'الرقم المدني', group: 'البيانات الشخصية' },
    { key: 'dateOfBirth', label: 'تاريخ الميلاد', group: 'البيانات الشخصية' },
    { key: 'gender', label: 'الجنس', group: 'البيانات الشخصية' },
    { key: 'maritalStatus', label: 'الحالة الاجتماعية', group: 'البيانات الشخصية' },
    { key: 'nationality', label: 'الجنسية', group: 'البيانات الشخصية' },
    { key: 'phone', label: 'رقم الهاتف', group: 'البيانات الشخصية' },
    { key: 'email', label: 'البريد الإلكتروني', group: 'البيانات الشخصية' },
    { key: 'address', label: 'العنوان', group: 'البيانات الشخصية' },
    // Job Info
    { key: 'department', label: 'القطاع', group: 'البيانات الوظيفية' },
    { key: 'jobTitle', label: 'المسمى الوظيفي', group: 'البيانات الوظيفية' },
    { key: 'hireDate', label: 'تاريخ التعيين', group: 'البيانات الوظيفية' },
    { key: 'contractType', label: 'نوع العقد', group: 'البيانات الوظيفية' },
    { key: 'status', label: 'حالة الموظف', group: 'البيانات الوظيفية' },
    // Financial Info
    { key: 'financialGrade', label: 'الدرجة المالية', group: 'البيانات المالية' },
    { key: 'basicSalary', label: 'الراتب الأساسي', group: 'البيانات المالية' },
    { key: 'allowances', label: 'العلاوات', group: 'البيانات المالية' },
    { key: 'bankName', label: 'اسم البنك', group: 'البيانات المالية' },
];

const EmployeeExporter: React.FC<EmployeeExporterProps> = ({ employees, settings }) => {
    const [selectedFields, setSelectedFields] = useState<Record<EmployeeKeys, boolean>>({
        name: true, employeeNumber: true, department: true, jobTitle: true,
    } as Record<EmployeeKeys, boolean>);
    
    const exportContentRef = useRef<HTMLDivElement>(null);

    const handleFieldChange = (field: EmployeeKeys) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const activeFields = useMemo(() => {
        return EXPORTABLE_FIELDS.filter(field => selectedFields[field.key]);
    }, [selectedFields]);

    const handleExportPDF = () => {
        const element = exportContentRef.current;
        if (element) {
            const originalTheme = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', 'light');
            
            // Temporarily make the hidden element visible for capturing
            const originalDisplay = element.style.display;
            element.style.display = 'block';

            const opt = {
              margin: 0.5,
              filename: `employee_data_export.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().from(element).set(opt).save().then(() => {
                // Restore original theme and display style
                if (originalTheme) {
                    document.documentElement.setAttribute('data-theme', originalTheme);
                }
                element.style.display = originalDisplay;
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const groupedFields = EXPORTABLE_FIELDS.reduce((acc, field) => {
        acc[field.group] = [...(acc[field.group] || []), field];
        return acc;
    }, {} as Record<string, typeof EXPORTABLE_FIELDS>);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="print:hidden">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">تصدير بيانات الموظفين</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Filters and Fields */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Field Selector */}
                        <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg">
                             <h3 className="text-lg font-semibold mb-3">اختيار الحقول</h3>
                             <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                                {Object.entries(groupedFields).map(([groupName, fields]) => (
                                    <div key={groupName}>
                                        <h4 className="font-semibold text-[var(--text-secondary)] mb-2">{groupName}</h4>
                                        {fields.map(field => (
                                             <label key={field.key} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedFields[field.key]}
                                                    onChange={() => handleFieldChange(field.key)}
                                                    className="form-checkbox h-4 w-4 bg-[var(--bg-tertiary)] border-[var(--border-color-light)] rounded text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                                                />
                                                <span>{field.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Preview and Actions */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">معاينة التقرير ({employees.length} موظف)</h3>
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg transition-colors">
                                    <PrinterIcon />
                                    <span>طباعة</span>
                                </button>
                                <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    <ExportIcon />
                                    <span>تصدير PDF</span>
                                </button>
                            </div>
                        </div>
                         <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[70vh]">
                                <table className="min-w-full text-right text-sm">
                                    <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                                        <tr>
                                            {activeFields.map(field => (
                                                <th key={field.key} className="py-2 px-3 font-semibold">{field.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {employees.map(emp => (
                                            <tr key={emp.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                                {activeFields.map(field => (
                                                    <td key={field.key} className="py-2 px-3 whitespace-nowrap">
                                                        {(emp[field.key] as any)?.toString() || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content for printing and exporting */}
            <div id="export-content" className="hidden print:block font-cairo" ref={exportContentRef}>
                 <div className="p-4">
                    <h2 className="text-2xl font-bold mb-4 text-center">تقرير بيانات الموظفين</h2>
                    <table className="w-full text-right text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-200">
                            <tr>
                                {activeFields.map(field => (
                                    <th key={field.key} className="py-2 px-2 font-semibold border border-gray-400">{field.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    {activeFields.map(field => (
                                        <td key={field.key} className="py-1 px-2 whitespace-nowrap border border-gray-400">
                                            {(emp[field.key] as any)?.toString() || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #export-content, #export-content * {
                        visibility: visible;
                    }
                    #export-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default EmployeeExporter;