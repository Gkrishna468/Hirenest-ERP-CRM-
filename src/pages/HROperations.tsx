/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  FileCheck,
  Clock,
  Calendar,
  FileSpreadsheet,
  Receipt,
  LogOut,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Check,
  X,
  Info,
  MoreVertical,
  Download,
  Upload,
  AlertCircle,
  TrendingUp,
  Award,
  Zap,
  Briefcase,
  Building2,
  Lock,
  ChevronRight,
  Eye,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Employee,
  EmploymentType,
  EmployeeStatus,
  WorkMode,
  OnboardingRecord,
  AttendanceRecord,
  AttendanceStatus,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Timesheet,
  ExpenseClaim,
  OffboardingRecord
} from "@/types/hr";

const API_HEADERS = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

export default function HROperations() {
  const { user } = useAuth();
  const token = localStorage.getItem("firebaseToken") || "executive-bypass-token";
  const isAdmin = user?.role === "admin";

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "employees" | "onboarding" | "attendance" | "leaves" | "timesheets" | "expenses" | "offboarding"
  >("dashboard");

  // Loading & data states
  const [loading, setLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [offboardings, setOffboardings] = useState<OffboardingRecord[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Selected details / Modal states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showSubmitTimesheetModal, setShowSubmitTimesheetModal] = useState(false);
  const [showSubmitExpenseModal, setShowSubmitExpenseModal] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingRecord | null>(null);
  const [selectedOffboarding, setSelectedOffboarding] = useState<OffboardingRecord | null>(null);

  // Form states
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employmentType: "INTERNAL_EMPLOYEE" as EmploymentType,
    designation: "",
    department: "",
    location: "",
    workMode: "Onsite" as WorkMode,
    joiningDate: new Date().toISOString().split("T")[0],
    employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
    clientId: "",
    clientName: "",
    vendorId: "",
    vendorName: "",
    placementId: "",
    skills: "",
    ctcAnnual: "",
    baseMonthly: ""
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    leaveType: "CASUAL" as LeaveType,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });

  const [timesheetForm, setTimesheetForm] = useState({
    employeeId: "",
    clientId: "",
    clientName: "",
    period: "2026-W33 (Aug 10 - Aug 16)",
    startDate: "2026-08-10",
    endDate: "2026-08-16",
    days: [
      { date: "2026-08-10", day: "Mon", hours: 8, task: "" },
      { date: "2026-08-11", day: "Tue", hours: 8, task: "" },
      { date: "2026-08-12", day: "Wed", hours: 8, task: "" },
      { date: "2026-08-13", day: "Thu", hours: 8, task: "" },
      { date: "2026-08-14", day: "Fri", hours: 8, task: "" },
      { date: "2026-08-15", day: "Sat", hours: 0, task: "" },
      { date: "2026-08-16", day: "Sun", hours: 0, task: "" }
    ]
  });

  const [expenseForm, setExpenseForm] = useState({
    employeeId: "",
    claimNumber: "",
    title: "",
    amount: "",
    category: "Travel" as any,
    merchant: "",
    expenseDate: new Date().toISOString().split("T")[0],
    description: ""
  });

  const [offboardForm, setOffboardForm] = useState({
    employeeId: "",
    resignationDate: new Date().toISOString().split("T")[0],
    lastWorkingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "",
    noticeServed: true
  });

  // Fetch all operational data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Employees
      const empRes = await fetch("/api/hr/employees", { headers: API_HEADERS(token) });
      const empJson = await empRes.json();
      if (empJson.success) setEmployees(empJson.data);

      // Onboarding
      const onRes = await fetch("/api/hr/onboarding", { headers: API_HEADERS(token) });
      const onJson = await onRes.json();
      if (onJson.success) setOnboarding(onJson.data);

      // Attendance (today's log by default)
      const attRes = await fetch("/api/hr/attendance", { headers: API_HEADERS(token) });
      const attJson = await attRes.json();
      if (attJson.success) setAttendance(attJson.data);

      // Holidays
      const holRes = await fetch("/api/hr/holidays", { headers: API_HEADERS(token) });
      const holJson = await holRes.json();
      if (holJson.success) setHolidays(holJson.data);

      // Leave Requests
      const leaveRes = await fetch("/api/hr/leave/requests", { headers: API_HEADERS(token) });
      const leaveJson = await leaveRes.json();
      if (leaveJson.success) setLeaveRequests(leaveJson.data);

      // Timesheets
      const tsRes = await fetch("/api/hr/timesheets", { headers: API_HEADERS(token) });
      const tsJson = await tsRes.json();
      if (tsJson.success) setTimesheets(tsJson.data);

      // Expenses
      const expRes = await fetch("/api/hr/expenses", { headers: API_HEADERS(token) });
      const expJson = await expRes.json();
      if (expJson.success) setExpenses(expJson.data);

      // Offboarding
      const offRes = await fetch("/api/hr/offboarding", { headers: API_HEADERS(token) });
      const offJson = await offRes.json();
      if (offJson.success) setOffboardings(offJson.data);

      // Metrics
      const mRes = await fetch("/api/hr/metrics", { headers: API_HEADERS(token) });
      const mJson = await mRes.json();
      if (mJson.success) setMetrics(mJson.data);

      // Pre-fill employee select dropdowns
      if (empJson.data && empJson.data.length > 0) {
        const firstEmp = empJson.data[0];
        setLeaveForm(prev => ({ ...prev, employeeId: firstEmp.id }));
        setTimesheetForm(prev => ({ ...prev, employeeId: firstEmp.id }));
        setExpenseForm(prev => ({ ...prev, employeeId: firstEmp.id }));
        setOffboardForm(prev => ({ ...prev, employeeId: firstEmp.id }));
        
        // Fetch leave balances for first employee
        fetchLeaveBalances(firstEmp.id);
      }
    } catch (err: any) {
      console.error("Error loading HR dashboard data:", err);
      toast.error("Failed to load workforce operations telemetry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalances = async (empId: string) => {
    try {
      const res = await fetch(`/api/hr/leave/balances/${empId}`, { headers: API_HEADERS(token) });
      const json = await res.json();
      if (json.success && json.data) {
        setLeaveBalances(prev => ({
          ...prev,
          [empId]: json.data
        }));
      }
    } catch (e) {
      console.error("Failed to load balances", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle employee selection change in forms
  const handleFormEmployeeChange = (field: string, empId: string) => {
    if (field === "leave") {
      setLeaveForm(prev => ({ ...prev, employeeId: empId }));
      fetchLeaveBalances(empId);
    } else if (field === "timesheet") {
      const emp = employees.find(e => e.id === empId);
      setTimesheetForm(prev => ({
        ...prev,
        employeeId: empId,
        clientId: emp?.clientId || "",
        clientName: emp?.clientName || ""
      }));
    } else if (field === "expense") {
      setExpenseForm(prev => ({ ...prev, employeeId: empId }));
    } else if (field === "offboard") {
      setOffboardForm(prev => ({ ...prev, employeeId: empId }));
    }
  };

  // Clock Actions (Clock In/Out)
  const handleClockAction = async (employeeId: string, action: "IN" | "OUT") => {
    try {
      const res = await fetch("/api/hr/attendance/clock", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({
          employeeId,
          action,
          locationType: "Office",
          shift: "General Shift (09:00 - 18:00)"
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Successfully clocked ${action.toLowerCase()}!`);
        // Refresh attendance records
        const attRes = await fetch("/api/hr/attendance", { headers: API_HEADERS(token) });
        const attJson = await attRes.json();
        if (attJson.success) setAttendance(attJson.data);
        
        // Refresh metrics
        const mRes = await fetch("/api/hr/metrics", { headers: API_HEADERS(token) });
        const mJson = await mRes.json();
        if (mJson.success) setMetrics(mJson.data);
      } else {
        toast.error(json.error || "Clocking failed");
      }
    } catch (err) {
      toast.error("Network error during clock event.");
    }
  };

  // Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillArray = newEmployeeForm.skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        ...newEmployeeForm,
        skills: skillArray,
        salaryDetails: {
          ctcAnnual: Number(newEmployeeForm.ctcAnnual) || undefined,
          baseMonthly: Number(newEmployeeForm.baseMonthly) || undefined,
          currency: "INR"
        }
      };

      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Workforce profile generated successfully!");
        setShowAddEmployeeModal(false);
        // Reset form
        setNewEmployeeForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          employmentType: "INTERNAL_EMPLOYEE",
          designation: "",
          department: "",
          location: "",
          workMode: "Onsite",
          joiningDate: new Date().toISOString().split("T")[0],
          employerOfRecord: "HireNest Staffing Solutions Pvt Ltd",
          clientId: "",
          clientName: "",
          vendorId: "",
          vendorName: "",
          placementId: "",
          skills: "",
          ctcAnnual: "",
          baseMonthly: ""
        });
        fetchData();
      } else {
        toast.error(json.error || "Failed to create profile.");
      }
    } catch (err) {
      toast.error("Network error creating workforce profile.");
    }
  };

  // Update Onboarding Item Status
  const handleUpdateOnboardingItem = async (recordId: string, itemId: string, newStatus: string) => {
    try {
      const record = onboarding.find(r => r.id === recordId);
      if (!record) return;

      const res = await fetch(`/api/hr/onboarding/${record.employeeId}/update-item`, {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({
          itemId,
          status: newStatus,
          notes: `Verified by HR Operations on ${new Date().toLocaleDateString()}`
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Onboarding item status synchronized!");
        // Update local state
        setOnboarding(prev =>
          prev.map(r => (r.id === recordId ? json.data : r))
        );
        if (selectedOnboarding?.id === recordId) {
          setSelectedOnboarding(json.data);
        }
        
        // Refresh metrics
        const mRes = await fetch("/api/hr/metrics", { headers: API_HEADERS(token) });
        const mJson = await mRes.json();
        if (mJson.success) setMetrics(mJson.data);
      } else {
        toast.error(json.error || "Failed to update checklist.");
      }
    } catch (err) {
      toast.error("Network error updating checklist state.");
    }
  };

  // Regularize Attendance Request
  const handleRegularizeAttendance = async (recordId: string, reason: string) => {
    try {
      const res = await fetch("/api/hr/attendance/regularize", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({ recordId, reason })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Regularization requested!");
        // Refresh
        const attRes = await fetch("/api/hr/attendance", { headers: API_HEADERS(token) });
        const attJson = await attRes.json();
        if (attJson.success) setAttendance(attJson.data);
      } else {
        toast.error(json.error || "Request failed");
      }
    } catch (err) {
      toast.error("Network error submitting request.");
    }
  };

  // Approve Regularization (Admin Only)
  const handleApproveRegularization = async (recordId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/hr/attendance/${recordId}/approve-regularization`, {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({ approved })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(approved ? "Regularization approved!" : "Regularization rejected!");
        // Refresh
        const attRes = await fetch("/api/hr/attendance", { headers: API_HEADERS(token) });
        const attJson = await attRes.json();
        if (attJson.success) setAttendance(attJson.data);
      } else {
        toast.error(json.error || "Approval update failed");
      }
    } catch (err) {
      toast.error("Network error updating request.");
    }
  };

  // Submit Leave Request
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emp = employees.find(emp => emp.id === leaveForm.employeeId);
      const res = await fetch("/api/hr/leave/requests", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({
          ...leaveForm,
          employeeCode: emp?.employeeCode || "",
          employeeName: emp?.fullName || ""
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Leave request logged successfully.");
        setShowApplyLeaveModal(false);
        setLeaveForm(prev => ({
          ...prev,
          reason: ""
        }));
        // Refresh requests and metrics
        fetchData();
      } else {
        toast.error(json.error || "Failed to submit leave request.");
      }
    } catch (err) {
      toast.error("Network error submitting leave request.");
    }
  };

  // Handle Leave Approval
  const handleLeaveApproval = async (id: string, action: "approve" | "reject", comments = "") => {
    try {
      const url = `/api/hr/leave/requests/${id}/${action}`;
      const res = await fetch(url, {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify(
          action === "approve"
            ? { role: isAdmin ? "hr" : "manager", comments }
            : { reason: comments || "Rejected by operations" }
        )
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Leave request ${action}d!`);
        fetchData();
      } else {
        toast.error(json.error || "Action failed.");
      }
    } catch (err) {
      toast.error("Network error processing leave approval.");
    }
  };

  // Submit Timesheet
  const handleSubmitTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emp = employees.find(emp => emp.id === timesheetForm.employeeId);
      const totalRegularHours = timesheetForm.days.reduce((sum, d) => sum + Number(d.hours), 0);

      const payload = {
        employeeId: timesheetForm.employeeId,
        employeeCode: emp?.employeeCode || "",
        employeeName: emp?.fullName || "",
        employmentType: emp?.employmentType || "INTERNAL_EMPLOYEE",
        period: timesheetForm.period,
        startDate: timesheetForm.startDate,
        endDate: timesheetForm.endDate,
        clientId: timesheetForm.clientId || undefined,
        clientName: timesheetForm.clientName || undefined,
        totalRegularHours,
        totalOvertimeHours: 0,
        dailyEntries: timesheetForm.days.map(d => ({
          date: d.date,
          day: d.day,
          regularHours: Number(d.hours),
          overtimeHours: 0,
          taskDescription: d.task || "Work Duty",
          status: d.hours > 0 ? "working" as const : "leave" as const
        }))
      };

      const res = await fetch("/api/hr/timesheets", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Timesheet lodged and routed for approval!");
        setShowSubmitTimesheetModal(false);
        fetchData();
      } else {
        toast.error(json.error || "Failed to log timesheet.");
      }
    } catch (err) {
      toast.error("Network error submitting timesheet.");
    }
  };

  // Approve/Reject Timesheet
  const handleTimesheetAction = async (id: string, action: "approve" | "reject", reason = "") => {
    try {
      const url = `/api/hr/timesheets/${id}/${action}`;
      const res = await fetch(url, {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify(action === "reject" ? { reason } : {})
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Timesheet ${action}d!`);
        fetchData();
      } else {
        toast.error(json.error || "Action failed.");
      }
    } catch (err) {
      toast.error("Network error processing timesheet.");
    }
  };

  // Submit Expense Claim
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emp = employees.find(emp => emp.id === expenseForm.employeeId);
      const res = await fetch("/api/hr/expenses", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({
          ...expenseForm,
          employeeCode: emp?.employeeCode || "",
          employeeName: emp?.fullName || "",
          amount: Number(expenseForm.amount),
          claimNumber: `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Expense claim filed!");
        setShowSubmitExpenseModal(false);
        setExpenseForm(prev => ({
          ...prev,
          title: "",
          amount: "",
          merchant: "",
          description: ""
        }));
        fetchData();
      } else {
        toast.error(json.error || "Failed to submit expense claim.");
      }
    } catch (err) {
      toast.error("Network error submitting claim.");
    }
  };

  // Approve/Reject Expense
  const handleExpenseAction = async (id: string, action: "approve" | "reject", comments = "") => {
    try {
      const url = `/api/hr/expenses/${id}/${action}`;
      const res = await fetch(url, {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify(action === "reject" ? { reason: comments } : { notes: comments })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Expense claim ${action}d!`);
        fetchData();
      } else {
        toast.error(json.error || "Action failed.");
      }
    } catch (err) {
      toast.error("Network error processing claim.");
    }
  };

  // Submit Offboarding
  const handleOffboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emp = employees.find(emp => emp.id === offboardForm.employeeId);
      const res = await fetch("/api/hr/offboarding", {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({
          ...offboardForm,
          employeeCode: emp?.employeeCode || "",
          employeeName: emp?.fullName || "",
          designation: emp?.designation || "",
          department: emp?.department || ""
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Offboarding pipeline initialized!");
        setShowOffboardModal(false);
        fetchData();
      } else {
        toast.error(json.error || "Failed to start offboarding.");
      }
    } catch (err) {
      toast.error("Network error initializing offboarding.");
    }
  };

  // Complete Offboarding Checklist Item
  const handleUpdateOffboardingItem = async (recordId: string, itemId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/hr/offboarding/${recordId}/update-checklist`, {
        method: "POST",
        headers: API_HEADERS(token),
        body: JSON.stringify({ itemId, completed })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Asset recovery checklists updated!");
        // Refresh offboarding details
        const offRes = await fetch("/api/hr/offboarding", { headers: API_HEADERS(token) });
        const offJson = await offRes.json();
        if (offJson.success) {
          setOffboardings(offJson.data);
          const updatedRecord = offJson.data.find((o: any) => o.id === recordId);
          if (updatedRecord && selectedOffboarding?.id === recordId) {
            setSelectedOffboarding(updatedRecord);
          }
        }
        
        // Refresh metrics
        const mRes = await fetch("/api/hr/metrics", { headers: API_HEADERS(token) });
        const mJson = await mRes.json();
        if (mJson.success) setMetrics(mJson.data);
      } else {
        toast.error(json.error || "Update failed.");
      }
    } catch (err) {
      toast.error("Network error updating offboarding item.");
    }
  };

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    const matchesType = typeFilter === "ALL" || emp.employmentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex-1 bg-slate-50 min-h-screen text-slate-800 flex flex-col">
      {/* Top Breadcrumb & Actions */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Workforce Management</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 font-extrabold">v3.0 HR Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            Workforce Center
          </h1>
        </div>

        {/* Global Action Drawer Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="skeuo-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-extrabold shadow-md transition-all text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add Employee Profile
            </button>
          )}
          <button
            onClick={() => setShowApplyLeaveModal(true)}
            className="border border-slate-300 hover:bg-slate-100 bg-white shadow-sm flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-extrabold text-slate-700 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            Log Leave Request
          </button>
          <button
            onClick={() => setShowSubmitTimesheetModal(true)}
            className="border border-slate-300 hover:bg-slate-100 bg-white shadow-sm flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-extrabold text-slate-700 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            Log Weekly Timesheet
          </button>
          <button
            onClick={() => setShowSubmitExpenseModal(true)}
            className="border border-slate-300 hover:bg-slate-100 bg-white shadow-sm flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-extrabold text-slate-700 transition-all"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            File Expense Claim
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 space-y-6">
        {/* Executive View Summary (Admin/Founder Specific) */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Active Workforce
                </p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                  {metrics.totalEmployees || 0}
                </h3>
                <p className="text-[10px] text-indigo-600 font-extrabold mt-1">
                  {metrics.activeOnboarding || 0} currently onboarding
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Bench Pool
                </p>
                <h3 className="text-3xl font-black text-orange-600 tracking-tight">
                  {metrics.benchCount || 0}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  Idle talent pool ready for assignment
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center text-orange-600 shadow-sm">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Leaves Pending HR Approval
                </p>
                <h3 className="text-3xl font-black text-red-600 tracking-tight">
                  {metrics.pendingLeaves || 0}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  Awaiting operational signoff
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-600 shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Onboarding SLA Status
                </p>
                <h3 className="text-3xl font-black text-green-600 tracking-tight">
                  94.2%
                </h3>
                <p className="text-[10px] text-green-700 font-extrabold mt-1">
                  Perfect SLA compliance matrix
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center text-green-600 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Workspace Tab Navigation */}
        <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex overflow-x-auto py-1 gap-1">
            {[
              { id: "dashboard", label: "Operations Room", icon: Activity },
              { id: "employees", label: "Employee 360", icon: Users },
              { id: "onboarding", label: "Onboarding Hub", icon: FileCheck },
              { id: "attendance", label: "Time & Attendance", icon: Clock },
              { id: "leaves", label: "Leave Desk", icon: Calendar },
              { id: "timesheets", label: "Timesheets", icon: FileSpreadsheet },
              { id: "expenses", label: "Expense Ledger", icon: Receipt },
              { id: "offboarding", label: "Offboarding Pipeline", icon: LogOut }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery("");
                }}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-t-lg font-sans text-sm font-extrabold transition-all border-b-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-100 shadow-sm"
          >
            Refresh Telemetry
          </button>
        </div>

        {/* Tab Content Panels */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-extrabold text-sm tracking-wide">
              Loading workforce data pipelines...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. OPERATIONS ROOM (DASHBOARD) */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clock Panel / Attendance Box */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1">
                  <div className="bg-indigo-600 p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">
                      Time Clock Module
                    </p>
                    <h3 className="text-xl font-black">Attendance Punch</h3>
                    <p className="text-xs text-indigo-100 mt-1">
                      Self-service clock controls for tracking physical & remote shifts.
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {user?.name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{user?.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{user?.role} Account</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Online
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const currentEmp = employees[0]; // Self or first employee for demo
                          if (currentEmp) {
                            handleClockAction(currentEmp.id, "IN");
                          } else {
                            toast.error("No active employee profile linked.");
                          }
                        }}
                        className="skeuo-btn-primary py-3 rounded-lg text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 flex flex-col items-center justify-center gap-1.5"
                      >
                        <Clock className="w-5 h-5" />
                        Clock In
                      </button>
                      <button
                        onClick={() => {
                          const currentEmp = employees[0];
                          if (currentEmp) {
                            handleClockAction(currentEmp.id, "OUT");
                          } else {
                            toast.error("No active employee profile linked.");
                          }
                        }}
                        className="border border-slate-300 hover:bg-slate-100 bg-white py-3 rounded-lg text-sm font-extrabold text-slate-700 flex flex-col items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-5 h-5 text-slate-500" />
                        Clock Out
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Today's Attendance Logs
                      </p>
                      {attendance.length === 0 ? (
                        <p className="text-xs text-slate-400">No clock events logged for today yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {attendance.slice(0, 3).map((att, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                              <span className="font-bold text-slate-700">{att.employeeName}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-black",
                                  att.status === "PRESENT" ? "bg-green-50 text-green-700 border border-green-200" :
                                  att.status === "LATE" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                  "bg-slate-50 text-slate-600 border border-slate-200"
                                )}>
                                  {att.status}
                                </span>
                                <span className="text-slate-400 font-bold">{att.checkInTime || "--:--"} - {att.checkOutTime || "--:--"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approvals Central Console */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Operational Approval Board</h3>
                      <p className="text-xs text-slate-500">Unify leave requests, timesheets, and expense claims waiting for HR action.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                      {(leaveRequests.filter(r => r.status === "PENDING_HR" || r.status === "PENDING_MANAGER").length) +
                       (timesheets.filter(t => t.status === "SUBMITTED").length) +
                       (expenses.filter(e => e.status === "SUBMITTED").length)} Pending
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[360px]">
                    {/* Leaves waiting */}
                    {leaveRequests.filter(r => r.status === "PENDING_HR" || r.status === "PENDING_MANAGER").map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 gap-4 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black text-xs">
                            LV
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Leave Request</p>
                            <p className="text-sm font-black text-slate-800">{req.employeeName} ({req.employeeCode})</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {req.leaveType} &bull; {req.startDate} to {req.endDate} ({req.daysCount} days)
                            </p>
                            <p className="text-xs italic text-slate-500 bg-white p-1.5 border border-slate-100 rounded mt-1 max-w-md">"{req.reason}"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleLeaveApproval(req.id, "approve", "Approved by Ops")}
                            className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 text-xs font-black flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleLeaveApproval(req.id, "reject", "Rejected due to bench availability")}
                            className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 text-xs font-black flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Timesheets waiting */}
                    {timesheets.filter(ts => ts.status === "SUBMITTED").map(ts => (
                      <div key={ts.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 gap-4 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">
                            TS
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Timesheet Submission</p>
                            <p className="text-sm font-black text-slate-800">{ts.employeeName} ({ts.employeeCode})</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ts.period} &bull; Hours Booked: <span className="font-bold text-indigo-600">{ts.totalRegularHours} hrs</span>
                            </p>
                            {ts.clientName && (
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Client: {ts.clientName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleTimesheetAction(ts.id, "approve")}
                            className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 text-xs font-black flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleTimesheetAction(ts.id, "reject", "Incorrect hourly allocation")}
                            className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 text-xs font-black flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Expenses waiting */}
                    {expenses.filter(exp => exp.status === "SUBMITTED").map(exp => (
                      <div key={exp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 gap-4 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-black text-xs">
                            EX
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expense Claim</p>
                            <p className="text-sm font-black text-slate-800">{exp.employeeName} ({exp.employeeCode})</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {exp.description} &bull; <span className="font-extrabold text-amber-600">₹{exp.amount}</span> ({exp.category})
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">{exp.merchantName} on {exp.expenseDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleExpenseAction(exp.id, "approve", "Approved by Finance Dept")}
                            className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 text-xs font-black flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleExpenseAction(exp.id, "reject", "Receipt missing")}
                            className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 text-xs font-black flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {leaveRequests.filter(r => r.status === "PENDING_HR" || r.status === "PENDING_MANAGER").length === 0 &&
                     timesheets.filter(t => t.status === "SUBMITTED").length === 0 &&
                     expenses.filter(e => e.status === "SUBMITTED").length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10">
                        <CheckCircle2 className="w-10 h-10 text-green-400 mb-2" />
                        <p className="text-slate-500 font-extrabold text-sm">Perfect! No pending approval queues.</p>
                        <p className="text-slate-400 text-xs">All workforce requests are up to date.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. EMPLOYEE 360 PANEL */}
            {activeTab === "employees" && (
              <div className="space-y-6">
                {/* Search & filters */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search employees by name, code, skill..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ONBOARDING">ONBOARDING</option>
                        <option value="PROBATION">PROBATION</option>
                        <option value="BENCH">BENCH</option>
                        <option value="OFFBOARDED">OFFBOARDED</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent"
                      >
                        <option value="ALL">All Types</option>
                        <option value="INTERNAL_EMPLOYEE">INTERNAL EMPLOYEE</option>
                        <option value="DEPLOYED_EMPLOYEE">DEPLOYED EMPLOYEE</option>
                        <option value="CONTRACTOR">CONTRACTOR</option>
                        <option value="CONSULTANT">CONSULTANT</option>
                        <option value="BENCH_RESOURCE">BENCH RESOURCE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Employees Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees.map(emp => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 p-6 shadow-sm transition-all cursor-pointer hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                            {emp.employeeCode}
                          </span>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-black",
                            emp.status === "ACTIVE" ? "bg-green-50 text-green-700 border border-green-200" :
                            emp.status === "ONBOARDING" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                            emp.status === "BENCH" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                            "bg-slate-50 text-slate-600 border border-slate-200"
                          )}>
                            {emp.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner">
                            {emp.fullName?.[0]}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-800 tracking-tight">{emp.fullName}</h4>
                            <p className="text-xs text-slate-500">{emp.designation} &bull; {emp.department}</p>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-100 pt-4 mb-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Employment Type</span>
                            <span className="font-bold text-slate-700">{emp.employmentType.replace("_", " ")}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Work Location</span>
                            <span className="font-bold text-slate-700">{emp.location} ({emp.workMode})</span>
                          </div>
                          {emp.clientName && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Client Assignment</span>
                              <span className="font-extrabold text-indigo-600 truncate max-w-[150px]">{emp.clientName}</span>
                            </div>
                          )}
                        </div>

                        {emp.skills && emp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {emp.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold">
                                {skill}
                              </span>
                            ))}
                            {emp.skills.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[10px] font-bold">
                                +{emp.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Joined: {new Date(emp.joiningDate).toLocaleDateString()}</span>
                        <span className="text-indigo-600 hover:underline flex items-center gap-1">
                          View Employee 360 <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <div className="col-span-full bg-white rounded-xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                      <Users className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-slate-500 font-extrabold text-sm">No employees match your filter criteria.</p>
                      <button
                        onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); setTypeFilter("ALL"); }}
                        className="text-xs text-indigo-600 font-bold hover:underline mt-2"
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ONBOARDING HUB */}
            {activeTab === "onboarding" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Onboarding List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1 flex flex-col">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 text-lg">Onboarding Enlistments</h3>
                    <p className="text-xs text-slate-500">Track candidates progressing from placement to active employee joining.</p>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto max-h-[500px]">
                    {onboarding.map(onb => (
                      <div
                        key={onb.id}
                        onClick={() => setSelectedOnboarding(onb)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer",
                          selectedOnboarding?.id === onb.id
                            ? "bg-indigo-50 border-indigo-300"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-sm text-slate-800">{onb.employeeName}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black",
                            onb.status === "Completed" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          )}>
                            {onb.stage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{onb.designation} &bull; {onb.department}</p>
                        
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>Checklist Progress</span>
                            <span>{onb.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${onb.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {onboarding.length === 0 && (
                      <p className="text-slate-400 text-xs text-center py-6">No onboarding records found.</p>
                    )}
                  </div>
                </div>

                {/* Checklist Details (Selected) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
                  {selectedOnboarding ? (
                    <div>
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">{selectedOnboarding.employeeName}</h3>
                          <p className="text-xs text-slate-500">
                            Onboarding Checklist &bull; Code: {selectedOnboarding.employeeCode} &bull; Target: {selectedOnboarding.targetCompletionDate}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm">
                          {selectedOnboarding.status}
                        </span>
                      </div>

                      <div className="p-6 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Onboarding Task Checklist
                        </h4>
                        <div className="space-y-2">
                          {selectedOnboarding.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                              <div className="flex items-start gap-3">
                                <span className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-inner border",
                                  item.status === "completed" || item.status === "verified"
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                                )}>
                                  {item.status === "completed" || item.status === "verified" ? "✓" : "•"}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded font-bold border border-slate-200 mt-1 uppercase">
                                    {item.category}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {(item.status === "pending" || item.status === "submitted") && (
                                  <button
                                    onClick={() => handleUpdateOnboardingItem(selectedOnboarding.id, item.id, "completed")}
                                    className="px-2.5 py-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold"
                                  >
                                    Mark Complete
                                  </button>
                                )}
                                {(item.status === "completed" || item.status === "verified") && (
                                  <span className="text-xs text-green-700 font-extrabold flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                    Done
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                      <FileCheck className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                      <p className="text-slate-500 font-extrabold text-sm">Select an onboarding enlistment</p>
                      <p className="text-slate-400 text-xs max-w-xs">Review compliance checklist item updates and documents.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. TIME & ATTENDANCE */}
            {activeTab === "attendance" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance logs */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">Daily Attendance Register</h3>
                      <p className="text-xs text-slate-500">Monitor daily log registers, overtime logs, and location shifts.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                          <th className="py-4 px-6">Employee</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">In - Out</th>
                          <th className="py-4 px-6">Hours Logged</th>
                          <th className="py-4 px-6">Regularize</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {attendance.map(att => (
                          <tr key={att.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold text-slate-800">{att.employeeName}</p>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{att.employeeCode}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded text-xs font-black border",
                                att.status === "PRESENT" ? "bg-green-50 text-green-700 border-green-200" :
                                att.status === "ABSENT" ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              )}>
                                {att.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-600">
                              {att.checkInTime || "--:--"} - {att.checkOutTime || "--:--"}
                            </td>
                            <td className="py-4 px-6 font-bold text-indigo-600">
                              {att.workHours} hrs
                            </td>
                            <td className="py-4 px-6">
                              {att.regularizationStatus === "Requested" ? (
                                <div className="flex items-center gap-1">
                                  {isAdmin ? (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleApproveRegularization(att.id, true)}
                                        className="p-1 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded text-xs font-black"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleApproveRegularization(att.id, false)}
                                        className="p-1 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded text-xs font-black"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                                      Requested
                                    </span>
                                  )}
                                </div>
                              ) : att.regularizationStatus === "Approved" ? (
                                <span className="text-[10px] bg-green-50 text-green-700 font-extrabold px-1.5 py-0.5 rounded border border-green-200">
                                  Regularized
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRegularizeAttendance(att.id, "Correction for late clock event")}
                                  className="text-xs text-indigo-600 hover:underline font-bold"
                                >
                                  Request
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Holiday Calendar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 text-lg">Holiday Calendar</h3>
                    <p className="text-xs text-slate-500">Mandatory national and local state holidays scheduled.</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {holidays.map(hol => (
                      <div key={hol.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{hol.name}</p>
                          <span className="text-[10px] text-slate-400 font-bold">{hol.date} &bull; {hol.day}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black border",
                          hol.type === "National" ? "bg-red-50 text-red-700 border-red-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        )}>
                          {hol.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. LEAVE DESK */}
            {activeTab === "leaves" && (
              <div className="space-y-6">
                {/* Leave Balances Header Panel */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-slate-800 text-lg mb-4">Leave Balances & Accruals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Casual Leave</p>
                      <h4 className="text-2xl font-black text-slate-800">12 / 12</h4>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Available</p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sick Leave</p>
                      <h4 className="text-2xl font-black text-slate-800">10 / 10</h4>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Available</p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Earned Leave</p>
                      <h4 className="text-2xl font-black text-slate-800">18 / 18</h4>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Available</p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Maternity Leave</p>
                      <h4 className="text-2xl font-black text-slate-800">84 / 84</h4>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Available</p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paternity Leave</p>
                      <h4 className="text-2xl font-black text-slate-800">15 / 15</h4>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Available</p>
                    </div>
                  </div>
                </div>

                {/* Leave Requests Logs */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">Leave Requests History</h3>
                      <p className="text-xs text-slate-500">Monitor all past and pending leave requests from teams.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                          <th className="py-4 px-6">Employee</th>
                          <th className="py-4 px-6">Type</th>
                          <th className="py-4 px-6">Dates Requested</th>
                          <th className="py-4 px-6">Days</th>
                          <th className="py-4 px-6">Reason</th>
                          <th className="py-4 px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {leaveRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold text-slate-800">{req.employeeName}</p>
                                <span className="text-[10px] font-black text-slate-400">{req.employeeCode}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-bold text-indigo-600">{req.leaveType}</td>
                            <td className="py-4 px-6 text-slate-600 font-bold">{req.startDate} to {req.endDate}</td>
                            <td className="py-4 px-6 font-bold">{req.daysCount} days</td>
                            <td className="py-4 px-6 text-slate-500 italic max-w-xs truncate">"{req.reason}"</td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded text-xs font-black border",
                                req.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
                                req.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              )}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 6. TIMESHEETS */}
            {activeTab === "timesheets" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-black text-slate-800 text-lg">Weekly Hours Logs</h3>
                  <p className="text-xs text-slate-500">Monitor timesheet logging for billing, utilization, and attendance validation.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                        <th className="py-4 px-6">Employee</th>
                        <th className="py-4 px-6">Period</th>
                        <th className="py-4 px-6">Client Client Assignment</th>
                        <th className="py-4 px-6">Regular Hours</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {timesheets.map(ts => (
                        <tr key={ts.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-slate-800">{ts.employeeName}</p>
                              <span className="text-[10px] font-black text-slate-400">{ts.employeeCode}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-600">{ts.period}</td>
                          <td className="py-4 px-6 text-indigo-600 font-bold">{ts.clientName || "Internal Duty"}</td>
                          <td className="py-4 px-6 font-black text-indigo-600">{ts.totalRegularHours} hrs</td>
                          <td className="py-4 px-6">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded text-xs font-black border",
                              (ts.status === "APPROVED" || ts.status === "APPROVED_BY_MANAGER") ? "bg-green-50 text-green-700 border-green-200" :
                              ts.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {ts.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. EXPENSE LEDGER */}
            {activeTab === "expenses" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-black text-slate-800 text-lg">Expense Claims Log</h3>
                  <p className="text-xs text-slate-500">Monitor active and processed business & travel expenses reimbursement ledger.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200">
                        <th className="py-4 px-6">Employee</th>
                        <th className="py-4 px-6">Claim ID</th>
                        <th className="py-4 px-6">Title & Category</th>
                        <th className="py-4 px-6">Amount</th>
                        <th className="py-4 px-6">Expense Date</th>
                        <th className="py-4 px-6">Merchant</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-slate-800">{exp.employeeName}</p>
                              <span className="text-[10px] font-black text-slate-400">{exp.employeeCode}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-600">{exp.claimNumber}</td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-slate-800">{exp.description}</p>
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[10px] text-slate-500 rounded font-bold">{exp.category}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-black text-amber-600">₹{exp.amount}</td>
                          <td className="py-4 px-6 font-bold text-slate-500">{exp.expenseDate}</td>
                          <td className="py-4 px-6 text-slate-600">{exp.merchantName}</td>
                          <td className="py-4 px-6">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded text-xs font-black border",
                              exp.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
                              exp.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {exp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. OFFBOARDING PIPELINE */}
            {activeTab === "offboarding" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Offboarding Records */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-1 flex flex-col">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 text-lg">Resignations & Offboarding</h3>
                    <p className="text-xs text-slate-500">Track final notices, asset checklists, and IT revocation status.</p>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto max-h-[500px]">
                    {offboardings.map(off => (
                      <div
                        key={off.id}
                        onClick={() => setSelectedOffboarding(off)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer",
                          selectedOffboarding?.id === off.id
                            ? "bg-indigo-50 border-indigo-300"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-sm text-slate-800">{off.employeeName}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black border",
                            (off.status === "Initiated" || off.status === "In Progress") ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"
                          )}>
                            {off.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{off.designation} &bull; {off.department}</p>
                        <p className="text-[10px] text-red-600 font-extrabold">LWD: {off.lastWorkingDay}</p>
                      </div>
                    ))}
                    {offboardings.length === 0 && (
                      <p className="text-slate-400 text-xs text-center py-6">No active offboarding records found.</p>
                    )}
                  </div>
                </div>

                {/* Revocation Checklist (Selected) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
                  {selectedOffboarding ? (
                    <div>
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">{selectedOffboarding.employeeName}</h3>
                          <p className="text-xs text-slate-500">
                            Offboarding Clearance &bull; Code: {selectedOffboarding.employeeCode} &bull; Notice: {selectedOffboarding.noticePeriodDays} days
                          </p>
                        </div>
                        <button
                          onClick={() => setShowOffboardModal(true)}
                          className="px-3.5 py-1.5 text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-black"
                        >
                          Log New Resignation
                        </button>
                      </div>

                      <div className="p-6 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Clearance Checklist & Asset Recovery
                        </h4>
                        <div className="space-y-2">
                          {selectedOffboarding.checklist.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                              <div className="flex items-start gap-3">
                                <span className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-inner border",
                                  item.completed
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                                )}>
                                  {item.completed ? "✓" : "•"}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{item.item}</p>
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded font-bold border border-slate-200 mt-1 uppercase">
                                    {item.category}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateOffboardingItem(selectedOffboarding.id, item.id, !item.completed)}
                                  className={cn(
                                    "px-2.5 py-1 text-xs rounded-lg font-bold border",
                                    item.completed
                                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                  )}
                                >
                                  {item.completed ? "Undo Completed" : "Mark Cleared"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                      <LogOut className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-extrabold text-sm">Select an offboarding candidate</p>
                      <p className="text-slate-400 text-xs max-w-xs">Track clearings, assets retrievals, notices, and last payroll processing.</p>
                      <button
                        onClick={() => setShowOffboardModal(true)}
                        className="mt-4 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-black"
                      >
                        Register New Resignation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- ALL MODALS & DETAIL VIEWS --- */}

      {/* A. Employee 360 Slideout / Detail Panel */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-8">
            <div>
              {/* Slideout Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 text-indigo-600 font-black rounded-full flex items-center justify-center text-xl shadow-inner">
                    {selectedEmployee.fullName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedEmployee.fullName}</h2>
                    <p className="text-sm text-slate-500">Code: {selectedEmployee.employeeCode} &bull; Designation: {selectedEmployee.designation}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Employee 360 Core Sections */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Employment Information</h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-slate-400">Department</p>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Employment Type</p>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployee.employmentType.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Work Mode</p>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployee.workMode} ({selectedEmployee.location})</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Joining Date</p>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployee.joiningDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Reporting Manager</p>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployee.reportingManagerName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Employer Of Record</p>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployee.employerOfRecord}</p>
                    </div>
                  </div>
                </div>

                {/* Staffing Linkage Panel */}
                {(selectedEmployee.clientName || selectedEmployee.vendorName) && (
                  <div>
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Staffing Deployment Matrices</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      {selectedEmployee.clientName && (
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold">Client Assignment</span>
                          <span className="font-extrabold text-indigo-600">{selectedEmployee.clientName}</span>
                        </div>
                      )}
                      {selectedEmployee.vendorName && (
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold">Associated Vendor Network</span>
                          <span className="font-extrabold text-slate-700">{selectedEmployee.vendorName}</span>
                        </div>
                      )}
                      {selectedEmployee.requirementTitle && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">Requirement Scope</span>
                          <span className="font-bold text-slate-600">{selectedEmployee.requirementTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Restricted Compensation Details for Admin Role */}
                {isAdmin ? (
                  <div>
                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Restricted Compensation Panel (Admin Access Only)
                    </h4>
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Annual CTC</p>
                        <p className="text-base font-black text-slate-800">
                          {selectedEmployee.salaryDetails?.ctcAnnual ? `₹${selectedEmployee.salaryDetails.ctcAnnual.toLocaleString()}` : "Not Disclosed"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Base Monthly Salary</p>
                        <p className="text-base font-black text-slate-800">
                          {selectedEmployee.salaryDetails?.baseMonthly ? `₹${selectedEmployee.salaryDetails.baseMonthly.toLocaleString()}` : "Not Disclosed"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Commercial salary figures and billing sheets are hidden by RBAC guidelines.
                  </div>
                )}

                {/* Skills Ledger */}
                <div>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Skill Profile</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmployee.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-white text-slate-700 border border-slate-200 shadow-sm rounded-lg text-xs font-black">
                        {skill}
                      </span>
                    ))}
                    {selectedEmployee.skills.length === 0 && <span className="text-slate-400 text-xs">No skills profiled.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3 rounded-lg text-sm transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">Generate Workforce Profile</h3>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeForm.firstName}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeForm.lastName}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmployeeForm.email}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeForm.phone}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Employment Type</label>
                  <select
                    value={newEmployeeForm.employmentType}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, employmentType: e.target.value as any }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white font-bold text-slate-700"
                  >
                    <option value="INTERNAL_EMPLOYEE">INTERNAL EMPLOYEE</option>
                    <option value="DEPLOYED_EMPLOYEE">DEPLOYED EMPLOYEE</option>
                    <option value="CONTRACTOR">CONTRACTOR</option>
                    <option value="CONSULTANT">CONSULTANT</option>
                    <option value="BENCH_RESOURCE">BENCH RESOURCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeForm.designation}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeForm.department}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeForm.location}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={newEmployeeForm.joiningDate}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={newEmployeeForm.ctcAnnual}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, ctcAnnual: e.target.value }))}
                    placeholder="e.g. 1200000"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Monthly Base (₹)</label>
                  <input
                    type="number"
                    value={newEmployeeForm.baseMonthly}
                    onChange={e => setNewEmployeeForm(prev => ({ ...prev, baseMonthly: e.target.value }))}
                    placeholder="e.g. 80000"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Node.js"
                  value={newEmployeeForm.skills}
                  onChange={e => setNewEmployeeForm(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-extrabold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="skeuo-btn-primary px-5 py-2 rounded-lg text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Generate Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Apply Leave Modal */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">Apply for Leave</h3>
              <button
                onClick={() => setShowApplyLeaveModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Select Employee</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={e => handleFormEmployeeChange("leave", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {leaveBalances[leaveForm.employeeId] && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] font-bold text-indigo-700 grid grid-cols-3 gap-2 text-center">
                  <div>
                    Casual: {leaveBalances[leaveForm.employeeId].casual.remaining}
                  </div>
                  <div>
                    Sick: {leaveBalances[leaveForm.employeeId].sick.remaining}
                  </div>
                  <div>
                    Earned: {leaveBalances[leaveForm.employeeId].earned.remaining}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Leave Category</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value as any }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                >
                  <option value="CASUAL">CASUAL LEAVE</option>
                  <option value="SICK">SICK LEAVE</option>
                  <option value="EARNED">EARNED LEAVE</option>
                  <option value="MATERNITY">MATERNITY LEAVE</option>
                  <option value="PATERNITY">PATERNITY LEAVE</option>
                  <option value="UNPAID_LOP">LOSS OF PAY (UNPAID)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Reason</label>
                <textarea
                  required
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="Provide brief reason for absence..."
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-extrabold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="skeuo-btn-primary px-5 py-2 rounded-lg text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Log Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Submit Timesheet Modal */}
      {showSubmitTimesheetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">Log Weekly Hours</h3>
              <button
                onClick={() => setShowSubmitTimesheetModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTimesheet} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Select Employee</label>
                <select
                  required
                  value={timesheetForm.employeeId}
                  onChange={e => handleFormEmployeeChange("timesheet", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Timesheet Period</label>
                <select
                  value={timesheetForm.period}
                  onChange={e => setTimesheetForm(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                >
                  <option value="2026-W33 (Aug 10 - Aug 16)">2026-W33 (Aug 10 - Aug 16)</option>
                  <option value="2026-W34 (Aug 17 - Aug 23)">2026-W34 (Aug 17 - Aug 23)</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto border border-slate-150 p-3 rounded-lg bg-slate-50/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Book Daily Hours (Mon - Fri)</p>
                {timesheetForm.days.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-xs font-black text-slate-600 w-12">{day.day}</span>
                    <input
                      type="number"
                      max={12}
                      min={0}
                      value={day.hours}
                      onChange={e => {
                        const hrs = Number(e.target.value);
                        setTimesheetForm(prev => {
                          const updated = [...prev.days];
                          updated[idx].hours = hrs;
                          return { ...prev, days: updated };
                        });
                      }}
                      className="w-16 border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Task description..."
                      value={day.task}
                      onChange={e => {
                        const tsk = e.target.value;
                        setTimesheetForm(prev => {
                          const updated = [...prev.days];
                          updated[idx].task = tsk;
                          return { ...prev, days: updated };
                        });
                      }}
                      className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitTimesheetModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-extrabold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="skeuo-btn-primary px-5 py-2 rounded-lg text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. Submit Expense Modal */}
      {showSubmitExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">File Expense Claim</h3>
              <button
                onClick={() => setShowSubmitExpenseModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Employee Filing</label>
                <select
                  required
                  value={expenseForm.employeeId}
                  onChange={e => handleFormEmployeeChange("expense", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Expense Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flight to Mumbai"
                    value={expenseForm.title}
                    onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                  >
                    <option value="Travel">Travel / Flight</option>
                    <option value="Meals">Client Dinner / Meals</option>
                    <option value="Lodging">Hotel / Lodging</option>
                    <option value="IT Equipment">IT Hardware / Cables</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={e => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Merchant / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indigo Airlines"
                  value={expenseForm.merchant}
                  onChange={e => setExpenseForm(prev => ({ ...prev, merchant: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="Purpose of the business expense..."
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitExpenseModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-extrabold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="skeuo-btn-primary px-5 py-2 rounded-lg text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  File Expense Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* F. Offboard / Resign Modal */}
      {showOffboardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">Register Resignation</h3>
              <button
                onClick={() => setShowOffboardModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOffboard} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Employee Resigning</label>
                <select
                  required
                  value={offboardForm.employeeId}
                  onChange={e => handleFormEmployeeChange("offboard", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Resignation Date</label>
                  <input
                    type="date"
                    required
                    value={offboardForm.resignationDate}
                    onChange={e => setOffboardForm(prev => ({ ...prev, resignationDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Last Working Date</label>
                  <input
                    type="date"
                    required
                    value={offboardForm.lastWorkingDate}
                    onChange={e => setOffboardForm(prev => ({ ...prev, lastWorkingDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Reason for Resignation</label>
                <textarea
                  required
                  value={offboardForm.reason}
                  onChange={e => setOffboardForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="Reason given for leaving..."
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOffboardModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-extrabold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-extrabold text-white bg-red-600 hover:bg-red-700"
                >
                  Initialize Offboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
