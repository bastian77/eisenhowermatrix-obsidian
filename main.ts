import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { PriorityMatrixSettingTab } from './src/settings/SettingsTab';
import { DEFAULT_SETTINGS, normalizeSettings } from './src/settings/settings';
import type { PriorityMatrixSettings } from './src/settings/settings';
import { TaskMatrixView, VIEW_TYPE_TASK_MATRIX } from './src/views/TaskMatrixView';

export default class PriorityMatrixPlugin extends Plugin {
    settings: PriorityMatrixSettings = DEFAULT_SETTINGS;

    async onload(): Promise<void> {
        this.settings = normalizeSettings(await this.loadData() as Partial<PriorityMatrixSettings> | null);

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
