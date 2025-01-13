import type { BeanCollection } from '../context/context';

export function isQuickFilterPresent(beans: BeanCollection): boolean {
    return !!beans.quickFilter?.isFilterPresent();
}

export function getQuickFilter(beans: BeanCollection): string | undefined {
    return beans.quickFilter?.getText();
}

export function resetQuickFilter(beans: BeanCollection): void {
    beans.quickFilter?.resetCache();
}
