import { Modal, Setting } from 'obsidian';
import type { App } from 'obsidian';

export function requestDueDate(app: App, urgentWithinDays: number, mustBeUrgent: boolean): Promise<string | null> {
    return new Promise(resolve => {
        const modal = new DueDateModal(app, resolve, urgentWithinDays, mustBeUrgent);
        modal.open();
    });
}

class DueDateModal extends Modal {
    private resolved = false;
    private value = '';

    constructor(app: App, private readonly resolveValue: (value: string | null) => void, private readonly urgentWithinDays: number, private readonly mustBeUrgent: boolean) {
        super(app);
        this.setTitle('Due date required');
    }

    onOpen(): void {
        new Setting(this.contentEl)
            .setName('Due date')
            .setDesc(this.mustBeUrgent
                ? `Choose a due date within the next ${this.urgentWithinDays} days.`
                : `Choose a due date more than ${this.urgentWithinDays} days away.`)
            .addText(text => {
                text.inputEl.type = 'date';
                const today = new Date();
                const boundaryDate = new Date(today);
                boundaryDate.setDate(boundaryDate.getDate() + this.urgentWithinDays);
                const earliestNotUrgentDate = new Date(boundaryDate);
                earliestNotUrgentDate.setDate(earliestNotUrgentDate.getDate() + 1);
                text.inputEl.min = toInputDate(this.mustBeUrgent ? today : earliestNotUrgentDate);
                if (this.mustBeUrgent) text.inputEl.max = toInputDate(boundaryDate);
                text.onChange(value => {
                    this.value = value;
                });
            });

        new Setting(this.contentEl)
            .addButton(button => button
                .setButtonText('Apply')
                .setCta()
                .onClick(() => this.finish(this.value || null)))
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => this.finish(null)));
    }

    onClose(): void {
        this.finish(null);
    }

    private finish(value: string | null): void {
        if (this.resolved) return;
        this.resolved = true;
        this.resolveValue(value);
        this.close();
    }
}

function toInputDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}