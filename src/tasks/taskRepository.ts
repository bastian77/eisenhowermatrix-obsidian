import { App, TFile, TFolder } from 'obsidian';
import { classifyTask } from './taskClassifier';
import { formatDueDate } from './taskParser';
import { parseTaskLine } from './taskParser';
import { ImportantThreshold, SourceTask, TaskDateFormat, TaskPriority } from './types';

export async function scanSourceTasks(
    app: App,
    root: TFolder,
    recursive: boolean,
    excludedPaths: Set<string> = new Set(),
    maxFiles = 0,
    importantFrom: ImportantThreshold = 'medium',
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
            const lines = (await app.vault.read(child)).split(/\r?\n/);
            lines.forEach((line, lineIndex) => {
                const parsed = parseTaskLine(line, dateFormat);
                if (!parsed) return;

                tasks.push({
                    id: `${child.path}:${lineIndex}`,
                    path: child.path,
                    line: lineIndex,
                    raw: line,
                    text: parsed.text,
                    checked: parsed.checked,
                    priority: parsed.priority,
                    due: parsed.due,
                    section: parsed.checked
                        ? 'done'
                        : classifyTask(parsed.priority, parsed.due, new Date(), importantFrom, urgentWithinDays),
                });
            });
        }
    };

    await walk(root);
    return tasks;
}

export async function updateTaskPriority(
    app: App,
    task: SourceTask,
    priority: TaskPriority,
    dueDate?: string | null,
    dateFormat: TaskDateFormat = 'yyyy-MM-dd'
): Promise<void> {
    const file = getTaskFile(app, task);
    await app.vault.process(file, content => {
        const lines = validateTaskLines(content, task);
        const existingDueField = lines[task.line].match(/\[due:{1,2}\s*[^\]]+\]/i)?.[0] ?? '';
        const withoutPriority = lines[task.line]
            .replace(/\s*\[priority:{1,2}\s*(?:highest|high|medium|low|lowest)\s*\]/i, '')
            .replace(/\s+$/, '');
        const withoutDueDate = withoutPriority
            .replace(/\s*\[due:{1,2}\s*[^\]]+\]/i, '')
            .replace(/\s+$/, '');
        const dueField = dueDate === undefined
            ? existingDueField
            : dueDate
                ? `[due:: ${formatDueDate(dueDate, dateFormat)}]`
                : '';
        const fields = [
            priority ? `[priority:: ${priority}]` : '',
            dueField,
        ].filter(Boolean).join(' ');

        lines[task.line] = fields ? `${withoutDueDate} ${fields}` : withoutDueDate;
        return lines.join('\n');
    });
}

export async function completeTask(app: App, task: SourceTask): Promise<void> {
    const file = getTaskFile(app, task);
    await app.vault.process(file, content => {
        const lines = validateTaskLines(content, task);
        lines[task.line] = lines[task.line].replace(/\[ \]/, '[x]');
        return lines.join('\n');
    });
}

function getTaskFile(app: App, task: SourceTask): TFile {
    const file = app.vault.getAbstractFileByPath(task.path);
    if (!(file instanceof TFile)) throw new Error(`Task file not found: ${task.path}`);
    return file;
}

function validateTaskLines(content: string, task: SourceTask): string[] {
    const lines = content.split(/\r?\n/);
    if (lines[task.line] !== task.raw) {
        throw new Error('Task changed since the view was refreshed. Refresh and try again.');
    }
    return lines;
}
