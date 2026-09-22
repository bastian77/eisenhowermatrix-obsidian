import { h } from 'preact';
import { App, Notice } from 'obsidian';
import { completeTask, SourceTask, TaskDateFormat, TaskSection, updateTaskPriority } from '../tasks/TaskProvider';

interface TaskMatrixProps {
    tasks: SourceTask[];
    app: App;
    dateFormat: TaskDateFormat;
    onChanged: () => void;
}

const sections: Array<{ id: TaskSection; title: string }> = [
    { id: 'q1', title: 'Do Now' },
    { id: 'q2', title: 'Plan' },
    { id: 'q3', title: 'Delegate' },
    { id: 'q4', title: 'Eliminate' },
];

export function TaskMatrix({ tasks, app, dateFormat, onChanged }: TaskMatrixProps) {
    const openTask = (task: SourceTask) => {
        void app.workspace.openLinkText(task.path, '', true);
    };

    const tasksFor = (section: TaskSection) => tasks.filter(task => task.section === section);
    const changePriority = async (task: SourceTask, section: TaskSection) => {
        if (section === 'todo') return;
        const priority = section === 'q1' || section === 'q2' ? 'high' : 'low';
        try {
            await updateTaskPriority(app, task, priority);
            onChanged();
        } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error));
        }
    };

    const complete = async (task: SourceTask) => {
        try {
            await completeTask(app, task);
            onChanged();
        } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error));
        }
    };

    return (
        <div className="priority-matrix-container">
            <div className="priority-matrix-toolbar">
                <div className="priority-matrix-title">Tasks Eisenhower view</div>
                <div className="priority-matrix-title">{tasks.filter(task => !task.checked).length} open tasks</div>
            </div>
            <div className="priority-matrix-grid">
                <div className="pmx-matrix-header">
                    <div className="pmx-col-subheader">Urgent</div>
                    <div className="pmx-col-subheader">Not urgent</div>
                </div>
                <div className="pmx-row-label">
                    <div className="pmx-col-subheader">Important</div>
                </div>
                <TaskSectionCell section={sections[0]} tasks={tasksFor('q1')} onOpen={openTask} onComplete={complete} dateFormat={dateFormat} onDrop={(id, target) => { const task = tasks.find(candidate => candidate.id === id); if (task) void changePriority(task, target); }} />
                <TaskSectionCell section={sections[1]} tasks={tasksFor('q2')} onOpen={openTask} onComplete={complete} dateFormat={dateFormat} onDrop={(id, target) => { const task = tasks.find(candidate => candidate.id === id); if (task) void changePriority(task, target); }} />
                <div className="pmx-row-label">
                    <div className="pmx-col-subheader">Not important</div>
                </div>
                <TaskSectionCell section={sections[2]} tasks={tasksFor('q3')} onOpen={openTask} onComplete={complete} dateFormat={dateFormat} onDrop={(id, target) => { const task = tasks.find(candidate => candidate.id === id); if (task) void changePriority(task, target); }} />
                <TaskSectionCell section={sections[3]} tasks={tasksFor('q4')} onOpen={openTask} onComplete={complete} dateFormat={dateFormat} onDrop={(id, target) => { const task = tasks.find(candidate => candidate.id === id); if (task) void changePriority(task, target); }} />
            </div>
            <div className="pmx-lists">
                <div className="pmx-list-wrapper">
                    <div className="pmx-col-header">Todo ohne Priorität</div>
                    <div className="pmx-list-panel pmx-todo">
                        <TaskList tasks={tasksFor('todo')} onOpen={openTask} onComplete={complete} dateFormat={dateFormat} />
                    </div>
                </div>
                <div className="pmx-list-wrapper">
                    <div className="pmx-col-header">Erledigte Todos</div>
                    <div className="pmx-list-panel pmx-done">
                        <TaskList tasks={tasksFor('done')} onOpen={openTask} dateFormat={dateFormat} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TaskSectionCell({ section, tasks, onOpen, onComplete, dateFormat, onDrop }: { section: { id: TaskSection; title: string }; tasks: SourceTask[]; onOpen: (task: SourceTask) => void; onComplete: (task: SourceTask) => void; dateFormat: TaskDateFormat; onDrop: (taskId: string, section: TaskSection) => void }) {
    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        const taskId = event.dataTransfer?.getData('text/plain');
        if (taskId) onDrop(taskId, section.id);
    };

    return (
        <div className={`pmx-cell pmx-${section.id}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <div className="pmx-cell-title">{section.title}</div>
            <TaskList tasks={tasks} onOpen={onOpen} onComplete={onComplete} dateFormat={dateFormat} />
        </div>
    );
}

function TaskList({ tasks, onOpen, onComplete, dateFormat }: { tasks: SourceTask[]; onOpen: (task: SourceTask) => void; onComplete?: (task: SourceTask) => void; dateFormat: TaskDateFormat }) {
    return (
        <div className="pmx-list">
            {tasks.map(task => (
                <div className="pmx-item-wrapper" key={task.id}>
                    <button className="pmx-item pmx-source-task" draggable onDragStart={(event) => event.dataTransfer?.setData('text/plain', task.id)} onClick={() => onOpen(task)} title={`${task.path}:${task.line + 1}`}>
                        <input className="pmx-task-checkbox" type="checkbox" checked={task.checked} disabled={task.checked} aria-label="Mark task as complete" onClick={(event) => event.stopPropagation()} onChange={() => { if (onComplete) void onComplete(task); }} />
                        <span className="pmx-source-task-content">
                            <span className="pmx-item-title">{task.text}</span>
                            <span className="pmx-source-task-meta">{task.priority ?? 'no priority'}{task.due ? ` · due ${formatDate(task.due, dateFormat)}` : ''}</span>
                        </span>
                    </button>
                </div>
            ))}
        </div>
    );
}

function formatDate(date: Date, format: TaskDateFormat): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    if (format === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
    if (format === 'dd/MM/yyyy') return `${day}/${month}/${year}`;
    if (format === 'dd-MM-yyyy') return `${day}-${month}-${year}`;
    return `${day}.${month}.${year}`;
}
