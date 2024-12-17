import type { ColDef } from '../entities/colDef';
import type { IFloatingFilterComp } from '../filter/floating/floatingFilter';
import type { Column } from '../interfaces/iColumn';
import type { AgPromise } from '../utils/promise';
import type { IAfterGuiAttachedParams } from './iAfterGuiAttachedParams';
import type { AgGridCommon } from './iCommon';
import type { IComponent } from './iComponent';
import type { IRowModel } from './iRowModel';
import type { IRowNode } from './iRowNode';

export type IFilterType = string | { new (): IFilterComp } | boolean;
export type IFloatingFilterType = string | { new (): IFloatingFilterComp };

export interface IFilterDef {
    /**
     * Filter component to use for this column.
     * - Set to `true` to use the default filter.
     * - Set to the name of a provided filter: `agNumberColumnFilter`, `agTextColumnFilter`, `agDateColumnFilter`, `agMultiColumnFilter`, `agSetColumnFilter`.
     * - Set to a `IFilterComp`.
     */
    filter?: any;
    /** Params to be passed to the filter component specified in `filter`. */
    filterParams?: any;

    /**
     * The custom component to be used for rendering the floating filter.
     * If none is specified the default AG Grid is used.
     */
    floatingFilterComponent?: any;
    /** Params to be passed to `floatingFilterComponent`. */
    floatingFilterComponentParams?: any;
}

export interface BaseFilter {
    /**
     * The grid will ask each active filter, in turn, whether each row in the grid passes. If any
     * filter fails, then the row will be excluded from the final set. The method is provided a
     * params object with attributes node (the rodNode the grid creates that wraps the data) and data
     * (the data object that you provided to the grid for that row). Note that this is only called for the
     * Client-Side Row Model, and can just return `true` if being used exclusively with other row models.
     */
    doesFilterPass(params: IDoesFilterPassParams): boolean;

    /**
     * Optional: Gets called when new rows are inserted into the grid. If the filter needs to change its
     * state after rows are loaded, it can do it here. For example the set filters uses this
     * to update the list of available values to select from (e.g. 'Ireland', 'UK' etc for
     * Country filter). To get the list of available values from within this method from the
     * Client Side Row Model, use `gridApi.forEachLeafNode(callback)`.
     */
    onNewRowsLoaded?(): void;

    /** Optional: Called whenever any filter is changed. */
    onAnyFilterChanged?(): void;

    /**
     * Optional: Used by AG Grid when rendering floating filters and there isn't a floating filter
     * associated for this filter, this will happen if you create a custom filter and NOT a custom floating
     * filter.
     */
    getModelAsString?(model: any): string;

    /**
     * Optional: A hook to perform any necessary operation just after the GUI for this component has been rendered on the screen.
     * If a parent popup is closed and reopened (e.g. for filters), this method is called each time the component is shown.
     * This is useful for any logic that requires attachment before executing, such as putting focus on a particular DOM element.
     */
    afterGuiAttached?(params?: IAfterGuiAttachedParams): void;

    /**
     * Optional: A hook to perform any necessary operation just after the GUI for this component has been removed from the screen.
     * If a parent popup is opened and closed (e.g. for filters), this method is called each time the component is hidden.
     * This is useful for any logic to reset the UI state back to the model before the component is reopened.
     */
    afterGuiDetached?(): void;
}

export interface IFilter extends BaseFilter {
    /**
     * Returns `true` if the filter is currently active, otherwise `false`.
     * If active then 1) the grid will show the filter icon in the column header
     * and 2) the filter will be included in the filtering of the data.
     */
    isFilterActive(): boolean;

    /**
     * Returns a model representing the current state of the filter, or `null` if the filter is
     * not active. The grid calls `getModel()` on all active filters when `gridApi.getFilterModel()` is called.
     */
    getModel(): any;

    /**
     * Sets the state of the filter using the supplied model. Providing `null` as the model will
     * de-activate the filter.
     */
    setModel(model: any): void | AgPromise<void>;

