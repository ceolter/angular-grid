import type { IDragAndDropImageComponent, IDragAndDropImageParams } from '../../dragAndDrop/dragAndDropImageComponent';
import type { ColDef } from '../../entities/colDef';
import type { IFloatingFilterComp, IFloatingFilterParams } from '../../filter/floating/floatingFilter';
import type { ISimpleFilter } from '../../filter/provided/iSimpleFilter';
import type { IHeaderComp, IHeaderParams, IInnerHeaderComponent } from '../../headerRendering/cells/column/headerComp';
import type {
    IHeaderGroupComp,
    IHeaderGroupParams,
    IInnerHeaderGroupComponent,
} from '../../headerRendering/cells/columnGroup/headerGroupComp';
import type { IDateComp, IDateParams } from '../../interfaces/dateComponent';
import type { ICellEditorComp, ICellEditorParams } from '../../interfaces/iCellEditor';
import type { AgGridCommon, WithoutGridCommon } from '../../interfaces/iCommon';
import type { IFilterComp, IFilterDef, IFilterParams } from '../../interfaces/iFilter';
import type { IFrameworkOverrides } from '../../interfaces/iFrameworkOverrides';
import type { ILoadingCellRendererComp } from '../../interfaces/iLoadingCellRenderer';
import type { ComponentType, UserCompDetails } from '../../interfaces/iUserCompDetails';
import type { ICellRendererComp, ICellRendererParams } from '../../rendering/cellRenderers/iCellRenderer';
import type { ILoadingOverlayComp, ILoadingOverlayParams } from '../../rendering/overlays/loadingOverlayComponent';
import type { INoRowsOverlayComp, INoRowsOverlayParams } from '../../rendering/overlays/noRowsOverlayComponent';
import type { ITooltipComp, ITooltipParams } from '../../tooltip/tooltipComponent';
import type { UserComponentFactory } from './userComponentFactory';
import { _getUserCompKeys } from './userComponentFactory';

const DateComponent: ComponentType<IDateComp> = {
    name: 'dateComponent',
    mandatoryMethods: ['getDate', 'setDate'],
    optionalMethods: ['afterGuiAttached', 'setInputPlaceholder', 'setInputAriaLabel', 'setDisabled', 'refresh'],
};

const DragAndDropImageComponent: ComponentType<IDragAndDropImageComponent> = {
    name: 'dragAndDropImageComponent',
    mandatoryMethods: ['setIcon', 'setLabel'],
};

const HeaderComponent: ComponentType = { name: 'headerComponent', optionalMethods: ['refresh'] };

const InnerHeaderComponent: ComponentType = { name: 'innerHeaderComponent' };
const InnerHeaderGroupComponent: ComponentType = { name: 'innerHeaderGroupComponent' };

const HeaderGroupComponent: ComponentType = { name: 'headerGroupComponent' };

const InnerCellRendererComponent: ComponentType = {
    name: 'innerRenderer',
    cellRenderer: true,
    optionalMethods: ['afterGuiAttached'],
};

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

const CellEditorComponent: ComponentType<ICellEditorComp> = {
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

const FilterComponent: ComponentType<ISimpleFilter> = {
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

const FloatingFilterComponent: ComponentType<IFloatingFilterComp> = {
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
): UserCompDetails<IDragAndDropImageComponent> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(DragAndDropImageComponent, 'agDragAndDropImage', params, true);
}

export function _getInnerCellRendererDetails<TDefinition = any>(
    userCompFactory: UserComponentFactory,
    def: TDefinition,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails<ICellRendererComp> | undefined {
    return userCompFactory.getCompDetails(def, InnerCellRendererComponent, undefined, params);
}

export function _getHeaderCompDetails(
    userCompFactory: UserComponentFactory,
    colDef: ColDef,
    params: WithoutGridCommon<IHeaderParams>
): UserCompDetails<IHeaderComp> | undefined {
    return userCompFactory.getCompDetails(colDef, HeaderComponent, 'agColumnHeader', params);
}

export function _getInnerHeaderCompDetails(
    userCompFactory: UserComponentFactory,
    headerCompParams: IHeaderParams,
    params: WithoutGridCommon<IHeaderParams>
): UserCompDetails<IInnerHeaderComponent> | undefined {
    return userCompFactory.getCompDetails(headerCompParams, InnerHeaderComponent, undefined, params);
}

export function _getHeaderGroupCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<IHeaderGroupParams>
): UserCompDetails<IHeaderGroupComp> | undefined {
    const colGroupDef = params.columnGroup.getColGroupDef()!;
    return userCompFactory.getCompDetails(colGroupDef, HeaderGroupComponent, 'agColumnGroupHeader', params);
}

export function _getInnerHeaderGroupCompDetails(
    userCompFactory: UserComponentFactory,
    headerGroupCompParams: IHeaderGroupParams,
    params: WithoutGridCommon<IHeaderGroupParams>
): UserCompDetails<IInnerHeaderGroupComponent> | undefined {
    return userCompFactory.getCompDetails(headerGroupCompParams, InnerHeaderGroupComponent, undefined, params);
}
// this one is unusual, as it can be LoadingCellRenderer, DetailCellRenderer, FullWidthCellRenderer or GroupRowRenderer.
// so we have to pass the type in.

export function _getFullWidthCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails<ICellRendererComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidth, undefined, params, true);
}

