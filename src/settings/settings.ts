import type { ImportantThreshold, TaskDateFormat } from '../tasks/types';

export interface PriorityMatrixSettings {
    includePath: string;
    recursive: boolean;
    maxFiles: number;
    importantFrom: ImportantThreshold;
    urgentWithinDays: number;
    dateFormat: TaskDateFormat;
}

export const DEFAULT_SETTINGS: PriorityMatrixSettings = {
    includePath: '/',
    recursive: true,
    maxFiles: 0,
    importantFrom: 'medium',
    urgentWithinDays: 7,
    dateFormat: 'yyyy-MM-dd',
};

export function normalizeSettings(loaded: Partial<PriorityMatrixSettings> | null): PriorityMatrixSettings {
    const settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    if (!['highest', 'high', 'medium', 'low'].includes(settings.importantFrom)) {
        settings.importantFrom = DEFAULT_SETTINGS.importantFrom;
    }
    if (!Number.isInteger(settings.urgentWithinDays) || settings.urgentWithinDays < 0) {
        settings.urgentWithinDays = DEFAULT_SETTINGS.urgentWithinDays;
    }
    if (!['yyyy-MM-dd', 'dd.MM.yyyy', 'dd/MM/yyyy', 'dd-MM-yyyy'].includes(settings.dateFormat)) {
        settings.dateFormat = DEFAULT_SETTINGS.dateFormat;
    }
    return settings;
}