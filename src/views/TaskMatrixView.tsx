import { ItemView, TFolder, WorkspaceLeaf } from 'obsidian';
import { render, h } from 'preact';
import { TaskMatrix } from '../components/TaskMatrix';
import { scanSourceTasks, SourceTask } from '../tasks/TaskProvider';
import PriorityMatrixPlugin from '../../main';

export const VIEW_TYPE_TASK_MATRIX = 'priority-matrix-tasks-view';

export class TaskMatrixView extends ItemView {
    private plugin: PriorityMatrixPlugin;
    private tasks: SourceTask[] = [];
    private refreshTimer: number | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: PriorityMatrixPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_TASK_MATRIX;
    }

    getDisplayText(): string {
        return 'Task matrix';
    }

    getIcon(): string {
        return 'layout-grid';
    }

    async onOpen(): Promise<void> {
        this.addAction('refresh-cw', 'Refresh tasks', () => {
            void this.refreshTasks();
        });
        this.registerEvent(this.app.vault.on('modify', file => this.scheduleRefresh(file.path)));
        this.registerEvent(this.app.vault.on('create', file => this.scheduleRefresh(file.path)));
        this.registerEvent(this.app.vault.on('delete', file => this.scheduleRefresh(file.path)));
        this.registerEvent(this.app.vault.on('rename', file => this.scheduleRefresh(file.path)));
        await this.refreshTasks();
    }

    async onClose(): Promise<void> {
        if (this.refreshTimer !== null) {
            window.clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        render(null, this.contentEl);
    }

    private scheduleRefresh(path: string): void {
        if (!path.toLowerCase().endsWith('.md')) return;
        if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
        this.refreshTimer = window.setTimeout(() => {
            this.refreshTimer = null;
            void this.refreshTasks();
        }, 250);
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
            this.plugin.settings.urgentWithinDays,
            this.plugin.settings.dateFormat
        );
        this.renderView();
    }

    private renderView(): void {
        this.contentEl.empty();
        const container = this.contentEl.createDiv({ cls: 'priority-matrix-view' });
        render(<TaskMatrix tasks={this.tasks} app={this.app} dateFormat={this.plugin.settings.dateFormat} urgentWithinDays={this.plugin.settings.urgentWithinDays} importantFrom={this.plugin.settings.importantFrom} onChanged={() => { void this.refreshTasks(); }} />, container);
    }
}
