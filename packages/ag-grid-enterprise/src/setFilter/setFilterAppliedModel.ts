import type { SetFilterModel } from 'ag-grid-community';

export class SetFilterAppliedModel {
    // This attribute contains keys that are actually used for filtering.
    // These keys take into account case sensitivity:
    // - When filtering is case-insensitive, all filtering keys are converted to upper case and stored here.
    private keys: Set<string | null> | null = null;

    constructor(private readonly caseFormat: <T extends string | null>(valueToFormat: T) => T) {}

    /** No model applied */
    public isNull(): boolean {
        return this.keys == null;
    }

    /** Nothing selected */
    public isEmpty(): boolean {
        return !this.keys?.size;
    }

    public update(appliedModel: SetFilterModel | null): void {
        const keys = new Set<string | null>();
        this.keys = keys;
        const values = appliedModel?.values;
        if (values) {
            const caseFormat = this.caseFormat;
            for (let i = 0, len = values.length; i < len; i++) {
                keys.add(caseFormat(values[i]));
            }
        }
    }

    public has(key: string | null): boolean {
        return !!this.keys?.has(this.caseFormat(key));
    }

    public destroy() {
        this.keys = null;
    }
}
