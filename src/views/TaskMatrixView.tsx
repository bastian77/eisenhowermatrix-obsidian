import { ItemView, TFolder, WorkspaceLeaf } from 'obsidian';
import { render, h } from 'preact';
import { TaskMatrix } from '../components/TaskMatrix';
import { scanSourceTasks, SourceTask } from '../tasks/TaskProvider';
import PriorityMatrixPlugin from '../../main';

export const VIEW_TYPE_TASK_MATRIX = 'priority-matrix-tasks-view';

export class TaskMatrixView extends ItemView {
    private plugin: PriorityMatrixPlugin;
    private tasks: SourceTask[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: PriorityMatrixPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_TASK_MATRIX;
    }

    getDisplayText(): string {
        return 'Tasks Eisenhower view';
    }

    getIcon(): string {
        return 'layout-grid';
    }

    async onOpen(): Promise<void> {
        this.addAction('refresh-cw', 'Refresh tasks', () => {
            void this.refreshTasks();
        });
        await this.refreshTasks();
    }

    async onClose(): Promise<void> {
        render(null, this.contentEl);
    }

    async refreshTasks(): Promise<void> {
        const includePath = this.plugin.settings.includePath?.trim() || '/';
        const normalizedPath = includePath === '/' ? '' : includePath.replace(/^\/*|\/*$/g, '');
        const root = normalizedPath
            ? this.app.vault.getAbstractFileByPath(normalizedPath)
            : this.app.vault.getRoot();

        if (!(root instanceof TFolder)) {
            this.contentEl.setText(`Task folder not found: ${includePath}`);
            return;
        }

        this.tasks = await scanSourceTasks(
            this.app,
            root,
            this.plugin.settings.recursive,
            new Set(),
            this.plugin.settings.maxFiles,
            this.plugin.settings.importantFrom,
            this.plugin.settings.urgentWithinDays
        );
        this.renderView();
    }

    private renderView(): void {
        this.contentEl.empty();
        const container = this.contentEl.createDiv({ cls: 'priority-matrix-view' });
        render(<TaskMatrix tasks={this.tasks} app={this.app} onChanged={() => { void this.refreshTasks(); }} />, container);
    }
}
