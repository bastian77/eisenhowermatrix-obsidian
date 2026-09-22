import { Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { TaskMatrixView, VIEW_TYPE_TASK_MATRIX } from './src/views/TaskMatrixView';
import type { TaskPriority } from './src/tasks/TaskProvider';

export interface PriorityMatrixSettings {
    includePath: string;
    recursive: boolean;
    maxFiles: number;
    importantFrom: Exclude<TaskPriority, null>;
    urgentWithinDays: number;
}

export const DEFAULT_SETTINGS: PriorityMatrixSettings = {
    includePath: '/',
    recursive: true,
    maxFiles: 0,
    importantFrom: 'medium',
    urgentWithinDays: 7,
};

export default class PriorityMatrixPlugin extends Plugin {
    settings: PriorityMatrixSettings = DEFAULT_SETTINGS;

    async onload(): Promise<void> {
        const loaded = await this.loadData() as Partial<PriorityMatrixSettings> | null;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
        if (!['highest', 'high', 'medium', 'low', 'lowest'].includes(this.settings.importantFrom)) {
            this.settings.importantFrom = DEFAULT_SETTINGS.importantFrom;
        }
        if (!Number.isInteger(this.settings.urgentWithinDays) || this.settings.urgentWithinDays < 0) {
            this.settings.urgentWithinDays = DEFAULT_SETTINGS.urgentWithinDays;
        }

        this.registerView(
            VIEW_TYPE_TASK_MATRIX,
            (leaf: WorkspaceLeaf) => new TaskMatrixView(leaf, this)
        );
        this.addSettingTab(new PriorityMatrixSettingTab(this.app, this));
        this.addRibbonIcon('layout-grid', 'Open tasks Eisenhower view', () => {
            void this.openTasksEisenhowerView();
        });
        this.addCommand({
            id: 'open-tasks-eisenhower-view',
            name: 'Open tasks Eisenhower view',
            callback: async () => {
                await this.openTasksEisenhowerView();
            },
        });
    }

    private async openTasksEisenhowerView(): Promise<void> {
        const leaf = this.app.workspace.getMostRecentLeaf() ?? this.app.workspace.getLeaf(true);
        await leaf.setViewState({ type: VIEW_TYPE_TASK_MATRIX });
        this.app.workspace.revealLeaf(leaf);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX).forEach(leaf => {
            const view = leaf.view;
            if (view instanceof TaskMatrixView) view.refreshTasks();
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
            .setName('Important from priority')
            .setDesc('Priorities at this level and above are placed in the Important row')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    highest: 'Highest',
                    high: 'High',
                    medium: 'Medium',
                    low: 'Low',
                    lowest: 'Lowest',
                })
                .setValue(this.plugin.settings.importantFrom)
                .onChange(async value => {
                    this.plugin.settings.importantFrom = value as Exclude<TaskPriority, null>;
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
    }
}
