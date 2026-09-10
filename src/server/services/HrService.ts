/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";
import type {
  Employee,
  EmploymentType,
  EmployeeStatus,
  EmploymentDocument,
  OnboardingRecord,
  OnboardingChecklistItem,
  AttendanceRecord,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  Timesheet,
  ExpenseClaim,
  OffboardingRecord,
  WorkforceMetrics,
} from "../../types/hr";

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: "hol-1", name: "New Year's Day", date: "2026-01-01", day: "Thursday", type: "National", isMandatory: true },
  { id: "hol-2", name: "Republic Day", date: "2026-01-26", day: "Monday", type: "National", isMandatory: true },
  { id: "hol-3", name: "Holi", date: "2026-03-04", day: "Wednesday", type: "National", isMandatory: true },
  { id: "hol-4", name: "Eid al-Fitr", date: "2026-03-20", day: "Friday", type: "National", isMandatory: true },
  { id: "hol-5", name: "Labour Day", date: "2026-05-01", day: "Friday", type: "National", isMandatory: true },
  { id: "hol-6", name: "Independence Day", date: "2026-08-15", day: "Saturday", type: "National", isMandatory: true },
  { id: "hol-7", name: "Ganesh Chaturthi", date: "2026-09-14", day: "Monday", type: "State", isMandatory: false },
  { id: "hol-8", name: "Gandhi Jayanti", date: "2026-10-02", day: "Friday", type: "National", isMandatory: true },
  { id: "hol-9", name: "Dussehra", date: "2026-10-20", day: "Tuesday", type: "National", isMandatory: true },
  { id: "hol-10", name: "Diwali (Deepavali)", date: "2026-11-08", day: "Sunday", type: "National", isMandatory: true },
  { id: "hol-11", name: "Christmas Day", date: "2026-12-25", day: "Friday", type: "National", isMandatory: true },
];

const STANDARD_ONBOARDING_ITEMS: OnboardingChecklistItem[] = [
  { id: "onb-1", title: "Government Identity Proof (Aadhaar/PAN/Passport)", category: "Documentation", required: true, status: "completed", completedAt: "2026-08-01T10:00:00Z" },
  { id: "onb-2", title: "Signed Offer & Appointment Letter", category: "Documentation", required: true, status: "completed", completedAt: "2026-08-01T11:00:00Z" },
  { id: "onb-3", title: "Permanent & Current Address Verification", category: "Documentation", required: true, status: "completed", completedAt: "2026-08-01T12:00:00Z" },
  { id: "onb-4", title: "Highest Educational Degree Certificate", category: "Documentation", required: true, status: "completed", completedAt: "2026-08-02T09:00:00Z" },
  { id: "onb-5", title: "Previous Employer Relieving & Experience Letters", category: "Documentation", required: false, status: "completed", completedAt: "2026-08-02T10:00:00Z" },
  { id: "onb-6", title: "HireNest Enterprise NDA & IP Assignment Agreement", category: "Policy & Compliance", required: true, status: "completed", completedAt: "2026-08-02T11:00:00Z" },
  { id: "onb-7", title: "Direct Deposit / Salary Bank Account Form", category: "Documentation", required: true, status: "completed", completedAt: "2026-08-03T10:00:00Z" },
  { id: "onb-8", title: "Workstation / Laptop Allocation & Asset Tagging", category: "Asset Allocation", required: true, status: "completed", completedAt: "2026-08-03T14:00:00Z" },
  { id: "onb-9", title: "Corporate Email, Slack & VPN Access Setup", category: "IT Setup", required: true, status: "completed", completedAt: "2026-08-04T09:30:00Z" },
  { id: "onb-10", title: "HR Induction & Company Policy Orientation Session", category: "Induction", required: true, status: "completed", completedAt: "2026-08-04T15:00:00Z" },
];

export class HrService {
  private static seeded = false;

