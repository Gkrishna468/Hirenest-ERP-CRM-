/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { hrService } from "../services/HrService";

export const hrRouter = Router();

// ==========================================
// 1. WORKFORCE & EMPLOYEES
// ==========================================
hrRouter.get("/employees", async (req: any, res) => {
  try {
    const employees = await hrService.listEmployees(req.user);
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.get("/employees/:id", async (req: any, res) => {
  try {
    const employee = await hrService.getEmployeeById(req.params.id, req.user);
    if (!employee) {
      return res.status(404).json({ success: false, error: "Employee not found or access restricted" });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/employees", async (req: any, res) => {
  try {
    const employee = await hrService.createEmployee(
      req.body,
      req.user?.name || req.user?.email || "HR Operations",
      req.user
    );
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.put("/employees/:id", async (req: any, res) => {
  try {
    const employee = await hrService.updateEmployee(
      req.params.id,
      req.body,
      req.user?.name || req.user?.email || "HR Operations"
    );
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/employees/convert-placement", async (req: any, res) => {
  try {
    const employee = await hrService.convertPlacementToEmployee(
      req.body,
      req.user?.name || req.user?.email || "HR Operations"
    );
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. ONBOARDING & DOCUMENTS
// ==========================================
hrRouter.get("/onboarding", async (req, res) => {
  try {
    const onboarding = await hrService.listOnboardingRecords();
    res.json({ success: true, data: onboarding });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/onboarding/:employeeId/update-item", async (req: any, res) => {
  try {
    const { itemId, status, notes } = req.body;
    const updated = await hrService.updateOnboardingItem(
      req.params.employeeId,
      itemId,
      status,
      req.user?.name || "HR Operations",
      notes
    );
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.get("/documents/:employeeId", async (req, res) => {
  try {
    const docs = await hrService.listDocuments(req.params.employeeId);
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/documents", async (req: any, res) => {
  try {
    const doc = await hrService.uploadDocument(
      req.body,
      req.user?.name || "HR Operations"
    );
    res.status(201).json({ success: true, data: doc });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/documents/:id/verify", async (req: any, res) => {
  try {
    const { status, notes } = req.body;
    const doc = await hrService.verifyDocument(
      req.params.id,
      status || "verified",
      req.user?.name || "HR Operations",
      notes
    );
    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ATTENDANCE, SHIFTS & HOLIDAYS
// ==========================================
hrRouter.get("/attendance", async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;
    const attendance = await hrService.listAttendance(date, employeeId);
    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/attendance/clock", async (req: any, res) => {
  try {
    const { employeeId, action, locationType, shift } = req.body;
    const record = await hrService.clockAttendance(
      employeeId,
      action || "IN",
      locationType || "Office",
      shift,
      req.user?.name || "Self"
    );
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/attendance/regularize", async (req: any, res) => {
  try {
    const { recordId, reason } = req.body;
    const record = await hrService.regularizeAttendance(
      recordId,
      reason,
      req.user?.name || "Employee"
    );
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/attendance/:id/approve-regularization", async (req: any, res) => {
  try {
    const { approved } = req.body;
    const record = await hrService.approveRegularization(
      req.params.id,
      approved !== undefined ? approved : true,
      req.user?.name || "HR Manager"
    );
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.get("/holidays", async (req, res) => {
  try {
    const holidays = await hrService.listHolidays();
    res.json({ success: true, data: holidays });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. LEAVE MANAGEMENT
// ==========================================
hrRouter.get("/leave/balances/:employeeId", async (req, res) => {
  try {
    const balance = await hrService.getLeaveBalance(req.params.employeeId);
    res.json({ success: true, data: balance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.get("/leave/requests", async (req, res) => {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const requests = await hrService.listLeaveRequests(employeeId);
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/leave/requests", async (req: any, res) => {
  try {
    const request = await hrService.createLeaveRequest(
      req.body,
      req.user?.name || "Employee"
    );
    res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/leave/requests/:id/approve", async (req: any, res) => {
  try {
    const { role, comments } = req.body;
    const request = await hrService.approveLeaveRequest(
      req.params.id,
      role || "manager",
      req.user?.name || "Reporting Manager",
      comments
    );
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/leave/requests/:id/reject", async (req: any, res) => {
  try {
    const { reason } = req.body;
    const request = await hrService.rejectLeaveRequest(
      req.params.id,
      req.user?.name || "Reporting Manager",
      reason
    );
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. TIMESHEETS
// ==========================================
hrRouter.get("/timesheets", async (req, res) => {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const timesheets = await hrService.listTimesheets(employeeId, clientId);
    res.json({ success: true, data: timesheets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/timesheets", async (req: any, res) => {
  try {
    const timesheet = await hrService.createTimesheet(
      req.body,
      req.user?.name || "Employee"
    );
    res.status(201).json({ success: true, data: timesheet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/timesheets/:id/approve", async (req: any, res) => {
  try {
    const timesheet = await hrService.approveTimesheet(
      req.params.id,
      req.user?.name || "Manager"
    );
    res.json({ success: true, data: timesheet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/timesheets/:id/reject", async (req: any, res) => {
  try {
    const { reason } = req.body;
    const timesheet = await hrService.rejectTimesheet(
      req.params.id,
      req.user?.name || "Manager",
      reason
    );
    res.json({ success: true, data: timesheet });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. EXPENSES
// ==========================================
hrRouter.get("/expenses", async (req, res) => {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const expenses = await hrService.listExpenses(employeeId);
    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/expenses", async (req: any, res) => {
  try {
    const expense = await hrService.createExpense(
      req.body,
      req.user?.name || "Employee"
    );
    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/expenses/:id/approve", async (req: any, res) => {
  try {
    const { notes } = req.body;
    const expense = await hrService.approveExpense(
      req.params.id,
      req.user?.name || "HR / Finance",
      notes
    );
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/expenses/:id/reject", async (req: any, res) => {
  try {
    const { reason } = req.body;
    const expense = await hrService.rejectExpense(
      req.params.id,
      req.user?.name || "HR / Finance",
      reason
    );
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. OFFBOARDING
// ==========================================
hrRouter.get("/offboarding", async (req, res) => {
  try {
    const offboarding = await hrService.listOffboardingRecords();
    res.json({ success: true, data: offboarding });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

hrRouter.post("/offboarding", async (req: any, res) => {
  try {
    const record = await hrService.initiateOffboarding(
      req.body,
      req.user?.name || "HR Operations"
    );
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

hrRouter.post("/offboarding/:id/update-checklist", async (req: any, res) => {
  try {
    const { itemId, completed } = req.body;
    const record = await hrService.updateOffboardingChecklist(
      req.params.id,
      itemId,
      completed,
      req.user?.name || "HR Operations"
    );
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 8. WORKFORCE METRICS
// ==========================================
hrRouter.get("/metrics", async (req: any, res) => {
  try {
    const metrics = await hrService.getWorkforceMetrics(req.user);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
