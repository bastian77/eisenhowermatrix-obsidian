import { App, TFile, TFolder } from 'obsidian';
export type TaskPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest' | null;
export type TaskDateFormat = 'yyyy-MM-dd' | 'dd.MM.yyyy' | 'dd/MM/yyyy' | 'dd-MM-yyyy';

export type TaskSection = 'todo' | 'q1' | 'q2' | 'q3' | 'q4' | 'done';

export interface SourceTask {
    id: string;
    path: string;
    line: number;
    raw: string;
    text: string;
    checked: boolean;
    priority: TaskPriority;
    due: Date | null;
    section: TaskSection;
}

const taskPattern = /^(\s*)([-*+]|\d+[.)])\s+\[([ xX])\]\s+(.*)$/;
const priorityPattern = /\[priority:{1,2}\s*(highest|high|medium|low|lowest)\s*\]/i;
const duePattern = /\[due:{1,2}\s*([^\]]+?)\s*\]/i;
const priorityRank: Record<Exclude<TaskPriority, null>, number> = {
    highest: 5,
    high: 4,
    medium: 3,
    low: 2,
    lowest: 1,
};

export async function scanSourceTasks(
    app: App,
    root: TFolder,
    recursive: boolean,
    excludedPaths: Set<string> = new Set(),
    maxFiles = 0,
    importantFrom: Exclude<TaskPriority, null> = 'medium',
    urgentWithinDays = 7,
    dateFormat: TaskDateFormat = 'yyyy-MM-dd'
): Promise<SourceTask[]> {
    const tasks: SourceTask[] = [];
    let scannedFiles = 0;

    const walk = async (folder: TFolder): Promise<void> => {
        for (const child of folder.children) {
            if (maxFiles > 0 && scannedFiles >= maxFiles) return;
            if (child instanceof TFolder) {
                if (recursive) await walk(child);
                continue;
            }
            if (!(child instanceof TFile) || child.extension.toLowerCase() !== 'md') continue;
            if (excludedPaths.has(child.path)) continue;

            scannedFiles += 1;
            const content = await app.vault.read(child);
            const lines = content.split(/\r?\n/);
            lines.forEach((line: string, lineIndex: number) => {
                const match = line.match(taskPattern);
                if (!match) return;

                const rawText = match[4].trim();
                const text = cleanTaskText(rawText);
                const checked = match[3].toLowerCase() === 'x';
                const priority = readPriority(rawText);
                const due = readDueDate(rawText, dateFormat);
                tasks.push({
                    id: `${child.path}:${lineIndex}`,
                    path: child.path,
                    line: lineIndex,
                    raw: line,
                    text,
                    checked,
                    priority,
                    due,
                    section: checked ? 'done' : classifyTask(priority, due, new Date(), importantFrom, urgentWithinDays),
                });
            });
        }
    };

    await walk(root);
    return tasks;
}

export async function updateTaskPriority(app: App, task: SourceTask, priority: TaskPriority): Promise<void> {
    const file = app.vault.getAbstractFileByPath(task.path);
    if (!(file instanceof TFile)) throw new Error(`Task file not found: ${task.path}`);

    const content = await app.vault.read(file);
    const lines = content.split(/\r?\n/);
    if (lines[task.line] !== task.raw) {
        throw new Error('Task changed since the view was refreshed. Refresh and try again.');
    }

    const withoutPriority = lines[task.line]
        .replace(/\s*\[priority:{1,2}\s*(?:highest|high|medium|low|lowest)\s*\]/i, '')
        .replace(/\s+$/, '');
    lines[task.line] = priority ? `${withoutPriority} [priority:: ${priority}]` : withoutPriority;
    await app.vault.modify(file, lines.join('\n'));
}

export async function completeTask(app: App, task: SourceTask): Promise<void> {
    const file = app.vault.getAbstractFileByPath(task.path);
    if (!(file instanceof TFile)) throw new Error(`Task file not found: ${task.path}`);

    const content = await app.vault.read(file);
    const lines = content.split(/\r?\n/);
    if (lines[task.line] !== task.raw) {
        throw new Error('Task changed since the view was refreshed. Refresh and try again.');
    }

    lines[task.line] = lines[task.line].replace(/\[ \]/, '[x]');
    await app.vault.modify(file, lines.join('\n'));
}

export function readPriority(text: string): TaskPriority {
    const value = text.match(priorityPattern)?.[1].toLowerCase() as Exclude<TaskPriority, null> | undefined;
    return value ?? null;
}

function cleanTaskText(text: string): string {
    return text
        .replace(/\s*\[(?:priority|due):{1,2}\s*[^\]]+\]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function readDueDate(text: string, dateFormat: TaskDateFormat = 'yyyy-MM-dd'): Date | null {
    const value = text.match(duePattern)?.[1];
    if (!value) return null;

    const normalized = value.trim();
    let year: number;
    let month: number;
    let day: number;

    const patterns: Record<TaskDateFormat, RegExp> = {
        'yyyy-MM-dd': /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/,
        'dd.MM.yyyy': /^(\d{2})\.(\d{2})\.(\d{4})$/,
        'dd/MM/yyyy': /^(\d{2})\/(\d{2})\/(\d{4})$/,
        'dd-MM-yyyy': /^(\d{2})-(\d{2})-(\d{4})$/,
    };
    const match = normalized.match(patterns[dateFormat]);

    if (!match) return null;
    if (dateFormat === 'yyyy-MM-dd') {
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    } else {
        day = Number(match[1]);
        month = Number(match[2]);
        year = Number(match[3]);
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
}

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
