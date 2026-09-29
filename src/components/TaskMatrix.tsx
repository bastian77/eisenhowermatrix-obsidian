import { h } from 'preact';
import { App, Notice } from 'obsidian';
import { requestDueDate } from './DueDateModal';
import { TaskList } from './TaskList';
import { compareTaskPriorityDescending, completeTask, updateTaskPriority } from '../tasks';
import type { ImportantThreshold, SourceTask, TaskDateFormat, TaskSection } from '../tasks/types';

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
