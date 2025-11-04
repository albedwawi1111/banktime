import React, { useState, useMemo, useRef } from 'react';
import type { VehiclePermit, Employee, AppSettings, Vehicle, FuelExpense } from '../types';
import Modal from './Modal';
import VehiclePermitPrint from './VehiclePermitPrint';
import { PlusIcon, PencilIcon, TrashIcon, PrinterIcon, EllipsisVerticalIcon, ArrowDownTrayIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

declare const html2pdf: any;

interface VehiclePermitManagerProps {
    permits: VehiclePermit[];
    employees: Employee[];
    addPermit: (permit: Partial<Omit<VehiclePermit, 'id' | 'createdAt' | 'destination' | 'permitNumber'>>) => void;
    updatePermit: (permit: VehiclePermit) => void;
    deletePermit: (id: string) => void;
    currentUser: Employee | null;
    settings: AppSettings;
    fuelExpenses: FuelExpense[];
    addFuelExpense: (expense: Omit<FuelExpense, 'id'>) => Promise<any>;
    updateFuelExpense: (expense: Partial<FuelExpense> & {id: string}) => Promise<void>;
    deleteFuelExpense: (id: string) => Promise<void>;
}

const getInitialFormData = (employees: Employee[], vehicles: Vehicle[]) => ({
    employeeName: employees.length > 0 ? employees[0].name : '',
    vehicleId: vehicles.length > 0 ? vehicles[0].id : '',
    purpose: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString('en-CA', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    endDate: '',
    endTime: '',
    odometerOut: 0,
    odometerIn: '',
});

export const VehiclePermitManager: React.FC<VehiclePermitManagerProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'permits' | 'fuel'>('permits');

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
             <div className="border-b border-[var(--border-color)] mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="تصاريح المركبات" active={activeTab === 'permits'} onClick={() => setActiveTab('permits')} />
                    <TabButton label="مصروفات واستهلاك الوقود" active={activeTab === 'fuel'} onClick={() => setActiveTab('fuel')} />
                </nav>
            </div>
            {activeTab === 'permits' ? <PermitsView {...props} /> : <FuelView {...props} />}
        </div>
    );
};

