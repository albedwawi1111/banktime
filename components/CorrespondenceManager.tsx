import React, { useState, useRef, useEffect } from 'react';
import type { Correspondence, PersonForPermit, AppSettings, CustomsCorrespondence, RejectionNotice } from '../types';
import Modal from './Modal';
import CorrespondenceLetter from './CorrespondenceLetter';
import CustomsCorrespondenceLetter from './CustomsCorrespondenceLetter';
import RejectionNoticePrint from './RejectionNoticePrint';
import { PlusIcon, TrashIcon, IdentificationIcon, PencilIcon } from './icons';

interface CorrespondenceManagerProps {
    correspondences: Correspondence[];
    addCorrespondence: (correspondence: Omit<Correspondence, 'id' | 'createdAt'>) => Promise<any>;
    updateCorrespondence: (correspondence: Correspondence) => void;
    deleteCorrespondence: (id: string) => void;
    customsCorrespondences: CustomsCorrespondence[];
    addCustomsCorrespondence: (correspondence: Omit<CustomsCorrespondence, 'id' | 'createdAt'>) => Promise<any>;
    updateCustomsCorrespondence: (correspondence: CustomsCorrespondence) => void;
    deleteCustomsCorrespondence: (id: string) => void;
    rejectionNotices: RejectionNotice[];
    addRejectionNotice: (notice: Omit<RejectionNotice, 'id' | 'createdAt'>) => Promise<any>;
    updateRejectionNotice: (notice: RejectionNotice) => void;
    deleteRejectionNotice: (id: string) => void;
    settings: AppSettings;
}

const EMPTY_PERSON_STATE: PersonForPermit = {
    name: '',
    jobTitle: '',
    nationalId: ''
};

const CorrespondenceManager: React.FC<CorrespondenceManagerProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'permits' | 'customs' | 'rejection'>('permits');
    
    const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                active ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-[var(--border-color-light)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">المراسلات</h2>
            <div className="border-b border-[var(--border-color)] mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="تصاريح الدخول" active={activeTab === 'permits'} onClick={() => setActiveTab('permits')} />
                    <TabButton label="مراسلات الجمارك" active={activeTab === 'customs'} onClick={() => setActiveTab('customs')} />
                    <TabButton label="إخطار رفض إرسالية" active={activeTab === 'rejection'} onClick={() => setActiveTab('rejection')} />
                </nav>
            </div>

            {activeTab === 'permits' && <PermitsManager {...props} />}
            {activeTab === 'customs' && <CustomsManager {...props} />}
            {activeTab === 'rejection' && <RejectionNoticeManager {...props} />}
        </div>
    );
};

