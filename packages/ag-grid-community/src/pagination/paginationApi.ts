import type { BeanCollection } from '../context/context';

export function paginationIsLastPageFound(beans: BeanCollection): boolean {
    return beans.rowModel.isLastRowIndexKnown();
}

export function paginationGetPageSize(beans: BeanCollection): number {
    return beans.pagination?.getPageSize() ?? 100;
}

export function paginationGetCurrentPage(beans: BeanCollection): number {
    return beans.pagination?.getCurrentPage() ?? 0;
}

export function paginationGetTotalPages(beans: BeanCollection): number {
    return beans.pagination?.getTotalPages() ?? 1;
}

export function paginationGetRowCount(beans: BeanCollection): number {
    return beans.pagination ? beans.pagination.getMasterRowCount() : beans.rowModel.getRowCount();
}

export function paginationGoToNextPage(beans: BeanCollection): void {
    beans.pagination?.goToNextPage();
}

export function paginationGoToPreviousPage(beans: BeanCollection): void {
    beans.pagination?.goToPreviousPage();
}

export function paginationGoToFirstPage(beans: BeanCollection): void {
    beans.pagination?.goToFirstPage();
}

export function paginationGoToLastPage(beans: BeanCollection): void {
    beans.pagination?.goToLastPage();
}

export function paginationGoToPage(beans: BeanCollection, page: number): void {
    beans.pagination?.goToPage(page);
}
