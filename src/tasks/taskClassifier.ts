import { TaskDateFormat, TaskPriority, TaskSection } from './types';

const priorityRank: Record<Exclude<TaskPriority, null>, number> = {
    highest: 5,
    high: 4,
    medium: 3,
    low: 2,
    lowest: 1,
};

export function classifyTask(
    priority: TaskPriority,
    due: Date | null,
    today = new Date(),
    importantFrom: Exclude<TaskPriority, null> = 'medium',
    urgentWithinDays = 7
): TaskSection {
    if (!priority) return 'todo';

    const important = priorityRank[priority] >= priorityRank[importantFrom];
    const urgent = due !== null && daysBetween(today, due) <= urgentWithinDays;

    if (important && urgent) return 'q1';
    if (important) return 'q2';
    if (urgent) return 'q3';
    return 'q4';
}

function daysBetween(from: Date, to: Date): number {
    const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.floor((end - start) / 86400000);
}