const PermitsView: React.FC<VehiclePermitManagerProps> = ({ permits, employees, addPermit, updatePermit, deletePermit, currentUser, settings }) => {
    const vehicles = useMemo(() => settings.vehicles || [], [settings]);
    const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPermit, setCurrentPermit] = useState<VehiclePermit | null>(null);
    const [formData, setFormData] = useState(getInitialFormData(employees, vehicles));
    const [permitToPrint, setPermitToPrint] = useState<VehiclePermit | null>(null);
    const [actionsMenu, setActionsMenu] = useState<{ [key: string]: boolean }>({});

    const sortedPermits = useMemo(() => {
        return [...permits].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    }, [permits]);

    const openModalForAdd = () => {
        setCurrentPermit(null);
        const initialData = getInitialFormData(employees, vehicles);
        
        if(initialData.vehicleId) {
            const lastPermitForVehicle = permits
                .filter(p => p.vehicleId === initialData.vehicleId && p.odometerIn != null)
                .sort((a, b) => {
                    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                    return dateB - dateA;
                })[0];
            
            if (lastPermitForVehicle && lastPermitForVehicle.odometerIn) {
                initialData.odometerOut = lastPermitForVehicle.odometerIn;
            }
        }
        
        setFormData(initialData);
        setIsModalOpen(true);
    };

    const openModalForEdit = (permit: VehiclePermit) => {
        setCurrentPermit(permit);
        
        const startDate = new Date(permit.startDate);
        const endDate = permit.endDate ? new Date(permit.endDate) : null;

        setFormData({
            employeeName: permit.employeeName,
            vehicleId: permit.vehicleId,
            purpose: permit.purpose,
            startDate: startDate.toISOString().split('T')[0],
            startTime: startDate.toLocaleTimeString('en-CA', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            endDate: endDate ? endDate.toISOString().split('T')[0] : '',
            endTime: endDate ? endDate.toLocaleTimeString('en-CA', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
            odometerOut: permit.odometerOut,
            odometerIn: permit.odometerIn != null ? String(permit.odometerIn) : '',
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'vehicleId' && !currentPermit) {
             const lastPermitForVehicle = permits
                .filter(p => p.vehicleId === value && p.odometerIn != null)
                .sort((a, b) => {
                    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                    return dateB - dateA;
                })[0];
            
            const lastOdometerIn = lastPermitForVehicle?.odometerIn ?? 0;
            setFormData(prev => ({ ...prev, odometerOut: lastOdometerIn, vehicleId: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const permitData: Partial<VehiclePermit> = {
            employeeName: formData.employeeName,
            vehicleId: formData.vehicleId,
            purpose: formData.purpose,
            startDate: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
            odometerOut: Number(formData.odometerOut),
        };

        if (formData.endDate && formData.endTime) {
            permitData.endDate = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
        }
        if (formData.odometerIn) {
            permitData.odometerIn = Number(formData.odometerIn);
        }

        if (currentPermit) {
            updatePermit({ 
                ...(permitData as Omit<VehiclePermit, 'id' | 'createdAt' | 'destination' | 'permitNumber'>),
                id: currentPermit.id, 
                createdAt: currentPermit.createdAt, 
                permitNumber: currentPermit.permitNumber,
                destination: currentPermit.destination,
            });
        } else {
            addPermit(permitData);
        }
        handleCloseModal();
    };

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    
    const toggleActionsMenu = (permitId: string) => {
        setActionsMenu(prev => ({ ...Object.keys(prev).reduce((acc, key) => ({...acc, [key]: false}), {}), [permitId]: !prev[permitId] }));
    };


    const inputClasses = "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">تصاريح المركبات</h2>
                <button onClick={openModalForAdd} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                    <PlusIcon />
                    إضافة تصريح جديد
                </button>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">رقم التصريح</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">اسم الموظف</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">المركبة</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">عداد الخروج</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">عداد العودة</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">المسافة (كم)</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">من</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">إلى / الحالة</th>
                                <th className="py-3 px-6 text-sm font-semibold text-[var(--text-secondary)]">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {sortedPermits.map(permit => {
                                const vehicle = vehicleMap.get(permit.vehicleId);
                                const distance = permit.odometerIn != null && permit.odometerIn > permit.odometerOut
                                    ? permit.odometerIn - permit.odometerOut
                                    : null;
                                return (
                                <tr key={permit.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <td className="py-4 px-6 font-mono">{permit.permitNumber}</td>
                                    <td className="py-4 px-6">{permit.employeeName}</td>
                                    <td className="py-4 px-6">{vehicle ? `${vehicle.type} (${vehicle.plateNumber})` : 'غير محدد'}</td>
                                    <td className="py-4 px-6">{permit.odometerOut}</td>
                                    <td className="py-4 px-6">{permit.odometerIn ?? '-'}</td>
                                    <td className="py-4 px-6 font-semibold">{distance}</td>
                                    <td className="py-4 px-6 text-xs">{formatDateTime(permit.startDate)}</td>
                                    <td className="py-4 px-6 text-xs">
                                        {permit.endDate ? formatDateTime(permit.endDate) : 
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[var(--warning-bg)] text-[var(--warning-text)]">قيد الاستخدام</span>
                                        }
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="relative">
                                            <button onClick={() => toggleActionsMenu(permit.id)} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><EllipsisVerticalIcon /></button>
                                            {actionsMenu[permit.id] && (
                                                <div className="absolute left-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md shadow-lg z-10">
                                                    <button onClick={() => { openModalForEdit(permit); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]">تعديل التصريح</button>
                                                    <button onClick={() => { setPermitToPrint(permit); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]">طباعة</button>
                                                    <button onClick={() => { deletePermit(permit.id); setActionsMenu({}); }} className="block w-full text-right px-4 py-2 text-sm text-[var(--danger-text)] hover:bg-[var(--danger-bg)]">حذف</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentPermit ? "تعديل تصريح" : "تصريح جديد"} maxWidth="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="employeeName" className={labelClasses}>اسم الموظف</label>
                            <select id="employeeName" name="employeeName" value={formData.employeeName} onChange={handleChange} required className={inputClasses}>
                                {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="vehicleId" className={labelClasses}>المركبة</label>
                            <select id="vehicleId" name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className={inputClasses}>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.type} ({v.plateNumber})</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="purpose" className={labelClasses}>الغرض من الاستخدام</label>
                        <textarea id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} required rows={3} className={inputClasses}></textarea>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className={labelClasses}>تاريخ ووقت الخروج</label>
                             <div className="flex gap-2">
                                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required className={inputClasses} />
                                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className={inputClasses} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="odometerOut" className={labelClasses}>رقم عداد السيارة عند الخروج</label>
                            <input type="number" id="odometerOut" name="odometerOut" value={formData.odometerOut} onChange={handleChange} required className={inputClasses} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                         <div>
                            <label htmlFor="endDate" className={labelClasses}>تاريخ ووقت العودة (اختياري)</label>
                            <div className="flex gap-2">
                                <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClasses} />
                                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={inputClasses} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="odometerIn" className={labelClasses}>رقم عداد السيارة عند العودة (اختياري)</label>
                            <input type="number" id="odometerIn" name="odometerIn" value={formData.odometerIn} onChange={handleChange} className={inputClasses} />
                            {formData.odometerIn && Number(formData.odometerIn) > formData.odometerOut && (
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    المسافة المقطوعة: {Number(formData.odometerIn) - formData.odometerOut} كم
                                </p>
                            )}
                        </div>
                    </div>
                     <div className="flex justify-end pt-6">
                        <button type="button" onClick={handleCloseModal} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2">إلغاء</button>
                        <button type="submit" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">{currentPermit ? 'حفظ التغييرات' : 'حفظ'}</button>
                    </div>
                </form>
            </Modal>
            
            {permitToPrint && (
                <VehiclePermitPrint 
                    permit={permitToPrint}
                    vehicles={vehicles}
                    onClose={() => setPermitToPrint(null)}
                />
            )}
        </div>
    );
};

const FuelView: React.FC<VehiclePermitManagerProps> = ({ permits, settings, fuelExpenses, addFuelExpense, updateFuelExpense, deleteFuelExpense }) => {
    const vehicles = useMemo(() => settings.vehicles || [], [settings]);
    const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const permitMap = useMemo(() => new Map(permits.map(p => [p.id, p])), [permits]);
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const reportPrintRef = useRef<HTMLDivElement>(null);

    const EMPTY_FUEL_STATE = { permitId: '', date: new Date().toISOString().slice(0, 10), liters: '', cost: '', odometerReading: '', stationName: '' };
    const [formData, setFormData] = useState(EMPTY_FUEL_STATE);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleEditClick = (expense: FuelExpense) => {
        setEditingId(expense.id);
        setFormData({
            permitId: expense.permitId,
            date: expense.date,
            liters: String(expense.liters),
            cost: String(expense.cost),
            odometerReading: String(expense.odometerReading),
            stationName: expense.stationName
        });
    };
    
    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData(EMPTY_FUEL_STATE);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const permit = permitMap.get(formData.permitId);
        if (!permit) return;

        const data: Omit<FuelExpense, 'id'> = {
            permitId: formData.permitId,
            vehicleId: permit.vehicleId,
            date: formData.date,
            liters: parseFloat(formData.liters),
            cost: parseFloat(formData.cost),
            odometerReading: parseInt(formData.odometerReading, 10),
            stationName: formData.stationName,
        };

        if (editingId) {
            await updateFuelExpense({ id: editingId, ...data });
        } else {
            await addFuelExpense(data);
        }
        handleCancelEdit();
    };

    const monthlyFuelExpenses = useMemo(() => [...fuelExpenses]
        .filter(exp => exp.date.startsWith(selectedMonth))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [fuelExpenses, selectedMonth]);

    const monthlyReportData = useMemo(() => {
        const dataByVehicle = vehicles.map(vehicle => {
            const allVehicleExpenses = fuelExpenses
                .filter(e => e.vehicleId === vehicle.id)
                .sort((a,b) => a.odometerReading - b.odometerReading);

            let monthlyDistance = 0;
            let monthlyLiters = 0;
            let monthlyCost = 0;

            for (let i = 1; i < allVehicleExpenses.length; i++) {
                const current = allVehicleExpenses[i];
                const prev = allVehicleExpenses[i - 1];
                
                if (current.date.startsWith(selectedMonth)) {
                    const distanceSegment = current.odometerReading - prev.odometerReading;
                    if (distanceSegment > 0) {
                        monthlyDistance += distanceSegment;
                        monthlyLiters += current.liters;
                        monthlyCost += current.cost;
                    }
                }
            }
            const consumption = monthlyLiters > 0 ? (monthlyDistance / monthlyLiters) : 0;
            return { vehicleId: vehicle.id, vehicleName: `${vehicle.type} (${vehicle.plateNumber})`, totalDistance: monthlyDistance, totalLiters: monthlyLiters, totalCost: monthlyCost, consumption };
        }).filter(d => d.totalDistance > 0 || d.totalLiters > 0);
        return dataByVehicle;
    }, [fuelExpenses, vehicles, selectedMonth]);

    const monthlyTotalStats = useMemo(() => monthlyReportData.reduce((acc, data) => ({ distance: acc.distance + data.totalDistance, liters: acc.liters + data.totalLiters, cost: acc.cost + data.totalCost }), { distance: 0, liters: 0, cost: 0 }), [monthlyReportData]);
    
    const handleExportPDF = () => {
        const element = reportPrintRef.current;
        if (element) {
            html2pdf().from(element).set({
                margin: 0.5,
                filename: `FuelReport_${selectedMonth}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
            }).save();
        }
    };
    
    const inputClasses = "w-full bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]";
    const petrolStationOptions = settings.petrolStations || [];

    return (
        <div className="space-y-6">
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">{editingId ? 'تعديل مصروف وقود' : 'إضافة مصروف وقود جديد'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="text-sm">التصريح</label>
                        <select name="permitId" value={formData.permitId} onChange={handleFormChange} required className={inputClasses}>
                            <option value="">-- اختر تصريح --</option>
                            {permits.map(p => {
                                const v = vehicleMap.get(p.vehicleId);
                                return <option key={p.id} value={p.id}>{`${p.permitNumber} - ${p.employeeName} (${v?.plateNumber})`}</option>
                            })}
                        </select>
                    </div>
                    <div><label className="text-sm">التاريخ</label><input type="date" name="date" value={formData.date} onChange={handleFormChange} required className={inputClasses} /></div>
                    <div><label className="text-sm">لتر</label><input type="number" step="0.01" name="liters" value={formData.liters} onChange={handleFormChange} required className={inputClasses} /></div>
                    <div><label className="text-sm">التكلفة (ر.ع.)</label><input type="number" step="0.001" name="cost" value={formData.cost} onChange={handleFormChange} required className={inputClasses} /></div>
                    <div><label className="text-sm">قراءة العداد</label><input type="number" name="odometerReading" value={formData.odometerReading} onChange={handleFormChange} required className={inputClasses} /></div>
                    <div className="lg:col-span-3">
                        <label className="text-sm">اسم المحطة</label>
                        <select name="stationName" value={formData.stationName} onChange={handleFormChange} required className={inputClasses}>
                            <option value="">-- اختر محطة --</option>
                            {petrolStationOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-3 flex gap-2">
                        <button type="submit" className="bg-green-600 text-white p-2 rounded-md w-full">{editingId ? 'تحديث' : 'إضافة'}</button>
                        {editingId && <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white p-2 rounded-md w-full">إلغاء</button>}
                    </div>
                </form>
            </div>

             <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <h3 className="text-xl font-bold p-4">سجل مصروفات الوقود</h3>
                <div className="overflow-x-auto">
                     <table className="w-full text-right text-sm">
                        <thead className="bg-[var(--bg-tertiary)]"><tr><th className="p-2">التاريخ</th><th className="p-2">المركبة</th><th className="p-2">الموظف</th><th className="p-2">لتر</th><th className="p-2">التكلفة</th><th className="p-2">العداد</th><th className="p-2">المحطة</th><th className="p-2">إجراءات</th></tr></thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {monthlyFuelExpenses.map(exp => {
                                const permit = permitMap.get(exp.permitId);
                                const vehicle = vehicleMap.get(exp.vehicleId);
                                return (
                                <tr key={exp.id} className="hover:bg-[var(--bg-tertiary)]/30">
                                    <td className="p-2">{exp.date}</td>
                                    <td className="p-2">{vehicle ? `${vehicle.type} (${vehicle.plateNumber})` : '-'}</td>
                                    <td className="p-2">{permit?.employeeName || '-'}</td>
                                    <td className="p-2">{exp.liters.toFixed(2)}</td>
                                    <td className="p-2">{exp.cost.toFixed(3)}</td>
                                    <td className="p-2">{exp.odometerReading}</td>
                                    <td className="p-2">{exp.stationName}</td>
                                    <td className="p-2">
                                        <button onClick={() => handleEditClick(exp)} className="mx-1 text-[var(--accent-text)]"><PencilIcon /></button>
                                        <button onClick={() => deleteFuelExpense(exp.id)} className="mx-1 text-[var(--danger-text)]"><TrashIcon /></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xl font-bold">ملخص استهلاك شهر {new Date(selectedMonth).toLocaleDateString('ar-EG', {month: 'long', year: 'numeric'})}</h3>
                    <div className="flex items-center gap-2">
                         <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-[var(--bg-tertiary)] border-none rounded-md p-2"/>
                         <button onClick={handleExportPDF} className="p-2 bg-[var(--accent-color)] text-white rounded-md"><ArrowDownTrayIcon /></button>
                    </div>
                </div>
                <div ref={reportPrintRef} className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[var(--bg-primary)] p-4 rounded-xl shadow"><p className="text-sm text-[var(--text-secondary)]">إجمالي المسافة</p><p className="text-2xl font-bold">{monthlyTotalStats.distance.toFixed(0)} كم</p></div>
                        <div className="bg-[var(--bg-primary)] p-4 rounded-xl shadow"><p className="text-sm text-[var(--text-secondary)]">إجمالي الوقود</p><p className="text-2xl font-bold">{monthlyTotalStats.liters.toFixed(2)} لتر</p></div>
                        <div className="bg-[var(--bg-primary)] p-4 rounded-xl shadow"><p className="text-sm text-[var(--text-secondary)]">إجمالي التكلفة</p><p className="text-2xl font-bold">{monthlyTotalStats.cost.toFixed(2)} ر.ع.</p></div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">كفاءة استهلاك الوقود (كم/لتر) - شهري</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyReportData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="vehicleName" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                                <Legend />
                                <Bar dataKey="consumption" name="كم/لتر" fill="var(--accent-color)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};