export function _getFullWidthLoadingCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails<ILoadingCellRendererComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidthLoading, 'agLoadingCellRenderer', params, true);
}

export function _getFullWidthGroupCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails<ICellRendererComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidthGroup, 'agGroupRowRenderer', params, true);
}

export function _getFullWidthDetailCellRendererDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails<ICellRendererComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(FullWidthDetail, 'agDetailCellRenderer', params, true);
}
// CELL RENDERER

export function _getCellRendererDetails<TDefinition = ColDef, TParams = ICellRendererParams>(
    userCompFactory: UserComponentFactory,
    def: TDefinition,
    params: WithoutGridCommon<TParams>
): UserCompDetails<ICellRendererComp> | undefined {
    return userCompFactory.getCompDetails(def, CellRendererComponent, undefined, params);
}

export function _getEditorRendererDetails<TDefinition, TEditorParams extends AgGridCommon<any, any>>(
    userCompFactory: UserComponentFactory,
    def: TDefinition,
    params: WithoutGridCommon<TEditorParams>
): UserCompDetails | undefined {
    return userCompFactory.getCompDetails<TDefinition, ICellRendererComp>(
        def,
        EditorRendererComponent,
        undefined,
        params
    );
}

export function _getLoadingCellRendererDetails(
    userCompFactory: UserComponentFactory,
    def: ColDef,
    params: WithoutGridCommon<ICellRendererParams>
): UserCompDetails<ILoadingCellRendererComp> | undefined {
    return userCompFactory.getCompDetails(def, LoadingCellRendererComponent, 'agSkeletonCellRenderer', params, true);
}
// CELL EDITOR

export function _getCellEditorDetails(
    userCompFactory: UserComponentFactory,
    def: ColDef,
    params: WithoutGridCommon<ICellEditorParams>
): UserCompDetails<ICellEditorComp> | undefined {
    return userCompFactory.getCompDetails(def, CellEditorComponent, 'agCellEditor', params, true);
}
// FILTER

/**
 * @param defaultFilter provided filters only
 */
export function _getFilterDetails(
    userCompFactory: UserComponentFactory,
    def: IFilterDef,
    params: WithoutGridCommon<IFilterParams>,
    defaultFilter: string
): UserCompDetails<IFilterComp> | undefined {
    return userCompFactory.getCompDetails(def, FilterComponent, defaultFilter, params, true);
}

export function _getDateCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<IDateParams>
): UserCompDetails<IDateComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(DateComponent, 'agDateInput', params, true);
}

export function _getLoadingOverlayCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ILoadingOverlayParams>
): UserCompDetails<ILoadingOverlayComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(LoadingOverlayComponent, 'agLoadingOverlay', params, true);
}

export function _getNoRowsOverlayCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<INoRowsOverlayParams>
): UserCompDetails<INoRowsOverlayComp> | undefined {
    return userCompFactory.getCompDetailsFromGridOptions(NoRowsOverlayComponent, 'agNoRowsOverlay', params, true);
}

export function _getTooltipCompDetails(
    userCompFactory: UserComponentFactory,
    params: WithoutGridCommon<ITooltipParams>
): UserCompDetails<ITooltipComp> | undefined {
    return userCompFactory.getCompDetails(params.colDef!, TooltipComponent, 'agTooltipComponent', params, true);
}

/**
 * @param defaultFloatingFilter provided floating filters only
 */
export function _getFloatingFilterCompDetails(
    userCompFactory: UserComponentFactory,
    def: IFilterDef,
    params: WithoutGridCommon<IFloatingFilterParams<any>>,
    defaultFloatingFilter: string
): UserCompDetails<IFloatingFilterComp> | undefined {
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
    return userCompFactory.mergeParams(defObject, FilterComponent, paramsFromGrid);
}
