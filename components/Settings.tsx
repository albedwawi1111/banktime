import React, { useState } from 'react';
import type { AppSettings, Vehicle, Announcement } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon } from './icons';

interface SettingsProps {
    settings: AppSettings;
    updateSettings: (settings: AppSettings) => void;
    announcements: Announcement[];
    addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
    updateAnnouncement: (announcement: Partial<Announcement> & { id: string }) => void;
    deleteAnnouncement: (id: string) => void;
}

const ListItemManager: React.FC<{
    title: string;
    items: string[];
    updateItems: (newItems: string[]) => void;
}> = ({ title, items, updateItems }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<{ value: string; index: number } | null>(null);
    const [inputValue, setInputValue] = useState('');

    const openModalForAdd = () => {
        setCurrentItem(null);
        setInputValue('');
        setIsModalOpen(true);
    };

    const openModalForEdit = (value: string, index: number) => {
        setCurrentItem({ value, index });
        setInputValue(value);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        let newItems;
        if (currentItem !== null) {
            // Edit
            newItems = [...items];
            newItems[currentItem.index] = inputValue.trim();
        } else {
            // Add
            newItems = [...items, inputValue.trim()];
        }
        updateItems(newItems.sort((a, b) => a.localeCompare(b, 'ar')));
        handleCloseModal();
    };
    
    const handleDelete = (index: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
            const newItems = items.filter((_, i) => i !== index);
            updateItems(newItems);
        }
    };

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg text-sm transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إضافة
                </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.length > 0 ? items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-[var(--bg-tertiary)]/50 p-2 rounded-md">
                        <span className="text-[var(--text-primary)]">{item}</span>
                        <div>
                            <button onClick={() => openModalForEdit(item, index)} className="text-[var(--accent-text)] hover:opacity-80 mx-2 transition-colors" title="تعديل"><PencilIcon /></button>
                            <button onClick={() => handleDelete(index)} className="text-[var(--danger-text)] hover:opacity-80 transition-colors" title="حذف"><TrashIcon /></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-[var(--text-muted)] py-4">لا توجد عناصر.</p>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? `تعديل ${title}` : `إضافة ${title}`}>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="item-value" className={labelClasses}>الاسم</label>
                    <input
                        type="text"
                        id="item-value"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        required
                        className={inputClasses}
                        autoFocus
                    />
                    <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const VehicleListManager: React.FC<{
    title: string;
    vehicles: Vehicle[];
    updateVehicles: (newVehicles: Vehicle[]) => void;
}> = ({ title, vehicles, updateVehicles }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<{ value: Vehicle; index: number } | null>(null);
    const [formData, setFormData] = useState({ type: '', plateNumber: '' });

    const openModalForAdd = () => {
        setCurrentItem(null);
        setFormData({ type: '', plateNumber: '' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (vehicle: Vehicle, index: number) => {
        setCurrentItem({ value: vehicle, index });
        setFormData({ type: vehicle.type, plateNumber: vehicle.plateNumber });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedType = formData.type.trim();
        const trimmedPlate = formData.plateNumber.trim();
        if (!trimmedType || !trimmedPlate) return;

        let newVehicles;
        if (currentItem !== null) {
            newVehicles = [...vehicles];
            newVehicles[currentItem.index] = { ...newVehicles[currentItem.index], type: trimmedType, plateNumber: trimmedPlate };
        } else {
            const newVehicle: Vehicle = {
                id: `veh_${Date.now()}`,
                type: trimmedType,
                plateNumber: trimmedPlate
            };
            newVehicles = [...vehicles, newVehicle];
        }
        updateVehicles(newVehicles.sort((a, b) => a.type.localeCompare(b.type, 'ar')));
        handleCloseModal();
    };

    const handleDelete = (index: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المركبة؟ سيؤدي هذا إلى فك ارتباطها بأي تصاريح حالية.')) {
            const newVehicles = vehicles.filter((_, i) => i !== index);
            updateVehicles(newVehicles);
        }
    };

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg text-sm transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إضافة
                </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {vehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="flex justify-between items-center bg-[var(--bg-tertiary)]/50 p-2 rounded-md">
                        <div>
                            <span className="text-[var(--text-primary)] font-semibold">{vehicle.type}</span>
                            <span className="text-[var(--text-muted)] text-sm mr-2">({vehicle.plateNumber})</span>
                        </div>
                        <div>
                            <button onClick={() => openModalForEdit(vehicle, index)} className="text-[var(--accent-text)] hover:opacity-80 mx-2 transition-colors" title="تعديل"><PencilIcon /></button>
                            <button onClick={() => handleDelete(index)} className="text-[var(--danger-text)] hover:opacity-80 transition-colors" title="حذف"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
                 {vehicles.length === 0 && <p className="text-center text-[var(--text-muted)] py-4">لا توجد مركبات.</p>}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? 'تعديل مركبة' : 'إضافة مركبة جديدة'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="vehicle-type" className={labelClasses}>نوع المركبة</label>
                        <input type="text" id="vehicle-type" value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value}))} required className={inputClasses} autoFocus />
                    </div>
                     <div>
                        <label htmlFor="vehicle-plate" className={labelClasses}>رقم اللوحة</label>
                        <input type="text" id="vehicle-plate" value={formData.plateNumber} onChange={(e) => setFormData(p => ({...p, plateNumber: e.target.value}))} required className={inputClasses} />
                    </div>
                    <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const AnnouncementManager: React.FC<{
    announcements: Announcement[];
    addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
    updateAnnouncement: (announcement: Partial<Announcement> & { id: string }) => void;
    deleteAnnouncement: (id: string) => void;
}> = ({ announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState({ message: '', type: 'info' as Announcement['type'] });

    const openModalForAdd = () => {
        setCurrentItem(null);
        setFormData({ message: '', type: 'info' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (announcement: Announcement) => {
        setCurrentItem(announcement);
        setFormData({ message: announcement.message, type: announcement.type });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.message.trim()) return;

        if (currentItem) {
            updateAnnouncement({
                id: currentItem.id,
                message: formData.message,
                type: formData.type,
            });
        } else {
            addAnnouncement({
                message: formData.message,
                type: formData.type,
                isActive: false, // Always add as inactive first
            });
        }
        handleCloseModal();
    };
    
    const handleToggleActive = (announcement: Announcement) => {
        updateAnnouncement({ id: announcement.id, isActive: !announcement.isActive });
    };

    const sortedAnnouncements = [...announcements].sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
    
    const typeStyles: Record<Announcement['type'], string> = {
        info: 'bg-blue-500/20 text-blue-400',
        warning: 'bg-yellow-500/20 text-yellow-400',
        danger: 'bg-red-500/20 text-red-500',
    };

    return (
        <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">إدارة شريط الإعلانات المتحرك</h3>
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-3 rounded-lg text-sm">
                    <PlusIcon />
                    إضافة إعلان
                </button>
            </div>
             <div className="overflow-x-auto max-h-64">
                <table className="min-w-full text-right text-sm">
                    <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                        <tr>
                            <th className="py-2 px-4 font-semibold">الرسالة</th>
                            <th className="py-2 px-4 font-semibold">النوع</th>
                            <th className="py-2 px-4 font-semibold">الحالة (تفعيل/إلغاء)</th>
                            <th className="py-2 px-4 font-semibold">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {sortedAnnouncements.map(item => (
                            <tr key={item.id}>
                                <td className="py-2 px-4 max-w-md truncate" title={item.message}>{item.message}</td>
                                <td className="py-2 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeStyles[item.type]}`}>{item.type}</span></td>
                                <td className="py-2 px-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={item.isActive} onChange={() => handleToggleActive(item)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900 sr-only">{item.isActive ? 'Active' : 'Inactive'}</span>
                                    </label>
                                </td>
                                <td className="py-2 px-4 whitespace-nowrap">
                                    <button onClick={() => openModalForEdit(item)} className="text-[var(--accent-text)] hover:opacity-80 mx-2"><PencilIcon /></button>
                                    <button onClick={() => deleteAnnouncement(item.id)} className="text-[var(--danger-text)] hover:opacity-80"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="ann-message" className={labelClasses}>رسالة الإعلان</label>
                        <textarea id="ann-message" rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="ann-type" className={labelClasses}>نوع الإعلان</label>
                        <select id="ann-type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as Announcement['type']})} required className={inputClasses}>
                            <option value="info">معلومات (أزرق)</option>
                            <option value="warning">تحذير (أصفر)</option>
                            <option value="danger">خطر (أحمر)</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                        <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors">حفظ</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


const Settings: React.FC<SettingsProps> = ({ settings, updateSettings, announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement }) => {
    const [activeTab, setActiveTab] = useState('lists');

    const updateNationalities = (nationalities: string[]) => updateSettings({ ...settings, nationalities });
    const updateJobTitles = (jobTitles: string[]) => updateSettings({ ...settings, jobTitles });
    const updateEducationDegrees = (educationDegrees: string[]) => updateSettings({ ...settings, educationDegrees });
    const updateLeaveTypes = (leaveTypes: string[]) => updateSettings({ ...settings, leaveTypes });
    const updateCorrespondenceRecipients = (correspondenceRecipients: string[]) => updateSettings({ ...settings, correspondenceRecipients });
    const updateVehicles = (vehicles: Vehicle[]) => updateSettings({ ...settings, vehicles });
    const updateDepartments = (departments: string[]) => updateSettings({ ...settings, departments });
    const updatePetrolStations = (petrolStations: string[]) => updateSettings({ ...settings, petrolStations });
    
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
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6">الإعدادات</h2>
            
            <div className="border-b border-[var(--border-color)] mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="القوائم" active={activeTab === 'lists'} onClick={() => setActiveTab('lists')} />
                    <TabButton label="المراسلات" active={activeTab === 'correspondence'} onClick={() => setActiveTab('correspondence')} />
                    <TabButton label="المركبات" active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
                    <TabButton label="الإعلانات" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
                </nav>
            </div>

            {activeTab === 'lists' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ListItemManager title="الجنسيات" items={settings.nationalities} updateItems={updateNationalities} />
                    <ListItemManager title="المسميات الوظيفية" items={settings.jobTitles} updateItems={updateJobTitles} />
                    <ListItemManager title="الأقسام" items={settings.departments || []} updateItems={updateDepartments} />
                    <ListItemManager title="المؤهلات العلمية" items={settings.educationDegrees || []} updateItems={updateEducationDegrees} />
                    <ListItemManager title="أنواع الإجازات" items={settings.leaveTypes || []} updateItems={updateLeaveTypes} />
                </div>
            )}

            {activeTab === 'correspondence' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                     <ListItemManager title="جهات المراسلات" items={settings.correspondenceRecipients || []} updateItems={updateCorrespondenceRecipients} />
                 </div>
            )}

            {activeTab === 'vehicles' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <VehicleListManager title="المركبات" vehicles={settings.vehicles || []} updateVehicles={updateVehicles} />
                    <ListItemManager title="محطات الوقود" items={settings.petrolStations || []} updateItems={updatePetrolStations} />
                 </div>
            )}

            {activeTab === 'announcements' && (
                <AnnouncementManager
                    announcements={announcements}
                    addAnnouncement={addAnnouncement}
                    updateAnnouncement={updateAnnouncement}
                    deleteAnnouncement={deleteAnnouncement}
                />
            )}
        </div>
    );
};

export default Settings;