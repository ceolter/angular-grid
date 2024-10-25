import type { BeanCollection, IClipboardCopyParams, IClipboardCopyRowsParams } from 'ag-grid-community';

export function copyToClipboard(beans: BeanCollection, params?: IClipboardCopyParams) {
    beans.clipboardSvc?.copyToClipboard(params);
}

export function cutToClipboard(beans: BeanCollection, params?: IClipboardCopyParams) {
    beans.clipboardSvc?.cutToClipboard(params);
}

export function copySelectedRowsToClipboard(beans: BeanCollection, params?: IClipboardCopyRowsParams): void {
    beans.clipboardSvc?.copySelectedRowsToClipboard(params);
}

export function copySelectedRangeToClipboard(beans: BeanCollection, params?: IClipboardCopyParams): void {
    beans.clipboardSvc?.copySelectedRangeToClipboard(params);
}

export function copySelectedRangeDown(beans: BeanCollection): void {
    beans.clipboardSvc?.copyRangeDown();
}

export function pasteFromClipboard(beans: BeanCollection): void {
    beans.clipboardSvc?.pasteFromClipboard();
}
