import type { AdvancedFilterModel, AgEvent, BaseCellDataType, JoinAdvancedFilterModel } from 'ag-grid-community';

interface AdvancedFilterBuilderItemEvent<T extends AdvancedFilterBuilderEvents> extends AgEvent<T> {
    item: AdvancedFilterBuilderItem;
}

export interface AdvancedFilterBuilderAddEvent extends AdvancedFilterBuilderItemEvent<'advancedFilterBuilderAdded'> {
    isJoin: boolean;
}

export interface AdvancedFilterBuilderMoveEvent extends AdvancedFilterBuilderItemEvent<'advancedFilterBuilderMoved'> {
    backwards: boolean;
}

export interface AdvancedFilterBuilderRemoveEvent
    extends AdvancedFilterBuilderItemEvent<'advancedFilterBuilderRemoved'> {}

export interface AdvancedFilterBuilderItem {
    filterModel: AdvancedFilterModel | null;
    level: number;
    parent?: JoinAdvancedFilterModel;
    valid: boolean;
    showMove?: boolean;
}

export type CreatePillParams = CreateInputPillParams | CreateSelectPillParams;

interface CreateInputPillParams extends BaseCreatePillParams {
    isSelect: false;
    valueFormatter: (value: string) => string;
    baseCellDataType: BaseCellDataType;
}

interface CreateSelectPillParams extends BaseCreatePillParams {
    isSelect: true;
    displayValue: string;
    getEditorParams: () => { values?: any[] };
    pickerAriaLabelKey: string;
    pickerAriaLabelValue: string;
}

interface BaseCreatePillParams {
    key: string;
    cssClass: string;
    update: (key: string) => void;
    ariaLabel: string;
}

export type AdvancedFilterBuilderEvents =
    | 'advancedFilterBuilderAdded'
    | 'advancedFilterBuilderMoved'
    | 'advancedFilterBuilderRemoved'
    | 'advancedFilterBuilderValueChanged'
    | 'advancedFilterBuilderValidChanged';
