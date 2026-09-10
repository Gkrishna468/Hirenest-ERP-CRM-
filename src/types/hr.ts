/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmploymentType =
  | 'INTERNAL_EMPLOYEE'
  | 'DEPLOYED_EMPLOYEE'
  | 'CONTRACTOR'
  | 'CONSULTANT'
  | 'BENCH_RESOURCE';

export type EmployeeStatus =
  | 'ACTIVE'
  | 'ONBOARDING'
  | 'PROBATION'
  | 'NOTICE_PERIOD'
  | 'OFFBOARDED'
  | 'TERMINATED'
  | 'BENCH';

export type WorkMode = 'Onsite' | 'Hybrid' | 'Remote';

export interface Employee {
  id: string;
  employeeCode: string; // e.g. "HN-EMP-1001"
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  designation: string;
  department: string;
  location: string;
  workMode: WorkMode;
  joiningDate: string; // ISO date
  probationEndDate?: string;
  confirmationDate?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  hrManagerId?: string;
  hrManagerName?: string;
  employerOfRecord: string; // e.g. "HireNest Staffing Solutions Pvt Ltd"
  
  // Staffing specific deployment linkages
  clientId?: string;
  clientName?: string;
  vendorId?: string;
  vendorName?: string;
  requirementId?: string;
  requirementTitle?: string;
  placementId?: string;
  candidateId?: string;
  
  skills: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumberMasked: string;
    ifscCode: string;
  };
  salaryDetails?: {
    ctcAnnual?: number;
    baseMonthly?: number;
    currency?: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';

export type DocumentType =
  | 'Government ID'
  | 'Address Proof'
  | 'Educational Degree'
  | 'Experience Letter'
  | 'Offer Letter'
  | 'Appointment Letter'
  | 'NDA'
  | 'Client SOW / Addendum'
  | 'Relieving Letter'
  | 'Other';

export interface EmploymentDocument {
  id: string;
  employeeId: string;
  employeeName?: string;
  documentType: DocumentType;
  title: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: string;
  uploadedAt: string;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  isRequired: boolean;
}

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  category: 'Documentation' | 'IT Setup' | 'Asset Allocation' | 'Policy & Compliance' | 'Induction';
  required: boolean;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'completed';
  assignedTo?: string;
  completedAt?: string;
  verifiedBy?: string;
  documentUrl?: string;
  notes?: string;
}

export interface OnboardingRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employmentType: EmploymentType;
  designation: string;
  department: string;
  joiningDate: string;
  targetCompletionDate: string;
  stage: 'Documentation' | 'Verification' | 'Asset Allocation' | 'Induction' | 'Completed';
  status: 'In Progress' | 'Completed' | 'Delayed';
  progressPercent: number;
  items: OnboardingChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'WFH'
  | 'ON_DUTY'
  | 'HOLIDAY'
  | 'WEEKEND';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // HH:mm
  checkOutTime?: string; // HH:mm
  workHours: number;
  overtimeHours: number;
  shift: string; // "General Shift (09:00 - 18:00)", "UK Shift", "US Shift"
  locationType: 'Office' | 'Client Site' | 'Home';
  regularizationStatus?: 'None' | 'Requested' | 'Approved' | 'Rejected';
  regularizationReason?: string;
  regularizationRequestedAt?: string;
  regularizedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: string;
  type: 'National' | 'State' | 'Optional';
  isMandatory: boolean;
  location?: string;
}

export type LeaveType =
  | 'CASUAL'
  | 'SICK'
  | 'EARNED'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID_LOP';

export interface LeaveBalance {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  casual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  earned: { total: number; used: number; remaining: number };
  maternity: { total: number; used: number; remaining: number };
  paternity: { total: number; used: number; remaining: number };
  lop: { used: number };
  year: number;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  managerApproval: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  };
  hrApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  };
  appliedAt: string;
  updatedAt: string;
}

export interface TimesheetDailyEntry {
  date: string; // YYYY-MM-DD
  day: string; // "Mon", "Tue", etc.
  regularHours: number;
  overtimeHours: number;
  taskDescription: string;
  status: 'working' | 'leave' | 'holiday';
}

export interface Timesheet {
  id: string;
  timesheetNumber: string; // e.g. "TS-2608-010"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employmentType: EmploymentType;
  period: string; // e.g. "2026-W33 (Aug 10 - Aug 16)"
  startDate: string;
  endDate: string;
  clientId?: string;
  clientName?: string;
  requirementId?: string;
  projectTitle: string;
  billable: boolean;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalHours: number;
  dailyEntries: TimesheetDailyEntry[];
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED_BY_MANAGER' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'Travel'
  | 'Client Entertainment'
  | 'Food / Meals'
  | 'Relocation'
  | 'Hardware / Tools'
  | 'Certification / Training'
  | 'Miscellaneous';

export interface ExpenseClaim {
  id: string;
  claimNumber: string; // e.g. "EXP-2608-001"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  category: ExpenseCategory;
  amount: number;
  currency: string; // default "INR"
  expenseDate: string; // YYYY-MM-DD
  merchantName: string;
  description: string;
  receiptName?: string;
  receiptUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OffboardingChecklistItem {
  id: string;
  category: 'Knowledge Handover' | 'Asset Recovery' | 'IT Access Revocation' | 'Finance Clearance' | 'HR Formalities';
  item: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface OffboardingRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employmentType: EmploymentType;
  designation: string;
  department: string;
  resignationDate: string;
  lastWorkingDay: string;
  noticePeriodDays: number;
  reasonForLeaving: string;
  handoverToEmployeeId?: string;
  handoverToEmployeeName?: string;
  exitInterviewNotes?: string;
  checklist: OffboardingChecklistItem[];
  assetReturnStatus: 'Pending' | 'Partial' | 'Completed';
  itAccessRevoked: boolean;
  relievingLetterIssued: boolean;
  status: 'Initiated' | 'In Progress' | 'Exit Completed' | 'Relieved';
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkforceMetrics {
  totalHeadcount: number;
  internalCount: number;
  deployedCount: number;
  contractorCount: number;
  consultantCount: number;
  benchCount: number;
  activeHeadcount: number;
  onboardingCount: number;
  noticePeriodCount: number;
  todayAttendance: {
    totalExpected: number;
    present: number;
    wfh: number;
    absent: number;
    onLeave: number;
    attendanceRatePercent: number;
  };
  pendingApprovals: {
    leaveRequests: number;
    timesheets: number;
    expenses: number;
    onboardingTasks: number;
    regularizations: number;
  };
}
