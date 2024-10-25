import type { IDragAndDropImageParams } from '../../dragAndDrop/dragAndDropImageComponent';
import type { ColDef } from '../../entities/colDef';
import type { IFloatingFilterParams } from '../../filter/floating/floatingFilter';
import type { IHeaderParams } from '../../headerRendering/cells/column/headerComp';
import type { IHeaderGroupParams } from '../../headerRendering/cells/columnGroup/headerGroupComp';
import type { IDateParams } from '../../interfaces/dateComponent';
import type { ICellEditorParams } from '../../interfaces/iCellEditor';
import type { AgGridCommon, WithoutGridCommon } from '../../interfaces/iCommon';
import type { IFilterDef, IFilterParams } from '../../interfaces/iFilter';
import type { IFrameworkOverrides } from '../../interfaces/iFrameworkOverrides';
import type { ComponentType, UserCompDetails } from '../../interfaces/iUserCompDetails';
import type { ICellRendererParams } from '../../rendering/cellRenderers/iCellRenderer';
import type { ILoadingOverlayParams } from '../../rendering/overlays/loadingOverlayComponent';
import type { INoRowsOverlayParams } from '../../rendering/overlays/noRowsOverlayComponent';
import type { ITooltipParams } from '../../tooltip/tooltipComponent';
import { _getUserCompKeys } from './userComponentFactory';
import type { UserComponentFactory } from './userComponentFactory';

const DateComponent: ComponentType = {
    name: 'dateComponent',
    mandatoryMethods: ['getDate', 'setDate'],
    optionalMethods: ['afterGuiAttached', 'setInputPlaceholder', 'setInputAriaLabel', 'setDisabled', 'refresh'],
};

const DragAndDropImageComponent: ComponentType = {
    name: 'dragAndDropImageComponent',
    mandatoryMethods: ['setIcon', 'setLabel'],
};

const HeaderComponent: ComponentType = { name: 'headerComponent', optionalMethods: ['refresh'] };

const HeaderGroupComponent: ComponentType = { name: 'headerGroupComponent' };

const CellRendererComponent: ComponentType = {
    name: 'cellRenderer',
    optionalMethods: ['refresh', 'afterGuiAttached'],
    cellRenderer: true,
};

const EditorRendererComponent: ComponentType = {
    name: 'cellRenderer',
    optionalMethods: ['refresh', 'afterGuiAttached'],
};

const LoadingCellRendererComponent: ComponentType = { name: 'loadingCellRenderer', cellRenderer: true };

const CellEditorComponent: ComponentType = {
    name: 'cellEditor',
    mandatoryMethods: ['getValue'],
    optionalMethods: [
        'isPopup',
        'isCancelBeforeStart',
        'isCancelAfterEnd',
        'getPopupPosition',
        'focusIn',
        'focusOut',
        'afterGuiAttached',
        'refresh',
    ],
};

const LoadingOverlayComponent: ComponentType = { name: 'loadingOverlayComponent', optionalMethods: ['refresh'] };

const NoRowsOverlayComponent: ComponentType = { name: 'noRowsOverlayComponent', optionalMethods: ['refresh'] };

const TooltipComponent: ComponentType = { name: 'tooltipComponent' };

const FilterComponent: ComponentType = {
    name: 'filter',
    mandatoryMethods: ['isFilterActive', 'doesFilterPass', 'getModel', 'setModel'],
    optionalMethods: [
        'afterGuiAttached',
        'afterGuiDetached',
        'onNewRowsLoaded',
        'getModelAsString',
        'onFloatingFilterChanged',
        'onAnyFilterChanged',
        'refresh',
    ],
};

const FloatingFilterComponent: ComponentType = {
    name: 'floatingFilterComponent',
    mandatoryMethods: ['onParentModelChanged'],
    optionalMethods: ['afterGuiAttached', 'refresh'],
};

const FullWidth: ComponentType = {
    name: 'fullWidthCellRenderer',
    optionalMethods: ['refresh', 'afterGuiAttached'],
    cellRenderer: true,
};

const FullWidthLoading: ComponentType = { name: 'loadingCellRenderer', cellRenderer: true };

const FullWidthGroup: ComponentType = {
    name: 'groupRowRenderer',
    optionalMethods: ['afterGuiAttached'],
    cellRenderer: true,
};

