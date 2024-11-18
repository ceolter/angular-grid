export class SetValueModelFilteringKeys {
    // To make the filtering fast, we store the keys in a Set rather than using the default array.
    private filteringKeys: Set<string | null> | null = null;

    // This attribute contains keys that are actually used for filtering.
    // These keys take into account case sensitivity:
    // - When filtering is case-insensitive, all filtering keys are converted to upper case and stored here.
    // - When filtering is case-sensitive, this is the same as filteringKeys.
    private filteringKeysCaseFormatted: Set<string | null> | null = null;

    public hasNoAppliedFilteringKeys: boolean = false;

    // Function responsible for formatting the filtering keys.
    private readonly caseFormat: <T extends string | null>(valueToFormat: T) => typeof valueToFormat;

    constructor({ caseFormat }: { caseFormat: <T extends string | null>(valueToFormat: T) => typeof valueToFormat }) {
        this.caseFormat = caseFormat;
    }

    public allFilteringKeys(): Set<string | null> | null {
        return this.filteringKeys;
    }

    public allFilteringKeysCaseFormatted(): Set<string | null> | null {
        return this.filteringKeysCaseFormatted;
    }

    public setFilteringKeys(filteringKeys: Set<string | null> | null): void {
        this.filteringKeys = new Set(filteringKeys);
        this.hasNoAppliedFilteringKeys = !this.filteringKeys || this.filteringKeys.size === 0;

        this.filteringKeysCaseFormatted = new Set<string | null>();
        this.filteringKeys.forEach((key) => this.filteringKeysCaseFormatted!.add(this.caseFormat(key)));
    }

    public addFilteringKey(key: string | null): void {
        if (this.filteringKeys == null) {
            this.filteringKeys = new Set<string | null>();
            this.filteringKeysCaseFormatted = new Set<string | null>();
        }

        this.filteringKeys.add(key);
        this.filteringKeysCaseFormatted!.add(this.caseFormat(key));

        if (this.hasNoAppliedFilteringKeys) {
            this.hasNoAppliedFilteringKeys = false;
        }
    }

    public hasCaseFormattedFilteringKey(key: string | null): boolean {
        return this.filteringKeysCaseFormatted!.has(this.caseFormat(key));
    }

    public hasFilteringKey(key: string | null): boolean {
        return this.filteringKeys!.has(key);
    }

    public reset() {
        this.filteringKeys = null;
        this.filteringKeysCaseFormatted = null;
        this.hasNoAppliedFilteringKeys = false;
    }
}