  private async ensureSeeded() {
    if (HrService.seeded) return;
    HrService.seeded = true;

    try {
      const db = getAdminDb();
      const empSnap = await db.collection("employees").limit(1).get();
      if (!empSnap.empty) return;

      console.log("[HrService] Initializing standard HireNest Workforce master records...");

      const initialEmployees: Partial<Employee>[] = [
        {
          id: "emp-101",
          employeeCode: "HN-EMP-1001",
          firstName: "Ananya",
          lastName: "Sharma",
          fullName: "Ananya Sharma",
          email: "ananya.sharma@hirenest.io",
          phone: "+91 98201 44556",
          employmentType: "INTERNAL_EMPLOYEE",
          status: "ACTIVE",
          designation: "Lead Talent Partner & Delivery Head",
          department: "Recruitment Operations",
          location: "Bengaluru, India",
          workMode: "Hybrid",
          joiningDate: "2024-03-15T09:00:00Z",
          confirmationDate: "2024-09-15T09:00:00Z",
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          reportingManagerName: "Gopal Krishna (Founder)",
          hrManagerName: "Priya Menon",
          skills: ["Executive Search", "Technical Screening", "Account Management", "Vendor SLA"],
          emergencyContact: { name: "Rajesh Sharma", relationship: "Spouse", phone: "+91 98201 11223" },
          bankDetails: { bankName: "HDFC Bank", accountHolder: "Ananya Sharma", accountNumberMasked: "••••••••4812", ifscCode: "HDFC0001234" },
          salaryDetails: { ctcAnnual: 1800000, baseMonthly: 150000, currency: "INR" },
          organizationId: "bootstrap-org",
          createdAt: "2024-03-15T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
        {
          id: "emp-102",
          employeeCode: "HN-EMP-1002",
          firstName: "Vikram",
          lastName: "Reddy",
          fullName: "Vikram Reddy",
          email: "vikram.reddy@hirenest.io",
          phone: "+91 98490 77889",
          employmentType: "INTERNAL_EMPLOYEE",
          status: "ACTIVE",
          designation: "Senior Full-Stack Architect",
          department: "Engineering & AI",
          location: "Hyderabad, India",
          workMode: "Remote",
          joiningDate: "2024-06-01T09:00:00Z",
          confirmationDate: "2024-12-01T09:00:00Z",
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          reportingManagerName: "Gopal Krishna (Founder)",
          hrManagerName: "Priya Menon",
          skills: ["React", "TypeScript", "Node.js", "Cloud Run", "Firestore", "System Architecture"],
          emergencyContact: { name: "Sunita Reddy", relationship: "Mother", phone: "+91 98490 22334" },
          bankDetails: { bankName: "ICICI Bank", accountHolder: "Vikram Reddy", accountNumberMasked: "••••••••7741", ifscCode: "ICIC0000554" },
          salaryDetails: { ctcAnnual: 2400000, baseMonthly: 200000, currency: "INR" },
          organizationId: "bootstrap-org",
          createdAt: "2024-06-01T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
        {
          id: "emp-103",
          employeeCode: "HN-EMP-1003",
          firstName: "Priya",
          lastName: "Menon",
          fullName: "Priya Menon",
          email: "priya.menon@hirenest.io",
          phone: "+91 98801 33221",
          employmentType: "INTERNAL_EMPLOYEE",
          status: "ACTIVE",
          designation: "Head of People & HR Operations",
          department: "Human Resources",
          location: "Bengaluru, India",
          workMode: "Hybrid",
          joiningDate: "2024-01-10T09:00:00Z",
          confirmationDate: "2024-07-10T09:00:00Z",
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          reportingManagerName: "Gopal Krishna (Founder)",
          skills: ["Workforce Management", "Employee Relations", "Statutory Compliance", "Performance"],
          emergencyContact: { name: "Kiran Menon", relationship: "Brother", phone: "+91 98801 55667" },
          bankDetails: { bankName: "Axis Bank", accountHolder: "Priya Menon", accountNumberMasked: "••••••••3399", ifscCode: "UTIB0000123" },
          salaryDetails: { ctcAnnual: 1600000, baseMonthly: 133333, currency: "INR" },
          organizationId: "bootstrap-org",
          createdAt: "2024-01-10T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
        {
          id: "emp-104",
          employeeCode: "HN-EMP-1004",
          firstName: "Rohan",
          lastName: "Deshmukh",
          fullName: "Rohan Deshmukh",
          email: "rohan.deshmukh@contractor.hirenest.io",
          phone: "+91 97654 99112",
          employmentType: "DEPLOYED_EMPLOYEE",
          status: "ACTIVE",
          designation: "Senior Cloud & DevOps Consultant",
          department: "Client Solutions",
          location: "Pune, India",
          workMode: "Onsite",
          joiningDate: "2025-02-01T09:00:00Z",
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          clientId: "client-techcorp",
          clientName: "TechCorp Financial Services",
          requirementTitle: "Kubernetes & Multi-Cloud Infrastructure Engineer",
          reportingManagerName: "Ananya Sharma",
          hrManagerName: "Priya Menon",
          skills: ["AWS", "GCP", "Kubernetes", "Terraform", "CI/CD", "Prometheus"],
          emergencyContact: { name: "Neha Deshmukh", relationship: "Spouse", phone: "+91 97654 88334" },
          bankDetails: { bankName: "State Bank of India", accountHolder: "Rohan Deshmukh", accountNumberMasked: "••••••••1092", ifscCode: "SBIN0001552" },
          salaryDetails: { ctcAnnual: 2200000, baseMonthly: 183333, currency: "INR" },
          organizationId: "bootstrap-org",
          createdAt: "2025-02-01T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
        {
          id: "emp-105",
          employeeCode: "HN-EMP-1005",
          firstName: "Sneha",
          lastName: "Patel",
          fullName: "Sneha Patel",
          email: "sneha.patel@vendor.hirenest.io",
          phone: "+91 99090 12345",
          employmentType: "CONTRACTOR",
          status: "ACTIVE",
          designation: "Senior Java Microservices Engineer",
          department: "Staff Augmentation",
          location: "Bengaluru, India",
          workMode: "Hybrid",
          joiningDate: "2025-05-15T09:00:00Z",
          employerOfRecord: "Apex Talent Solutions (Vendor Partner)",
          vendorId: "v-apex-01",
          vendorName: "Apex Talent Partners Pvt Ltd",
          clientId: "client-innovate",
          clientName: "Innovate Mobility Labs",
          requirementTitle: "Java Spring Boot & Kafka Specialist",
          reportingManagerName: "Ananya Sharma",
          hrManagerName: "Priya Menon",
          skills: ["Java 17", "Spring Boot", "Kafka", "PostgreSQL", "Docker"],
          emergencyContact: { name: "Amit Patel", relationship: "Father", phone: "+91 99090 67890" },
          organizationId: "bootstrap-org",
          createdAt: "2025-05-15T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
        {
          id: "emp-106",
          employeeCode: "HN-EMP-1006",
          firstName: "Arjun",
          lastName: "Verma",
          fullName: "Arjun Verma",
          email: "arjun.verma@hirenest.io",
          phone: "+91 98111 65432",
          employmentType: "BENCH_RESOURCE",
          status: "BENCH",
          designation: "React Native & Mobile Engineer",
          department: "Bench / Sourcing Pool",
          location: "Noida, India",
          workMode: "Remote",
          joiningDate: "2026-07-01T09:00:00Z",
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          reportingManagerName: "Vikram Reddy",
          hrManagerName: "Priya Menon",
          skills: ["React Native", "iOS", "Android", "TypeScript", "Redux Toolkit"],
          emergencyContact: { name: "Pooja Verma", relationship: "Spouse", phone: "+91 98111 22334" },
          bankDetails: { bankName: "HDFC Bank", accountHolder: "Arjun Verma", accountNumberMasked: "••••••••5519", ifscCode: "HDFC0000456" },
          salaryDetails: { ctcAnnual: 1400000, baseMonthly: 116666, currency: "INR" },
          organizationId: "bootstrap-org",
          createdAt: "2026-07-01T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
        {
          id: "emp-107",
          employeeCode: "HN-EMP-1007",
          firstName: "Kavita",
          lastName: "Nair",
          fullName: "Kavita Nair",
          email: "kavita.nair@hirenest.io",
          phone: "+91 98450 88221",
          employmentType: "INTERNAL_EMPLOYEE",
          status: "ONBOARDING",
          designation: "Enterprise Business Development Manager",
          department: "Commercial Sales",
          location: "Mumbai, India",
          workMode: "Onsite",
          joiningDate: "2026-08-10T09:00:00Z",
          probationEndDate: "2027-02-10T09:00:00Z",
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          reportingManagerName: "Gopal Krishna (Founder)",
          hrManagerName: "Priya Menon",
          skills: ["Enterprise Sales", "Client Acquisition", "Staffing Solutions", "Contract Negotiation"],
          emergencyContact: { name: "Suresh Nair", relationship: "Father", phone: "+91 98450 11990" },
          bankDetails: { bankName: "Kotak Mahindra Bank", accountHolder: "Kavita Nair", accountNumberMasked: "••••••••8830", ifscCode: "KKBK0001001" },
          salaryDetails: { ctcAnnual: 2000000, baseMonthly: 166666, currency: "INR" },
          organizationId: "bootstrap-org",
          createdAt: "2026-08-10T09:00:00Z",
          updatedAt: "2026-08-14T09:00:00Z",
        },
      ];

      const batch = db.batch();
      for (const emp of initialEmployees) {
        const ref = db.collection("employees").doc(emp.id!);
        batch.set(ref, emp);

        // Seed Leave Balance
        const leaveBalRef = db.collection("hr_leave_balances").doc(emp.id!);
        const leaveBal: LeaveBalance = {
          employeeId: emp.id!,
          employeeCode: emp.employeeCode!,
          employeeName: emp.fullName!,
          casual: { total: 12, used: 2, remaining: 10 },
          sick: { total: 10, used: 1, remaining: 9 },
          earned: { total: 18, used: 4, remaining: 14 },
          maternity: { total: 180, used: 0, remaining: 180 },
          paternity: { total: 15, used: 0, remaining: 15 },
          lop: { used: 0 },
          year: 2026,
          updatedAt: new Date().toISOString(),
        };
        batch.set(leaveBalRef, leaveBal);

        // Seed Onboarding Record
        const onbRef = db.collection("hr_onboarding").doc(emp.id!);
        const onbRecord: OnboardingRecord = {
          id: `onb-${emp.id}`,
          employeeId: emp.id!,
          employeeCode: emp.employeeCode!,
          employeeName: emp.fullName!,
          employmentType: emp.employmentType!,
          designation: emp.designation!,
          department: emp.department!,
          joiningDate: emp.joiningDate!,
          targetCompletionDate: "2026-08-25T00:00:00Z",
          stage: emp.status === "ONBOARDING" ? "Verification" : "Completed",
          status: emp.status === "ONBOARDING" ? "In Progress" : "Completed",
          progressPercent: emp.status === "ONBOARDING" ? 60 : 100,
          items: STANDARD_ONBOARDING_ITEMS.map((item, idx) => ({
            ...item,
            id: `onb-${emp.id}-${idx + 1}`,
            status: emp.status === "ONBOARDING" && idx > 5 ? "pending" : "completed",
          })),
          createdAt: emp.joiningDate!,
          updatedAt: new Date().toISOString(),
        };
        batch.set(onbRef, onbRecord);
      }

      // Seed Holidays
      for (const hol of DEFAULT_HOLIDAYS) {
        const holRef = db.collection("hr_holidays").doc(hol.id);
        batch.set(holRef, hol);
      }

      // Seed Initial Sample Attendance
      const todayStr = new Date().toISOString().split("T")[0];
      const sampleAttendances: AttendanceRecord[] = [
        {
          id: `att-101-${todayStr}`,
          employeeId: "emp-101",
          employeeCode: "HN-EMP-1001",
          employeeName: "Ananya Sharma",
          date: todayStr,
          status: "PRESENT",
          checkInTime: "09:12",
          checkOutTime: "18:25",
          workHours: 9.2,
          overtimeHours: 0.2,
          shift: "General Shift (09:00 - 18:00)",
          locationType: "Office",
          regularizationStatus: "None",
          createdAt: `${todayStr}T09:12:00Z`,
          updatedAt: `${todayStr}T18:25:00Z`,
        },
        {
          id: `att-102-${todayStr}`,
          employeeId: "emp-102",
          employeeCode: "HN-EMP-1002",
          employeeName: "Vikram Reddy",
          date: todayStr,
          status: "WFH",
          checkInTime: "09:00",
          checkOutTime: "18:00",
          workHours: 9.0,
          overtimeHours: 0,
          shift: "General Shift (09:00 - 18:00)",
          locationType: "Home",
          regularizationStatus: "None",
          createdAt: `${todayStr}T09:00:00Z`,
          updatedAt: `${todayStr}T18:00:00Z`,
        },
        {
          id: `att-104-${todayStr}`,
          employeeId: "emp-104",
          employeeCode: "HN-EMP-1004",
          employeeName: "Rohan Deshmukh",
          date: todayStr,
          status: "PRESENT",
          checkInTime: "09:30",
          checkOutTime: "18:30",
          workHours: 9.0,
          overtimeHours: 0,
          shift: "General Shift (09:00 - 18:00)",
          locationType: "Client Site",
          regularizationStatus: "None",
          createdAt: `${todayStr}T09:30:00Z`,
          updatedAt: `${todayStr}T18:30:00Z`,
        },
        {
          id: `att-105-${todayStr}`,
          employeeId: "emp-105",
          employeeCode: "HN-EMP-1005",
          employeeName: "Sneha Patel",
          date: todayStr,
          status: "PRESENT",
          checkInTime: "09:15",
          checkOutTime: "18:15",
          workHours: 9.0,
          overtimeHours: 0,
          shift: "General Shift (09:00 - 18:00)",
          locationType: "Client Site",
          regularizationStatus: "None",
          createdAt: `${todayStr}T09:15:00Z`,
          updatedAt: `${todayStr}T18:15:00Z`,
        },
      ];

      for (const att of sampleAttendances) {
        const attRef = db.collection("hr_attendance").doc(att.id);
        batch.set(attRef, att);
      }

      // Seed Initial Timesheet Sample
      const timesheetSample: Timesheet = {
        id: "ts-104-w32",
        timesheetNumber: "TS-2608-0104",
        employeeId: "emp-104",
        employeeCode: "HN-EMP-1004",
        employeeName: "Rohan Deshmukh",
        employmentType: "DEPLOYED_EMPLOYEE",
        period: "2026-W32 (Aug 03 - Aug 09)",
        startDate: "2026-08-03",
        endDate: "2026-08-09",
        clientId: "client-techcorp",
        clientName: "TechCorp Financial Services",
        projectTitle: "Multi-Region Kubernetes Migration & Infrastructure Hardening",
        billable: true,
        totalRegularHours: 40,
        totalOvertimeHours: 4,
        totalHours: 44,
        status: "SUBMITTED",
        dailyEntries: [
          { date: "2026-08-03", day: "Mon", regularHours: 8, overtimeHours: 1, taskDescription: "Cluster upgrade and Terraform state refactoring", status: "working" },
          { date: "2026-08-04", day: "Tue", regularHours: 8, overtimeHours: 0, taskDescription: "Ingress controller routing & SSL cert automation", status: "working" },
          { date: "2026-08-05", day: "Wed", regularHours: 8, overtimeHours: 2, taskDescription: "Client stage cutover & load testing", status: "working" },
          { date: "2026-08-06", day: "Thu", regularHours: 8, overtimeHours: 1, taskDescription: "Prometheus alerts tuning & runbook documentation", status: "working" },
          { date: "2026-08-07", day: "Fri", regularHours: 8, overtimeHours: 0, taskDescription: "Weekly sprint demo & client sign-off review", status: "working" },
          { date: "2026-08-08", day: "Sat", regularHours: 0, overtimeHours: 0, taskDescription: "Weekend Off", status: "holiday" },
          { date: "2026-08-09", day: "Sun", regularHours: 0, overtimeHours: 0, taskDescription: "Weekend Off", status: "holiday" },
        ],
        submittedAt: "2026-08-10T09:00:00Z",
        createdAt: "2026-08-03T09:00:00Z",
        updatedAt: "2026-08-10T09:00:00Z",
      };
      batch.set(db.collection("hr_timesheets").doc(timesheetSample.id), timesheetSample);

      // Seed Initial Sample Expense
      const sampleExpense: ExpenseClaim = {
        id: "exp-101-01",
        claimNumber: "EXP-2608-001",
        employeeId: "emp-101",
        employeeCode: "HN-EMP-1001",
        employeeName: "Ananya Sharma",
        category: "Client Entertainment",
        amount: 3450,
        currency: "INR",
        expenseDate: "2026-08-08",
        merchantName: "The Leela Palace - Citrus",
        description: "Client lunch meeting with VP of Talent Acquisition at TechCorp",
        receiptName: "tax_invoice_citrus_3450.pdf",
        status: "SUBMITTED",
        submittedAt: "2026-08-09T11:00:00Z",
        createdAt: "2026-08-09T11:00:00Z",
        updatedAt: "2026-08-09T11:00:00Z",
      };
      batch.set(db.collection("hr_expenses").doc(sampleExpense.id), sampleExpense);

      await batch.commit();
      console.log("[HrService] Standard workforce master seed committed successfully.");
    } catch (err) {
      console.error("[HrService] Seed error:", err);
    }
  }

  // -------------------------------------------------------------
  // EMPLOYEES CRUD
  // -------------------------------------------------------------
  async listEmployees(userContext?: any): Promise<Employee[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const snap = await db.collection("employees").get();
    let employees = snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));

    // RBAC Filter
    if (userContext) {
      if (userContext.workspace === "Vendor" && userContext.vendorId) {
        // Vendors only see their own deployed contractors
        employees = employees.filter(e => e.vendorId === userContext.vendorId);
      } else if (userContext.workspace === "Client" && userContext.clientId) {
        // Clients only see workers deployed on their account
        employees = employees.filter(e => e.clientId === userContext.clientId);
      }
    }

    return employees.sort((a, b) => (a.employeeCode || "").localeCompare(b.employeeCode || ""));
  }

  async getEmployeeById(id: string, userContext?: any): Promise<Employee | null> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const doc = await db.collection("employees").doc(id).get();
    if (!doc.exists) return null;

    const emp = { id: doc.id, ...doc.data() } as Employee;

    // RBAC check
    if (userContext) {
      if (userContext.workspace === "Vendor" && userContext.vendorId && emp.vendorId !== userContext.vendorId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && emp.clientId !== userContext.clientId) {
        return null;
      }
    }

    return emp;
  }

  async createEmployee(data: Partial<Employee>, performedBy: string = "HR Operations", userContext?: any): Promise<Employee> {
    const db = getAdminDb();
    const id = data.id || `emp-${crypto.randomUUID().substring(0, 8)}`;
    
    // Auto-generate employee code if missing
    let employeeCode = data.employeeCode;
    if (!employeeCode) {
      const snap = await db.collection("employees").get();
      const nextNum = 1001 + snap.size;
      employeeCode = `HN-EMP-${nextNum}`;
    }

    const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || "New Employee";

    const employee: Employee = {
      id,
      employeeCode,
      firstName: data.firstName || fullName.split(" ")[0] || "Employee",
      lastName: data.lastName || fullName.split(" ").slice(1).join(" ") || "",
      fullName,
      email: data.email || `${employeeCode.toLowerCase()}@hirenest.io`,
      phone: data.phone || "+91 00000 00000",
      avatar: data.avatar || "",
      employmentType: data.employmentType || "INTERNAL_EMPLOYEE",
      status: data.status || "ONBOARDING",
      designation: data.designation || "Associate",
      department: data.department || "Operations",
      location: data.location || "Bengaluru, India",
      workMode: data.workMode || "Hybrid",
      joiningDate: data.joiningDate || new Date().toISOString(),
      probationEndDate: data.probationEndDate,
      confirmationDate: data.confirmationDate,
      reportingManagerId: data.reportingManagerId,
      reportingManagerName: data.reportingManagerName || "Gopal Krishna",
      hrManagerId: data.hrManagerId,
      hrManagerName: data.hrManagerName || "Priya Menon",
      employerOfRecord: data.employerOfRecord || "HireNest Staffing Solutions Pvt Ltd",
      clientId: data.clientId,
      clientName: data.clientName,
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      requirementId: data.requirementId,
      requirementTitle: data.requirementTitle,
      placementId: data.placementId,
      candidateId: data.candidateId,
      skills: Array.isArray(data.skills) ? data.skills : [],
      emergencyContact: data.emergencyContact || { name: "Primary Contact", relationship: "Family", phone: "+91 00000 00000" },
      bankDetails: data.bankDetails,
      salaryDetails: data.salaryDetails,
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("employees").doc(id).set(employee);

    // Auto-create Leave Balance
    const leaveBal: LeaveBalance = {
      employeeId: id,
      employeeCode,
      employeeName: fullName,
      casual: { total: 12, used: 0, remaining: 12 },
      sick: { total: 10, used: 0, remaining: 10 },
      earned: { total: 18, used: 0, remaining: 18 },
      maternity: { total: 180, used: 0, remaining: 180 },
      paternity: { total: 15, used: 0, remaining: 15 },
      lop: { used: 0 },
      year: new Date().getFullYear(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection("hr_leave_balances").doc(id).set(leaveBal);

    // Auto-create Onboarding Checklist
    const onbRecord: OnboardingRecord = {
      id: `onb-${id}`,
      employeeId: id,
      employeeCode,
      employeeName: fullName,
      employmentType: employee.employmentType,
      designation: employee.designation,
      department: employee.department,
      joiningDate: employee.joiningDate,
      targetCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      stage: "Documentation",
      status: "In Progress",
      progressPercent: 10,
      items: STANDARD_ONBOARDING_ITEMS.map((item, idx) => ({
        ...item,
        id: `onb-${id}-${idx + 1}`,
        status: idx === 0 ? "pending" : "pending",
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection("hr_onboarding").doc(id).set(onbRecord);

    // Publish event
    await DomainEventPublisher.publish(
      "EMPLOYEE_CREATED",
      "Employee",
      id,
      performedBy,
      {
        employeeCode,
        fullName,
        employmentType: employee.employmentType,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
      }
    );

    return employee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>, performedBy: string = "HR Operations"): Promise<Employee> {
    const db = getAdminDb();
    const ref = db.collection("employees").doc(id);
    const existing = await ref.get();
    if (!existing.exists) throw new Error("Employee not found");

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...existing.data(), ...payload } as Employee;

    // Publish event
    await DomainEventPublisher.publish(
      "EMPLOYEE_UPDATED",
      "Employee",
      id,
      performedBy,
      { updates: Object.keys(updates) }
    );

    return updated;
  }

  // Convert a confirmed placement into an employee record
  async convertPlacementToEmployee(placementData: any, performedBy: string = "HR Onboarding"): Promise<Employee> {
    const db = getAdminDb();
    const candidateName = placementData.candidateName || "Placed Candidate";
    const snap = await db.collection("employees").get();
    const employeeCode = `HN-EMP-${1001 + snap.size}`;
    const id = `emp-${crypto.randomUUID().substring(0, 8)}`;

    const isContract = placementData.model === "staffing" || !!placementData.vendorId;

    const employee: Employee = {
      id,
      employeeCode,
      firstName: candidateName.split(" ")[0] || "Candidate",
      lastName: candidateName.split(" ").slice(1).join(" ") || "",
      fullName: candidateName,
      email: placementData.email || `${employeeCode.toLowerCase()}@hirenest.io`,
      phone: placementData.phone || "+91 98000 00000",
      employmentType: isContract ? "DEPLOYED_EMPLOYEE" : "INTERNAL_EMPLOYEE",
      status: "ONBOARDING",
      designation: placementData.jobTitle || placementData.designation || "Software Specialist",
      department: placementData.department || "Client Delivery",
      location: placementData.location || "Bengaluru, India",
      workMode: "Hybrid",
      joiningDate: placementData.joinedDate || placementData.joiningDate || new Date().toISOString(),
      employerOfRecord: isContract ? (placementData.vendorName || "HireNest Staffing Solutions Pvt Ltd") : "HireNest Staffing Solutions Pvt Ltd",
      clientId: placementData.clientId,
      clientName: placementData.clientName,
      vendorId: placementData.vendorId,
      vendorName: placementData.vendorName,
      requirementId: placementData.jobId || placementData.requirementId,
      requirementTitle: placementData.jobTitle,
      placementId: placementData.id || placementData.placementId,
      candidateId: placementData.candidateId,
      skills: placementData.skills || [],
      salaryDetails: {
        ctcAnnual: Number(placementData.finalCtc) || Number(placementData.offeredCtc) || 1200000,
        currency: "INR",
      },
      organizationId: placementData.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("employees").doc(id).set(employee);

    // Auto-create Leave Balance & Onboarding
    const leaveBal: LeaveBalance = {
      employeeId: id,
      employeeCode,
      employeeName: candidateName,
      casual: { total: 12, used: 0, remaining: 12 },
      sick: { total: 10, used: 0, remaining: 10 },
      earned: { total: 18, used: 0, remaining: 18 },
      maternity: { total: 180, used: 0, remaining: 180 },
      paternity: { total: 15, used: 0, remaining: 15 },
      lop: { used: 0 },
      year: new Date().getFullYear(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection("hr_leave_balances").doc(id).set(leaveBal);

    const onbRecord: OnboardingRecord = {
      id: `onb-${id}`,
      employeeId: id,
      employeeCode,
      employeeName: candidateName,
      employmentType: employee.employmentType,
      designation: employee.designation,
      department: employee.department,
      joiningDate: employee.joiningDate,
      targetCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      stage: "Documentation",
      status: "In Progress",
      progressPercent: 20,
      items: STANDARD_ONBOARDING_ITEMS.map((item, idx) => ({
        ...item,
        id: `onb-${id}-${idx + 1}`,
        status: idx < 2 ? "completed" : "pending",
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection("hr_onboarding").doc(id).set(onbRecord);

    await DomainEventPublisher.publish(
      "PLACEMENT_CONVERTED_TO_EMPLOYEE",
      "Employee",
      id,
      performedBy,
      {
        placementId: employee.placementId,
        candidateName,
        employeeCode,
        clientId: employee.clientId,
      }
    );

    return employee;
  }

  // -------------------------------------------------------------
  // ONBOARDING & DOCUMENTS
  // -------------------------------------------------------------
  async listOnboardingRecords(): Promise<OnboardingRecord[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const snap = await db.collection("hr_onboarding").get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as OnboardingRecord));
  }

  async updateOnboardingItem(
    employeeId: string,
    itemId: string,
    status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'completed',
    performedBy: string = "HR Operations",
    notes?: string
  ): Promise<OnboardingRecord> {
    const db = getAdminDb();
    const ref = db.collection("hr_onboarding").doc(employeeId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Onboarding record not found");

    const record = snap.data() as OnboardingRecord;
    const items = record.items.map(it => {
      if (it.id === itemId) {
        return {
          ...it,
          status,
          verifiedBy: status === "verified" || status === "completed" ? performedBy : it.verifiedBy,
          completedAt: status === "completed" || status === "verified" ? new Date().toISOString() : it.completedAt,
          notes: notes || it.notes,
        };
      }
      return it;
    });

    const completedCount = items.filter(it => it.status === "completed" || it.status === "verified").length;
    const progressPercent = Math.round((completedCount / items.length) * 100);
    const isAllComplete = progressPercent === 100;

    const payload: Partial<OnboardingRecord> = {
      items,
      progressPercent,
      stage: isAllComplete ? "Completed" : progressPercent > 60 ? "Asset Allocation" : progressPercent > 30 ? "Verification" : "Documentation",
      status: isAllComplete ? "Completed" : "In Progress",
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);

    if (isAllComplete) {
      // Transition employee to ACTIVE
      await db.collection("employees").doc(employeeId).update({
        status: "ACTIVE",
        updatedAt: new Date().toISOString(),
      });

      await DomainEventPublisher.publish(
        "ONBOARDING_COMPLETED",
        "Employee",
        employeeId,
        performedBy,
        { progressPercent: 100 }
      );
    }

    return { ...record, ...payload };
  }

  async listDocuments(employeeId: string): Promise<EmploymentDocument[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const snap = await db.collection("hr_documents").where("employeeId", "==", employeeId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmploymentDocument));
  }

  async uploadDocument(docData: Partial<EmploymentDocument>, performedBy: string = "HR Operations"): Promise<EmploymentDocument> {
    const db = getAdminDb();
    const id = docData.id || `doc-${crypto.randomUUID()}`;
    const doc: EmploymentDocument = {
      id,
      employeeId: docData.employeeId!,
      employeeName: docData.employeeName || "Employee",
      documentType: docData.documentType || "Government ID",
      title: docData.title || docData.fileName || "Uploaded Document",
      fileName: docData.fileName || "document.pdf",
      fileUrl: docData.fileUrl || "",
      fileSize: docData.fileSize || "1.2 MB",
      uploadedAt: new Date().toISOString(),
      verificationStatus: "pending",
      isRequired: docData.isRequired !== undefined ? docData.isRequired : true,
    };

    await db.collection("hr_documents").doc(id).set(doc);

    await DomainEventPublisher.publish(
      "DOCUMENT_UPLOADED",
      "EmploymentDocument",
      id,
      performedBy,
      { employeeId: doc.employeeId, documentType: doc.documentType }
    );

    return doc;
  }

  async verifyDocument(
    docId: string,
    verificationStatus: 'verified' | 'rejected',
    verifiedBy: string = "HR Operations",
    verificationNotes?: string
  ): Promise<EmploymentDocument> {
    const db = getAdminDb();
    const ref = db.collection("hr_documents").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Document not found");

    const payload = {
      verificationStatus,
      verifiedBy,
      verifiedAt: new Date().toISOString(),
      verificationNotes: verificationNotes || "",
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as EmploymentDocument;

    await DomainEventPublisher.publish(
      "DOCUMENT_VERIFIED",
      "EmploymentDocument",
      docId,
      verifiedBy,
      { verificationStatus, employeeId: updated.employeeId }
    );

    return updated;
  }

  // -------------------------------------------------------------
  // ATTENDANCE, SHIFTS & HOLIDAYS
  // -------------------------------------------------------------
  async listAttendance(date?: string, employeeId?: string): Promise<AttendanceRecord[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    let query: any = db.collection("hr_attendance");

    if (date) {
      query = query.where("date", "==", date);
    }
    if (employeeId) {
      query = query.where("employeeId", "==", employeeId);
    }

    const snap = await query.get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AttendanceRecord));
  }

  async clockAttendance(
    employeeId: string,
    action: 'IN' | 'OUT',
    locationType: 'Office' | 'Client Site' | 'Home' = 'Office',
    shift: string = 'General Shift (09:00 - 18:00)',
    performedBy: string = "Self"
  ): Promise<AttendanceRecord> {
    const db = getAdminDb();
    const empDoc = await db.collection("employees").doc(employeeId).get();
    const emp = empDoc.exists ? (empDoc.data() as Employee) : null;
    const employeeName = emp?.fullName || "Employee";
    const employeeCode = emp?.employeeCode || "HN-EMP";

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const id = `att-${employeeId}-${dateStr}`;

    const ref = db.collection("hr_attendance").doc(id);
    const snap = await ref.get();

    let record: AttendanceRecord;

    if (!snap.exists) {
      record = {
        id,
        employeeId,
        employeeCode,
        employeeName,
        date: dateStr,
        status: locationType === "Home" ? "WFH" : "PRESENT",
        checkInTime: timeStr,
        workHours: 0,
        overtimeHours: 0,
        shift,
        locationType,
        regularizationStatus: "None",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      await ref.set(record);
    } else {
      const existing = snap.data() as AttendanceRecord;
      let workHours = existing.workHours;
      let overtimeHours = existing.overtimeHours;

      if (action === "OUT" && existing.checkInTime) {
        const [inH, inM] = existing.checkInTime.split(":").map(Number);
        const [outH, outM] = timeStr.split(":").map(Number);
        const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        workHours = Math.max(0, Math.round((totalMinutes / 60) * 10) / 10);
        overtimeHours = Math.max(0, Math.round((workHours - 8) * 10) / 10);
      }

      record = {
        ...existing,
        checkOutTime: action === "OUT" ? timeStr : existing.checkOutTime,
        workHours,
        overtimeHours,
        updatedAt: now.toISOString(),
      };
      await ref.update(record);
    }

    await DomainEventPublisher.publish(
      "ATTENDANCE_LOGGED",
      "AttendanceRecord",
      id,
      performedBy,
      { employeeId, action, timeStr, date: dateStr }
    );

    return record;
  }

  async regularizeAttendance(
    recordId: string,
    reason: string,
    performedBy: string = "Employee"
  ): Promise<AttendanceRecord> {
    const db = getAdminDb();
    const ref = db.collection("hr_attendance").doc(recordId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Attendance record not found");

    const payload = {
      regularizationStatus: "Requested" as const,
      regularizationReason: reason,
      regularizationRequestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as AttendanceRecord;

    await DomainEventPublisher.publish(
      "ATTENDANCE_REGULARIZATION_REQUESTED",
      "AttendanceRecord",
      recordId,
      performedBy,
      { reason, employeeId: updated.employeeId }
    );

    return updated;
  }

  async approveRegularization(
    recordId: string,
    approved: boolean,
    approvedBy: string = "Manager / HR"
  ): Promise<AttendanceRecord> {
    const db = getAdminDb();
    const ref = db.collection("hr_attendance").doc(recordId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Attendance record not found");

    const payload = {
      status: approved ? "PRESENT" : "ABSENT",
      regularizationStatus: approved ? "Approved" : "Rejected",
      regularizedBy: approvedBy,
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as AttendanceRecord;

    await DomainEventPublisher.publish(
      "ATTENDANCE_REGULARIZATION_RESOLVED",
      "AttendanceRecord",
      recordId,
      approvedBy,
      { approved, employeeId: updated.employeeId }
    );

    return updated;
  }

  async listHolidays(): Promise<Holiday[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const snap = await db.collection("hr_holidays").get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Holiday)).sort((a, b) => a.date.localeCompare(b.date));
  }

  // -------------------------------------------------------------
  // LEAVE MANAGEMENT
  // -------------------------------------------------------------
  async getLeaveBalance(employeeId: string): Promise<LeaveBalance | null> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const snap = await db.collection("hr_leave_balances").doc(employeeId).get();
    if (!snap.exists) return null;
    return snap.data() as LeaveBalance;
  }

  async listLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    let query: any = db.collection("hr_leave_requests");
    if (employeeId) {
      query = query.where("employeeId", "==", employeeId);
    }
    const snap = await query.get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as LeaveRequest)).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }

  async createLeaveRequest(data: Partial<LeaveRequest>, performedBy: string = "Employee"): Promise<LeaveRequest> {
    const db = getAdminDb();
    const id = `lv-${crypto.randomUUID()}`;
    const employeeId = data.employeeId!;

    const empDoc = await db.collection("employees").doc(employeeId).get();
    const emp = empDoc.exists ? (empDoc.data() as Employee) : null;

    const request: LeaveRequest = {
      id,
      employeeId,
      employeeCode: emp?.employeeCode || data.employeeCode || "HN-EMP",
      employeeName: emp?.fullName || data.employeeName || "Employee",
      leaveType: data.leaveType || "CASUAL",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date().toISOString().split("T")[0],
      daysCount: data.daysCount || 1,
      reason: data.reason || "Personal work",
      status: "PENDING_MANAGER",
      managerApproval: { status: "pending" },
      hrApproval: { status: "pending" },
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("hr_leave_requests").doc(id).set(request);

    await DomainEventPublisher.publish(
      "LEAVE_REQUESTED",
      "LeaveRequest",
      id,
      performedBy,
      {
        employeeId,
        leaveType: request.leaveType,
        daysCount: request.daysCount,
        startDate: request.startDate,
      }
    );

    return request;
  }

  async approveLeaveRequest(
    requestId: string,
    role: 'manager' | 'hr',
    approvedBy: string = "Manager",
    comments?: string
  ): Promise<LeaveRequest> {
    const db = getAdminDb();
    const ref = db.collection("hr_leave_requests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Leave request not found");

    const req = snap.data() as LeaveRequest;

    let nextStatus: LeaveRequest['status'] = req.status;
    let managerApproval = req.managerApproval;
    let hrApproval = req.hrApproval;

    if (role === "manager") {
      managerApproval = {
        status: "approved",
        approvedBy,
        approvedAt: new Date().toISOString(),
        comments: comments || "Approved by reporting manager",
      };
      nextStatus = "APPROVED"; // Direct approval or transition
    } else {
      hrApproval = {
        status: "approved",
        approvedBy,
        approvedAt: new Date().toISOString(),
        comments: comments || "HR Approved",
      };
      nextStatus = "APPROVED";
    }

    const payload: Partial<LeaveRequest> = {
      status: nextStatus,
      managerApproval,
      hrApproval,
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);

    // If fully approved, deduct from LeaveBalance
    if (nextStatus === "APPROVED") {
      const balRef = db.collection("hr_leave_balances").doc(req.employeeId);
      const balSnap = await balRef.get();
      if (balSnap.exists) {
        const bal = balSnap.data() as LeaveBalance;
        const count = req.daysCount;

        if (req.leaveType === "CASUAL" && bal.casual) {
          bal.casual.used += count;
          bal.casual.remaining = Math.max(0, bal.casual.total - bal.casual.used);
        } else if (req.leaveType === "SICK" && bal.sick) {
          bal.sick.used += count;
          bal.sick.remaining = Math.max(0, bal.sick.total - bal.sick.used);
        } else if (req.leaveType === "EARNED" && bal.earned) {
          bal.earned.used += count;
          bal.earned.remaining = Math.max(0, bal.earned.total - bal.earned.used);
        } else if (req.leaveType === "UNPAID_LOP" && bal.lop) {
          bal.lop.used += count;
        }
        bal.updatedAt = new Date().toISOString();
        await balRef.set(bal);
      }
    }

    await DomainEventPublisher.publish(
      "LEAVE_APPROVED",
      "LeaveRequest",
      requestId,
      approvedBy,
      { employeeId: req.employeeId, daysCount: req.daysCount, leaveType: req.leaveType }
    );

    return { ...req, ...payload };
  }

  async rejectLeaveRequest(
    requestId: string,
    rejectedBy: string = "Manager",
    reason?: string
  ): Promise<LeaveRequest> {
    const db = getAdminDb();
    const ref = db.collection("hr_leave_requests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Leave request not found");

    const req = snap.data() as LeaveRequest;
    const payload: Partial<LeaveRequest> = {
      status: "REJECTED",
      managerApproval: {
        status: "rejected",
        approvedBy: rejectedBy,
        approvedAt: new Date().toISOString(),
        comments: reason || "Declined by management",
      },
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);

    await DomainEventPublisher.publish(
      "LEAVE_REJECTED",
      "LeaveRequest",
      requestId,
      rejectedBy,
      { employeeId: req.employeeId, reason }
    );

    return { ...req, ...payload };
  }

  // -------------------------------------------------------------
  // TIMESHEETS
  // -------------------------------------------------------------
  async listTimesheets(employeeId?: string, clientId?: string): Promise<Timesheet[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    let query: any = db.collection("hr_timesheets");
    if (employeeId) query = query.where("employeeId", "==", employeeId);
    if (clientId) query = query.where("clientId", "==", clientId);

    const snap = await query.get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Timesheet)).sort((a, b) => (b.period || "").localeCompare(a.period || ""));
  }

  async createTimesheet(data: Partial<Timesheet>, performedBy: string = "Employee"): Promise<Timesheet> {
    const db = getAdminDb();
    const id = data.id || `ts-${crypto.randomUUID()}`;
    const snap = await db.collection("hr_timesheets").get();
    const timesheetNumber = data.timesheetNumber || `TS-2608-${String(snap.size + 101).padStart(4, "0")}`;

    const totalReg = data.dailyEntries ? data.dailyEntries.reduce((sum, e) => sum + (Number(e.regularHours) || 0), 0) : 40;
    const totalOT = data.dailyEntries ? data.dailyEntries.reduce((sum, e) => sum + (Number(e.overtimeHours) || 0), 0) : 0;

    const timesheet: Timesheet = {
      id,
      timesheetNumber,
      employeeId: data.employeeId!,
      employeeCode: data.employeeCode || "HN-EMP",
      employeeName: data.employeeName || "Employee",
      employmentType: data.employmentType || "DEPLOYED_EMPLOYEE",
      period: data.period || "2026-W33 (Aug 10 - Aug 16)",
      startDate: data.startDate || "2026-08-10",
      endDate: data.endDate || "2026-08-16",
      clientId: data.clientId,
      clientName: data.clientName,
      requirementId: data.requirementId,
      projectTitle: data.projectTitle || "Core Client Engagement",
      billable: data.billable !== undefined ? data.billable : true,
      totalRegularHours: totalReg,
      totalOvertimeHours: totalOT,
      totalHours: totalReg + totalOT,
      dailyEntries: data.dailyEntries || [],
      status: data.status || "SUBMITTED",
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("hr_timesheets").doc(id).set(timesheet);

    await DomainEventPublisher.publish(
      "TIMESHEET_SUBMITTED",
      "Timesheet",
      id,
      performedBy,
      {
        timesheetNumber,
        employeeId: timesheet.employeeId,
        totalHours: timesheet.totalHours,
        billable: timesheet.billable,
      }
    );

    return timesheet;
  }

  async approveTimesheet(timesheetId: string, approvedBy: string = "Manager"): Promise<Timesheet> {
    const db = getAdminDb();
    const ref = db.collection("hr_timesheets").doc(timesheetId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Timesheet not found");

    const payload = {
      status: "APPROVED" as const,
      approvedBy,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as Timesheet;

    await DomainEventPublisher.publish(
      "TIMESHEET_APPROVED",
      "Timesheet",
      timesheetId,
      approvedBy,
      {
        timesheetNumber: updated.timesheetNumber,
        employeeId: updated.employeeId,
        totalHours: updated.totalHours,
      }
    );

    return updated;
  }

  async rejectTimesheet(timesheetId: string, rejectedBy: string = "Manager", rejectionReason?: string): Promise<Timesheet> {
    const db = getAdminDb();
    const ref = db.collection("hr_timesheets").doc(timesheetId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Timesheet not found");

    const payload = {
      status: "REJECTED" as const,
      approvedBy: rejectedBy,
      rejectionReason: rejectionReason || "Correction needed in logged hours",
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as Timesheet;

    await DomainEventPublisher.publish(
      "TIMESHEET_REJECTED",
      "Timesheet",
      timesheetId,
      rejectedBy,
      { rejectionReason }
    );

    return updated;
  }

  // -------------------------------------------------------------
  // EXPENSES
  // -------------------------------------------------------------
  async listExpenses(employeeId?: string): Promise<ExpenseClaim[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    let query: any = db.collection("hr_expenses");
    if (employeeId) query = query.where("employeeId", "==", employeeId);

    const snap = await query.get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ExpenseClaim)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createExpense(data: Partial<ExpenseClaim>, performedBy: string = "Employee"): Promise<ExpenseClaim> {
    const db = getAdminDb();
    const id = data.id || `exp-${crypto.randomUUID()}`;
    const snap = await db.collection("hr_expenses").get();
    const claimNumber = data.claimNumber || `EXP-2608-${String(snap.size + 101).padStart(3, "0")}`;

    const expense: ExpenseClaim = {
      id,
      claimNumber,
      employeeId: data.employeeId!,
      employeeCode: data.employeeCode || "HN-EMP",
      employeeName: data.employeeName || "Employee",
      category: data.category || "Travel",
      amount: Number(data.amount) || 0,
      currency: data.currency || "INR",
      expenseDate: data.expenseDate || new Date().toISOString().split("T")[0],
      merchantName: data.merchantName || "Merchant",
      description: data.description || "Business expense",
      receiptName: data.receiptName,
      receiptUrl: data.receiptUrl,
      status: data.status || "SUBMITTED",
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("hr_expenses").doc(id).set(expense);

    await DomainEventPublisher.publish(
      "EXPENSE_SUBMITTED",
      "ExpenseClaim",
      id,
      performedBy,
      {
        claimNumber,
        employeeId: expense.employeeId,
        amount: expense.amount,
        category: expense.category,
      }
    );

    return expense;
  }

  async approveExpense(expenseId: string, approvedBy: string = "HR / Finance", approvalNotes?: string): Promise<ExpenseClaim> {
    const db = getAdminDb();
    const ref = db.collection("hr_expenses").doc(expenseId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Expense not found");

    const payload = {
      status: "APPROVED" as const,
      approvedBy,
      approvedAt: new Date().toISOString(),
      approvalNotes: approvalNotes || "Verified and approved for reimbursement",
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as ExpenseClaim;

    await DomainEventPublisher.publish(
      "EXPENSE_APPROVED",
      "ExpenseClaim",
      expenseId,
      approvedBy,
      { claimNumber: updated.claimNumber, amount: updated.amount }
    );

    return updated;
  }

  async rejectExpense(expenseId: string, rejectedBy: string = "HR / Finance", rejectionReason?: string): Promise<ExpenseClaim> {
    const db = getAdminDb();
    const ref = db.collection("hr_expenses").doc(expenseId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Expense not found");

    const payload = {
      status: "REJECTED" as const,
      approvedBy: rejectedBy,
      rejectionReason: rejectionReason || "Invalid receipt or out of policy",
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);
    const updated = { ...snap.data(), ...payload } as ExpenseClaim;

    await DomainEventPublisher.publish(
      "EXPENSE_REJECTED",
      "ExpenseClaim",
      expenseId,
      rejectedBy,
      { rejectionReason }
    );

    return updated;
  }

  // -------------------------------------------------------------
  // OFFBOARDING
  // -------------------------------------------------------------
  async listOffboardingRecords(): Promise<OffboardingRecord[]> {
    await this.ensureSeeded();
    const db = getAdminDb();
    const snap = await db.collection("hr_offboarding").get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as OffboardingRecord));
  }

  async initiateOffboarding(data: Partial<OffboardingRecord>, performedBy: string = "HR Operations"): Promise<OffboardingRecord> {
    const db = getAdminDb();
    const employeeId = data.employeeId!;
    const empDoc = await db.collection("employees").doc(employeeId).get();
    if (!empDoc.exists) throw new Error("Employee not found");
    const emp = empDoc.data() as Employee;

    const id = `off-${employeeId}`;

    const defaultChecklist = [
      { id: "off-item-1", category: "Knowledge Handover" as const, item: "Document & Handover all active projects / repositories", completed: false },
      { id: "off-item-2", category: "Knowledge Handover" as const, item: "Client team alignment & transition sign-off", completed: false },
      { id: "off-item-3", category: "Asset Recovery" as const, item: "Return Corporate Laptop, Charger & Security Fob", completed: false },
      { id: "off-item-4", category: "IT Access Revocation" as const, item: "Revoke Google Workspace, GitHub & VPN credentials", completed: false },
      { id: "off-item-5", category: "Finance Clearance" as const, item: "Settle pending expense reimbursements & statutory deductions", completed: false },
      { id: "off-item-6", category: "HR Formalities" as const, item: "Conduct Exit Interview and record feedback", completed: false },
      { id: "off-item-7", category: "HR Formalities" as const, item: "Generate & Dispatch Relieving & Experience Certificate", completed: false },
    ];

    const record: OffboardingRecord = {
      id,
      employeeId,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      employmentType: emp.employmentType,
      designation: emp.designation,
      department: emp.department,
      resignationDate: data.resignationDate || new Date().toISOString().split("T")[0],
      lastWorkingDay: data.lastWorkingDay || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      noticePeriodDays: data.noticePeriodDays || 30,
      reasonForLeaving: data.reasonForLeaving || "Better opportunity / Career growth",
      handoverToEmployeeName: data.handoverToEmployeeName,
      exitInterviewNotes: data.exitInterviewNotes || "",
      checklist: defaultChecklist,
      assetReturnStatus: "Pending",
      itAccessRevoked: false,
      relievingLetterIssued: false,
      status: "Initiated",
      progressPercent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("hr_offboarding").doc(id).set(record);

    // Update employee status to NOTICE_PERIOD
    await db.collection("employees").doc(employeeId).update({
      status: "NOTICE_PERIOD",
      updatedAt: new Date().toISOString(),
    });

    await DomainEventPublisher.publish(
      "OFFBOARDING_INITIATED",
      "OffboardingRecord",
      id,
      performedBy,
      {
        employeeId,
        lastWorkingDay: record.lastWorkingDay,
        reason: record.reasonForLeaving,
      }
    );

    return record;
  }

  async updateOffboardingChecklist(
    offboardingId: string,
    itemId: string,
    completed: boolean,
    performedBy: string = "HR Operations"
  ): Promise<OffboardingRecord> {
    const db = getAdminDb();
    const ref = db.collection("hr_offboarding").doc(offboardingId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Offboarding record not found");

    const record = snap.data() as OffboardingRecord;
    const checklist = record.checklist.map(it => {
      if (it.id === itemId) {
        return {
          ...it,
          completed,
          completedBy: completed ? performedBy : undefined,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return it;
    });

    const completedCount = checklist.filter(it => it.completed).length;
    const progressPercent = Math.round((completedCount / checklist.length) * 100);
    const isAllComplete = progressPercent === 100;

    const assetItem = checklist.find(it => it.category === "Asset Recovery");
    const itItem = checklist.find(it => it.category === "IT Access Revocation");
    const certItem = checklist.find(it => it.item.includes("Relieving"));

    const payload: Partial<OffboardingRecord> = {
      checklist,
      progressPercent,
      assetReturnStatus: assetItem?.completed ? "Completed" : "Pending",
      itAccessRevoked: itItem?.completed || false,
      relievingLetterIssued: certItem?.completed || false,
      status: isAllComplete ? "Relieved" : progressPercent > 50 ? "Exit Completed" : "In Progress",
      updatedAt: new Date().toISOString(),
    };

    await ref.update(payload);

    if (isAllComplete) {
      await db.collection("employees").doc(record.employeeId).update({
        status: "OFFBOARDED",
        updatedAt: new Date().toISOString(),
      });

      await DomainEventPublisher.publish(
        "OFFBOARDING_COMPLETED",
        "OffboardingRecord",
        offboardingId,
        performedBy,
        { employeeId: record.employeeId }
      );
    }

    return { ...record, ...payload };
  }

  // -------------------------------------------------------------
  // WORKFORCE METRICS
  // -------------------------------------------------------------
  async getWorkforceMetrics(userContext?: any): Promise<WorkforceMetrics> {
    await this.ensureSeeded();
    const employees = await this.listEmployees(userContext);
    const todayStr = new Date().toISOString().split("T")[0];

    const totalHeadcount = employees.length;
    const internalCount = employees.filter(e => e.employmentType === "INTERNAL_EMPLOYEE").length;
    const deployedCount = employees.filter(e => e.employmentType === "DEPLOYED_EMPLOYEE").length;
    const contractorCount = employees.filter(e => e.employmentType === "CONTRACTOR").length;
    const consultantCount = employees.filter(e => e.employmentType === "CONSULTANT").length;
    const benchCount = employees.filter(e => e.employmentType === "BENCH_RESOURCE" || e.status === "BENCH").length;
    const activeHeadcount = employees.filter(e => e.status === "ACTIVE").length;
    const onboardingCount = employees.filter(e => e.status === "ONBOARDING").length;
    const noticePeriodCount = employees.filter(e => e.status === "NOTICE_PERIOD").length;

    // Today Attendance
    const attendances = await this.listAttendance(todayStr);
    const present = attendances.filter(a => a.status === "PRESENT").length;
    const wfh = attendances.filter(a => a.status === "WFH").length;
    const onLeave = attendances.filter(a => a.status === "ABSENT").length;
    const totalExpected = Math.max(activeHeadcount, attendances.length);
    const absent = Math.max(0, totalExpected - (present + wfh + onLeave));
    const attendanceRatePercent = totalExpected > 0 ? Math.round(((present + wfh) / totalExpected) * 100) : 100;

    // Pending Approvals
    const leaveRequests = await this.listLeaveRequests();
    const pendingLeaves = leaveRequests.filter(l => l.status === "PENDING_MANAGER" || l.status === "PENDING_HR").length;

    const timesheets = await this.listTimesheets();
    const pendingTimesheets = timesheets.filter(t => t.status === "SUBMITTED").length;

    const expenses = await this.listExpenses();
    const pendingExpenses = expenses.filter(e => e.status === "SUBMITTED").length;

    const onbRecords = await this.listOnboardingRecords();
    const pendingOnb = onbRecords.filter(o => o.status === "In Progress").length;

    const pendingRegularizations = attendances.filter(a => a.regularizationStatus === "Requested").length;

    return {
      totalHeadcount,
      internalCount,
      deployedCount,
      contractorCount,
      consultantCount,
      benchCount,
      activeHeadcount,
      onboardingCount,
      noticePeriodCount,
      todayAttendance: {
        totalExpected,
        present,
        wfh,
        absent,
        onLeave,
        attendanceRatePercent,
      },
      pendingApprovals: {
        leaveRequests: pendingLeaves,
        timesheets: pendingTimesheets,
        expenses: pendingExpenses,
        onboardingTasks: pendingOnb,
        regularizations: pendingRegularizations,
      },
    };
  }
}

export const hrService = new HrService();
