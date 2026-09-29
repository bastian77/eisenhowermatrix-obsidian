import { PluginSettingTab, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type PriorityMatrixPlugin from '../../main';
import type { ImportantThreshold, TaskDateFormat } from '../tasks/types';

export class PriorityMatrixSettingTab extends PluginSettingTab {
    constructor(app: App, private readonly plugin: PriorityMatrixPlugin) {
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
            .setDesc('Priorities at this level and above are placed in the important row')
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