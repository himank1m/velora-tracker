import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  KanbanSquare,
  MessageSquare,
  Search,
  Target,
  Users,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  blankProject,
  blankTask,
  blankTaskComment,
  buildProjectAnalytics,
  buildProjectRecommendations,
  commentToRow,
  filterProjects,
  filterTasks,
  formatProjectId,
  formatTaskId,
  kanbanStatuses,
  projectDepartments,
  projectPriorities,
  projectStatuses,
  projectToRow,
  rowToComment,
  rowToProject,
  rowToTask,
  sanitizeProject,
  sanitizeTask,
  sanitizeTaskComment,
  taskStatuses,
  taskToRow,
} from '../services/projectService';
import '../projects.css';

function loadLocal(key, mapper) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]').map(mapper);
  } catch {
    return [];
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function PriorityBadge({ priority }) {
  return <span className={`project-priority ${String(priority).toLowerCase()}`}>{priority}</span>;
}

function ProjectMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`project-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function ProjectManagementCenter({
  user,
  profile,
  companyId,
  employees = [],
  documents = [],
  canEdit = false,
}) {
  const [projects, setProjects] = useState(() => loadLocal('velora-projects', sanitizeProject));
  const [tasks, setTasks] = useState(() => loadLocal('velora-project-tasks', sanitizeTask));
  const [comments, setComments] = useState(() => loadLocal('velora-task-comments', sanitizeTaskComment));
  const [projectForm, setProjectForm] = useState(() => ({ ...blankProject, projectId: formatProjectId(0) }));
  const [taskForm, setTaskForm] = useState(() => ({ ...blankTask, taskId: formatTaskId(0) }));
  const [commentForm, setCommentForm] = useState(blankTaskComment);
  const [editingProjectId, setEditingProjectId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [syncAvailable, setSyncAvailable] = useState(true);

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Velora user';
  const analytics = useMemo(() => buildProjectAnalytics(projects, tasks, employees), [employees, projects, tasks]);
  const recommendations = useMemo(() => buildProjectRecommendations(projects, tasks, employees), [employees, projects, tasks]);
  const filteredProjects = useMemo(() => filterProjects(projects, query, statusFilter, departmentFilter), [departmentFilter, projects, query, statusFilter]);
  const filteredTasks = useMemo(() => filterTasks(tasks, query, statusFilter, departmentFilter), [departmentFilter, query, statusFilter, tasks]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0];
  const projectNameById = (id) => projects.find((project) => project.id === id)?.projectName || 'Unlinked project';
  const employeeOptions = employees.map((employee) => employee.fullName || employee.email || employee.employeeId).filter(Boolean);
  const selectedTaskComments = comments.filter((comment) => comment.taskId === selectedTask?.id);

  useEffect(() => {
    setProjectForm((value) => value.projectId ? value : { ...value, projectId: formatProjectId(projects.length) });
  }, [projects.length]);

  useEffect(() => {
    setTaskForm((value) => value.taskId ? value : { ...value, taskId: formatTaskId(tasks.length) });
  }, [tasks.length]);

  useEffect(() => {
    let mounted = true;
    async function loadProjects() {
      if (!user?.id) return;
      const [projectResult, taskResult, commentResult] = await Promise.all([
        supabase.from('project_records').select('*').order('created_at', { ascending: false }),
        supabase.from('project_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('project_task_comments').select('*').order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      if (projectResult.error || taskResult.error || commentResult.error) {
        setSyncAvailable(false);
        return;
      }
      const mappedProjects = (projectResult.data || []).map(rowToProject);
      const mappedTasks = (taskResult.data || []).map(rowToTask);
      const mappedComments = (commentResult.data || []).map(rowToComment);
      setSyncAvailable(true);
      setProjects(mappedProjects);
      setTasks(mappedTasks);
      setComments(mappedComments);
      saveLocal('velora-projects', mappedProjects);
      saveLocal('velora-project-tasks', mappedTasks);
      saveLocal('velora-task-comments', mappedComments);
    }
    loadProjects();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  function toggleTeamMember(member) {
    setProjectForm((value) => {
      const current = value.teamMembers || [];
      return {
        ...value,
        teamMembers: current.includes(member)
          ? current.filter((item) => item !== member)
          : [...current, member],
      };
    });
  }

  async function saveProject(event) {
    event.preventDefault();
    if (!canEdit) {
      setNotice('Only management can create or update projects.');
      return;
    }
    const cleanProject = sanitizeProject({
      ...projectForm,
      id: editingProjectId || projectForm.id,
      projectId: projectForm.projectId || formatProjectId(projects.length),
    });
    if (!cleanProject.projectName) {
      setNotice('Add a project name before saving.');
      return;
    }
    let savedProject = cleanProject;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const queryBuilder = editingProjectId
        ? supabase.from('project_records').update(projectToRow(cleanProject, user.id, companyId)).eq('id', editingProjectId)
        : supabase.from('project_records').insert(projectToRow(cleanProject, user.id, companyId));
      const { data, error } = await queryBuilder.select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        savedProject = rowToProject(data);
        synced = true;
      }
    }
    const next = editingProjectId
      ? projects.map((project) => project.id === editingProjectId ? savedProject : project)
      : [savedProject, ...projects];
    setProjects(next);
    saveLocal('velora-projects', next);
    setProjectForm({ ...blankProject, projectId: formatProjectId(next.length) });
    setEditingProjectId('');
    setNotice(synced ? 'Project saved.' : 'Project saved locally. Run the Phase 17 SQL migration to enable Supabase sync.');
  }

  async function saveTask(event) {
    event.preventDefault();
    if (!canEdit) {
      setNotice('Only management can create or update tasks.');
      return;
    }
    const cleanTask = sanitizeTask({
      ...taskForm,
      id: editingTaskId || taskForm.id,
      taskId: taskForm.taskId || formatTaskId(tasks.length),
    });
    if (!cleanTask.taskName) {
      setNotice('Add a task name before saving.');
      return;
    }
    let savedTask = cleanTask;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const queryBuilder = editingTaskId
        ? supabase.from('project_tasks').update(taskToRow(cleanTask, user.id, companyId)).eq('id', editingTaskId)
        : supabase.from('project_tasks').insert(taskToRow(cleanTask, user.id, companyId));
      const { data, error } = await queryBuilder.select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        savedTask = rowToTask(data);
        synced = true;
      }
    }
    const next = editingTaskId
      ? tasks.map((task) => task.id === editingTaskId ? savedTask : task)
      : [savedTask, ...tasks];
    setTasks(next);
    saveLocal('velora-project-tasks', next);
    setTaskForm({ ...blankTask, taskId: formatTaskId(next.length) });
    setEditingTaskId('');
    setSelectedTaskId(savedTask.id);
    setNotice(synced ? 'Task saved.' : 'Task saved locally. Run the Phase 17 SQL migration to enable Supabase sync.');
  }

  async function updateTaskStatus(task, status) {
    const updated = sanitizeTask({
      ...task,
      status,
      progress: status === 'Completed' ? 100 : task.progress,
    });
    const next = tasks.map((item) => item.id === task.id ? updated : item);
    setTasks(next);
    saveLocal('velora-project-tasks', next);
    if (syncAvailable && user?.id && !String(task.id).startsWith('task-')) {
      const { error } = await supabase.from('project_tasks').update(taskToRow(updated, user.id, companyId)).eq('id', task.id);
      if (error) setSyncAvailable(false);
    }
  }

  async function saveComment(event) {
    event.preventDefault();
    if (!selectedTask) {
      setNotice('Select a task before adding a note.');
      return;
    }
    const cleanComment = sanitizeTaskComment({
      ...commentForm,
      taskId: selectedTask.id,
      author: commentForm.author || userDisplayName,
    });
    if (!cleanComment.note) {
      setNotice('Add a note before saving.');
      return;
    }
    let savedComment = cleanComment;
    let synced = syncAvailable;
    if (syncAvailable && user?.id && !String(selectedTask.id).startsWith('task-')) {
      const { data, error } = await supabase
        .from('project_task_comments')
        .insert(commentToRow(cleanComment, user.id))
        .select()
        .single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        savedComment = rowToComment(data);
        synced = true;
      }
    }
    const next = [savedComment, ...comments];
    setComments(next);
    saveLocal('velora-task-comments', next);
    setCommentForm(blankTaskComment);
    setNotice(synced ? 'Task note saved.' : 'Task note saved locally.');
  }

  function editProject(project) {
    setProjectForm(project);
    setEditingProjectId(project.id);
  }

  function editTask(task) {
    setTaskForm(task);
    setEditingTaskId(task.id);
    setSelectedTaskId(task.id);
  }

  return (
    <div className="projects-page">
      <header className="section-heading page-header">
        <div>
          <p className="eyebrow">Project Management Center</p>
          <h1>Execution command hub</h1>
          <p className="page-description">Connect management, departments, employees, AI COO priorities, documents, and operational execution in one project and task system.</p>
        </div>
        <div className="project-sync-card">
          <CheckCircle2 size={18} />
          <span>{syncAvailable ? 'Supabase synced' : 'Local fallback'}</span>
        </div>
      </header>

      {notice && <div className="inline-alert success">{notice}</div>}

      <section className="project-metrics-grid">
        <ProjectMetric icon={Target} label="Active projects" value={analytics.activeProjects} detail="Planning, active, at risk, on hold" />
        <ProjectMetric icon={CheckCircle2} label="Completed" value={analytics.completedProjects} detail={`${analytics.completionRate}% success rate`} tone="success" />
        <ProjectMetric icon={AlertTriangle} label="Overdue projects" value={analytics.overdueProjects} detail={`${analytics.overdueTasks} overdue tasks`} tone="danger" />
        <ProjectMetric icon={ClipboardList} label="Active tasks" value={analytics.activeTasks} detail={`${analytics.blockedTasks} blocked`} tone="info" />
      </section>

      <section className="projects-grid main">
        <div className="project-panel">
          <div className="project-panel-heading">
            <div>
              <p className="eyebrow">Executive view</p>
              <h2>Strategic project portfolio</h2>
            </div>
          </div>
          <div className="project-filter-bar">
            <label className="project-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects and tasks" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              {[...projectStatuses, ...taskStatuses].filter((value, index, arr) => arr.indexOf(value) === index).map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
              <option>All</option>
              {projectDepartments.map((department) => <option key={department}>{department}</option>)}
            </select>
          </div>
          <div className="project-list">
            {filteredProjects.map((project) => {
              const projectTasks = tasks.filter((task) => task.projectId === project.id);
              const complete = projectTasks.filter((task) => task.status === 'Completed').length;
              const progress = projectTasks.length ? Math.round((complete / projectTasks.length) * 100) : 0;
              return (
                <article key={project.id}>
                  <div className="project-list-head">
                    <span>{project.projectId}</span>
                    <PriorityBadge priority={project.priority} />
                  </div>
                  <h3>{project.projectName}</h3>
                  <p>{project.description || 'No description recorded.'}</p>
                  <footer>
                    <span>{project.department}</span>
                    <span>{project.status}</span>
                    <span>{project.dueDate || 'No deadline'}</span>
                    <button type="button" onClick={() => editProject(project)}>Edit</button>
                  </footer>
                  <meter min="0" max="100" value={progress}>{progress}%</meter>
                </article>
              );
            })}
            {!filteredProjects.length && (
              <div className="empty-state">
                <Target size={28} />
                <strong>No projects found</strong>
                <span>Create a project or adjust filters to see work in motion.</span>
              </div>
            )}
          </div>
        </div>

        <aside className="project-panel">
          <p className="eyebrow">AI COO task intelligence</p>
          <h2>Recommended priorities</h2>
          <div className="project-recommendation-list">
            {recommendations.map((item) => (
              <article key={item.title}>
                <PriorityBadge priority={item.priority} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="project-panel">
        <div className="project-panel-heading">
          <div>
            <p className="eyebrow">Kanban board</p>
            <h2>Task execution flow</h2>
          </div>
          <span className="project-board-note"><KanbanSquare size={16} />Status buttons prepare future drag-and-drop</span>
        </div>
        <div className="kanban-board">
          {kanbanStatuses.map((status) => (
            <div className="kanban-column" key={status}>
              <h3>{status}</h3>
              {filteredTasks.filter((task) => task.status === status).map((task) => (
                <article key={task.id} onClick={() => setSelectedTaskId(task.id)}>
                  <div><PriorityBadge priority={task.priority} /><span>{task.taskId}</span></div>
                  <strong>{task.taskName}</strong>
                  <small>{task.assignedEmployee || 'Unassigned'} - {task.dueDate || 'No due date'}</small>
                  <meter min="0" max="100" value={task.progress}>{task.progress}%</meter>
                  <div className="kanban-actions">
                    {kanbanStatuses.filter((nextStatus) => nextStatus !== status).slice(0, 3).map((nextStatus) => (
                      <button type="button" key={nextStatus} onClick={(event) => { event.stopPropagation(); updateTaskStatus(task, nextStatus); }}>{nextStatus}</button>
                    ))}
                  </div>
                </article>
              ))}
              {!filteredTasks.some((task) => task.status === status) && <p className="project-muted">No tasks here.</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="projects-grid three">
        <form className="project-panel project-form" onSubmit={saveProject}>
          <p className="eyebrow">Projects</p>
          <h2>{editingProjectId ? 'Edit project' : 'Create project'}</h2>
          <label><span>Project ID</span><input value={projectForm.projectId} onChange={(event) => setProjectForm((value) => ({ ...value, projectId: event.target.value }))} /></label>
          <label><span>Project name</span><input value={projectForm.projectName} onChange={(event) => setProjectForm((value) => ({ ...value, projectName: event.target.value }))} /></label>
          <label><span>Description</span><textarea value={projectForm.description} onChange={(event) => setProjectForm((value) => ({ ...value, description: event.target.value }))} /></label>
          <div className="project-form-row">
            <label><span>Department</span><select value={projectForm.department} onChange={(event) => setProjectForm((value) => ({ ...value, department: event.target.value }))}>{projectDepartments.map((department) => <option key={department}>{department}</option>)}</select></label>
            <label><span>Priority</span><select value={projectForm.priority} onChange={(event) => setProjectForm((value) => ({ ...value, priority: event.target.value }))}>{projectPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          </div>
          <div className="project-form-row">
            <label><span>Status</span><select value={projectForm.status} onChange={(event) => setProjectForm((value) => ({ ...value, status: event.target.value }))}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label><span>Budget</span><input value={projectForm.budget} onChange={(event) => setProjectForm((value) => ({ ...value, budget: event.target.value }))} /></label>
          </div>
          <div className="project-form-row">
            <label><span>Start date</span><input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((value) => ({ ...value, startDate: event.target.value }))} /></label>
            <label><span>Due date</span><input type="date" value={projectForm.dueDate} onChange={(event) => setProjectForm((value) => ({ ...value, dueDate: event.target.value }))} /></label>
          </div>
          <label><span>Project manager</span><input list="project-employee-options" value={projectForm.projectManager} onChange={(event) => setProjectForm((value) => ({ ...value, projectManager: event.target.value }))} /></label>
          <div className="project-member-picker">
            <span>Team members</span>
            <div>{employeeOptions.map((employee) => <button type="button" className={(projectForm.teamMembers || []).includes(employee) ? 'active' : ''} key={employee} onClick={() => toggleTeamMember(employee)}>{employee}</button>)}</div>
          </div>
          <label><span>Linked document</span><select value={projectForm.linkedDocumentId} onChange={(event) => setProjectForm((value) => ({ ...value, linkedDocumentId: event.target.value }))}><option value="">No document</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.fileName}</option>)}</select></label>
          <button type="submit" disabled={!canEdit}>{editingProjectId ? 'Save project' : 'Create project'}</button>
          {editingProjectId && <button type="button" className="secondary-action" onClick={() => { setEditingProjectId(''); setProjectForm({ ...blankProject, projectId: formatProjectId(projects.length) }); }}>Cancel edit</button>}
        </form>

        <form className="project-panel project-form" onSubmit={saveTask}>
          <p className="eyebrow">Tasks</p>
          <h2>{editingTaskId ? 'Edit task' : 'Create task'}</h2>
          <label><span>Task ID</span><input value={taskForm.taskId} onChange={(event) => setTaskForm((value) => ({ ...value, taskId: event.target.value }))} /></label>
          <label><span>Task name</span><input value={taskForm.taskName} onChange={(event) => setTaskForm((value) => ({ ...value, taskName: event.target.value }))} /></label>
          <label><span>Description</span><textarea value={taskForm.description} onChange={(event) => setTaskForm((value) => ({ ...value, description: event.target.value }))} /></label>
          <label><span>Project</span><select value={taskForm.projectId} onChange={(event) => setTaskForm((value) => ({ ...value, projectId: event.target.value }))}><option value="">No linked project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectId} - {project.projectName}</option>)}</select></label>
          <div className="project-form-row">
            <label><span>Assigned employee</span><input list="project-employee-options" value={taskForm.assignedEmployee} onChange={(event) => setTaskForm((value) => ({ ...value, assignedEmployee: event.target.value }))} /></label>
            <label><span>Department</span><select value={taskForm.assignedDepartment} onChange={(event) => setTaskForm((value) => ({ ...value, assignedDepartment: event.target.value }))}>{projectDepartments.map((department) => <option key={department}>{department}</option>)}</select></label>
          </div>
          <div className="project-form-row">
            <label><span>Priority</span><select value={taskForm.priority} onChange={(event) => setTaskForm((value) => ({ ...value, priority: event.target.value }))}>{projectPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
            <label><span>Status</span><select value={taskForm.status} onChange={(event) => setTaskForm((value) => ({ ...value, status: event.target.value }))}>{taskStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          </div>
          <div className="project-form-row">
            <label><span>Due date</span><input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((value) => ({ ...value, dueDate: event.target.value }))} /></label>
            <label><span>Progress %</span><input type="number" min="0" max="100" value={taskForm.progress} onChange={(event) => setTaskForm((value) => ({ ...value, progress: event.target.value }))} /></label>
          </div>
          <label><span>Linked document</span><select value={taskForm.linkedDocumentId} onChange={(event) => setTaskForm((value) => ({ ...value, linkedDocumentId: event.target.value }))}><option value="">No document</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.fileName}</option>)}</select></label>
          <button type="submit" disabled={!canEdit}>{editingTaskId ? 'Save task' : 'Create task'}</button>
          {editingTaskId && <button type="button" className="secondary-action" onClick={() => { setEditingTaskId(''); setTaskForm({ ...blankTask, taskId: formatTaskId(tasks.length) }); }}>Cancel edit</button>}
        </form>

        <div className="project-panel">
          <p className="eyebrow">Task notes</p>
          <h2>{selectedTask?.taskName || 'Select a task'}</h2>
          {selectedTask && (
            <>
              <div className="task-detail-card">
                <strong>{selectedTask.taskId}</strong>
                <span>{projectNameById(selectedTask.projectId)}</span>
                <meter min="0" max="100" value={selectedTask.progress}>{selectedTask.progress}%</meter>
              </div>
              <form className="project-form compact" onSubmit={saveComment}>
                <label><span>Progress update or manager comment</span><textarea value={commentForm.note} onChange={(event) => setCommentForm((value) => ({ ...value, note: event.target.value }))} /></label>
                <button type="submit"><MessageSquare size={16} />Add note</button>
              </form>
            </>
          )}
          <div className="task-comment-list">
            {selectedTaskComments.map((comment) => (
              <article key={comment.id}>
                <MessageSquare size={16} />
                <span><strong>{comment.author || 'Velora user'}</strong><small>{comment.note} - {new Date(comment.createdAt).toLocaleString()}</small></span>
              </article>
            ))}
            {!selectedTaskComments.length && <p className="project-muted">Task notes, progress updates, and manager observations will appear here.</p>}
          </div>
        </div>
      </section>

      <section className="projects-grid two">
        <div className="project-panel">
          <p className="eyebrow">Employee workload</p>
          <h2>Who is working on what</h2>
          <div className="workload-list">
            {analytics.teamWorkload.slice(0, 8).map((item) => (
              <article key={item.employee}>
                <Users size={17} />
                <div>
                  <strong>{item.employee}</strong>
                  <small>{item.assigned} assigned - {item.completed} completed - {item.overdue} overdue - {item.projects} projects</small>
                  <meter min="0" max="8" value={Math.min(8, item.assigned)}>{item.assigned}</meter>
                </div>
              </article>
            ))}
            {!analytics.teamWorkload.length && <p className="project-muted">Employee workload appears when tasks are assigned to HR employee records.</p>}
          </div>
        </div>
        <div className="project-panel">
          <p className="eyebrow">Department performance</p>
          <h2>Execution by department</h2>
          <div className="department-performance-list">
            {analytics.departmentPerformance.map((item) => (
              <article key={item.department}>
                <BarChart3 size={17} />
                <div>
                  <strong>{item.department}</strong>
                  <small>{item.projects} projects - {item.tasks} tasks - {item.blocked} blocked</small>
                  <meter min="0" max="100" value={item.completionRate}>{item.completionRate}%</meter>
                </div>
                <span>{item.completionRate}%</span>
              </article>
            ))}
            {!analytics.departmentPerformance.length && <p className="project-muted">Department productivity appears when projects and tasks are created.</p>}
          </div>
        </div>
      </section>

      <section className="project-panel project-timeline-panel">
        <p className="eyebrow">Project timeline</p>
        <h2>Milestones, deadlines, dependencies, and progress</h2>
        <div className="project-timeline">
          {projects.slice(0, 10).map((project) => (
            <article key={project.id}>
              <CalendarDays size={18} />
              <div>
                <strong>{project.projectName}</strong>
                <small>{project.startDate || 'No start'} to {project.dueDate || 'No due date'} - {project.status}</small>
              </div>
              <PriorityBadge priority={project.priority} />
            </article>
          ))}
          {!projects.length && <p className="project-muted">Project milestones and deadlines will appear here.</p>}
        </div>
      </section>

      <datalist id="project-employee-options">
        {employeeOptions.map((employee) => <option key={employee} value={employee} />)}
      </datalist>

      <section className="project-panel project-ai-foundation">
        <FileText size={22} />
        <div>
          <p className="eyebrow">Future foundation</p>
          <h2>Ready for Gantt, capacity planning, and automated project creation</h2>
          <p>Projects and tasks now have enough structure for AI COO deadline monitoring, workload balancing, document-linked execution, and future resource forecasting.</p>
        </div>
      </section>
    </div>
  );
}

export default ProjectManagementCenter;
