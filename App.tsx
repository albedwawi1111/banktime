import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Employee, TimeLog, Shift, LeaveRequest, PublicHoliday, RamadanDates, Theme, AppSettings, BirthdayNotification, ExpiryNotification, PasswordResetRequest, Correspondence, UserSession, AuditLog, UserRequest, UserRequestNotification, TrainingRecord, TrainingNotification, VehiclePermit, Survey, SurveyQuestion, SurveyResponse, Announcement, ToastMessage, CustomsCorrespondence, RejectionNotice, ScheduleNotification, ScheduleNotificationItem, TopBarNotifications, FuelExpense } from './types';
import { View } from './types';
import { EmployeeManager } from './components/EmployeeManager';
import { ShiftScheduler } from './components/ShiftScheduler';
import { OvertimeReport } from './components/OvertimeReport';
import AttendanceSheet from './components/AttendanceSheet';
import LeaveManager from './components/LeaveManager';
import Dashboard from './components/Dashboard';
import TopBar from './components/TopBar';
import Settings from './components/Settings';
import MaktabiSystem from './components/MaktabiSystem';
import EmployeeExporter from './components/EmployeeExporter';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import MyProfile from './components/MyProfile';
import CorrespondenceManager from './components/CorrespondenceManager';
import UserManagement from './components/UserManagement';
import AuditLogViewer from './components/AuditLogViewer';
import UserRequestManager from './components/UserRequestManager';
import TrainingManager from './components/TrainingManager';
// FIX: Changed to a named import as the module does not have a default export.
import { VehiclePermitManager } from './components/VehiclePermitManager';
import HelpGuide from './components/HelpGuide';
import AboutPage from './components/AboutPage';
import SurveyManager from './components/SurveyManager';
import AdminLoginChoiceModal from './components/AdminLoginChoiceModal';
import AnnouncementBar from './components/AnnouncementBar';
import ToastContainer from './components/ToastContainer';
import ChatBot from './components/ChatBot';
import { UserGroupIcon, CalendarDaysIcon, ChartBarIcon, ClipboardDocumentListIcon, PaperAirplaneIcon, HomeIcon, Cog6ToothIcon, ComputerDesktopIcon, SparklesIcon, DocumentArrowDownIcon, UserCircleIcon, DocumentTextIcon, UsersIcon, ChatBubbleLeftRightIcon, AdjustmentsHorizontalIcon, AcademicCapIcon, QFSIcon, CarIcon, QuestionMarkCircleIcon, InformationCircleIcon, ClipboardDocumentCheckIcon, TableCellsIcon } from './components/icons';
import { db } from './firebase';

declare const firebase: any;

