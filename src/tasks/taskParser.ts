import { ParsedTaskLine, TaskDateFormat, TaskPriority } from './types';

const taskPattern = /^(\s*)([-*+]|\d+[.)])\s+\[([ xX])\]\s+(.*)$/;
const priorityPattern = /\[priority:{1,2}\s*(highest|high|medium|low|lowest)\s*\]/i;
const duePattern = /\[due:{1,2}\s*([^\]]+?)\s*\]/i;

export function parseTaskLine(line: string, dateFormat: TaskDateFormat): ParsedTaskLine | null {
    const match = line.match(taskPattern);
    if (!match) return null;

    const rawText = match[4].trim();
    return {
        text: cleanTaskText(rawText),
        checked: match[3].toLowerCase() === 'x',
        priority: readPriority(rawText),
        due: readDueDate(rawText, dateFormat),
    };
}

export function readPriority(text: string): TaskPriority {
    const value = text.match(priorityPattern)?.[1].toLowerCase() as Exclude<TaskPriority, null> | undefined;
    return value ?? null;
}

export function readDueDate(text: string, dateFormat: TaskDateFormat = 'yyyy-MM-dd'): Date | null {
    const value = text.match(duePattern)?.[1];
    if (!value) return null;

    const normalized = value.trim();
    const patterns: Record<TaskDateFormat, RegExp> = {
        'yyyy-MM-dd': /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/,
        'dd.MM.yyyy': /^(\d{2})\.(\d{2})\.(\d{4})$/,
        'dd/MM/yyyy': /^(\d{2})\/(\d{2})\/(\d{4})$/,
        'dd-MM-yyyy': /^(\d{2})-(\d{2})-(\d{4})$/,
    };
    const match = normalized.match(patterns[dateFormat]);
    if (!match) return null;

    const year = dateFormat === 'yyyy-MM-dd' ? Number(match[1]) : Number(match[3]);
    const month = dateFormat === 'yyyy-MM-dd' ? Number(match[2]) : Number(match[2]);
    const day = dateFormat === 'yyyy-MM-dd' ? Number(match[3]) : Number(match[1]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

export function formatDueDate(value: string, format: TaskDateFormat): string {
    const [year, month, day] = value.split('-');
    if (format === 'yyyy-MM-dd') return value;
    if (format === 'dd/MM/yyyy') return `${day}/${month}/${year}`;
    if (format === 'dd-MM-yyyy') return `${day}-${month}-${year}`;
    return `${day}.${month}.${year}`;
}

function cleanTaskText(text: string): string {
    return text
        .replace(/\s*\[(?:priority|due):{1,2}\s*[^\]]+\]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