const FullWidthDetail: ComponentType = { name: 'detailCellRenderer', optionalMethods: ['refresh'], cellRenderer: true };

export function _getDragAndDropImageCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<IDragAndDropImageParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(
        DragAndDropImageComponent,
        'agDragAndDropImage',
        params,
        true
    )!;
}

export function _getHeaderCompDetails(
    userCompFactory: UserComponentFactory,
    colDef: ColDef,
    params: WithoutGridCommon<IHeaderParams>
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails(colDef, HeaderComponent, 'agColumnHeader', params);
}

export function _getHeaderGroupCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<IHeaderGroupParams>
): UserCompDetails | undefined {
    const colGroupDef = params.columnGroup.getColGroupDef()!;
    return userCompFactory.getCompDetails(colGroupDef, HeaderGroupComponent, 'agColumnGroupHeader', params);
}
// this one is unusual, as it can be LoadingCellRenderer, DetailCellRenderer, FullWidthCellRenderer or GroupRowRenderer.
// so we have to pass the type in.

export function _getFullWidthCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidth, null, params, true)!;
}

export function _getFullWidthLoadingCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidthLoading, 'agLoadingCellRenderer', params, true)!;
}

export function _getFullWidthGroupCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidthGroup, 'agGroupRowRenderer', params, true)!;
}

export function _getFullWidthDetailCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidthDetail, 'agDetailCellRenderer', params, true)!;
}
// CELL RENDERER

export function _getCellRendererDetails<TDefinition = ColDef, TParams = ICellRendererParams>(
    userCompFactory: UserComponentFactory,
    def: TDefinition,
    params: WithoutGridCommon<TParams>
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails(def, CellRendererComponent, null, params);
}

export function _getEditorRendererDetails<TDefinition, TEditorParams extends AgGridCommon<any, any>>(
    userCompFactory: UserComponentFactory,
    def: TDefinition,
    params: WithoutGridCommon<TEditorParams>
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails<TDefinition>(def, EditorRendererComponent, null, params);
}

export function _getLoadingCellRendererDetails(
    userCompFactory: UserComponentFactory,
    def: ColDef,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails(def, LoadingCellRendererComponent, 'agSkeletonCellRenderer', params, true);
}
// CELL EDITOR

export function _getCellEditorDetails(
    userCompFactory: UserComponentFactory,
    def: ColDef,
    params: WithoutGridCommon<ICellEditorParams>
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails(def, CellEditorComponent, 'agCellEditor', params, true);
}
// FILTER

export function _getFilterDetails(
    userCompFactory: UserComponentFactory,
    def: IFilterDef,
    params: WithoutGridCommon<IFilterParams>,
    defaultFilter: string
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails(def, FilterComponent, defaultFilter, params, true);
}

export function _getDateCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<IDateParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(DateComponent, 'agDateInput', params, true)!;
}

export function _getLoadingOverlayCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ILoadingOverlayParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(LoadingOverlayComponent, 'agLoadingOverlay', params, true)!;
}

export function _getNoRowsOverlayCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<INoRowsOverlayParams>
): UserCompDetails {
    return userCompFactory.getCompDetailsFromGridOptions(NoRowsOverlayComponent, 'agNoRowsOverlay', params, true)!;
}

export function _getTooltipCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ITooltipParams>
): UserCompDetails {
    return userCompFactory.getCompDetails(params.colDef!, TooltipComponent, 'agTooltipComponent', params, true)!;
}

export function _getFloatingFilterCompDetails(
    userCompFactory: UserComponentFactory,
    def: IFilterDef,
    params: WithoutGridCommon<IFloatingFilterParams<any>>,
    defaultFloatingFilter: string | null
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails(def, FloatingFilterComponent, defaultFloatingFilter, params);
}

export function _getFilterCompKeys(frameworkOverrides: IFrameworkOverrides, def: IFilterDef) {
    return _getUserCompKeys(frameworkOverrides, def, FilterComponent);
}

export function _mergeFilterParamsWithApplicationProvidedParams(
    userCompFactory: UserComponentFactory,
    defObject: ColDef,
    paramsFromGrid: IFilterParams
): IFilterParams {
    return userCompFactory.mergeParamsWithApplicationProvidedParams(defObject, FilterComponent, paramsFromGrid);
}