const FirebaseConfigError: React.FC = () => (
    <div className="min-h-screen bg-red-900 text-white flex flex-col justify-center items-center p-8 text-center" dir="rtl">
        <div className="bg-red-800/50 p-8 rounded-2xl border-2 border-red-600 max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">خطأ في الاتصال بقاعدة البيانات</h1>
            <p className="text-lg mb-2">
                فشل تهيئة Firebase. هذا يعني عادةً أن إعدادات المشروع غير صحيحة.
            </p>
            <p className="max-w-2xl mb-6 mx-auto">
                <strong>للمطور:</strong> يرجى فتح ملف <code>firebase.ts</code> واستبدال كائن <code>firebaseConfig</code> بالإعدادات الصحيحة من مشروعك على Firebase. يبدو أنك تستخدم الإعدادات الافتراضية أو غير الصالحة.
            </p>
            <div className="bg-gray-900 p-4 rounded-lg text-left text-sm whitespace-pre-wrap font-mono" dir="ltr">
                <code>
                    <span className="text-gray-400">{`// In firebase.ts`}</span><br />
                    <span className="text-purple-400">{`const`}</span> <span className="text-yellow-300">{`firebaseConfig`}</span> {`= {`}
                    <br />
                    <span>{`  apiKey: `}</span><span className="text-green-300">{`"YOUR_API_KEY"`}</span>,
                    <br />
                    <span>{`  authDomain: `}</span><span className="text-green-300">{`"YOUR_PROJECT_ID.firebaseapp.com"`}</span>,
                    <br />
                    <span>{`  projectId: `}</span><span className="text-green-300">{`"YOUR_PROJECT_ID"`}</span>,
                    <br />
                    <span>{`  // ... and so on`}</span>
                    <br />
                    {`};`}
                </code>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
  // All state hooks grouped at the top
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [adminUserForChoice, setAdminUserForChoice] = useState<Employee | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [navigationPayload, setNavigationPayload] = useState<any>(null);
  
  const [theme, setTheme] = useState<Theme>('light');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [ramadanDates, setRamadanDates] = useState<RamadanDates>({});
  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>([]);
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [customsCorrespondences, setCustomsCorrespondences] = useState<CustomsCorrespondence[]>([]);
  const [rejectionNotices, setRejectionNotices] = useState<RejectionNotice[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [vehiclePermits, setVehiclePermits] = useState<VehiclePermit[]>([]);
  const [fuelExpenses, setFuelExpenses] = useState<FuelExpense[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [scheduleNotifications, setScheduleNotifications] = useState<ScheduleNotification[]>([]);
  const [previousTrainingRecords, setPreviousTrainingRecords] = useState<TrainingRecord[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  const defaultSettings: AppSettings = { 
      nationalities: ['عماني'], 
      jobTitles: ['فني سلامة غذاء', 'طبيب بيطري'], 
      educationDegrees: ['ثانوية عامة', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه'],
      leaveTypes: ['إجازة سنوية', 'إجازة مرضية', 'إجازة غير مدفوعة'],
      correspondenceRecipients: [],
      vehicles: [],
      // FIX: Add default departments to align with the updated AppSettings type.
      departments: ['قسم الحجر وسلامة الغذاء بميناء صحار'],
      petrolStations: ['شل', 'نفط عمان', 'المها'],
  };
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const handleNavigate = useCallback((view: View, payload: any = null) => {
    setCurrentView(view);
    setNavigationPayload(payload);
  }, []);

  // All effect hooks grouped after state
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    setTheme(savedTheme || 'light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    if (!db) {
      console.log("Firestore not initialized, skipping data fetch.");
      setIsLoading(false);
      return;
    }

    const collections: { name: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
      { name: 'employees', setter: setEmployees },
      { name: 'shifts', setter: setShifts },
      { name: 'timeLogs', setter: setTimeLogs },
      { name: 'leaveRequests', setter: setLeaveRequests },
      { name: 'publicHolidays', setter: setPublicHolidays },
      { name: 'passwordResets', setter: setPasswordResets },
      { name: 'correspondences', setter: setCorrespondences },
      { name: 'customsCorrespondences', setter: setCustomsCorrespondences },
      { name: 'rejectionNotices', setter: setRejectionNotices },
      { name: 'userSessions', setter: setUserSessions },
      { name: 'auditLogs', setter: setAuditLogs },
      { name: 'userRequests', setter: setUserRequests },
      { name: 'trainingRecords', setter: setTrainingRecords },
      { name: 'vehiclePermits', setter: setVehiclePermits },
      { name: 'fuelExpenses', setter: setFuelExpenses },
      { name: 'surveys', setter: setSurveys },
      { name: 'surveyQuestions', setter: setSurveyQuestions },
      { name: 'surveyResponses', setter: setSurveyResponses },
      { name: 'announcements', setter: setAnnouncements },
      { name: 'scheduleNotifications', setter: setScheduleNotifications },
    ];
    
    const unsubscribers = collections.map(({ name, setter }) => 
      db.collection(name).onSnapshot((snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        setter(data);
      }, (error: Error) => console.error(`Error fetching ${name}:`, error))
    );

    const configUnsubscribers = [
      db.collection('configuration').doc('appSettings').onSnapshot((doc: any) => {
        if (doc.exists) {
          setSettings({ ...defaultSettings, ...doc.data() });
        }
      }),
      db.collection('configuration').doc('ramadanDates').onSnapshot((doc: any) => {
        if (doc.exists) {
          setRamadanDates(doc.data());
        }
      })
    ];

    unsubscribers.push(...configUnsubscribers);

    setIsLoading(false);

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // Session management
  useEffect(() => {
    if (employees.length > 0) {
      const userId = sessionStorage.getItem('userId');
      const sessionRole = sessionStorage.getItem('sessionRole') as Employee['role'] | null;

      if (userId) {
        const userFromDb = employees.find(e => e.id === userId);
        if (userFromDb) {
          // If a session role is stored, override the user's role from the database.
          // This is crucial for the admin 'login as employee' feature.
          const userForSession = sessionRole ? { ...userFromDb, role: sessionRole } : userFromDb;
          
          setCurrentUser(userForSession);
          setIsAuthenticated(true);
        }
      }
    }
  }, [employees]);

  // Presence management (heartbeat)
  useEffect(() => {
      // Fix: Use `number` for interval ID in browser environments instead of `NodeJS.Timeout`.
      let heartbeatInterval: number | undefined;

      if (isAuthenticated && currentUser) {
          // Set online status immediately
          db.collection('userSessions').doc(currentUser.id).set({
              status: 'online',
              lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
              employeeName: currentUser.name,
          }, { merge: true });

          // Start heartbeat to update lastSeen timestamp every minute
          heartbeatInterval = window.setInterval(() => {
              db.collection('userSessions').doc(currentUser.id).update({
                  lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
              }).catch((err: Error) => console.error("Heartbeat failed:", err));
          }, 60 * 1000); // 1 minute
      }

      return () => {
          if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
          }
      };
  }, [isAuthenticated, currentUser]);
  
  useEffect(() => {
    setPreviousTrainingRecords(trainingRecords);
  }, [trainingRecords]);

  // Automatically update employee status based on active leave requests
  useEffect(() => {
    // Don't run this logic until all data is loaded
    if (isLoading || employees.length === 0) {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const updates = new Map<string, 'Active' | 'On Leave'>();

    employees.forEach(employee => {
        const isOnActiveLeave = leaveRequests.some(lr =>
            lr.employeeId === employee.id &&
            lr.status === 'Approved' &&
            lr.startDate <= todayStr &&
            lr.endDate >= todayStr
        );

        // If employee is on an active leave but their status is not 'On Leave', schedule an update.
        if (isOnActiveLeave && employee.status !== 'On Leave') {
            updates.set(employee.id, 'On Leave');
        } 
        // If employee is NOT on an active leave but their status IS 'On Leave', schedule an update to revert it.
        else if (!isOnActiveLeave && employee.status === 'On Leave') {
            updates.set(employee.id, 'Active');
        }
    });

    // If there are any updates to perform, commit them in a single batch.
    if (updates.size > 0) {
        const batch = db.batch();
        updates.forEach((status, employeeId) => {
            const docRef = db.collection('employees').doc(employeeId);
            batch.update(docRef, { status: status });
        });

        batch.commit().catch(err => {
            console.error("Error batch updating employee statuses based on leave:", err);
        });
    }
  }, [employees, leaveRequests, isLoading]); // This effect re-runs whenever employees or leave requests change

  // Global Keyboard Shortcuts for Navigation
  useEffect(() => {
    if (!currentUser) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (isModifierPressed) {
        let view: View | null = null;
        const key = event.key;

        if (currentUser.role === 'Employee') {
            if (key === '1') view = View.DASHBOARD;
            if (key === '2') view = View.PROFILE;
            if (key === '3') view = View.ATTENDANCE;
            if (key === '4') view = View.SCHEDULER;
            if (key === '5') view = View.LEAVES;
        } else { // Admin or Head of Dept
            if (key === '1') view = View.DASHBOARD;
            if (key === '2') view = View.EMPLOYEES;
            if (key === '3') view = View.SCHEDULER;
            if (key === '4') view = View.ATTENDANCE;
            if (key === '5') view = View.LEAVES;
            if (key === '6') view = View.REPORT;
        }
        
        if (view) {
          event.preventDefault();
          handleNavigate(view);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser, handleNavigate]);

  // All memoization hooks grouped after effects
  const notifications: TopBarNotifications = useMemo(() => {
    const birthdays: BirthdayNotification[] = [];
    const expirations: ExpiryNotification[] = [];
    const trainingNotifications: TrainingNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntil = (dateStr: string): number => {
      if (!dateStr) return Infinity;
      try {
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (e) {
        return Infinity;
      }
    };

    employees.forEach(employee => {
      if (employee.dateOfBirth) {
        const birthDate = new Date(employee.dateOfBirth);
        let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysToBirthday = daysUntil(nextBirthday.toISOString().split('T')[0]);
        if (daysToBirthday >= 0 && daysToBirthday <= 7) {
            birthdays.push({
                employeeId: employee.id,
                employeeName: employee.name,
                daysUntil: daysToBirthday,
            });
        }
      }

      if (employee.documents) {
        employee.documents.forEach(doc => {
          if (doc.expiryDate) {
            const daysToExpiry = daysUntil(doc.expiryDate);
            if (daysToExpiry >= 0 && daysToExpiry <= 30) {
              expirations.push({
                employeeId: employee.id,
                employeeName: employee.name,
                documentName: doc.name,
                daysUntil: daysToExpiry,
                expiryDate: doc.expiryDate,
              });
            }
          }
        });
      }
    });

    const previousRecordsMap = new Map<string, TrainingRecord>(previousTrainingRecords.map((r: TrainingRecord) => [r.id, r]));
    trainingRecords.forEach((record: TrainingRecord) => {
        if ((record.status === 'Planned' || record.status === 'In Progress') && currentUser) {
            const previousRecord = previousRecordsMap.get(record.id) as TrainingRecord | undefined;
            const userWasInPrevious = previousRecord?.employeeIds.includes(currentUser.id);

            const userIsInCurrent = record.employeeIds.includes(currentUser.id);

            if (userIsInCurrent && !userWasInPrevious) {
                trainingNotifications.push({
                    recordId: record.id,
                    courseName: record.courseName,
                });
            }
        }
    });

    const resets: PasswordResetRequest[] = currentUser?.role === 'Admin' ? passwordResets : [];

    const userRequestNotifications: UserRequestNotification[] = [];
    if (currentUser?.role === 'Admin') {
        userRequests.forEach(req => {
            if (req.status === 'Pending') {
                userRequestNotifications.push({
                    requestId: req.id,
                    title: req.title,
                    employeeName: req.employeeName,
                });
            }
        });
    }

    const scheduleNotificationsForUser: ScheduleNotificationItem[] = [];
    if (currentUser) {
        const latestNotification = scheduleNotifications
            .filter(n => n.department === currentUser.department && n.employeeIds.includes(currentUser.id))
            .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))[0];

        if (latestNotification) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (latestNotification.createdAt?.toDate() > sevenDaysAgo) {
                scheduleNotificationsForUser.push({
                    id: latestNotification.id,
                    message: latestNotification.message,
                    createdBy: latestNotification.createdBy,
                });
            }
        }
    }

    return { birthdays, expirations, resets, training: trainingNotifications, userRequests: userRequestNotifications, schedule: scheduleNotificationsForUser };
  }, [employees, currentUser, passwordResets, trainingRecords, previousTrainingRecords, userRequests, scheduleNotifications]);

  const activeAnnouncements = useMemo(() => {
    return announcements
        .filter(a => a.isActive)
        .sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
  }, [announcements]);

  // Toast handlers
  const addToast = (message: string, type: ToastMessage['type']) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
  };
  
  const dismissToast = (id: number) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
  };


  // Early return for Firebase configuration error. Must be AFTER all hooks.
  if (!db) {
    return <FirebaseConfigError />;
  }

  // All other component logic (functions, handlers, etc.)
  const logActivity = async (action: string, details: string) => {
    if (!currentUser) return;
    try {
        await db.collection('auditLogs').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser.id,
            userName: currentUser.name,
            action,
            details,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
  };

  // --- CRUD Handlers ---
  const addDoc = (collection: string, action: string, detailsBuilder: (data: any) => string) => async (data: any) => {
      const docRef = await db.collection(collection).add(data);
      await logActivity(action, detailsBuilder(data));
      return docRef;
  };
  const updateDoc = (collection: string, action: string, detailsBuilder: (data: any) => string) => async (docData: any) => {
      const { id, ...data } = docData;
      await db.collection(collection).doc(id).update(data);
      await logActivity(action, detailsBuilder(docData));
  };
  const deleteDoc = (collection: string, findItem: (id: string) => any, action: string, detailsBuilder: (item: any) => string) => async (id: string) => {
      const itemToDelete = findItem(id);
      if (itemToDelete) {
          await logActivity(action, detailsBuilder(itemToDelete));
      }
      await db.collection(collection).doc(id).delete();
  };
  const bulkUpdateTimeLogs = async (logsToDelete: string[], logsToAdd: Omit<TimeLog, 'id'>[]) => {
    const batch = db.batch();
    
    logsToDelete.forEach(logId => {
        const docRef = db.collection('timeLogs').doc(logId);
        batch.delete(docRef);
    });
    
    logsToAdd.forEach(log => {
        const docRef = db.collection('timeLogs').doc();
        batch.set(docRef, log);
    });

    await batch.commit();
    await logActivity('تحديث مجمع للدوام', `تطبيق جدول مناوبات جديد مقترح من المساعد الذكي.`);
  };

  const addEmployee = addDoc('employees', 'إنشاء موظف', data => `إضافة الموظف: ${data.name}`);
  const updateEmployee = updateDoc('employees', 'تحديث موظف', data => `تحديث بيانات الموظف: ${data.name}`);
  const deleteEmployee = deleteDoc('employees', id => employees.find(e => e.id === id), 'حذف موظف', item => `حذف الموظف: ${item.name}`);

  const bulkDeleteEmployees = async (ids: string[]) => {
    const batch = db.batch();
    ids.forEach(id => {
        const docRef = db.collection('employees').doc(id);
        batch.delete(docRef);
    });
    await batch.commit();
    await logActivity('حذف مجمع للموظفين', `حذف ${ids.length} موظف.`);
    addToast(`تم حذف ${ids.length} موظف بنجاح.`, 'success');
  };

  const bulkUpdateEmployees = async (ids: string[], data: Partial<Omit<Employee, 'id'>>) => {
      const batch = db.batch();
      ids.forEach(id => {
          const docRef = db.collection('employees').doc(id);
          batch.update(docRef, data);
      });
      await batch.commit();
      await logActivity('تحديث مجمع للموظفين', `تحديث بيانات ${ids.length} موظف.`);
      addToast(`تم تحديث ${ids.length} موظف بنجاح.`, 'success');
  };

  const addShift = addDoc('shifts', 'إنشاء مناوبة', data => `إنشاء مناوبة جديدة: ${data.name}`);
  const updateShift = updateDoc('shifts', 'تحديث مناوبة', data => `تحديث بيانات المناوبة: ${data.name}`);
  const deleteShift = deleteDoc('shifts', id => shifts.find(s => s.id === id), 'حذف مناوبة', item => `حذف المناوبة: ${item.name}`);

  const addTimeLog = addDoc('timeLogs', 'إضافة دوام', data => `إضافة سجل دوام لـ ${employees.find(e => e.id === data.employeeId)?.name} بتاريخ ${data.date}`);
  const updateTimeLog = updateDoc('timeLogs', 'تحديث دوام', data => `تحديث سجل دوام لـ ${employees.find(e => e.id === data.employeeId)?.name} بتاريخ ${data.date}`);
  const deleteTimeLog = deleteDoc('timeLogs', id => timeLogs.find(l => l.id === id), 'حذف دوام', item => `حذف سجل دوام لـ ${employees.find(e => e.id === item.employeeId)?.name} بتاريخ ${item.date}`);

  const addLeaveRequest = addDoc('leaveRequests', 'إضافة طلب إجازة', data => `إضافة طلب ${data.leaveType} لـ ${employees.find(e => e.id === data.employeeId)?.name}`);
  const updateLeaveRequest = updateDoc('leaveRequests', 'تحديث طلب إجازة', data => `تحديث حالة طلب ${data.leaveType} لـ ${employees.find(e => e.id === data.employeeId)?.name} إلى ${data.status}`);
  const deleteLeaveRequest = deleteDoc('leaveRequests', id => leaveRequests.find(r => r.id === id), 'حذف طلب إجازة', item => `حذف طلب ${item.leaveType} لـ ${employees.find(e => e.id === item.employeeId)?.name}`);
  
  const addPublicHoliday = addDoc('publicHolidays', 'إضافة إجازة رسمية', data => `إضافة إجازة رسمية: ${data.name}`);
  const updatePublicHoliday = updateDoc('publicHolidays', 'تحديث إجازة رسمية', data => `تحديث إجازة رسمية: ${data.name}`);
  const deletePublicHoliday = deleteDoc('publicHolidays', id => publicHolidays.find(h => h.id === id), 'حذف إجازة رسمية', item => `حذف إجازة رسمية: ${item.name}`);
  
  const addTrainingRecord = addDoc('trainingRecords', 'إضافة سجل تدريبي', data => `إضافة دورة: ${data.courseName}`);
  const updateTrainingRecord = updateDoc('trainingRecords', 'تحديث سجل تدريبي', data => `تحديث دورة: ${data.courseName}`);
  const deleteTrainingRecord = deleteDoc('trainingRecords', id => trainingRecords.find(t => t.id === id), 'حذف سجل تدريبي', item => `حذف دورة: ${item.courseName}`);

  const addScheduleNotification = async (data: Omit<ScheduleNotification, 'id' | 'createdAt'>) => {
    const docRef = await db.collection('scheduleNotifications').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await logActivity('إرسال إشعار مناوبات', `إرسال إشعار إلى قسم: ${data.department}`);
    addToast('تم إرسال الإشعار بنجاح.', 'success');
    return docRef;
  };

  const addPasswordResetRequest = addDoc('passwordResets', 'طلب إعادة تعيين كلمة مرور', data => `طلب إعادة تعيين كلمة مرور لـ ${data.employeeName}`);
  const deletePasswordResetRequest = deleteDoc('passwordResets', id => passwordResets.find(p => p.id === id), 'معالجة طلب إعادة تعيين', item => `تمت معالجة طلب إعادة تعيين كلمة مرور لـ ${item.employeeName}`);

  const addCorrespondence = async (data: Omit<Correspondence, 'id' | 'createdAt'>) => {
    const docRef = await db.collection('correspondences').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await logActivity('إنشاء مراسلة', `إنشاء مراسلة جديدة إلى ${data.recipient} بعنوان ${data.subject}`);
    return docRef;
  };
  const updateCorrespondence = updateDoc('correspondences', 'تحديث مراسلة', data => `تحديث المراسلة رقم ${data.referenceNumber}`);
  const deleteCorrespondence = deleteDoc('correspondences', id => correspondences.find(c => c.id === id), 'حذف مراسلة', item => `حذف المراسلة رقم ${item.referenceNumber}`);

  const addCustomsCorrespondence = async (data: Omit<CustomsCorrespondence, 'id' | 'createdAt'>) => {
    const docRef = await db.collection('customsCorrespondences').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await logActivity('إنشاء مراسلة جمركية', `إنشاء مراسلة إلى ${data.recipient} بعنوان ${data.subject}`);
    return docRef;
  };
  const updateCustomsCorrespondence = updateDoc('customsCorrespondences', 'تحديث مراسلة جمركية', data => `تحديث المراسلة رقم ${data.referenceNumber}`);
  const deleteCustomsCorrespondence = deleteDoc('customsCorrespondences', id => customsCorrespondences.find(c => c.id === id), 'حذف مراسلة جمركية', item => `حذف المراسلة رقم ${item.referenceNumber}`);

  const addRejectionNotice = async (data: Omit<RejectionNotice, 'id' | 'createdAt'>) => {
      const docRef = await db.collection('rejectionNotices').add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await logActivity('إنشاء إخطار رفض', `إنشاء إخطار رفض للمستورد: ${data.importerName}`);
      return docRef;
  };
  const updateRejectionNotice = updateDoc('rejectionNotices', 'تحديث إخطار رفض', data => `تحديث إخطار رفض للمستورد: ${data.importerName}`);
  const deleteRejectionNotice = deleteDoc('rejectionNotices', id => rejectionNotices.find(n => n.id === id), 'حذف إخطار رفض', item => `حذف إخطار رفض للمستورد: ${item.importerName}`);

  const addUserRequest = async (data: Omit<UserRequest, 'id' | 'employeeName' | 'createdAt' | 'status'>) => {
    const user = employees.find(e => e.id === data.employeeId);
    if (!user) return;
    const requestData = { ...data, employeeName: user.name, status: 'Pending' as const, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    await db.collection('userRequests').add(requestData);
    await logActivity('تقديم مقترح/شكوى', `تقديم مقترح جديد بعنوان: ${data.title}`);
  };
  const updateUserRequest = updateDoc('userRequests', 'تحديث مقترح/شكوى', data => `تحديث حالة المقترح "${data.title}" إلى ${data.status}`);

  const addVehiclePermit = async (data: Partial<Omit<VehiclePermit, 'id' | 'createdAt' | 'destination' | 'permitNumber'>>) => {
    const year = new Date().getFullYear();
    const yearPermits = vehiclePermits.filter(p => 
        p.permitNumber && p.permitNumber.endsWith(`/${year}`)
    );

    let maxNumber = 0;
    yearPermits.forEach(p => {
        const numPart = p.permitNumber.split('/')[0];
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
        }
    });
    
    const nextNumber = maxNumber + 1;
    const permitNumber = `${nextNumber}/${year}`;

    const permitData = { 
        ...data,
        permitNumber,
        destination: 'قسم الحجر وسلامة الغذاء بميناء صحار',
        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
    };
    await db.collection('vehiclePermits').add(permitData);
    await logActivity('إنشاء تصريح مركبة', `إنشاء تصريح رقم ${permitNumber} للموظف: ${data.employeeName}`);
  };
  const updateVehiclePermit = async (docData: any) => {
      const { id, ...data } = docData;
      const permitData = {
          ...data,
          destination: 'قسم الحجر وسلامة الغذاء بميناء صحار'
      };
      await db.collection('vehiclePermits').doc(id).update(permitData);
      await logActivity('تحديث تصريح مركبة', `تحديث تصريح رقم ${docData.permitNumber} للموظف: ${docData.employeeName}`);
  };
  const deleteVehiclePermit = deleteDoc('vehiclePermits', id => vehiclePermits.find(p => p.id === id), 'حذف تصريح مركبة', item => `حذف تصريح رقم ${item.permitNumber || '(غير مرقم)'} للموظف: ${item.employeeName}`);
  
  const addFuelExpense = addDoc('fuelExpenses', 'إضافة مصروف وقود', data => `إضافة وقود للمركبة بتاريخ ${data.date}`);
  const updateFuelExpense = updateDoc('fuelExpenses', 'تحديث مصروف وقود', data => `تحديث مصروف وقود بتاريخ ${data.date}`);
  const deleteFuelExpense = deleteDoc('fuelExpenses', id => fuelExpenses.find(f => f.id === id), 'حذف مصروف وقود', item => `حذف مصروف وقود بتاريخ ${item.date}`);


  const addSurvey = addDoc('surveys', 'إنشاء استطلاع', data => `إنشاء استطلاع: ${data.title}`);
  const updateSurvey = updateDoc('surveys', 'تحديث استطلاع', data => `تحديث استطلاع: ${data.title}`);
  const deleteSurvey = deleteDoc('surveys', id => surveys.find(s => s.id === id), 'حذف استطلاع', item => `حذف استطلاع: ${item.title}`);
  
  const addQuestion = addDoc('surveyQuestions', 'إضافة سؤال', data => `إضافة سؤال: ${data.text}`);
  const updateQuestion = updateDoc('surveyQuestions', 'تحديث سؤال', data => `تحديث سؤال: ${data.text}`);
  const deleteQuestion = deleteDoc('surveyQuestions', id => surveyQuestions.find(q => q.id === id), 'حذف سؤال', item => `حذف سؤال: ${item.text}`);
  
  const addSurveyResponses = async (responses: Omit<SurveyResponse, 'id' | 'submittedAt'>[]) => {
      const batch = db.batch();
      responses.forEach(response => {
          const docRef = db.collection('surveyResponses').doc();
          batch.set(docRef, {
              ...response,
              submittedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      });
      await batch.commit();
      await logActivity('إرسال استطلاع', `قام المستخدم بإرسال ردود استطلاع`);
  };

  const addAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
      const announcementData = { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
      await addDoc('announcements', 'إنشاء إعلان', d => `إضافة إعلان: ${d.message}`)(announcementData);
  };
  const updateAnnouncement = updateDoc('announcements', 'تحديث إعلان', data => `تحديث الإعلان: ${data.message}`);
  const deleteAnnouncement = deleteDoc('announcements', id => announcements.find(a => a.id === id), 'حذف إعلان', item => `حذف الإعلان: ${item.message}`);

  const updateRamadanDatesForYear = async (year: number, dates: { start: string; end: string }) => {
    const currentData = { ...ramadanDates, [year]: dates };
    await db.collection('configuration').doc('ramadanDates').set(currentData);
  };
  
  const updateSettings = async (newSettings: AppSettings) => {
    await db.collection('configuration').doc('appSettings').set(newSettings);
  };

  const viewEmployeeAttendance = (employeeId: string) => {
    handleNavigate(View.ATTENDANCE, { employeeId });
  };

  // --- Auth Handlers ---
  const handleLogin = async (nationalId: string, password: string): Promise<void> => {
    setLoginError('');
    const user = employees.find(e => e.nationalId === nationalId);
    if (!user) {
        setLoginError('الرقم المدني غير صحيح.');
        return;
    }

    const isDefaultPassword = password === '20252025';
    const isCorrectPassword = user.hasChangedPassword ? user.password === password : isDefaultPassword;

    if (!isCorrectPassword) {
        setLoginError('كلمة المرور غير صحيحة.');
        return;
    }
    
    // Admin role choice logic
    if (user.nationalId === '7734383') {
        setAdminUserForChoice(user);
        return; // Stop here, wait for user choice
    }

    let userToUpdate = { ...user };
    let needsUpdate = false;
    
    // For all other users, assign 'Employee' role if not set
    if (!userToUpdate.role) {
        userToUpdate.role = 'Employee';
        needsUpdate = true;
    }

    if (needsUpdate) {
        await updateEmployee(userToUpdate);
    }
    
    sessionStorage.setItem('userId', user.id);
    sessionStorage.setItem('sessionRole', userToUpdate.role!);
    setCurrentUser(userToUpdate);
    setIsAuthenticated(true);
    await logActivity('تسجيل دخول', `قام المستخدم بتسجيل الدخول`);
    
    if (!user.hasChangedPassword) {
        setShowChangePasswordModal(true);
    }
  };
  
  const handleAdminRoleChoice = async (chosenRole: 'Admin' | 'Employee' | 'Head of Department') => {
    if (!adminUserForChoice) return;

    let userToUpdate = { ...adminUserForChoice };
    if (userToUpdate.role !== 'Admin') {
        await updateEmployee({ ...userToUpdate, role: 'Admin' });
    }

    // Create session user with the chosen role
    const sessionUser = { ...userToUpdate, role: chosenRole };
    
    sessionStorage.setItem('userId', sessionUser.id);
    sessionStorage.setItem('sessionRole', chosenRole);
    setCurrentUser(sessionUser);
    setIsAuthenticated(true);

    const roleNameMap = {
      'Admin': 'مدير',
      'Head of Department': 'رئيس قسم',
      'Employee': 'موظف'
    };
    const roleName = roleNameMap[chosenRole];

    await logActivity('تسجيل دخول', `قام مدير النظام بتسجيل الدخول بصلاحية: ${roleName}`);
    
    if (!sessionUser.hasChangedPassword) {
        setShowChangePasswordModal(true);
    }

    setAdminUserForChoice(null); // Clear the choice state
  };

  const handleLogout = async () => {
    if (currentUser) {
        await logActivity('تسجيل خروج', `قام المستخدم بتسجيل الخروج`);
        await db.collection('userSessions').doc(currentUser.id).set({
            status: 'offline',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            employeeName: currentUser.name
        }, { merge: true });
    }
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('sessionRole');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView(View.DASHBOARD);
  };

  const handleChangePassword = async (newPassword: string) => {
    if (currentUser) {
        const updatedUser = { ...currentUser, password: newPassword, hasChangedPassword: true };
        await updateEmployee(updatedUser);
        setCurrentUser(updatedUser);
        setShowChangePasswordModal(false);
        await logActivity('تغيير كلمة المرور', 'قام المستخدم بتغيير كلمة المرور الخاصة به');
    }
  };
  
  const handleUpdatePassword = async (currentPassword: string, newPassword: string): Promise<{success: boolean, message: string}> => {
    if (!currentUser || !currentUser.password) {
        return { success: false, message: 'المستخدم غير موجود أو لا توجد كلمة مرور حالية.' };
    }
    if (currentUser.password !== currentPassword) {
        return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
    }
    await handleChangePassword(newPassword);
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح.' };
  };

  const handleForgotPasswordRequest = async (nationalId: string): Promise<{ success: boolean; message: string }> => {
    const user = employees.find(e => e.nationalId === nationalId);
    if (!user) {
        return { success: false, message: 'الرقم المدني غير مسجل في النظام.' };
    }
    
    const existingRequest = passwordResets.find(r => r.employeeId === user.id);
    if (existingRequest) {
         return { success: true, message: 'تم إرسال طلب بالفعل وهو قيد المراجعة من قبل مدير النظام.' };
    }

    await addPasswordResetRequest({
        employeeId: user.id,
        employeeName: user.name,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'تم إرسال طلب إعادة تعيين كلمة المرور إلى مدير النظام. يرجى التواصل معه.' };
  };

  const handleClearPasswordReset = async (resetId: string) => {
    await deletePasswordResetRequest(resetId);
    handleNavigate(View.EMPLOYEES);
  };

  // --- Main Render Logic ---
  if (isLoading) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">جاري تحميل البيانات...</h1>
        </div>
    );
  }
  
  if (adminUserForChoice) {
    return (
        <AdminLoginChoiceModal 
            onChoice={handleAdminRoleChoice}
            employeeName={adminUserForChoice.name}
        />
    );
  }
  
  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} error={loginError} onForgotPasswordRequest={handleForgotPasswordRequest} />;
  }
  
  const renderView = () => {
    switch(currentView) {
      case View.DASHBOARD:
        return <Dashboard 
            employees={employees}
            leaveRequests={leaveRequests}
            timeLogs={timeLogs}
            shifts={shifts}
            updateLeaveRequest={updateLeaveRequest}
            notifications={notifications}
            currentUser={currentUser}
            trainingRecords={trainingRecords}
            surveys={surveys}
            surveyQuestions={surveyQuestions}
            surveyResponses={surveyResponses}
            addSurveyResponses={addSurveyResponses}
            onNavigate={handleNavigate}
            updateEmployee={updateEmployee}
        />;
      case View.EMPLOYEES:
        return <EmployeeManager 
            employees={employees} 
            userSessions={userSessions}
            settings={settings} 
            addEmployee={addEmployee} 
            updateEmployee={updateEmployee} 
            deleteEmployee={deleteEmployee} 
            onViewAttendance={viewEmployeeAttendance}
            currentUser={currentUser}
            trainingRecords={trainingRecords}
            addToast={addToast}
            bulkDeleteEmployees={bulkDeleteEmployees}
            bulkUpdateEmployees={bulkUpdateEmployees}
            updateTrainingRecord={updateTrainingRecord}
        />;
      case View.SCHEDULER:
        return <ShiftScheduler 
            employees={employees} 
            timeLogs={timeLogs} 
            addTimeLog={addTimeLog} 
            updateTimeLog={updateTimeLog}
            deleteTimeLog={deleteTimeLog}
            shifts={shifts}
            addShift={addShift}
            updateShift={updateShift}
            deleteShift={deleteShift}
            publicHolidays={publicHolidays}
            leaveRequests={leaveRequests}
            settings={settings}
            currentUser={currentUser}
            bulkUpdateTimeLogs={bulkUpdateTimeLogs}
            addScheduleNotification={addScheduleNotification}
        />;
      case View.ATTENDANCE:
        return <AttendanceSheet employees={employees} timeLogs={timeLogs} shifts={shifts} publicHolidays={publicHolidays} leaveRequests={leaveRequests} ramadanDates={ramadanDates} initialEmployeeId={navigationPayload?.employeeId || (currentUser.role === 'Employee' ? currentUser.id : '')} currentUser={currentUser} />;
      case View.LEAVES:
        return <LeaveManager 
            employees={employees}
            leaveRequests={leaveRequests}
            addLeaveRequest={addLeaveRequest}
            updateLeaveRequest={updateLeaveRequest}
            deleteLeaveRequest={deleteLeaveRequest}
            publicHolidays={publicHolidays}
            addPublicHoliday={addPublicHoliday}
            updatePublicHoliday={updatePublicHoliday}
            deletePublicHoliday={deletePublicHoliday}
            ramadanDates={ramadanDates}
            updateRamadanDatesForYear={updateRamadanDatesForYear}
            settings={settings}
            currentUser={currentUser}
            initialStatusFilter={navigationPayload?.status}
        />;
      case View.REPORT:
        return <OvertimeReport 
            employees={employees} 
            timeLogs={timeLogs}
            publicHolidays={publicHolidays}
            leaveRequests={leaveRequests}
            ramadanDates={ramadanDates}
            settings={settings}
            currentUser={currentUser}
        />;
       case View.PROFILE:
        return <MyProfile
            currentUser={currentUser}
            settings={settings}
            updateEmployee={updateEmployee}
            updatePassword={handleUpdatePassword}
            leaveRequests={leaveRequests}
            timeLogs={timeLogs}
            shifts={shifts}
            trainingRecords={trainingRecords}
            addToast={addToast}
        />;
      case View.CORRESPONDENCE:
        return <CorrespondenceManager 
            correspondences={correspondences}
            addCorrespondence={addCorrespondence}
            updateCorrespondence={updateCorrespondence}
            deleteCorrespondence={deleteCorrespondence}
            customsCorrespondences={customsCorrespondences}
            addCustomsCorrespondence={addCustomsCorrespondence}
            updateCustomsCorrespondence={updateCustomsCorrespondence}
            deleteCustomsCorrespondence={deleteCustomsCorrespondence}
            rejectionNotices={rejectionNotices}
            addRejectionNotice={addRejectionNotice}
            updateRejectionNotice={updateRejectionNotice}
            deleteRejectionNotice={deleteRejectionNotice}
            settings={settings}
        />;
      case View.VEHICLE_PERMITS:
        return <VehiclePermitManager
            permits={vehiclePermits}
            employees={employees}
            addPermit={addVehiclePermit}
            updatePermit={updateVehiclePermit}
            // FIX: Pass the defined deleteVehiclePermit function instead of the undefined deletePermit.
            deletePermit={deleteVehiclePermit}
            currentUser={currentUser}
            settings={settings}
            fuelExpenses={fuelExpenses}
            addFuelExpense={addFuelExpense}
            updateFuelExpense={updateFuelExpense}
            deleteFuelExpense={deleteFuelExpense}
        />;
      case View.USER_REQUESTS:
        return <UserRequestManager
            userRequests={userRequests}
            currentUser={currentUser}
            addRequest={addUserRequest}
            updateRequest={updateUserRequest}
        />;
      case View.TRAINING:
          return <TrainingManager 
            employees={employees}
            trainingRecords={trainingRecords}
            settings={settings}
            addTrainingRecord={addTrainingRecord}
            updateTrainingRecord={updateTrainingRecord}
            deleteTrainingRecord={deleteTrainingRecord}
            currentUser={currentUser}
          />;
      case View.SURVEYS:
        return <SurveyManager 
            surveys={surveys}
            questions={surveyQuestions}
            responses={surveyResponses}
            addSurvey={addSurvey}
            updateSurvey={updateSurvey}
            deleteSurvey={deleteSurvey}
            addQuestion={addQuestion}
            updateQuestion={updateQuestion}
            deleteQuestion={deleteQuestion}
        />;
      case View.SETTINGS:
          return <Settings 
              settings={settings} 
              updateSettings={updateSettings} 
              announcements={announcements}
              addAnnouncement={addAnnouncement}
              updateAnnouncement={updateAnnouncement}
              deleteAnnouncement={deleteAnnouncement}
          />;
      case View.MAKTABI:
          return <MaktabiSystem />;
      case View.EXPORT:
          return <EmployeeExporter employees={employees} settings={settings} />;
      case View.USERS:
        return <UserManagement employees={employees} userSessions={userSessions} settings={settings} />;
      case View.AUDIT_LOG:
        return <AuditLogViewer auditLogs={auditLogs} />;
      case View.HELP:
        return <HelpGuide currentUser={currentUser} />;
      case View.ABOUT:
        return <AboutPage />;
      default:
        return <Dashboard 
            employees={employees}
            leaveRequests={leaveRequests}
            timeLogs={timeLogs}
            shifts={shifts}
            updateLeaveRequest={updateLeaveRequest}
            notifications={notifications}
            currentUser={currentUser}
            trainingRecords={trainingRecords}
            surveys={surveys}
            surveyQuestions={surveyQuestions}
            surveyResponses={surveyResponses}
            addSurveyResponses={addSurveyResponses}
            onNavigate={handleNavigate}
            updateEmployee={updateEmployee}
        />;
    }
  };

// FIX: Specified that the `icon` prop's element type accepts a `className` prop to resolve the TypeScript error with `React.cloneElement`.
const NavButton: React.FC<{ view: View; label: string; icon: React.ReactElement<{ className?: string }>; title?: string; }> = ({ view, label, icon, title }) => {
    const isActive = currentView === view;
    return (
        <button 
            onClick={() => handleNavigate(view)} 
            className={`w-full flex items-center justify-start gap-4 p-3 font-semibold rounded-md transition-all duration-300 ${
                isActive 
                ? 'bg-[var(--accent-color)] text-white shadow-lg' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
            aria-label={label}
            title={title || label}
        >
            {React.cloneElement(icon, { className: "w-5 h-5"})}
            <span>{label}</span>
        </button>
    );
  };
  
  const adminNavItems = [
    // General
    { view: View.DASHBOARD, label: 'لوحة التحكم', icon: <HomeIcon />, shortcut: '1' },
    // Core HR
    { view: View.EMPLOYEES, label: 'الموظفين', icon: <UserGroupIcon />, shortcut: '2' },
    { view: View.SCHEDULER, label: 'إدارة المناوبات', icon: <CalendarDaysIcon />, shortcut: '3' },
    { view: View.ATTENDANCE, label: 'كشف الحضور', icon: <ClipboardDocumentListIcon />, shortcut: '4' },
    { view: View.LEAVES, label: 'إدارة الإجازات', icon: <PaperAirplaneIcon />, shortcut: '5' },
    { view: View.REPORT, label: 'تقارير الإضافي', icon: <ChartBarIcon />, shortcut: '6' },
    // Development & Documents
    { view: View.TRAINING, label: 'التدريب والتطوير', icon: <AcademicCapIcon />, adminOnly: false },
    { view: View.CORRESPONDENCE, label: 'المراسلات', icon: <DocumentTextIcon />, adminOnly: false },
    { view: View.VEHICLE_PERMITS, label: 'تصاريح المركبات', icon: <CarIcon />, adminOnly: false },
    // Feedback & Communication
    { view: View.USER_REQUESTS, label: 'مقترحات وشكاوى', icon: <ChatBubbleLeftRightIcon /> },
    { view: View.SURVEYS, label: 'استطلاعات الرأي', icon: <ChatBubbleLeftRightIcon />, adminOnly: true },
    // System & Tools
    { view: View.MAKTABI, label: 'نظام مكتبي', icon: <ComputerDesktopIcon /> },
    { view: View.USERS, label: 'المستخدمون', icon: <UsersIcon />, adminOnly: true },
    { view: View.AUDIT_LOG, label: 'سجل النشاطات', icon: <ClipboardDocumentListIcon />, adminOnly: true },
    { view: View.EXPORT, label: 'تصدير البيانات', icon: <DocumentArrowDownIcon /> },
    { view: View.SETTINGS, label: 'الإعدادات', icon: <Cog6ToothIcon />, adminOnly: true },
    // Help
    { view: View.HELP, label: 'دليل الاستخدام', icon: <QuestionMarkCircleIcon />, adminOnly: false },
    { view: View.ABOUT, label: 'حول البرنامج', icon: <InformationCircleIcon />, adminOnly: false },
  ];

  const employeeNavItems = [
    { view: View.DASHBOARD, label: 'لوحة التحكم', icon: <HomeIcon />, shortcut: '1' },
    { view: View.PROFILE, label: 'ملفي الشخصي', icon: <UserCircleIcon />, shortcut: '2' },
    { view: View.ATTENDANCE, label: 'كشف الحضور', icon: <ClipboardDocumentListIcon />, shortcut: '3' },
    { view: View.SCHEDULER, label: 'جدول المناوبات', icon: <CalendarDaysIcon />, shortcut: '4' },
    { view: View.LEAVES, label: 'الإجازات', icon: <PaperAirplaneIcon />, shortcut: '5' },
    { view: View.REPORT, label: 'تقاريري', icon: <ChartBarIcon /> },
    { view: View.TRAINING, label: 'تدريبي', icon: <AcademicCapIcon /> },
    { view: View.USER_REQUESTS, label: 'مقترحاتي وشكاوي', icon: <ChatBubbleLeftRightIcon /> },
    { view: View.HELP, label: 'دليل الاستخدام', icon: <QuestionMarkCircleIcon /> },
    { view: View.ABOUT, label: 'حول البرنامج', icon: <InformationCircleIcon /> },
  ];
  
// FIX: Specified that the `icon` prop's element type accepts a `className` prop to resolve the TypeScript error with `React.cloneElement`.
const BottomNavButton: React.FC<{ view: View; label: string; icon: React.ReactElement<{ className?: string }>; isActive: boolean; onClick: () => void; }> = ({ view, label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
        isActive
          ? 'text-[var(--accent-color)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
      aria-label={label}
    >
      {React.cloneElement(icon, { className: "w-6 h-6" })}
      <span className="text-xs tracking-tight">{label}</span>
    </button>
  );

  const adminBottomNavItems = [
    adminNavItems.find(i => i.view === View.DASHBOARD),
    adminNavItems.find(i => i.view === View.EMPLOYEES),
    adminNavItems.find(i => i.view === View.SCHEDULER),
    adminNavItems.find(i => i.view === View.REPORT),
    adminNavItems.find(i => i.view === View.CORRESPONDENCE),
  ].filter(Boolean) as (typeof adminNavItems[0])[];

  const employeeBottomNavItems = [
    employeeNavItems.find(i => i.view === View.DASHBOARD),
    employeeNavItems.find(i => i.view === View.PROFILE),
    employeeNavItems.find(i => i.view === View.SCHEDULER),
    employeeNavItems.find(i => i.view === View.LEAVES),
    employeeNavItems.find(i => i.view === View.REPORT),
  ].filter(Boolean) as (typeof employeeNavItems[0])[];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
       <ToastContainer toasts={toasts} onDismiss={dismissToast} />
       {activeAnnouncements.length > 0 && (
          <AnnouncementBar announcements={activeAnnouncements} />
      )}
      {showChangePasswordModal && (
        <ChangePasswordModal 
            onClose={() => {
              alert('يجب عليك تغيير كلمة المرور للمتابعة.');
            }}
            onPasswordChange={handleChangePassword}
        />
      )}
      <aside className="fixed top-4 bottom-4 right-4 w-64 bg-[var(--bg-glass)] backdrop-blur-sm shadow-2xl flex-col p-4 z-20 transition-all duration-300 border border-[var(--border-color)] rounded-2xl hidden md:flex">
        <div className="text-center mb-10">
          <a 
            href="#" 
            className="inline-block" 
            onClick={(e) => { e.preventDefault(); handleNavigate(View.DASHBOARD); }}
            aria-label="الصفحة الرئيسية"
          >
              <h1 className="text-xl font-bold text-[var(--text-primary)]">شؤون الموظفين</h1>
          </a>
        </div>
        
        <nav className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 -mr-2 custom-scrollbar">
            {currentUser.role === 'Employee' ? (
                employeeNavItems.map(item => <NavButton key={item.view} {...item} title={item.shortcut ? `${item.label} (Ctrl+${item.shortcut})` : item.label} />)
            ) : (
                adminNavItems.map(item => {
                    if (item.adminOnly && currentUser.role !== 'Admin') return null;
                    return <NavButton key={item.view} {...item} title={item.shortcut ? `${item.label} (Ctrl+${item.shortcut})` : item.label} />;
                })
            )}
        </nav>

        <footer className="mt-auto pt-4 text-center text-[var(--text-muted)] text-sm">
            <p className="mb-2">تم التطوير بواسطة مبارك درويش</p>
            <div className="flex justify-center">
                <QFSIcon className="w-24" />
            </div>
        </footer>
      </aside>

      <TopBar 
        currentTheme={theme} 
        setTheme={setTheme} 
        notifications={notifications} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onNavigate={handleNavigate} 
        onClearPasswordReset={handleClearPasswordReset}
      />

      <main className="pl-4 pb-24 transition-all duration-300 pt-28 pr-4 md:pr-72 md:pb-4">
        <div className="container mx-auto">
          <div className="bg-[var(--bg-glass)] rounded-xl shadow-2xl border border-[var(--border-color)]">
              {renderView()}
          </div>
        </div>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-glass)] backdrop-blur-sm border-t border-[var(--border-color)] z-30 flex justify-around md:hidden">
        {currentUser.role === 'Employee'
            ? employeeBottomNavItems.map(item => <BottomNavButton key={item.view} {...item} isActive={currentView === item.view} onClick={() => handleNavigate(item.view)} />)
            : adminBottomNavItems.map(item => <BottomNavButton key={item.view} {...item} isActive={currentView === item.view} onClick={() => handleNavigate(item.view)} />)
        }
      </nav>

        <button
            onClick={() => setIsChatBotOpen(true)}
            className="fixed bottom-6 left-6 z-40 bg-[var(--accent-color)] text-white p-4 rounded-full shadow-lg hover:bg-[var(--accent-color-hover)] transition-transform transform hover:scale-110 print:hidden"
            aria-label="Open AI Chatbot"
        >
            <SparklesIcon className="w-6 h-6" />
        </button>

        {isChatBotOpen && (
            <ChatBot
                isOpen={isChatBotOpen}
                onClose={() => setIsChatBotOpen(false)}
                employees={employees}
                shifts={shifts}
                timeLogs={timeLogs}
                leaveRequests={leaveRequests}
                publicHolidays={publicHolidays}
                settings={settings}
                trainingRecords={trainingRecords}
            />
        )}
    </div>
  );
}

export default App;