    /**
     * This method is called when the filter parameters change.
     * The result returned by this method will determine if the filter should be refreshed and reused,
     * or if a new filter instance should be created.
     *
     * This method should return `true` if the filter should be refreshed and reused instead of being destroyed.
     * This is useful if the new params passed are compatible with the existing filter instance.
     *
     * When `false` is returned, the existing filter will be destroyed and a new filter will be created.
     * This should be done if the new params passed are not compatible with the existing filter instance.
     *
     * @param newParams {IFilterParams} - New filter params.
     *
     * @returns {boolean} - `true` means that the filter should be refreshed and kept.
     * `false` means that the filter will be destroyed and a new filter instance will be created.
     */
    refresh?(newParams: IFilterParams): boolean;
}

export interface ProvidedFilterModel {
    filterType?: string;
}

export interface IFilterComp<TData = any> extends IComponent<IFilterParams<TData>>, IFilter {}

export interface IDoesFilterPassParams<TData = any> {
    /** The row node in question. */
    node: IRowNode<TData>;
    /** The data part of the row node in question. */
    data: TData;
}

export interface IFilterOptionDef {
    /** A unique key that does not clash with the built-in filter keys. */
    displayKey: string;
    /** Display name for the filter. Can be replaced by a locale-specific value using a `localeTextFunc`. */
    displayName: string;
    /** Custom filter logic that returns a boolean based on the `filterValues` and `cellValue`. */
    predicate?: (filterValues: any[], cellValue: any) => boolean;
    /** Number of inputs to display for this option. Defaults to `1` if unspecified. */
    numberOfInputs?: 0 | 1 | 2;
}

export interface BaseFilterParams<TData = any, TContext = any> extends AgGridCommon<TData, TContext> {
    /** The column this filter is for. */
    column: Column;
    /** The column definition for the column. */
    colDef: ColDef<TData>;
    /**
     * @deprecated 33.1 Use the corresponding methods on the grid API (`api`) instead.
     */
    rowModel: IRowModel;

    /**
     * Get the cell value for the given row node and column, which can be the column ID, definition, or `Column` object.
     * If no column is provided, the column this filter is on will be used.
     */
    getValue: <TValue = any>(
        node: IRowNode<TData>,
        column?: string | ColDef<TData, TValue> | Column<TValue>
    ) => TValue | null | undefined;

    /**
     * A function callback, call with a node to be told whether the node passes all filters except the current filter.
     * This is useful if you want to only present to the user values that this filter can filter given the status of the other filters.
     * The set filter uses this to remove from the list,
     * items that are no longer available due to the state of other filters (like Excel type filtering).
     */
    doesRowPassOtherFilter: (rowNode: IRowNode<TData>) => boolean; // TODO: this method should be "doesRowPassOtherFilters"
}

/**
 * Parameters provided by the grid to the `init` method of an `IFilterComp`
 */
export interface IFilterParams<TData = any, TContext = any> extends BaseFilterParams<TData, TContext> {
    /**
     * A function callback to be called when the filter changes. The
     * grid will then respond by filtering the grid data. The callback
     * takes one optional parameter which, if included, will get merged
     * to the FilterChangedEvent object (useful for passing additional
     * information to anyone listening to this event, however such extra
     * attributes are not used by the grid).
     */
    filterChangedCallback: (additionalEventAttributes?: any) => void;
    /**
     * A function callback, to be optionally called, when the filter UI changes.
     * The grid will respond with emitting a FilterModifiedEvent.
     * Apart from emitting the event, the grid takes no further action.
     */
    filterModifiedCallback: () => void;
}

/**
 * FilterModel represents the filter state for all columns in the grid keyed by the column id.
 * If using inbuilt AG Grid filters then the type of the column filter model could be one of:
 *      `TextFilterModel`, `NumberFilterModel`, `DateFilterModel`, `SetFilterModel`, `IMultiFilterModel`, `AdvancedFilterModel`
 */
export interface FilterModel {
    [colId: string]: any;
}
