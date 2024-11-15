import type { AdvancedFilterModel, BeanCollection } from 'ag-grid-community';

export function getAdvancedFilterModel(beans: BeanCollection): AdvancedFilterModel | null {
    return beans.filterManager?.getAdvFilterModel() ?? null;
}

export function setAdvancedFilterModel(beans: BeanCollection, advancedFilterModel: AdvancedFilterModel | null): void {
    beans.filterManager?.setAdvFilterModel(advancedFilterModel);
}

export function showAdvancedFilterBuilder(beans: BeanCollection): void {
    beans.filterManager?.toggleAdvFilterBuilder(true, 'api');
}

export function hideAdvancedFilterBuilder(beans: BeanCollection): void {
    beans.filterManager?.toggleAdvFilterBuilder(false, 'api');
}
