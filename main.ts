import { Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { TaskMatrixView, VIEW_TYPE_TASK_MATRIX } from './src/views/TaskMatrixView';
import type { ImportantThreshold, TaskDateFormat } from './src/tasks/TaskProvider';

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

export default class PriorityMatrixPlugin extends Plugin {
    settings: PriorityMatrixSettings = DEFAULT_SETTINGS;

    async onload(): Promise<void> {
        const loaded = await this.loadData() as Partial<PriorityMatrixSettings> | null;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
        if (!['highest', 'high', 'medium', 'low'].includes(this.settings.importantFrom)) {
            this.settings.importantFrom = DEFAULT_SETTINGS.importantFrom;
        }
        if (!Number.isInteger(this.settings.urgentWithinDays) || this.settings.urgentWithinDays < 0) {
            this.settings.urgentWithinDays = DEFAULT_SETTINGS.urgentWithinDays;
        }
        if (!['yyyy-MM-dd', 'dd.MM.yyyy', 'dd/MM/yyyy', 'dd-MM-yyyy'].includes(this.settings.dateFormat)) {
            this.settings.dateFormat = DEFAULT_SETTINGS.dateFormat;
        }

        this.registerView(
            VIEW_TYPE_TASK_MATRIX,
            (leaf: WorkspaceLeaf) => new TaskMatrixView(leaf, this)
        );
        this.addSettingTab(new PriorityMatrixSettingTab(this.app, this));
        this.addRibbonIcon('layout-grid', 'Open task matrix', () => {
            void this.openTasksEisenhowerView();
        });
        this.addCommand({
            id: 'open-tasks-eisenhower-view',
            name: 'Open task matrix',
            callback: async () => {
                await this.openTasksEisenhowerView();
            },
        });
    }

    private async openTasksEisenhowerView(): Promise<void> {
        const leaf = this.app.workspace.getMostRecentLeaf() ?? this.app.workspace.getLeaf(true);
        await leaf.setViewState({ type: VIEW_TYPE_TASK_MATRIX });
        await this.app.workspace.revealLeaf(leaf);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX).forEach(leaf => {
            const view = leaf.view;
            if (view instanceof TaskMatrixView) {
                void view.refreshTasks().catch(error => {
                    new Notice(error instanceof Error ? error.message : String(error));
                });
            }
        });
    }
}

class PriorityMatrixSettingTab extends PluginSettingTab {
    constructor(app: import('obsidian').App, private readonly plugin: PriorityMatrixPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Task folder')
            .setDesc('Vault-relative folder to scan, or / for the whole vault')
            .addText(text => text
                .setPlaceholder('/')
                .setValue(this.plugin.settings.includePath)
                .onChange(async value => {
                    this.plugin.settings.includePath = value.trim() || '/';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Recursive scan')
            .setDesc('Include tasks in subfolders')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.recursive)
                .onChange(async value => {
                    this.plugin.settings.recursive = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Maximum files')
            .setDesc('Set 0 to scan every Markdown file')
            .addText(text => text
                .setPlaceholder('0')
                .setValue(String(this.plugin.settings.maxFiles))
                .onChange(async value => {
                    const parsed = Number(value);
                    this.plugin.settings.maxFiles = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Importance threshold')
            .setDesc('Priorities at this level and above are placed in the Important row')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    highest: 'Highest',
                    high: 'High',
                    medium: 'Medium',
                    low: 'Low',
                })
                .setValue(this.plugin.settings.importantFrom)
                .onChange(async value => {
                    this.plugin.settings.importantFrom = value as ImportantThreshold;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Urgent within days')
            .setDesc('Due today, overdue, or due within this many days is urgent')
            .addText(text => text
                .setPlaceholder('7')
                .setValue(String(this.plugin.settings.urgentWithinDays))
                .onChange(async value => {
                    const parsed = Number(value);
                    this.plugin.settings.urgentWithinDays = Number.isInteger(parsed) && parsed >= 0 ? parsed : 7;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Due date format')
            .setDesc('Format used when reading due fields such as [due:: 2026-09-25]')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'yyyy-MM-dd': 'YYYY-MM-DD',
                    'dd.MM.yyyy': 'DD.MM.YYYY',
                    'dd/MM/yyyy': 'DD/MM/YYYY',
                    'dd-MM-yyyy': 'DD-MM-YYYY',
                })
                .setValue(this.plugin.settings.dateFormat)
                .onChange(async value => {
                    this.plugin.settings.dateFormat = value as TaskDateFormat;
                    await this.plugin.saveSettings();
                }));
    }
}
