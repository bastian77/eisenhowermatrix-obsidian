import { h } from 'preact';
import { App, Modal, Notice, Setting } from 'obsidian';
import { compareTaskPriorityDescending, completeTask, ImportantThreshold, SourceTask, TaskDateFormat, TaskSection, updateTaskPriority } from '../tasks/TaskProvider';

interface TaskMatrixProps {
    tasks: SourceTask[];
    app: App;
    dateFormat: TaskDateFormat;
    urgentWithinDays: number;
    importantFrom: ImportantThreshold;
    onChanged: () => void;
}

const sections: Array<{ id: TaskSection; title: string }> = [
    { id: 'q1', title: 'Do Now' },
    { id: 'q2', title: 'Plan' },
    { id: 'q3', title: 'Delegate' },
    { id: 'q4', title: 'Eliminate' },
];

const priorityBelowThreshold: Record<ImportantThreshold, NonNullable<SourceTask['priority']>> = {
    highest: 'high',
    high: 'medium',
    medium: 'low',
    low: 'lowest',
};

export function TaskMatrix({ tasks, app, dateFormat, urgentWithinDays, importantFrom, onChanged }: TaskMatrixProps) {
    const openTask = (task: SourceTask) => {
        void app.workspace.openLinkText(task.path, '', true);
    };

    const tasksFor = (section: TaskSection) => {
        const sectionTasks = tasks.filter(task => task.section === section);
        if (section === 'todo' || section === 'done') return sectionTasks;
        return sectionTasks.sort((left, right) => compareTaskPriorityDescending(left.priority, right.priority));
    };
    const changePriority = async (task: SourceTask, section: TaskSection) => {
        if (section === 'todo') return;
        const importantSection = section === 'q1' || section === 'q2';
        const priority = importantSection ? importantFrom : priorityBelowThreshold[importantFrom];
        try {
            let dueDate: string | null | undefined;
            const urgentSection = section === 'q1' || section === 'q3';
            const taskIsUrgent = task.section === 'q1' || task.section === 'q3';
            const needsUrgencyChangeDate = urgentSection !== taskIsUrgent;
            const needsPlanDate = section === 'q2' && !task.due;
            if (section === 'q4' && taskIsUrgent) {
                dueDate = null;
            } else if (needsUrgencyChangeDate || needsPlanDate) {
                const selectedDueDate = await requestDueDate(app, urgentWithinDays, urgentSection);
                if (!selectedDueDate) return;
                dueDate = selectedDueDate;
            }
            await updateTaskPriority(app, task, priority, dueDate, dateFormat);
            onChanged();
        } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error));
        }
    };

    const complete = (task: SourceTask): void => {
        void completeTask(app, task)
            .then(() => onChanged())
            .catch(error => new Notice(error instanceof Error ? error.message : String(error)));
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

function requestDueDate(app: App, urgentWithinDays: number, mustBeUrgent: boolean): Promise<string | null> {
    return new Promise(resolve => {
        const modal = new DueDateModal(app, resolve, urgentWithinDays, mustBeUrgent);
        modal.open();
    });
}

class DueDateModal extends Modal {
    private resolved = false;
    private value = '';

    constructor(app: App, private readonly resolveValue: (value: string | null) => void, private readonly urgentWithinDays: number, private readonly mustBeUrgent: boolean) {
        super(app);
        this.setTitle('Due date required');
    }

    onOpen(): void {
        new Setting(this.contentEl)
            .setName('Due date')
            .setDesc(this.mustBeUrgent
                ? `Choose a due date within the next ${this.urgentWithinDays} days.`
                : `Choose a due date more than ${this.urgentWithinDays} days away.`)
            .addText(text => {
                text.inputEl.type = 'date';
                const today = new Date();
                const boundaryDate = new Date(today);
                boundaryDate.setDate(boundaryDate.getDate() + this.urgentWithinDays);
                const earliestNotUrgentDate = new Date(boundaryDate);
                earliestNotUrgentDate.setDate(earliestNotUrgentDate.getDate() + 1);
                text.inputEl.min = toInputDate(this.mustBeUrgent ? today : earliestNotUrgentDate);
                if (this.mustBeUrgent) text.inputEl.max = toInputDate(boundaryDate);
                text.onChange(value => {
                    this.value = value;
                });
            });

        new Setting(this.contentEl)
            .addButton(button => button
                .setButtonText('Apply')
                .setCta()
                .onClick(() => this.finish(this.value || null)))
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => this.finish(null)));
    }

    onClose(): void {
        this.finish(null);
    }

    private finish(value: string | null): void {
        if (this.resolved) return;
        this.resolved = true;
        this.resolveValue(value);
        this.close();
    }
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
    const day = String(date.getDate()).replace(/^\d$/, '0$&');
    const month = String(date.getMonth() + 1).replace(/^\d$/, '0$&');
    const year = date.getFullYear();
    if (format === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
    if (format === 'dd/MM/yyyy') return `${day}/${month}/${year}`;
    if (format === 'dd-MM-yyyy') return `${day}-${month}-${year}`;
    return `${day}.${month}.${year}`;
}

function toInputDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
