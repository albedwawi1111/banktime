export interface Document {
  name: string;
  documentNumber: string;
  expiryDate: string;
  fileName: string;
  data: string; // base64 encoded file
}

export interface Education {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: string;
}

export interface WorkExperience {
  company: string;
  jobTitle: string;
  startDate: string;
  endDate: string; // or 'Present'
  description?: string;
}

export interface Employee {
  id: string;
  // Personal Info
  name: string;
  profilePicture?: string; // base64 data URL
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  nationality?: string;
  nationalId?: string; // Labeled as Civil ID in UI
  address?: string;
  phone?: string;
  email?: string;
  
  // Job Info
  employeeNumber?: string;
  department: string;
  jobTitle?: string;
  hireDate?: string;
  contractType?: 'Full-time' | 'Part-time' | 'Contract';
  status?: 'Active' | 'Inactive' | 'On Leave';
  annualLeaveBalance?: number;
  sickLeaveBalance?: number;

  // Financial Info
  financialGrade?: string;
  basicSalary?: number;
  allowances?: number;
  bankName?: string;

  // Education Info
  education?: Education[];

  // Documents
  documents?: Document[];

  // Work Experience and Skills
  workExperience?: WorkExperience[];
  skills?: string[];

  // Auth Info
  password?: string;
  hasChangedPassword?: boolean;
  role?: 'Admin' | 'Employee' | 'Head of Department';
  dashboardLayout?: { key: string; visible: boolean }[];
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string; // e.g., hex color code
  department: string;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:mm
  clockOut: string; // HH:mm
  shiftId?: string; // Link to a predefined shift
}

export interface OvertimeRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  totalRequiredHours: number;
  totalActualHours: number;
  totalOvertimeHours: number;
  compensatoryDays: number;
  workDaysOnHolidays: number;
  compensatoryDaysDue: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface RamadanDateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface RamadanDates {
  [year: number]: RamadanDateRange;
}

export enum View {
  DASHBOARD = 'dashboard',
  EMPLOYEES = 'employees',
  SCHEDULER = 'scheduler',
  REPORT = 'report',
  ATTENDANCE = 'attendance',
  LEAVES = 'leaves',
  SETTINGS = 'settings',
  MAKTABI = 'maktabi',
  EXPORT = 'export',
  USERS = 'users',
  PROFILE = 'profile',
  CORRESPONDENCE = 'correspondence',
  USER_REQUESTS = 'user_requests',
  AUDIT_LOG = 'audit_log',
  TRAINING = 'training',
  VEHICLE_PERMITS = 'vehicle_permits',
  HELP = 'help',
  ABOUT = 'about',
  SURVEYS = 'surveys',
}

export interface Vehicle {
  id: string;
  type: string;
  plateNumber: string;
}

export interface AppSettings {
  nationalities: string[];
  jobTitles: string[];
  educationDegrees: string[];
  leaveTypes: string[];
  correspondenceRecipients: string[];
  vehicles: Vehicle[];
  departments?: string[];
  petrolStations?: string[];
}

export type Theme = 'dark-blue' | 'light' | 'forest' | 'crimson' | 'matrix';

export interface BirthdayNotification {
  employeeId: string;
  employeeName: string;
  daysUntil: number;
}

export interface ExpiryNotification {
  employeeId: string;
  employeeName: string;
  documentName: string;
  daysUntil: number;
  expiryDate: string;
}

export interface UserRequestNotification {
  requestId: string;
  title: string;
  employeeName: string;
}

export interface TrainingNotification {
  recordId: string;
  courseName: string;
  employeeName?: string; // For manager view
}

export interface PasswordResetRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: any; // Firestore timestamp
}

export interface ScheduleNotification {
  id: string;
  employeeIds: string[];
  department: string;
  message: string;
  month: string; // e.g., "YYYY-MM"
  createdAt: any; // Firestore timestamp
  createdBy: string;
}

export interface ScheduleNotificationItem {
  id: string;
  message: string;
  createdBy: string;
}

export interface TopBarNotifications {
    birthdays: BirthdayNotification[];
    expirations: ExpiryNotification[];
    resets: PasswordResetRequest[];
    training: TrainingNotification[];
    userRequests?: UserRequestNotification[];
    schedule?: ScheduleNotificationItem[];
}


export interface PersonForPermit {
  name: string;
  jobTitle: string;
  nationalId: string;
}

export interface Correspondence {
  id: string;
  referenceNumber: string;
  recipient: string;
  subject: string;
  persons: PersonForPermit[];
  createdAt: any; // Firestore timestamp
  type: 'permanent' | 'temporary' | 'temporary_period' | 'nutrition_card';
  startDate?: string;
  endDate?: string;
}

export interface CustomsCorrespondence {
  id: string;
  referenceNumber: string;
  recipient: string;
  subject: string; // "إصدار بيان ثان"
  createdAt: any; // Firestore timestamp
  companyName: string;
  product: string;
  countryOfOrigin: string;
  customsDeclarationNumber: string;
  rejectionReasons: string;
  secondIssuanceReasons: string;
}

export interface RejectionNotice {
  id: string;
  // Details of Consignment
  exporterName: string;
  importerName: string;
  countryOfOrigin: string;
  pointOfEntry: string;
  customDeclarationNo: string;
  noOfPackages: string;
  weight: string;
  scientificName: string;
  commonName: string;
  commodity: string;

  // Rejection Details
  notificationDate: string;
  arrivalDate: string;
  actionTaken: string;
  causeOfNonCompliance: string;

  // Signatures
  headDepartmentName: string;
  authorizedOfficerName: string;

  createdAt: any; // Firestore timestamp
}

export interface UserSession {
  id: string; // employeeId
  employeeName: string;
  status: 'online' | 'offline';
  lastSeen: any; // Firestore timestamp
}

export interface AuditLog {
  id: string;
  timestamp: any; // Firestore timestamp
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface UserRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: any; // Firestore timestamp
}

export interface TrainingRecord {
  id: string;
  employeeIds: string[];
  courseName: string;
  provider: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Planned' | 'In Progress' | 'Completed';
}

export interface VehiclePermit {
  id: string;
  permitNumber: string;
  employeeName: string;
  vehicleId: string;
  destination: string;
  purpose: string;
  startDate: string; // ISO string for datetime
  endDate?: string; // ISO string for datetime
  createdAt: any; // Firestore timestamp
  odometerOut: number;
  odometerIn?: number;
}

export interface FuelExpense {
  id: string;
  permitId: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  liters: number;
  cost: number;
  odometerReading: number;
  stationName: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed';
  createdAt: any; // Firestore timestamp
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  text: string;
  type: 'scale-5' | 'text';
  order: number;
  analysisResult?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  questionId: string;
  employeeId: string;
  answer: string | number;
  submittedAt: any; // Firestore timestamp
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  isActive: boolean;
  createdAt: any; // Firestore timestamp
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}