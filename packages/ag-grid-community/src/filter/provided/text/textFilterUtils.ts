export function trimInputForFilter(value?: string | null): string | null | undefined {
    const trimmedInput = value?.trim();

    // trim the input, unless it is all whitespace (this is consistent with Excel behaviour)
    return trimmedInput === '' ? value : trimmedInput;
}
