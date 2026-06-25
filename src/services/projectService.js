const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

export const projectPriorities = ['Low', 'Medium', 'High', 'Critical', 'Strategic'];
export const projectStatuses = ['Planning', 'Active', 'At Risk', 'On Hold', 'Completed', 'Cancelled'];
export const taskStatuses = ['Not Started', 'In Progress', 'Blocked', 'Review', 'Completed', 'Cancelled'];
export const kanbanStatuses = ['Not Started', 'In Progress', 'Review', 'Completed'];
export const projectDepartments = ['Management', 'Sales', 'Logistics', 'Procurement', 'Finance', 'HR', 'Operations', 'IT', 'Inventory'];

export const blankProject = {
  id: '',
  projectId: '',
  projectName: '',
  description: '',
  department: 'Operations',
  priority: 'Medium',
  status: 'Planning',
  startDate: today(),
  dueDate: '',
  budget: '',
  projectManager: '',
  teamMembers: [],
  linkedDocumentId: '',
  createdAt: '',
};

export const blankTask = {
  id: '',
  taskId: '',
  projectId: '',
  taskName: '',
  description: '',
  assignedEmployee: '',
  assignedDepartment: 'Operations',
  priority: 'Medium',
  dueDate: '',
  status: 'Not Started',
  progress: 0,
  linkedDocumentId: '',
  createdAt: '',
};

