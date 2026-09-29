import { TFile } from 'obsidian';

export type TaskPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest' | null;
export type ImportantThreshold = Exclude<Exclude<TaskPriority, null>, 'lowest'>;
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

export interface ParsedTaskLine {
    text: string;
    checked: boolean;
    priority: TaskPriority;
    due: Date | null;
}

export type TaskFile = TFile;
