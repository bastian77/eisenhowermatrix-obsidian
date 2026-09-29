import { h } from 'preact';
import type { SourceTask, TaskDateFormat } from '../tasks/types';

interface TaskListProps {
    tasks: SourceTask[];
    onOpen: (task: SourceTask) => void;
    onComplete?: (task: SourceTask) => void;
    dateFormat: TaskDateFormat;
}

export function TaskList({ tasks, onOpen, onComplete, dateFormat }: TaskListProps) {
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