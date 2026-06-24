import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileText,
  Lock,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);
const cycleStatuses = ['Draft', 'Calculating', 'Pending Approval', 'Approved', 'Paid', 'Locked', 'Cancelled'];
const bonusTypes = ['Performance Bonus', 'Sales Commission', 'Logistics Incentive', 'Festival Bonus', 'Custom Bonus'];
const deductionTypes = ['Attendance Deduction', 'Leave Deduction', 'Advance Salary Deduction', 'Penalty Deduction', 'Tax Deduction', 'Other Deduction'];

const numberValue = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;
const money = (value) => {
  const rounded = Math.round(numberValue(value));
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  if (digits.length <= 3) return `₹${sign}${digits}`;
  const lastThree = digits.slice(-3);
  const leading = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${sign}${leading},${lastThree}`;
};

const blankCycle = {
  cycleName: '',
  periodStart: today.slice(0, 8) + '01',
  periodEnd: today,
  runStatus: 'Draft',
  approvalStatus: 'Draft',
  notes: '',
};

const blankSalaryHistory = {
  employeeId: '',
  previousSalary: 0,
  newSalary: 0,
  effectiveDate: today,
  reason: '',
  approvedBy: '',
  notes: '',
};

const blankBonus = {
  employeeId: '',
  department: '',
  payrollCycleId: '',
  performanceNoteId: '',
  bonusType: 'Performance Bonus',
  amount: 0,
  paymentDate: today,
  status: 'Pending',
  notes: '',
};

const blankDeduction = {
  employeeId: '',
  department: '',
  payrollCycleId: '',
  deductionType: 'Tax Deduction',
  amount: 0,
  deductionDate: today,
  status: 'Pending',
  notes: '',
};

function employeeName(employees, id) {
  return employees.find((employee) => employee.id === id)?.fullName || 'Unassigned';
}

function employeeCode(employees, id) {
  return employees.find((employee) => employee.id === id)?.employeeCode || id || '';
}

function employeeDepartment(employees, id, fallback = '') {
  return employees.find((employee) => employee.id === id)?.department || fallback || 'Unassigned';
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(filename, columns, rows) {
  const csv = [
    columns.map((column) => column.label).join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column.key])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportPayslipPdf(payslip) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Velora Motors', 14, 16);
  doc.setFontSize(11);
  doc.text(`Payslip - ${payslip.payrollMonth}`, 14, 24);
  autoTable(doc, {
    startY: 34,
    head: [['Field', 'Value']],
    body: [
      ['Employee', payslip.employeeName],
      ['Employee ID', payslip.employeeCode],
      ['Department', payslip.department],
      ['Role', payslip.role],
      ['Base Salary', money(payslip.baseSalary)],
      ['Bonuses', money(payslip.bonuses)],
      ['Deductions', money(payslip.deductions)],
      ['Net Salary', money(payslip.netSalary)],
      ['Payment Status', payslip.paymentStatus],
    ],
    headStyles: { fillColor: [30, 64, 175] },
  });
  doc.save(`velora-payslip-${payslip.employeeCode}-${payslip.payrollMonth}.pdf`);
}

function Field({ label, children }) {
  return <label><span>{label}</span>{children}</label>;
}

function StatusPill({ value }) {
  return <span className={`status-pill status-${String(value || 'default').toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>;
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

function BarList({ rows, valueKey, labelKey }) {
  const max = Math.max(...rows.map((row) => numberValue(row[valueKey])), 1);
  return (
    <div className="analytics-bars">
      {rows.map((row) => (
        <div key={row[labelKey]}>
          <span>{row[labelKey]}</span>
          <div><i style={{ width: `${Math.max(6, (numberValue(row[valueKey]) / max) * 100)}%` }} /></div>
          <strong>{money(row[valueKey])}</strong>
        </div>
      ))}
    </div>
  );
}

export default function PayrollCompensationCenter({
  employees,
  hrDepartments,
  payrollRecords,
  payrollCycles,
  salaryHistory,
  bonuses,
  deductions,
  performanceNotes,
  savePayrollCycle,
  updatePayrollCycleStatus,
  saveSalaryHistory,
  saveBonus,
  saveDeduction,
  canEdit,
  canApprove,
  canViewFinancials,
}) {
  const [activeTab, setActiveTab] = useState('Command Center');
  const [cycleForm, setCycleForm] = useState(blankCycle);
  const [editingCycleId, setEditingCycleId] = useState('');
  const [salaryForm, setSalaryForm] = useState(blankSalaryHistory);
  const [bonusForm, setBonusForm] = useState(blankBonus);
  const [deductionForm, setDeductionForm] = useState(blankDeduction);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [message, setMessage] = useState('');

  const employeeOptions = employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.fullName}</option>);
  const cycleOptions = payrollCycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.cycleName}</option>);

  const currentCycle = payrollCycles.find((cycle) => cycle.id === selectedCycleId)
    || payrollCycles.find((cycle) => !['Paid', 'Locked', 'Cancelled'].includes(cycle.runStatus))
    || payrollCycles[0];
  const cyclePayroll = currentCycle
    ? payrollRecords.filter((record) => record.payrollCycleId === currentCycle.id || (!record.payrollCycleId && record.paymentDate >= currentCycle.periodStart && record.paymentDate <= currentCycle.periodEnd))
    : payrollRecords;
  const cycleBonuses = currentCycle
    ? bonuses.filter((bonus) => bonus.payrollCycleId === currentCycle.id || (!bonus.payrollCycleId && bonus.paymentDate >= currentCycle.periodStart && bonus.paymentDate <= currentCycle.periodEnd))
    : bonuses;
  const cycleDeductions = currentCycle
    ? deductions.filter((deduction) => deduction.payrollCycleId === currentCycle.id || (!deduction.payrollCycleId && deduction.deductionDate >= currentCycle.periodStart && deduction.deductionDate <= currentCycle.periodEnd))
    : deductions;

  const totals = {
    monthlyPayroll: cyclePayroll.reduce((sum, record) => sum + numberValue(record.netSalary), 0),
    pending: cyclePayroll.filter((record) => record.paymentStatus === 'Pending').reduce((sum, record) => sum + numberValue(record.netSalary), 0),
    paid: cyclePayroll.filter((record) => record.paymentStatus === 'Paid').reduce((sum, record) => sum + numberValue(record.netSalary), 0),
    overdue: cyclePayroll.filter((record) => record.paymentStatus === 'Overdue').reduce((sum, record) => sum + numberValue(record.netSalary), 0),
    bonuses: cycleBonuses.reduce((sum, bonus) => sum + numberValue(bonus.amount), 0),
    deductions: cycleDeductions.reduce((sum, deduction) => sum + numberValue(deduction.amount), 0),
  };

  const payrollByDepartment = hrDepartments.map((department) => ({
    department: department.name,
    payroll: cyclePayroll
      .filter((record) => employeeDepartment(employees, record.employeeId) === department.name)
      .reduce((sum, record) => sum + numberValue(record.netSalary), 0),
    averageSalary: (() => {
      const rows = cyclePayroll.filter((record) => employeeDepartment(employees, record.employeeId) === department.name);
      return rows.length ? rows.reduce((sum, record) => sum + numberValue(record.netSalary), 0) / rows.length : 0;
    })(),
  })).filter((row) => row.payroll > 0);

  const payrollTrend = payrollCycles.map((cycle) => ({
    cycle: cycle.cycleName,
    payroll: payrollRecords
      .filter((record) => record.payrollCycleId === cycle.id || (!record.payrollCycleId && record.paymentDate >= cycle.periodStart && record.paymentDate <= cycle.periodEnd))
      .reduce((sum, record) => sum + numberValue(record.netSalary), 0),
  })).filter((row) => row.payroll > 0);

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) || employees[0];
  const employeeSalaryHistory = selectedEmployee ? salaryHistory.filter((item) => item.employeeId === selectedEmployee.id) : [];
  const payslipRecord = selectedEmployee
    ? cyclePayroll.find((record) => record.employeeId === selectedEmployee.id) || payrollRecords.find((record) => record.employeeId === selectedEmployee.id)
    : null;
  const payslip = selectedEmployee && payslipRecord ? {
    employeeName: selectedEmployee.fullName,
    employeeCode: selectedEmployee.employeeCode,
    department: selectedEmployee.department,
    role: selectedEmployee.role,
    payrollMonth: currentCycle?.cycleName || payslipRecord.paymentDate?.slice(0, 7) || 'Current payroll',
    baseSalary: payslipRecord.baseSalary,
    bonuses: cycleBonuses.filter((bonus) => bonus.employeeId === selectedEmployee.id).reduce((sum, bonus) => sum + numberValue(bonus.amount), 0),
    deductions: cycleDeductions.filter((deduction) => deduction.employeeId === selectedEmployee.id).reduce((sum, deduction) => sum + numberValue(deduction.amount), 0),
    netSalary: payslipRecord.netSalary,
    paymentStatus: payslipRecord.paymentStatus,
  } : null;

  async function submitCycle(event) {
    event.preventDefault();
    await savePayrollCycle(cycleForm, editingCycleId);
    setCycleForm(blankCycle);
    setEditingCycleId('');
    setMessage('Payroll cycle saved.');
  }

  async function submitSalaryHistory(event) {
    event.preventDefault();
    await saveSalaryHistory(salaryForm);
    setSalaryForm(blankSalaryHistory);
    setMessage('Salary history added.');
  }

  async function submitBonus(event) {
    event.preventDefault();
    const employee = employees.find((item) => item.id === bonusForm.employeeId);
    await saveBonus({ ...bonusForm, department: bonusForm.department || employee?.department || '' });
    setBonusForm(blankBonus);
    setMessage('Bonus recorded.');
  }

  async function submitDeduction(event) {
    event.preventDefault();
    const employee = employees.find((item) => item.id === deductionForm.employeeId);
    await saveDeduction({ ...deductionForm, department: deductionForm.department || employee?.department || '' });
    setDeductionForm(blankDeduction);
    setMessage('Deduction recorded.');
  }

  const reports = [
    {
      title: 'Monthly Payroll Report',
      slug: 'monthly-payroll',
      columns: [
        { key: 'employeeCode', label: 'Employee ID' },
        { key: 'employeeName', label: 'Employee' },
        { key: 'netSalary', label: 'Net Salary' },
        { key: 'paymentDate', label: 'Payment Date' },
        { key: 'paymentStatus', label: 'Status' },
      ],
      rows: cyclePayroll.map((record) => ({ ...record, employeeCode: employeeCode(employees, record.employeeId), employeeName: employeeName(employees, record.employeeId), netSalary: money(record.netSalary) })),
    },
    {
      title: 'Department Payroll Report',
      slug: 'department-payroll',
      columns: [{ key: 'department', label: 'Department' }, { key: 'payroll', label: 'Payroll' }, { key: 'averageSalary', label: 'Average Salary' }],
      rows: payrollByDepartment.map((row) => ({ ...row, payroll: money(row.payroll), averageSalary: money(row.averageSalary) })),
    },
    {
      title: 'Employee Salary History Report',
      slug: 'employee-salary-history',
      columns: [{ key: 'employeeName', label: 'Employee' }, { key: 'previousSalary', label: 'Previous' }, { key: 'newSalary', label: 'New' }, { key: 'effectiveDate', label: 'Effective Date' }, { key: 'reason', label: 'Reason' }],
      rows: salaryHistory.map((row) => ({ ...row, employeeName: employeeName(employees, row.employeeId), previousSalary: money(row.previousSalary), newSalary: money(row.newSalary) })),
    },
    {
      title: 'Bonus Report',
      slug: 'bonus-report',
      columns: [{ key: 'employeeName', label: 'Employee' }, { key: 'bonusType', label: 'Type' }, { key: 'amount', label: 'Amount' }, { key: 'paymentDate', label: 'Payment Date' }, { key: 'status', label: 'Status' }],
      rows: bonuses.map((row) => ({ ...row, employeeName: employeeName(employees, row.employeeId), amount: money(row.amount) })),
    },
    {
      title: 'Deduction Report',
      slug: 'deduction-report',
      columns: [{ key: 'employeeName', label: 'Employee' }, { key: 'deductionType', label: 'Type' }, { key: 'amount', label: 'Amount' }, { key: 'deductionDate', label: 'Date' }, { key: 'status', label: 'Status' }],
      rows: deductions.map((row) => ({ ...row, employeeName: employeeName(employees, row.employeeId), amount: money(row.amount) })),
    },
  ];

  return (
    <section className="page-stack">
      <div className="section-heading page-header">
        <div>
          <p className="eyebrow">Payroll and compensation</p>
          <h1>Payroll command center</h1>
          <p className="page-description">Manage payroll cycles, approvals, bonuses, deductions, salary history, payslips, and compensation analytics.</p>
        </div>
        <div className="toolbar">
          <select value={selectedCycleId} onChange={(event) => setSelectedCycleId(event.target.value)}>
            <option value="">Current cycle</option>
            {cycleOptions}
          </select>
          <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>
            <option value="">Select employee</option>
            {employeeOptions}
          </select>
        </div>
      </div>

      {message && <div className="app-message">{message}</div>}

      <div className="metrics-grid enterprise-metrics">
        <MetricCard icon={CircleDollarSign} label="Monthly payroll" value={canViewFinancials ? money(totals.monthlyPayroll) : 'Restricted'} detail={currentCycle?.cycleName || 'All cycles'} />
        <MetricCard icon={WalletCards} label="Pending salaries" value={canViewFinancials ? money(totals.pending) : 'Restricted'} detail={`${cyclePayroll.filter((record) => record.paymentStatus === 'Pending').length} records`} />
        <MetricCard icon={CheckCircle2} label="Paid salaries" value={canViewFinancials ? money(totals.paid) : 'Restricted'} detail={`${cyclePayroll.filter((record) => record.paymentStatus === 'Paid').length} records`} tone="success" />
        <MetricCard icon={CalendarDays} label="Overdue salaries" value={canViewFinancials ? money(totals.overdue) : 'Restricted'} detail={`${cyclePayroll.filter((record) => record.paymentStatus === 'Overdue').length} records`} tone={totals.overdue ? 'danger' : ''} />
        <MetricCard icon={TrendingUp} label="Bonuses" value={canViewFinancials ? money(totals.bonuses) : 'Restricted'} detail={`Deductions ${canViewFinancials ? money(totals.deductions) : 'restricted'}`} />
      </div>

      <div className="tabs">
        {['Command Center', 'Cycles', 'Salary History', 'Bonuses', 'Deductions', 'Payslips', 'Reports', 'Analytics'].map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Command Center' && (
        <div className="dashboard-grid">
          <section className="chart-card wide">
            <div className="card-heading"><div><p className="eyebrow">Department cost</p><h2>Payroll by department</h2></div></div>
            <BarList rows={payrollByDepartment} valueKey="payroll" labelKey="department" />
          </section>
          <section className="activity-card">
            <div className="card-heading"><div><p className="eyebrow">Approval workflow</p><h2>Cycles needing action</h2></div></div>
            <div className="activity-list">
              {payrollCycles.filter((cycle) => ['Draft', 'Calculating', 'Pending Approval'].includes(cycle.runStatus)).map((cycle) => (
                <article className="activity-item" key={cycle.id}>
                  <span><CalendarDays size={16} /></span>
                  <div><strong>{cycle.cycleName}</strong><small>{cycle.periodStart} - {cycle.periodEnd}</small></div>
                  <StatusPill value={cycle.runStatus} />
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'Cycles' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitCycle}>
              <Field label="Cycle Name"><input required value={cycleForm.cycleName} onChange={(event) => setCycleForm({ ...cycleForm, cycleName: event.target.value })} placeholder="June 2026 Payroll" /></Field>
              <Field label="Period Start"><input type="date" value={cycleForm.periodStart} onChange={(event) => setCycleForm({ ...cycleForm, periodStart: event.target.value })} /></Field>
              <Field label="Period End"><input type="date" value={cycleForm.periodEnd} onChange={(event) => setCycleForm({ ...cycleForm, periodEnd: event.target.value })} /></Field>
              <Field label="Run Status"><select value={cycleForm.runStatus} onChange={(event) => setCycleForm({ ...cycleForm, runStatus: event.target.value })}>{cycleStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Approval Status"><select value={cycleForm.approvalStatus} onChange={(event) => setCycleForm({ ...cycleForm, approvalStatus: event.target.value })}>{cycleStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
              <Field label="Notes"><input value={cycleForm.notes} onChange={(event) => setCycleForm({ ...cycleForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">{editingCycleId ? 'Update cycle' : 'Create cycle'}</button></div>
            </form>
          )}
          <div className="table-card"><table><thead><tr><th>Cycle</th><th>Period</th><th>Run</th><th>Approval</th><th>Actions</th></tr></thead><tbody>{payrollCycles.map((cycle) => <tr key={cycle.id}><td><strong>{cycle.cycleName}</strong><br /><small>{cycle.notes}</small></td><td>{cycle.periodStart} - {cycle.periodEnd}</td><td><StatusPill value={cycle.runStatus} /></td><td><StatusPill value={cycle.approvalStatus} /></td><td className="row-actions">{canEdit && cycle.runStatus !== 'Locked' && <button className="mini" onClick={() => { setCycleForm(cycle); setEditingCycleId(cycle.id); }}>Edit</button>}{canApprove && cycle.runStatus === 'Pending Approval' && <button className="mini" onClick={() => updatePayrollCycleStatus(cycle.id, 'Approved')}>Approve</button>}{canApprove && cycle.runStatus === 'Approved' && <button className="mini" onClick={() => updatePayrollCycleStatus(cycle.id, 'Paid')}>Mark paid</button>}{canApprove && cycle.runStatus === 'Paid' && <button className="mini" onClick={() => updatePayrollCycleStatus(cycle.id, 'Locked')}><Lock size={14} />Lock</button>}</td></tr>)}</tbody></table></div>
        </>
      )}

      {activeTab === 'Salary History' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitSalaryHistory}>
              <Field label="Employee"><select required value={salaryForm.employeeId} onChange={(event) => setSalaryForm({ ...salaryForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Previous Salary"><input value={salaryForm.previousSalary} onChange={(event) => setSalaryForm({ ...salaryForm, previousSalary: event.target.value })} /></Field>
              <Field label="New Salary"><input value={salaryForm.newSalary} onChange={(event) => setSalaryForm({ ...salaryForm, newSalary: event.target.value })} /></Field>
              <Field label="Effective Date"><input type="date" value={salaryForm.effectiveDate} onChange={(event) => setSalaryForm({ ...salaryForm, effectiveDate: event.target.value })} /></Field>
              <Field label="Reason"><input value={salaryForm.reason} onChange={(event) => setSalaryForm({ ...salaryForm, reason: event.target.value })} /></Field>
              <Field label="Approved By"><input value={salaryForm.approvedBy} onChange={(event) => setSalaryForm({ ...salaryForm, approvedBy: event.target.value })} /></Field>
              <Field label="Notes"><input value={salaryForm.notes} onChange={(event) => setSalaryForm({ ...salaryForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">Add salary change</button></div>
            </form>
          )}
          <div className="table-card"><table><thead><tr><th>Employee</th><th>Previous</th><th>New</th><th>Effective</th><th>Reason</th><th>Approved By</th></tr></thead><tbody>{salaryHistory.map((row) => <tr key={row.id}><td>{employeeName(employees, row.employeeId)}</td><td>{money(row.previousSalary)}</td><td>{money(row.newSalary)}</td><td>{row.effectiveDate}</td><td>{row.reason}</td><td>{row.approvedBy}</td></tr>)}</tbody></table></div>
        </>
      )}

      {activeTab === 'Bonuses' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitBonus}>
              <Field label="Employee"><select required value={bonusForm.employeeId} onChange={(event) => setBonusForm({ ...bonusForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Department"><input value={bonusForm.department} onChange={(event) => setBonusForm({ ...bonusForm, department: event.target.value })} /></Field>
              <Field label="Cycle"><select value={bonusForm.payrollCycleId} onChange={(event) => setBonusForm({ ...bonusForm, payrollCycleId: event.target.value })}><option value="">No cycle</option>{cycleOptions}</select></Field>
              <Field label="Performance Note"><select value={bonusForm.performanceNoteId} onChange={(event) => setBonusForm({ ...bonusForm, performanceNoteId: event.target.value })}><option value="">No linked note</option>{performanceNotes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></Field>
              <Field label="Bonus Type"><select value={bonusForm.bonusType} onChange={(event) => setBonusForm({ ...bonusForm, bonusType: event.target.value })}>{bonusTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Amount"><input value={bonusForm.amount} onChange={(event) => setBonusForm({ ...bonusForm, amount: event.target.value })} /></Field>
              <Field label="Payment Date"><input type="date" value={bonusForm.paymentDate} onChange={(event) => setBonusForm({ ...bonusForm, paymentDate: event.target.value })} /></Field>
              <Field label="Notes"><input value={bonusForm.notes} onChange={(event) => setBonusForm({ ...bonusForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">Add bonus</button></div>
            </form>
          )}
          <div className="table-card"><table><thead><tr><th>Employee</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th><th>Notes</th></tr></thead><tbody>{bonuses.map((bonus) => <tr key={bonus.id}><td>{employeeName(employees, bonus.employeeId)}</td><td>{bonus.bonusType}</td><td>{money(bonus.amount)}</td><td>{bonus.paymentDate}</td><td><StatusPill value={bonus.status} /></td><td>{bonus.notes}</td></tr>)}</tbody></table></div>
        </>
      )}

      {activeTab === 'Deductions' && (
        <>
          {canEdit && (
            <form className="entry-form" onSubmit={submitDeduction}>
              <Field label="Employee"><select required value={deductionForm.employeeId} onChange={(event) => setDeductionForm({ ...deductionForm, employeeId: event.target.value })}><option value="">Select employee</option>{employeeOptions}</select></Field>
              <Field label="Department"><input value={deductionForm.department} onChange={(event) => setDeductionForm({ ...deductionForm, department: event.target.value })} /></Field>
              <Field label="Cycle"><select value={deductionForm.payrollCycleId} onChange={(event) => setDeductionForm({ ...deductionForm, payrollCycleId: event.target.value })}><option value="">No cycle</option>{cycleOptions}</select></Field>
              <Field label="Deduction Type"><select value={deductionForm.deductionType} onChange={(event) => setDeductionForm({ ...deductionForm, deductionType: event.target.value })}>{deductionTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
              <Field label="Amount"><input value={deductionForm.amount} onChange={(event) => setDeductionForm({ ...deductionForm, amount: event.target.value })} /></Field>
              <Field label="Deduction Date"><input type="date" value={deductionForm.deductionDate} onChange={(event) => setDeductionForm({ ...deductionForm, deductionDate: event.target.value })} /></Field>
              <Field label="Notes"><input value={deductionForm.notes} onChange={(event) => setDeductionForm({ ...deductionForm, notes: event.target.value })} /></Field>
              <div className="form-actions"><button type="submit">Add deduction</button></div>
            </form>
          )}
          <div className="table-card"><table><thead><tr><th>Employee</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th><th>Notes</th></tr></thead><tbody>{deductions.map((deduction) => <tr key={deduction.id}><td>{employeeName(employees, deduction.employeeId)}</td><td>{deduction.deductionType}</td><td>{money(deduction.amount)}</td><td>{deduction.deductionDate}</td><td><StatusPill value={deduction.status} /></td><td>{deduction.notes}</td></tr>)}</tbody></table></div>
        </>
      )}

      {activeTab === 'Payslips' && (
        <div className="report-grid">
          {payslip ? (
            <article className="report-card wide">
              <div><p className="eyebrow">Payslip preview</p><h2>{payslip.employeeName}</h2><p>{payslip.employeeCode} - {payslip.department} - {payslip.role}</p></div>
              <div className="detail-facts">
                <span><small>Payroll month</small><strong>{payslip.payrollMonth}</strong></span>
                <span><small>Base salary</small><strong>{money(payslip.baseSalary)}</strong></span>
                <span><small>Bonuses</small><strong>{money(payslip.bonuses)}</strong></span>
                <span><small>Deductions</small><strong>{money(payslip.deductions)}</strong></span>
                <span><small>Net salary</small><strong>{money(payslip.netSalary)}</strong></span>
                <span><small>Status</small><strong>{payslip.paymentStatus}</strong></span>
              </div>
              <div className="report-actions"><button onClick={() => exportPayslipPdf(payslip)}><FileText size={16} />Export PDF</button></div>
            </article>
          ) : (
            <article className="report-card"><h2>No payslip selected</h2><p>Select an employee with payroll data to preview a payslip.</p></article>
          )}
        </div>
      )}

      {activeTab === 'Reports' && (
        <div className="report-grid">
          {reports.map((report) => (
            <article className="report-card" key={report.slug}>
              <div><p className="eyebrow">Payroll reports</p><h2>{report.title}</h2><p>{report.rows.length} records ready for export.</p></div>
              <div className="report-actions"><button onClick={() => exportCsv(`velora-${report.slug}.csv`, report.columns, report.rows)}><Download size={16} />CSV</button><button disabled><FileText size={16} />PDF ready</button></div>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div className="dashboard-grid">
          <section className="chart-card wide"><div className="card-heading"><div><p className="eyebrow">Payroll trend</p><h2>Cycle payroll movement</h2></div></div><BarList rows={payrollTrend} valueKey="payroll" labelKey="cycle" /></section>
          <section className="chart-card"><div className="card-heading"><div><p className="eyebrow">Average salary</p><h2>By department</h2></div></div><BarList rows={payrollByDepartment} valueKey="averageSalary" labelKey="department" /></section>
          <section className="chart-card"><div className="card-heading"><div><p className="eyebrow">Compensation movement</p><h2>Bonus vs deduction</h2></div></div><BarList rows={[{ label: 'Bonuses', value: totals.bonuses }, { label: 'Deductions', value: totals.deductions }]} valueKey="value" labelKey="label" /></section>
        </div>
      )}
    </section>
  );
}
