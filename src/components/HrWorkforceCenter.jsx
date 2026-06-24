import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);

const money = (value) => {
  const rounded = Math.round(Number(String(value ?? '').replace(/,/g, '')) || 0);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  if (digits.length <= 3) return `₹${sign}${digits}`;
  const lastThree = digits.slice(-3);
  const leading = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${sign}${leading},${lastThree}`;
};

const numberValue = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;
const textValue = (value) => String(value ?? '').trim();
const statusOptions = ['Active', 'On Leave', 'Suspended', 'Resigned', 'Terminated'];
const employmentTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Consultant'];
const payrollStatuses = ['Pending', 'Paid', 'Overdue'];
const attendanceStatuses = ['Present', 'Absent', 'Leave', 'Half Day'];
const leaveStatuses = ['Requested', 'Approved', 'Rejected', 'Cancelled'];
const performanceTypes = ['Review', 'Achievement', 'Warning', 'Performance Note'];
const hrDocumentTypes = ['Contract', 'ID Document', 'Certification', 'Offer Letter', 'Payroll Document'];

const blankEmployee = {
  employeeCode: '',
  fullName: '',
  profilePhotoUrl: '',
  email: '',
  phone: '',
  department: 'Operations',
  role: '',
  dateOfJoining: today,
  employmentType: 'Full Time',
  reportingManagerId: '',
  status: 'Active',
};

const blankDepartment = {
  name: '',
  description: '',
  managerEmployeeId: '',
  status: 'Active',
};

const blankPayroll = {
  employeeId: '',
  baseSalary: 0,
  bonus: 0,
  deductions: 0,
  paymentDate: today,
  paymentStatus: 'Pending',
  notes: '',
};

const blankAttendance = {
  employeeId: '',
  attendanceDate: today,
  status: 'Present',
  notes: '',
};

const blankLeave = {
  employeeId: '',
  leaveType: 'Annual Leave',
  startDate: today,
  endDate: today,
  status: 'Requested',
  reason: '',
};

const blankPerformance = {
  employeeId: '',
  noteType: 'Performance Note',
  title: '',
  note: '',
  rating: '',
};

const blankDocument = {
  employeeId: '',
  documentType: 'Contract',
  file: null,
  notes: '',
};

function exportCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [
    columns.map((column) => column.label).join(','),
    ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(filename, title, columns, rows) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Velora Motors', 14, 16);
  doc.setFontSize(11);
  doc.text(title, 14, 24);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 30);
  autoTable(doc, {
    startY: 38,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => row[column.key] ?? '')),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
  });
  doc.save(filename);
}

function Field({ label, children }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ value }) {
  return <span className={`status-pill status-${String(value || 'default').toLowerCase().replace(/\s+/g, '-')}`}>{value || 'Unknown'}</span>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span><Icon size={19} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  );
}

function useFilteredRows(rows, query, filters) {
  return useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const searchMatch = !normalized || Object.values(row).join(' ').toLowerCase().includes(normalized);
      const filterMatch = Object.entries(filters).every(([key, value]) => value === 'All' || !value || row[key] === value);
      return searchMatch && filterMatch;
    });
  }, [filters, query, rows]);
}

function EmployeeName({ employees, id }) {
  return employees.find((employee) => employee.id === id)?.fullName || 'Unassigned';
}

export default function HrWorkforceCenter({
  employees,
  hrDepartments,
  payrollRecords,
  attendanceRecords,
  leaveRequests,
  performanceNotes,
  documents,
  saveEmployee,
  deleteEmployee,
  saveHrDepartment,
  deleteHrDepartment,
  savePayrollRecord,
  deletePayrollRecord,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  saveLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
  savePerformanceNote,
  deletePerformanceNote,
  uploadDocument,
  canEdit,
  canDelete,
  canViewFinancials,
}) {
  const [activeTab, setActiveTab] = useState('Employees');
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeForm, setEmployeeForm] = useState(blankEmployee);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [departmentForm, setDepartmentForm] = useState(blankDepartment);
  const [editingDepartmentId, setEditingDepartmentId] = useState('');
  const [payrollForm, setPayrollForm] = useState(blankPayroll);
  const [editingPayrollId, setEditingPayrollId] = useState('');
  const [attendanceForm, setAttendanceForm] = useState(blankAttendance);
  const [editingAttendanceId, setEditingAttendanceId] = useState('');
  const [leaveForm, setLeaveForm] = useState(blankLeave);
  const [editingLeaveId, setEditingLeaveId] = useState('');
  const [performanceForm, setPerformanceForm] = useState(blankPerformance);
  const [editingPerformanceId, setEditingPerformanceId] = useState('');
  const [documentForm, setDocumentForm] = useState(blankDocument);
  const [message, setMessage] = useState('');

  const filteredEmployees = useFilteredRows(employees, query, {
    department: departmentFilter,
    status: statusFilter,
  });

  const activeEmployees = employees.filter((employee) => employee.status === 'Active');
  const onLeave = employees.filter((employee) => employee.status === 'On Leave');
  const upcomingPayroll = payrollRecords.filter((record) => {
    if (record.paymentStatus === 'Paid') return false;
    const date = new Date(record.paymentDate);
    if (Number.isNaN(date.getTime())) return false;
    const days = Math.ceil((date - new Date()) / 86400000);
    return days >= 0 && days <= 10;
  });
  const newJoiners = employees.filter((employee) => {
    const joined = new Date(employee.dateOfJoining);
    return !Number.isNaN(joined.getTime()) && (new Date() - joined) / 86400000 <= 30;
  });

  const payrollTotal = payrollRecords.reduce((sum, record) => sum + numberValue(record.netSalary), 0);
  const leaveBalance = Math.max(0, 24 - leaveRequests
    .filter((request) => request.status === 'Approved')
    .reduce((sum, request) => sum + numberValue(request.days), 0));

  const employeeOptions = employees.map((employee) => (
    <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.fullName}</option>
  ));

  async function submitEmployee(event) {
    event.preventDefault();
    await saveEmployee(employeeForm, editingEmployeeId);
    setEmployeeForm(blankEmployee);
    setEditingEmployeeId('');
    setMessage('Employee record saved.');
  }

  async function submitDepartment(event) {
    event.preventDefault();
    await saveHrDepartment(departmentForm, editingDepartmentId);
    setDepartmentForm(blankDepartment);
    setEditingDepartmentId('');
    setMessage('Department saved.');
  }

  async function submitPayroll(event) {
    event.preventDefault();
    await savePayrollRecord(payrollForm, editingPayrollId);
    setPayrollForm(blankPayroll);
    setEditingPayrollId('');
    setMessage('Payroll record saved.');
  }

  async function submitAttendance(event) {
    event.preventDefault();
    await saveAttendanceRecord(attendanceForm, editingAttendanceId);
    setAttendanceForm(blankAttendance);
    setEditingAttendanceId('');
    setMessage('Attendance record saved.');
  }

  async function submitLeave(event) {
    event.preventDefault();
    await saveLeaveRequest(leaveForm, editingLeaveId);
    setLeaveForm(blankLeave);
    setEditingLeaveId('');
    setMessage('Leave request saved.');
  }

  async function submitPerformance(event) {
    event.preventDefault();
    await savePerformanceNote(performanceForm, editingPerformanceId);
    setPerformanceForm(blankPerformance);
    setEditingPerformanceId('');
    setMessage('Performance note saved.');
  }

  async function submitDocument(event) {
    event.preventDefault();
    if (!documentForm.file) return;
    await uploadDocument({
      file: documentForm.file,
      category: documentForm.documentType,
      linkedModule: 'Employees',
      linkedRecordId: documentForm.employeeId,
      notes: documentForm.notes,
    });
    setDocumentForm(blankDocument);
    event.currentTarget.reset();
    setMessage('Employee document uploaded to the vault.');
  }

  const reportColumns = {
    employee: [
      { key: 'employeeCode', label: 'Employee ID' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'dateOfJoining', label: 'Joining Date' },
    ],
    payroll: [
      { key: 'employeeName', label: 'Employee' },
      { key: 'baseSalaryFormatted', label: 'Base Salary' },
      { key: 'bonusFormatted', label: 'Bonus' },
      { key: 'deductionsFormatted', label: 'Deductions' },
      { key: 'netSalaryFormatted', label: 'Net Salary' },
      { key: 'paymentStatus', label: 'Status' },
    ],
    department: [
      { key: 'name', label: 'Department' },
      { key: 'employeeCount', label: 'Employees' },
      { key: 'status', label: 'Status' },
    ],
    attendance: [
      { key: 'employeeName', label: 'Employee' },
      { key: 'attendanceDate', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Notes' },
    ],
  };

  const reportRows = {
    employee: employees,
    payroll: payrollRecords.map((record) => ({
      ...record,
      employeeName: employees.find((employee) => employee.id === record.employeeId)?.fullName || record.employeeCode,
      baseSalaryFormatted: money(record.baseSalary),
      bonusFormatted: money(record.bonus),
      deductionsFormatted: money(record.deductions),
      netSalaryFormatted: money(record.netSalary),
    })),
    department: hrDepartments.map((department) => ({
      ...department,
      employeeCount: employees.filter((employee) => employee.department === department.name).length,
    })),
    attendance: attendanceRecords.map((record) => ({
      ...record,
      employeeName: employees.find((employee) => employee.id === record.employeeId)?.fullName || record.employeeId,
    })),
  };

  return (
    <section className="page-stack">
      <div className="section-heading page-header">
        <div>
          <p className="eyebrow">Human resources</p>
          <h1>Workforce management</h1>
          <p className="page-description">Manage employees, departments, payroll, leave, attendance, documents, and performance history.</p>
        </div>
        <div className="toolbar">
          <input className="search" placeholder="Search employees, roles, departments" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option>All</option>
            {[...new Set([...hrDepartments.map((department) => department.name), ...employees.map((employee) => employee.department)].filter(Boolean))].map((department) => <option key={department}>{department}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>

      {message && <div className="app-message">{message}</div>}

      <div className="metrics-grid enterprise-metrics">
        <MetricCard icon={Users} label="Total employees" value={employees.length} detail={`${activeEmployees.length} active`} />
        <MetricCard icon={UserCheck} label="Active employees" value={activeEmployees.length} detail="Available workforce" tone="success" />
        <MetricCard icon={CalendarDays} label="On leave" value={onLeave.length} detail={`${leaveBalance} leave days remaining`} />
        <MetricCard icon={Briefcase} label="Upcoming payroll" value={upcomingPayroll.length} detail={canViewFinancials ? money(payrollTotal) : 'Financial view restricted'} />
        <MetricCard icon={ShieldCheck} label="New joiners" value={newJoiners.length} detail="Joined in last 30 days" />
      </div>

      <div className="tabs">
        {['Employees', 'Departments', 'Payroll', 'Attendance', 'Leave', 'Performance', 'Documents', 'Reports'].map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Employees' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitEmployee}>
              <Field label="Employee ID"><input value={employeeForm.employeeCode} onChange={(event) => setEmployeeForm({ ...employeeForm, employeeCode: event.target.value })} placeholder="EMP-0001" /></Field>
              <Field label="Full Name"><input required value={employeeForm.fullName} onChange={(event) => setEmployeeForm({ ...employeeForm, fullName: event.target.value })} /></Field>
              <Field label="Profile Photo URL"><input value={employeeForm.profilePhotoUrl} onChange={(event) => setEmployeeForm({ ...employeeForm, profilePhotoUrl: event.target.value })} /></Field>
              <Field label="Email"><input type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} /></Field>
              <Field label="Phone"><input value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} /></Field>
              <Field label="Department"><input list="hr-department-list" value={employeeForm.department} onChange={(event) => setEmployeeForm({ ...employeeForm, department: event.target.value })} /><datalist id="hr-department-list">{hrDepartments.map((department) => <option key={department.id} value={department.name} />)}</datalist></Field>
              <Field label="Role"><input required value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })} /></Field>
              <Field label="Date of Joining"><input type="date" value={employeeForm.dateOfJoining} onChange={(event) => setEmployeeForm({ ...employeeForm, dateOfJoining: event.target.value })} /></Field>
              <Field label="Employment Type"><select value={employeeForm.employmentType} onChange={(event) => setEmployeeForm({ ...employeeForm, employmentType: event.target.value })}>{employmentTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Reporting Manager"><select value={employeeForm.reportingManagerId} onChange={(event) => setEmployeeForm({ ...employeeForm, reportingManagerId: event.target.value })}><option value="">None</option>{employeeOptions}</select></Field>
              <Field label="Status"><select value={employeeForm.status} onChange={(event) => setEmployeeForm({ ...employeeForm, status: event.target.value })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <div className="form-actions"><button type="submit">{editingEmployeeId ? 'Update employee' : 'Add employee'}</button></div>
            </form>
          )}
          <div className="table-card">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Joining</th><th>Manager</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td><strong>{employee.employeeCode}</strong><br />{employee.fullName}<br /><small>{employee.email || employee.phone}</small></td>
                    <td>{employee.department}</td>
                    <td>{employee.role}<br /><small>{employee.employmentType}</small></td>
                    <td>{employee.dateOfJoining}</td>
                    <td><EmployeeName employees={employees} id={employee.reportingManagerId} /></td>
                    <td><StatusPill value={employee.status} /></td>
                    <td className="row-actions">
                      {canEdit && <button className="mini" onClick={() => { setEmployeeForm(employee); setEditingEmployeeId(employee.id); }}>Edit</button>}
                      {canDelete && <button className="mini danger" onClick={() => deleteEmployee(employee.id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredEmployees.length && <div className="empty-state"><Users size={24} /><p>No employees match this view.</p></div>}
          </div>
        </>
      )}

      {activeTab === 'Departments' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitDepartment}>
              <Field label="Department Name"><input required value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} /></Field>
              <Field label="Description"><input value={departmentForm.description} onChange={(event) => setDepartmentForm({ ...departmentForm, description: event.target.value })} /></Field>
              <Field label="Manager"><select value={departmentForm.managerEmployeeId} onChange={(event) => setDepartmentForm({ ...departmentForm, managerEmployeeId: event.target.value })}><option value="">Unassigned</option>{employeeOptions}</select></Field>
              <Field label="Status"><select value={departmentForm.status} onChange={(event) => setDepartmentForm({ ...departmentForm, status: event.target.value })}><option>Active</option><option>Inactive</option></select></Field>
              <div className="form-actions"><button type="submit">{editingDepartmentId ? 'Update department' : 'Create department'}</button></div>
            </form>
          )}
          <div className="report-grid">
            {hrDepartments.map((department) => (
              <article className="report-card" key={department.id}>
                <div><p className="eyebrow">Department</p><h2>{department.name}</h2><p>{department.description || 'No description provided.'}</p></div>
                <p>{employees.filter((employee) => employee.department === department.name).length} employees</p>
                <small>Manager: <EmployeeName employees={employees} id={department.managerEmployeeId} /></small>
                <div className="report-actions">
                  {canEdit && <button onClick={() => { setDepartmentForm(department); setEditingDepartmentId(department.id); }}>Edit</button>}
                  {canDelete && <button className="danger" onClick={() => deleteHrDepartment(department.id)}>Delete</button>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {activeTab === 'Payroll' && (
        <>
          {canEdit && canViewFinancials && (
            <form className="entry-form" onSubmit={submitPayroll}>
              <Field label="Employee"><select required value={payrollForm.employeeId} onChange={(event) => setPayrollForm({ ...payrollForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Base Salary"><input value={payrollForm.baseSalary} onChange={(event) => setPayrollForm({ ...payrollForm, baseSalary: event.target.value })} /></Field>
              <Field label="Bonus"><input value={payrollForm.bonus} onChange={(event) => setPayrollForm({ ...payrollForm, bonus: event.target.value })} /></Field>
              <Field label="Deductions"><input value={payrollForm.deductions} onChange={(event) => setPayrollForm({ ...payrollForm, deductions: event.target.value })} /></Field>
              <Field label="Payment Date"><input type="date" value={payrollForm.paymentDate} onChange={(event) => setPayrollForm({ ...payrollForm, paymentDate: event.target.value })} /></Field>
              <Field label="Payment Status"><select value={payrollForm.paymentStatus} onChange={(event) => setPayrollForm({ ...payrollForm, paymentStatus: event.target.value })}>{payrollStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Notes"><input value={payrollForm.notes} onChange={(event) => setPayrollForm({ ...payrollForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">{editingPayrollId ? 'Update payroll' : 'Add payroll'}</button></div>
            </form>
          )}
          <div className="table-card">
            <table>
              <thead><tr><th>Employee</th><th>Base</th><th>Bonus</th><th>Deductions</th><th>Net Salary</th><th>Payment</th><th>Actions</th></tr></thead>
              <tbody>{payrollRecords.map((record) => (
                <tr key={record.id}>
                  <td><EmployeeName employees={employees} id={record.employeeId} /></td>
                  <td>{canViewFinancials ? money(record.baseSalary) : 'Restricted'}</td>
                  <td>{canViewFinancials ? money(record.bonus) : 'Restricted'}</td>
                  <td>{canViewFinancials ? money(record.deductions) : 'Restricted'}</td>
                  <td>{canViewFinancials ? money(record.netSalary) : 'Restricted'}</td>
                  <td>{record.paymentDate}<br /><StatusPill value={record.paymentStatus} /></td>
                  <td className="row-actions">{canEdit && canViewFinancials && <button className="mini" onClick={() => { setPayrollForm(record); setEditingPayrollId(record.id); }}>Edit</button>}{canDelete && <button className="mini danger" onClick={() => deletePayrollRecord(record.id)}>Delete</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'Attendance' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitAttendance}>
              <Field label="Employee"><select required value={attendanceForm.employeeId} onChange={(event) => setAttendanceForm({ ...attendanceForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Date"><input type="date" value={attendanceForm.attendanceDate} onChange={(event) => setAttendanceForm({ ...attendanceForm, attendanceDate: event.target.value })} /></Field>
              <Field label="Status"><select value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value })}>{attendanceStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Notes"><input value={attendanceForm.notes} onChange={(event) => setAttendanceForm({ ...attendanceForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">{editingAttendanceId ? 'Update attendance' : 'Add attendance'}</button></div>
            </form>
          )}
          <div className="table-card"><table><thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{attendanceRecords.map((record) => <tr key={record.id}><td><EmployeeName employees={employees} id={record.employeeId} /></td><td>{record.attendanceDate}</td><td><StatusPill value={record.status} /></td><td>{record.notes}</td><td className="row-actions">{canEdit && <button className="mini" onClick={() => { setAttendanceForm(record); setEditingAttendanceId(record.id); }}>Edit</button>}{canDelete && <button className="mini danger" onClick={() => deleteAttendanceRecord(record.id)}>Delete</button>}</td></tr>)}</tbody></table></div>
        </>
      )}

      {activeTab === 'Leave' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitLeave}>
              <Field label="Employee"><select required value={leaveForm.employeeId} onChange={(event) => setLeaveForm({ ...leaveForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Leave Type"><input value={leaveForm.leaveType} onChange={(event) => setLeaveForm({ ...leaveForm, leaveType: event.target.value })} /></Field>
              <Field label="Start Date"><input type="date" value={leaveForm.startDate} onChange={(event) => setLeaveForm({ ...leaveForm, startDate: event.target.value })} /></Field>
              <Field label="End Date"><input type="date" value={leaveForm.endDate} onChange={(event) => setLeaveForm({ ...leaveForm, endDate: event.target.value })} /></Field>
              <Field label="Status"><select value={leaveForm.status} onChange={(event) => setLeaveForm({ ...leaveForm, status: event.target.value })}>{leaveStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Reason"><input value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">{editingLeaveId ? 'Update leave' : 'Request leave'}</button></div>
            </form>
          )}
          <div className="table-card"><table><thead><tr><th>Employee</th><th>Leave</th><th>Dates</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead><tbody>{leaveRequests.map((request) => <tr key={request.id}><td><EmployeeName employees={employees} id={request.employeeId} /></td><td>{request.leaveType}<br /><small>{request.reason}</small></td><td>{request.startDate} - {request.endDate}</td><td>{request.days}</td><td><StatusPill value={request.status} /></td><td className="row-actions">{canEdit && <button className="mini" onClick={() => { setLeaveForm(request); setEditingLeaveId(request.id); }}>Edit</button>}{canEdit && request.status === 'Requested' && <button className="mini" onClick={() => updateLeaveStatus(request.id, 'Approved')}>Approve</button>}{canDelete && <button className="mini danger" onClick={() => deleteLeaveRequest(request.id)}>Delete</button>}</td></tr>)}</tbody></table></div>
        </>
      )}

      {activeTab === 'Performance' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitPerformance}>
              <Field label="Employee"><select required value={performanceForm.employeeId} onChange={(event) => setPerformanceForm({ ...performanceForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Type"><select value={performanceForm.noteType} onChange={(event) => setPerformanceForm({ ...performanceForm, noteType: event.target.value })}>{performanceTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Title"><input required value={performanceForm.title} onChange={(event) => setPerformanceForm({ ...performanceForm, title: event.target.value })} /></Field>
              <Field label="Rating"><input value={performanceForm.rating} onChange={(event) => setPerformanceForm({ ...performanceForm, rating: event.target.value })} /></Field>
              <Field label="Note"><textarea value={performanceForm.note} onChange={(event) => setPerformanceForm({ ...performanceForm, note: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">{editingPerformanceId ? 'Update note' : 'Add note'}</button></div>
            </form>
          )}
          <div className="activity-list">{performanceNotes.map((note) => <article className="activity-item" key={note.id}><span><ClipboardList size={16} /></span><div><strong>{note.title}</strong><p>{note.note}</p><small><EmployeeName employees={employees} id={note.employeeId} /> - {note.noteType} {note.rating ? `/ ${note.rating}` : ''}</small></div><div className="row-actions">{canEdit && <button className="mini" onClick={() => { setPerformanceForm(note); setEditingPerformanceId(note.id); }}>Edit</button>}{canDelete && <button className="mini danger" onClick={() => deletePerformanceNote(note.id)}>Delete</button>}</div></article>)}</div>
        </>
      )}

      {activeTab === 'Documents' && (
        <>
          {canEdit && (
            <form className="entry-form document-form" onSubmit={submitDocument}>
              <Field label="Employee"><select required value={documentForm.employeeId} onChange={(event) => setDocumentForm({ ...documentForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Document Type"><select value={documentForm.documentType} onChange={(event) => setDocumentForm({ ...documentForm, documentType: event.target.value })}>{hrDocumentTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="File"><input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.docx" onChange={(event) => setDocumentForm({ ...documentForm, file: event.target.files?.[0] || null })} /></Field>
              <Field label="Notes"><input value={documentForm.notes} onChange={(event) => setDocumentForm({ ...documentForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit"><Upload size={16} /> Upload HR document</button></div>
            </form>
          )}
          <div className="document-grid">
            {documents.filter((document) => document.linkedModule === 'Employees').map((document) => (
              <article className="document-card" key={document.id}>
                <span className="document-icon"><FileText size={22} /></span>
                <div className="document-meta"><strong>{document.fileName}</strong><small>{document.category}</small><p>Employee: <EmployeeName employees={employees} id={document.linkedRecordId} /></p></div>
              </article>
            ))}
          </div>
        </>
      )}

      {activeTab === 'Reports' && (
        <div className="report-grid">
          {[
            ['Employee Report', 'employee', 'employee-report'],
            ['Payroll Report', 'payroll', 'payroll-report'],
            ['Department Report', 'department', 'department-report'],
            ['Attendance Report', 'attendance', 'attendance-report'],
          ].map(([title, key, slug]) => (
            <article className="report-card" key={slug}>
              <div><p className="eyebrow">HR reports</p><h2>{title}</h2><p>{reportRows[key].length} records ready for export.</p></div>
              <div className="report-actions">
                <button onClick={() => exportCsv(`velora-${slug}.csv`, reportColumns[key], reportRows[key])}><Download size={16} />CSV</button>
                <button onClick={() => exportPdf(`velora-${slug}.pdf`, title, reportColumns[key], reportRows[key])}><FileText size={16} />PDF</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