export const blankTaskComment = {
  id: '',
  taskId: '',
  author: '',
  note: '',
  createdAt: '',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function numberValue(value) {
  return Number(String(value ?? '').replace(/,/g, '')) || 0;
}

export function formatProjectId(count = 0) {
  return `PRJ-${String(count + 1).padStart(4, '0')}`;
}

export function formatTaskId(count = 0) {
  return `TSK-${String(count + 1).padStart(4, '0')}`;
}

export function sanitizeProject(project = {}) {
  return {
    ...blankProject,
    ...project,
    id: project.id || uid('project'),
    projectId: project.projectId || formatProjectId(0),
    projectName: String(project.projectName || '').trim(),
    description: String(project.description || '').trim(),
    department: projectDepartments.includes(project.department) ? project.department : 'Operations',
    priority: projectPriorities.includes(project.priority) ? project.priority : 'Medium',
    status: projectStatuses.includes(project.status) ? project.status : 'Planning',
    budget: String(project.budget ?? '').trim(),
    teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.filter(Boolean) : [],
    createdAt: project.createdAt || project.created_at || nowIso(),
  };
}

export function sanitizeTask(task = {}) {
  return {
    ...blankTask,
    ...task,
    id: task.id || uid('task'),
    taskId: task.taskId || formatTaskId(0),
    projectId: task.projectId || '',
    taskName: String(task.taskName || '').trim(),
    description: String(task.description || '').trim(),
    assignedDepartment: projectDepartments.includes(task.assignedDepartment) ? task.assignedDepartment : 'Operations',
    priority: projectPriorities.includes(task.priority) ? task.priority : 'Medium',
    status: taskStatuses.includes(task.status) ? task.status : 'Not Started',
    progress: Math.min(100, Math.max(0, Number(task.progress) || 0)),
    createdAt: task.createdAt || task.created_at || nowIso(),
  };
}

export function sanitizeTaskComment(comment = {}) {
  return {
    ...blankTaskComment,
    ...comment,
    id: comment.id || uid('comment'),
    taskId: comment.taskId || '',
    author: String(comment.author || '').trim(),
    note: String(comment.note || '').trim(),
    createdAt: comment.createdAt || comment.created_at || nowIso(),
  };
}

export function projectToRow(project, userId, companyId) {
  return {
    project_id: project.projectId,
    project_name: project.projectName,
    description: project.description,
    department: project.department,
    priority: project.priority,
    status: project.status,
    start_date: project.startDate || null,
    due_date: project.dueDate || null,
    budget: numberValue(project.budget),
    project_manager: project.projectManager || '',
    team_members: project.teamMembers || [],
    linked_document_id: project.linkedDocumentId || null,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToProject(row) {
  return sanitizeProject({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    description: row.description,
    department: row.department,
    priority: row.priority,
    status: row.status,
    startDate: row.start_date,
    dueDate: row.due_date,
    budget: row.budget,
    projectManager: row.project_manager,
    teamMembers: row.team_members,
    linkedDocumentId: row.linked_document_id,
    createdAt: row.created_at,
  });
}

export function taskToRow(task, userId, companyId) {
  return {
    task_id: task.taskId,
    project_record_id: task.projectId || null,
    task_name: task.taskName,
    description: task.description,
    assigned_employee: task.assignedEmployee || '',
    assigned_department: task.assignedDepartment,
    priority: task.priority,
    due_date: task.dueDate || null,
    status: task.status,
    progress: Number(task.progress) || 0,
    linked_document_id: task.linkedDocumentId || null,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToTask(row) {
  return sanitizeTask({
    id: row.id,
    taskId: row.task_id,
    projectId: row.project_record_id,
    taskName: row.task_name,
    description: row.description,
    assignedEmployee: row.assigned_employee,
    assignedDepartment: row.assigned_department,
    priority: row.priority,
    dueDate: row.due_date,
    status: row.status,
    progress: row.progress,
    linkedDocumentId: row.linked_document_id,
    createdAt: row.created_at,
  });
}

export function commentToRow(comment, userId) {
  return {
    task_record_id: comment.taskId,
    author: comment.author,
    note: comment.note,
    created_by: userId || null,
  };
}

export function rowToComment(row) {
  return sanitizeTaskComment({
    id: row.id,
    taskId: row.task_record_id,
    author: row.author,
    note: row.note,
    createdAt: row.created_at,
  });
}

export function buildProjectAnalytics(projects = [], tasks = [], employees = []) {
  const now = new Date();
  const activeProjects = projects.filter((project) => ['Planning', 'Active', 'At Risk', 'On Hold'].includes(project.status));
  const completedProjects = projects.filter((project) => project.status === 'Completed');
  const overdueProjects = projects.filter((project) => project.dueDate && new Date(project.dueDate) < now && project.status !== 'Completed');
  const activeTasks = tasks.filter((task) => !['Completed', 'Cancelled'].includes(task.status));
  const blockedTasks = tasks.filter((task) => task.status === 'Blocked');
  const overdueTasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed');
  const workload = employees.map((employee) => {
    const name = employee.fullName || employee.email || employee.employeeId;
    const assigned = tasks.filter((task) => task.assignedEmployee === name);
    return {
      employee: name,
      assigned: assigned.length,
      completed: assigned.filter((task) => task.status === 'Completed').length,
      overdue: assigned.filter((task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed').length,
      projects: new Set(assigned.map((task) => task.projectId).filter(Boolean)).size,
    };
  }).sort((a, b) => b.assigned - a.assigned);

  const departments = projectDepartments.map((department) => {
    const departmentProjects = projects.filter((project) => project.department === department);
    const departmentTasks = tasks.filter((task) => task.assignedDepartment === department);
    const completed = departmentTasks.filter((task) => task.status === 'Completed').length;
    return {
      department,
      projects: departmentProjects.length,
      tasks: departmentTasks.length,
      completionRate: departmentTasks.length ? Math.round((completed / departmentTasks.length) * 100) : 0,
      blocked: departmentTasks.filter((task) => task.status === 'Blocked').length,
    };
  }).filter((item) => item.projects || item.tasks);

  const highRiskProjects = projects.filter((project) => project.status === 'At Risk' || project.priority === 'Critical' || project.priority === 'Strategic' || overdueProjects.some((item) => item.id === project.id));

  return {
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    overdueProjects: overdueProjects.length,
    activeTasks: activeTasks.length,
    blockedTasks: blockedTasks.length,
    overdueTasks: overdueTasks.length,
    teamWorkload: workload,
    departmentPerformance: departments,
    highRiskProjects,
    completionRate: projects.length ? Math.round((completedProjects.length / projects.length) * 100) : 0,
  };
}

export function buildProjectRecommendations(projects = [], tasks = [], employees = []) {
  const analytics = buildProjectAnalytics(projects, tasks, employees);
  const recommendations = [];
  if (analytics.blockedTasks) {
    recommendations.push({
      title: 'Unblock stalled execution',
      detail: `${analytics.blockedTasks} tasks are blocked. Review owners, dependencies, and manager comments.`,
      priority: 'Critical',
    });
  }
  if (analytics.overdueProjects) {
    recommendations.push({
      title: 'Review overdue project deadlines',
      detail: `${analytics.overdueProjects} projects have missed due dates and need revised execution plans.`,
      priority: 'High',
    });
  }
  const overloaded = analytics.teamWorkload.filter((item) => item.assigned >= 5 && item.completed < item.assigned);
  if (overloaded.length) {
    recommendations.push({
      title: 'Balance team workload',
      detail: `${overloaded[0].employee} appears heavily loaded with ${overloaded[0].assigned} assigned tasks.`,
      priority: 'Medium',
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      title: 'Execution cadence looks stable',
      detail: 'No major blocked, overdue, or workload imbalance signals were detected.',
      priority: 'Low',
    });
  }
  return recommendations;
}

export function filterProjects(projects = [], query = '', status = 'All', department = 'All') {
  const needle = String(query || '').toLowerCase();
  return projects.filter((project) => {
    const text = [project.projectId, project.projectName, project.description, project.department, project.priority, project.status].join(' ').toLowerCase();
    return (!needle || text.includes(needle))
      && (status === 'All' || project.status === status)
      && (department === 'All' || project.department === department);
  });
}

export function filterTasks(tasks = [], query = '', status = 'All', department = 'All') {
  const needle = String(query || '').toLowerCase();
  return tasks.filter((task) => {
    const text = [task.taskId, task.taskName, task.description, task.assignedEmployee, task.assignedDepartment, task.priority, task.status].join(' ').toLowerCase();
    return (!needle || text.includes(needle))
      && (status === 'All' || task.status === status)
      && (department === 'All' || task.assignedDepartment === department);
  });
}
