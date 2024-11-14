import type { AgPublicEventType, GridApi, IRowNode } from 'ag-grid-community';
import { KeyCode, _areEqual } from 'ag-grid-community';

function escapeQuotes(value: string): string {
    return value.replaceAll(/(['"])/g, '\\$1');
}

export function getRowByIndex(index: number): HTMLElement | null {
    return document.getElementById('myGrid')!.querySelector(`[row-index="${index}"]`);
}

export function getRowById(id: string): HTMLElement | null {
    return document.getElementById('myGrid')!.querySelector(`[row-id="${escapeQuotes(id)}"]`);
}

export function getCellByPosition(rowIndex: number, colId: string): HTMLElement | null {
    return getRowByIndex(rowIndex)?.querySelector(`[col-id="${colId}"]`) ?? null;
}

export function getCheckboxByIndex(index: number): HTMLElement | null {
    return getRowByIndex(index)?.querySelector<HTMLElement>('.ag-selection-checkbox input[type=checkbox]') ?? null;
}

export function getCheckboxById(id: string): HTMLElement | null {
    return getRowById(id)?.querySelector<HTMLElement>('.ag-selection-checkbox input[type=checkbox]') ?? null;
}

export function getHeaderCheckboxByIndex(index: number): HTMLElement | null {
    return document
        .getElementById('myGrid')!
        .querySelectorAll<HTMLElement>('.ag-header-select-all')
        .item(index)
        .querySelector('input[type=checkbox]');
}

export function selectRowsByIndex(indices: number[], click: boolean, api: GridApi): void {
    for (const i of indices) {
        click ? clickRowByIndex(i, { ctrlKey: true }) : toggleCheckboxByIndex(i);
    }
    assertSelectedRowsByIndex(indices, api);
}

export function clickRowByIndex(index: number, opts?: MouseEventInit): void {
    getRowByIndex(index)?.dispatchEvent(new MouseEvent('click', { ...opts, bubbles: true }));
}

export function toggleCheckboxByIndex(index: number, opts?: MouseEventInit): void {
    getCheckboxByIndex(index)?.dispatchEvent(new MouseEvent('click', { ...opts, bubbles: true }));
}

export function toggleCheckboxById(id: string, opts?: MouseEventInit): void {
    getCheckboxById(id)?.dispatchEvent(new MouseEvent('click', { ...opts, bubbles: true }));
}

export function toggleHeaderCheckboxByIndex(index: number, opts?: MouseEventInit): void {
    getHeaderCheckboxByIndex(index)?.dispatchEvent(new MouseEvent('click', { ...opts, bubbles: true }));
}

export function clickExpandGroupRowByIndex(index: number, opts?: MouseEventInit): void {
    getRowByIndex(index)
        ?.querySelector<HTMLElement>('.ag-group-contracted')
        ?.dispatchEvent(new MouseEvent('click', { ...opts, bubbles: true }));
}

export async function expandGroupRowByIndex(api: GridApi, index: number, opts?: MouseEventInit): Promise<void> {
    const updated = waitForEvent('modelUpdated', api, 2); // attach listener first
    clickExpandGroupRowByIndex(index, opts);
    await updated;
}

export function assertSelectedRowsByIndex(indices: number[], api: GridApi): void {
    const actual = new Set(api.getSelectedNodes().map((n) => n.rowIndex));
    const expected = new Set(indices);
    expect(actual).toEqual(expected);
}

export function assertSelectedRowElementsById(ids: string[], api: GridApi): void {
    const selected = new Set<string>();
    api.forEachNode((node) => (node.isSelected() ? selected.add(node.id!) : null));
    expect(selected).toEqual(new Set(ids));
}

export function assertSelectedRowNodes(nodes: IRowNode[], api: GridApi): void {
    const selectedNodes = api.getSelectedNodes();

    expect(selectedNodes).toHaveLength(nodes.length);

    for (let i = 0; i < nodes.length; i++) {
        expect(selectedNodes[i]).toBe(nodes[i]);
    }
}

interface CellRangeSpec {
    rowStartIndex: number;
    rowEndIndex: number;
    columns: string[];
}

export function assertSelectedCellRanges(cellRanges: CellRangeSpec[], api: GridApi): void {
    const selectedCellRanges = api.getCellRanges()?.slice();
    const notFound: CellRangeSpec[] = [];

    for (const range of cellRanges) {
        const foundIdx =
            selectedCellRanges?.findIndex(
                (selectedRange) =>
                    range.rowStartIndex === selectedRange.startRow?.rowIndex &&
                    range.rowEndIndex === selectedRange.endRow?.rowIndex &&
                    _areEqual(
                        range.columns,
                        selectedRange.columns.map((c) => c.getId())
                    )
            ) ?? -1;

        if (foundIdx > -1) {
            selectedCellRanges?.splice(foundIdx, 1);
        } else {
            notFound.push(range);
        }
    }
    expect(notFound).toEqual([]);
}

export function waitForEvent(event: AgPublicEventType, api: GridApi, n = 1): Promise<void> {
    let count = n;
    return new Promise((resolve) => {
        function listener() {
            if (--count === 0) {
                api.removeEventListener(event, listener);
                resolve();
            }
        }
        api.addEventListener(event, listener);
    });
}

export function pressSpaceKey(element: HTMLElement, opts?: KeyboardEventInit): void {
    element.dispatchEvent(new KeyboardEvent('keydown', { ...opts, key: KeyCode.SPACE, bubbles: true }));
}
