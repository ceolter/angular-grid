import type { CrossFilteringContext } from './crossFilteringContext';

type CrossFilterCategoryEntry = { category: string; value: string };

export class ChartSelectionModel {
    public selection: CrossFilterCategoryEntry[] = [];
    public available: CrossFilterCategoryEntry[] = [];
    public category: string;

    public constructor(
        public chartId: string,
        private crossFilteringContext: CrossFilteringContext
    ) {}

    getBooleanSelection(): boolean[] {
        return this.available.map((entry) =>
            this.hasSelection() ? this.isSelected(entry.category, entry.value) : true
        );
    }

    public areAllSelected(category: string): boolean {
        return this.available.every((entry) => this.isSelected(category, entry.value));
    }

    public hasSelection(): boolean {
        return this.selection.length > 0;
    }

    public isSelected(category: string, value: string): boolean {
        const rawValue = (value as any)?.value || value;
        return this.selection.some((entry) => entry.category === category && entry.value === rawValue);
    }

    public toggleSelection(multiSelection: boolean, category: string, value: string, notify = true): void {
        const isSelected = this.isSelected(category, value);

        const rawValue = (value as any)?.value || value;
        if (isSelected) {
            this.selection = this.selection.filter((entry) => entry.category !== category || entry.value !== rawValue);
        } else {
            if (!multiSelection) {
                this.clearSelection(false);
            }
            this.selection.push({ category, value: rawValue });
        }

        if (notify) {
            this.crossFilteringContext.updateFromSelectionModels();
        }
    }

    setSelection(entries: CrossFilterCategoryEntry[], notify = true): boolean {
        const entriesAreDifferent =
            this.selection.length !== entries.length ||
            this.selection.some(({ category, value }, i) => {
                const rawValue = (value as any)?.value || value;
                return category !== entries[i].category || rawValue !== entries[i].value;
            });

        if (!entriesAreDifferent) {
            return false;
        }

        this.selection = entries;
        if (notify) {
            this.crossFilteringContext.updateFromSelectionModels();
        }

        return true;
    }

    public clearSelection(notify = true): void {
        this.setSelection([], notify);
    }

    public selectAll(notify = true): void {
        this.setSelection(this.available, notify);
    }
}