// ===============================================
// Permits Manager (Existing Logic)
// ===============================================
const PermitsManager: React.FC<CorrespondenceManagerProps> = ({ correspondences, customsCorrespondences, addCorrespondence, updateCorrespondence, deleteCorrespondence, settings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCorrespondence, setEditingCorrespondence] = useState<Correspondence | null>(null);
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [persons, setPersons] = useState<PersonForPermit[]>([]);
    const [newPerson, setNewPerson] = useState<PersonForPermit>(EMPTY_PERSON_STATE);
    const [viewingCorrespondence, setViewingCorrespondence] = useState<Correspondence | null>(null);
    const [type, setType] = useState<Correspondence['type']>('permanent');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const recipientOptions = settings.correspondenceRecipients || [];

    const openModalForAdd = () => {
        setEditingCorrespondence(null);
        setRecipient(recipientOptions[0] || '');
        setSubject('بشأن تصريح دخول دائم لميناء صحار');
        setPersons([]);
        setNewPerson(EMPTY_PERSON_STATE);
        setType('permanent');
        setStartDate('');
        setEndDate('');
        setIsModalOpen(true);
    };
    
    const openModalForEdit = (corr: Correspondence) => {
        setEditingCorrespondence(corr);
        setRecipient(corr.recipient);
        setSubject(corr.subject);
        setPersons(corr.persons);
        setType(corr.type || 'permanent');
        setStartDate(corr.startDate || '');
        setEndDate(corr.endDate || '');
        setIsModalOpen(true);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as Correspondence['type'];
        setType(newType);
        switch (newType) {
            case 'permanent':
                setSubject('بشأن تصريح دخول دائم لميناء صحار');
                break;
            case 'temporary':
            case 'temporary_period':
                setSubject('بشأن تصريح دخول مؤقت لميناء صحار');
                break;
            case 'nutrition_card':
                setSubject('بشأن استخراج بطاقة تغذية');
                break;
        }
    };

    const handleAddPerson = () => {
        if (newPerson.name && newPerson.jobTitle && newPerson.nationalId) {
            setPersons([...persons, newPerson]);
            setNewPerson(EMPTY_PERSON_STATE);
        }
    };

    const handleRemovePerson = (indexToRemove: number) => {
        setPersons(persons.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isPeriodValid = type !== 'temporary_period' || (startDate && endDate);
        if (recipient && subject && persons.length > 0 && isPeriodValid) {
            if (editingCorrespondence) {
                updateCorrespondence({
                    id: editingCorrespondence.id,
                    recipient,
                    subject,
                    persons,
                    type,
                    startDate: type === 'temporary_period' ? startDate : '',
                    endDate: type === 'temporary_period' ? endDate : '',
                    createdAt: editingCorrespondence.createdAt,
                    referenceNumber: editingCorrespondence.referenceNumber,
                });
            } else {
                const year = new Date().getFullYear();
                
                const allYearCorrs = [
                    ...correspondences.filter(c => c.referenceNumber && c.referenceNumber.endsWith(`/${year}`)),
                    ...customsCorrespondences.filter(c => c.referenceNumber && c.referenceNumber.endsWith(`/${year}`)),
                ];
    
                let maxNumber = 0;
                allYearCorrs.forEach(c => {
                    const parts = c.referenceNumber.split('/');
                    if (parts.length === 3) {
                        const num = parseInt(parts[1], 10);
                        if (!isNaN(num) && num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                });
                
                const nextNumber = maxNumber + 1;
                const referenceNumber = `54/${nextNumber}/${year}`;

                await addCorrespondence({
                    recipient,
                    subject,
                    persons,
                    type,
                    startDate: type === 'temporary_period' ? startDate : '',
                    endDate: type === 'temporary_period' ? endDate : '',
                    referenceNumber,
                });
            }
            setIsModalOpen(false);
        } else {
            alert('يرجى ملء جميع الحقول المطلوبة والتأكد من صحة التواريخ.');
        }
    };
    
    const sortedCorrespondences = [...correspondences].sort((a, b) => {
        const dateA = a.createdAt?.toDate() || 0;
        const dateB = b.createdAt?.toDate() || 0;
        return dateB - dateA;
    });

    const typeMap: Record<Correspondence['type'], string> = {
        permanent: 'تصريح دائم',
        temporary: 'تصريح مؤقت',
        temporary_period: 'تصريح مؤقت لفترة',
        nutrition_card: 'بطاقة تغذية',
    };
    
    return (
        <>
            <div className="flex justify-end mb-6">
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إنشاء تصريح جديد
                </button>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الرقم</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">النوع</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الجهة المرسل إليها</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">الموضوع</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">تاريخ الإنشاء</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {sortedCorrespondences.map(corr => (
                                <tr key={corr.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <td className="py-4 px-6 font-mono">{corr.referenceNumber}</td>
                                    <td className="py-4 px-6 font-semibold">{typeMap[corr.type] || 'غير محدد'}</td>
                                    <td className="py-4 px-6">{corr.recipient}</td>
                                    <td className="py-4 px-6">{corr.subject}</td>
                                    <td className="py-4 px-6">{corr.createdAt ? new Date(corr.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <button onClick={() => setViewingCorrespondence(corr)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mx-2" title="عرض/طباعة"><IdentificationIcon /></button>
                                        <button onClick={() => openModalForEdit(corr)} className="text-[var(--accent-text)] hover:opacity-80 mx-2" title="تعديل"><PencilIcon /></button>
                                        <button onClick={() => deleteCorrespondence(corr.id)} className="text-[var(--danger-text)] hover:opacity-80" title="حذف"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCorrespondence ? "تعديل التصريح" : "إنشاء تصريح جديد"} maxWidth="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">نوع المراسلة</label>
                        <select value={type} onChange={handleTypeChange} className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]">
                            <option value="permanent">تصريح دائم</option>
                            <option value="temporary">تصريح مؤقت</option>
                            <option value="temporary_period">تصريح مؤقت لفترة معينة</option>
                            <option value="nutrition_card">بطاقة تغذية</option>
                        </select>
                    </div>

                    {type === 'temporary_period' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">تاريخ البدء</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">تاريخ الانتهاء</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الجهة المرسل إليها</label>
                        <select value={recipient} onChange={e => setRecipient(e.target.value)} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]">
                             {recipientOptions.length === 0 && <option value="" disabled>يرجى إضافة جهات من الإعدادات</option>}
                            {recipientOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الموضوع</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                    </div>
                    
                    <div className="pt-4 border-t border-[var(--border-color)]">
                        <h4 className="font-semibold mb-2">الأشخاص</h4>
                        <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <input value={newPerson.name} onChange={e => setNewPerson({...newPerson, name: e.target.value})} placeholder="الاسم" className="w-full bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                            <input value={newPerson.jobTitle} onChange={e => setNewPerson({...newPerson, jobTitle: e.target.value})} placeholder="المسمى الوظيفي" className="w-full bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                            <input value={newPerson.nationalId} onChange={e => setNewPerson({...newPerson, nationalId: e.target.value})} placeholder="الرقم المدني" className="w-full bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                            <button type="button" onClick={handleAddPerson} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1"><PlusIcon className="w-4 h-4" /> إضافة</button>
                        </div>
                        <div className="mt-4 space-y-2">
                            {persons.map((person, index) => (
                                <div key={index} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-2 rounded-md text-sm">
                                    <span>{person.name} - {person.jobTitle} ({person.nationalId})</span>
                                    <button type="button" onClick={() => handleRemovePerson(index)} className="text-[var(--danger-text)]"><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">{editingCorrespondence ? 'حفظ التغييرات' : 'حفظ'}</button>
                    </div>
                </form>
            </Modal>

            {viewingCorrespondence && (
                <CorrespondenceLetter
                    correspondence={viewingCorrespondence}
                    onClose={() => setViewingCorrespondence(null)}
                />
            )}
        </>
    );
};

// ===============================================
// Customs Correspondence Manager (New Logic)
// ===============================================
const CustomsManager: React.FC<CorrespondenceManagerProps> = ({ customsCorrespondences, correspondences, addCustomsCorrespondence, updateCustomsCorrespondence, deleteCustomsCorrespondence, settings }) => {
    const EMPTY_FORM_STATE = {
        recipient: settings.correspondenceRecipients?.[0] || '',
        subject: 'إصدار بيان ثان',
        companyName: '',
        product: '',
        countryOfOrigin: '',
        customsDeclarationNumber: '',
        rejectionReasons: '',
        secondIssuanceReasons: '',
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<CustomsCorrespondence | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM_STATE);
    const [viewing, setViewing] = useState<CustomsCorrespondence | null>(null);

    const recipientOptions = settings.correspondenceRecipients || [];

    const openModalForAdd = () => {
        setEditing(null);
        setFormData(EMPTY_FORM_STATE);
        setIsModalOpen(true);
    };

    const openModalForEdit = (corr: CustomsCorrespondence) => {
        setEditing(corr);
        setFormData({
            recipient: corr.recipient,
            subject: corr.subject,
            companyName: corr.companyName,
            product: corr.product,
            countryOfOrigin: corr.countryOfOrigin,
            customsDeclarationNumber: corr.customsDeclarationNumber,
            rejectionReasons: corr.rejectionReasons,
            secondIssuanceReasons: corr.secondIssuanceReasons,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { recipient, subject, companyName, product, customsDeclarationNumber, rejectionReasons, secondIssuanceReasons } = formData;
        if (recipient && subject && companyName && product && customsDeclarationNumber && rejectionReasons && secondIssuanceReasons) {
            if (editing) {
                updateCustomsCorrespondence({ ...editing, ...formData });
            } else {
                const year = new Date().getFullYear();
                const allYearCorrs = [
                    ...correspondences.filter(c => c.referenceNumber && c.referenceNumber.endsWith(`/${year}`)),
                    ...customsCorrespondences.filter(c => c.referenceNumber && c.referenceNumber.endsWith(`/${year}`)),
                ];
                let maxNumber = 0;
                allYearCorrs.forEach(c => {
                    const parts = c.referenceNumber.split('/');
                    if (parts.length === 3) {
                        const num = parseInt(parts[1], 10);
                        if (!isNaN(num) && num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                });
                const nextNumber = maxNumber + 1;
                const referenceNumber = `54/${nextNumber}/${year}`;

                await addCustomsCorrespondence({ ...formData, referenceNumber });
            }
            setIsModalOpen(false);
        } else {
            alert('يرجى ملء جميع الحقول.');
        }
    };
    
    const sortedCorrespondences = [...customsCorrespondences].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    return (
        <>
            <div className="flex justify-end mb-6">
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إنشاء مراسلة جمركية
                </button>
            </div>
             <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold">الرقم</th>
                                <th className="py-3 px-6 text-sm font-semibold">الجهة</th>
                                <th className="py-3 px-6 text-sm font-semibold">الموضوع</th>
                                <th className="py-3 px-6 text-sm font-semibold">تاريخ الإنشاء</th>
                                <th className="py-3 px-6 text-sm font-semibold">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {sortedCorrespondences.map(corr => (
                                <tr key={corr.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                    <td className="py-4 px-6 font-mono">{corr.referenceNumber}</td>
                                    <td className="py-4 px-6">{corr.recipient}</td>
                                    <td className="py-4 px-6">{corr.subject}</td>
                                    <td className="py-4 px-6 text-xs">{corr.createdAt ? new Date(corr.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '-'}</td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <button onClick={() => setViewing(corr)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mx-2" title="عرض/طباعة"><IdentificationIcon /></button>
                                        <button onClick={() => openModalForEdit(corr)} className="text-[var(--accent-text)] hover:opacity-80 mx-2" title="تعديل"><PencilIcon /></button>
                                        <button onClick={() => deleteCustomsCorrespondence(corr.id)} className="text-[var(--danger-text)] hover:opacity-80" title="حذف"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل مراسلة جمركية" : "مراسلة جمركية جديدة"} maxWidth="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الجهة المرسل إليها</label>
                        <select value={formData.recipient} onChange={e => setFormData(f => ({...f, recipient: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]">
                            {recipientOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم الشركة</label>
                            <input type="text" value={formData.companyName} onChange={e => setFormData(f => ({...f, companyName: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المنتج</label>
                            <input type="text" value={formData.product} onChange={e => setFormData(f => ({...f, product: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">بلد المنشأ</label>
                            <input type="text" value={formData.countryOfOrigin} onChange={e => setFormData(f => ({...f, countryOfOrigin: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رقم البيان الجمركي</label>
                            <input type="text" value={formData.customsDeclarationNumber} onChange={e => setFormData(f => ({...f, customsDeclarationNumber: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">أسباب الرفض</label>
                        <textarea rows={3} value={formData.rejectionReasons} onChange={e => setFormData(f => ({...f, rejectionReasons: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">أسباب طلب الإصدار الثاني</label>
                        <textarea rows={3} value={formData.secondIssuanceReasons} onChange={e => setFormData(f => ({...f, secondIssuanceReasons: e.target.value}))} required className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]" />
                    </div>

                    <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">{editing ? 'حفظ التغييرات' : 'حفظ'}</button>
                    </div>
                </form>
            </Modal>
            {viewing && (
                <CustomsCorrespondenceLetter
                    correspondence={viewing}
                    onClose={() => setViewing(null)}
                />
            )}
        </>
    );
};

// ===============================================
// Rejection Notice Manager (New Implementation)
// ===============================================
const RejectionNoticeManager: React.FC<CorrespondenceManagerProps> = ({ rejectionNotices, addRejectionNotice, updateRejectionNotice, deleteRejectionNotice }) => {
    const EMPTY_NOTICE_STATE: Omit<RejectionNotice, 'id' | 'createdAt'> = {
        exporterName: '',
        importerName: '',
        countryOfOrigin: '',
        pointOfEntry: '',
        customDeclarationNo: '',
        noOfPackages: '',
        weight: '',
        scientificName: '',
        commonName: '',
        commodity: '',
        notificationDate: new Date().toISOString().slice(0, 10),
        arrivalDate: '',
        actionTaken: '',
        causeOfNonCompliance: '',
        headDepartmentName: 'ماجد بن علي الشامسي',
        authorizedOfficerName: '',
    };
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<RejectionNotice | null>(null);
    const [formData, setFormData] = useState(EMPTY_NOTICE_STATE);
    const [viewing, setViewing] = useState<RejectionNotice | null>(null);
    
    const openModalForAdd = () => {
        setEditing(null);
        setFormData(EMPTY_NOTICE_STATE);
        setIsModalOpen(true);
    };

    const openModalForEdit = (notice: RejectionNotice) => {
        setEditing(notice);
        setFormData(notice);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const requiredFields: (keyof typeof formData)[] = ['importerName', 'commodity', 'causeOfNonCompliance', 'authorizedOfficerName'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            alert('يرجى ملء جميع الحقول الإلزامية.');
            return;
        }

        if (editing) {
            await updateRejectionNotice({ ...editing, ...formData });
        } else {
            await addRejectionNotice(formData);
        }
        setIsModalOpen(false);
    };

    const sortedNotices = [...rejectionNotices].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    
    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
    
    return (
        <>
            <div className="flex justify-end mb-6">
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إنشاء إخطار رفض جديد
                </button>
            </div>
             <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold">تاريخ الإخطار</th>
                                <th className="py-3 px-6 text-sm font-semibold">المستورد</th>
                                <th className="py-3 px-6 text-sm font-semibold">السلعة</th>
                                <th className="py-3 px-6 text-sm font-semibold">سبب الرفض</th>
                                <th className="py-3 px-6 text-sm font-semibold">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {sortedNotices.map(notice => (
                                <tr key={notice.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                    <td className="py-4 px-6">{notice.notificationDate}</td>
                                    <td className="py-4 px-6 font-semibold">{notice.importerName}</td>
                                    <td className="py-4 px-6">{notice.commodity}</td>
                                    <td className="py-4 px-6 truncate max-w-xs">{notice.causeOfNonCompliance}</td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <button onClick={() => setViewing(notice)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mx-2" title="عرض/طباعة"><IdentificationIcon /></button>
                                        <button onClick={() => openModalForEdit(notice)} className="text-[var(--accent-text)] hover:opacity-80 mx-2" title="تعديل"><PencilIcon /></button>
                                        <button onClick={() => deleteRejectionNotice(notice.id)} className="text-[var(--danger-text)] hover:opacity-80" title="حذف"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "تعديل إخطار الرفض" : "إنشاء إخطار رفض"} maxWidth="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 custom-scrollbar">
                    <fieldset className="border border-[var(--border-color)] p-4 rounded-md">
                        <legend className="px-2 font-semibold">تفاصيل الإرسالية</legend>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="exporterName" className={labelClasses}>اسم المصدر</label><input type="text" id="exporterName" value={formData.exporterName} onChange={e => setFormData(f => ({...f, exporterName: e.target.value}))} className={inputClasses} /></div>
                            <div><label htmlFor="importerName" className={labelClasses}>اسم المستورد *</label><input type="text" id="importerName" value={formData.importerName} onChange={e => setFormData(f => ({...f, importerName: e.target.value}))} required className={inputClasses} /></div>
                            <div><label htmlFor="countryOfOrigin" className={labelClasses}>بلد المنشأ</label><input type="text" id="countryOfOrigin" value={formData.countryOfOrigin} onChange={e => setFormData(f => ({...f, countryOfOrigin: e.target.value}))} className={inputClasses} /></div>
                            <div><label htmlFor="pointOfEntry" className={labelClasses}>منفذ الدخول</label><input type="text" id="pointOfEntry" value={formData.pointOfEntry} onChange={e => setFormData(f => ({...f, pointOfEntry: e.target.value}))} className={inputClasses} /></div>
                            <div className="md:col-span-2"><label htmlFor="customDeclarationNo" className={labelClasses}>رقم البيان الجمركي</label><input type="text" id="customDeclarationNo" value={formData.customDeclarationNo} onChange={e => setFormData(f => ({...f, customDeclarationNo: e.target.value}))} className={inputClasses} /></div>
                            <div><label htmlFor="noOfPackages" className={labelClasses}>عدد الطرود</label><input type="text" id="noOfPackages" value={formData.noOfPackages} onChange={e => setFormData(f => ({...f, noOfPackages: e.target.value}))} className={inputClasses} /></div>
                            <div><label htmlFor="weight" className={labelClasses}>الوزن</label><input type="text" id="weight" value={formData.weight} onChange={e => setFormData(f => ({...f, weight: e.target.value}))} className={inputClasses} /></div>
                            <div><label htmlFor="scientificName" className={labelClasses}>الاسم العلمي</label><input type="text" id="scientificName" value={formData.scientificName} onChange={e => setFormData(f => ({...f, scientificName: e.target.value}))} className={inputClasses} /></div>
                            <div><label htmlFor="commonName" className={labelClasses}>الاسم الشائع</label><input type="text" id="commonName" value={formData.commonName} onChange={e => setFormData(f => ({...f, commonName: e.target.value}))} className={inputClasses} /></div>
                            <div className="md:col-span-2"><label htmlFor="commodity" className={labelClasses}>السلعة *</label><input type="text" id="commodity" value={formData.commodity} onChange={e => setFormData(f => ({...f, commodity: e.target.value}))} required className={inputClasses} /></div>
                        </div>
                    </fieldset>

                     <fieldset className="border border-[var(--border-color)] p-4 rounded-md">
                        <legend className="px-2 font-semibold">تفاصيل الرفض</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="notificationDate" className={labelClasses}>تاريخ الإخطار</label><input type="date" id="notificationDate" value={formData.notificationDate} onChange={e => setFormData(f => ({...f, notificationDate: e.target.value}))} required className={inputClasses} /></div>
                            <div><label htmlFor="arrivalDate" className={labelClasses}>تاريخ وصول الإرسالية</label><input type="date" id="arrivalDate" value={formData.arrivalDate} onChange={e => setFormData(f => ({...f, arrivalDate: e.target.value}))} className={inputClasses} /></div>
                            <div className="md:col-span-2"><label htmlFor="actionTaken" className={labelClasses}>الإجراء المتخذ</label><input type="text" id="actionTaken" value={formData.actionTaken} onChange={e => setFormData(f => ({...f, actionTaken: e.target.value}))} className={inputClasses} /></div>
                            <div className="md:col-span-2"><label htmlFor="causeOfNonCompliance" className={labelClasses}>سبب الرفض *</label><textarea id="causeOfNonCompliance" rows={3} value={formData.causeOfNonCompliance} onChange={e => setFormData(f => ({...f, causeOfNonCompliance: e.target.value}))} required className={inputClasses}></textarea></div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-[var(--border-color)] p-4 rounded-md">
                        <legend className="px-2 font-semibold">التواقيع</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="headDepartmentName" className={labelClasses}>اسم وتوقيع رئيس القسم</label><input type="text" id="headDepartmentName" value={formData.headDepartmentName} onChange={e => setFormData(f => ({...f, headDepartmentName: e.target.value}))} required className={inputClasses} /></div>
                            <div><label htmlFor="authorizedOfficerName" className={labelClasses}>اسم وتوقيع الموظف المختص *</label><input type="text" id="authorizedOfficerName" value={formData.authorizedOfficerName} onChange={e => setFormData(f => ({...f, authorizedOfficerName: e.target.value}))} required className={inputClasses} /></div>
                        </div>
                    </fieldset>

                    <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">{editing ? 'حفظ التغييرات' : 'حفظ'}</button>
                    </div>
                </form>
            </Modal>
            
            {viewing && (
                <RejectionNoticePrint
                    notice={viewing}
                    onClose={() => setViewing(null)}
                />
            )}
        </>
    );
}

export default CorrespondenceManager;