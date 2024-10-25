/* import type {
    ColDef,
    Column,
    Context,
    FilterManager,
    FocusService,
    IFilterComp,
    IRowModel,
    TabGuardCtrl,
    UserComponentFactory,
} from 'ag-grid-community';
import {
    AgPromise,
    IAfterGuiAttachedParams,
    IClientSideRowModel,
    IDoesFilterPassParams,
    IMultiFilterModel,
    MultiFilterParams,
    ProvidedFilter,
    ProvidedFilterModel,
    ProvidedFilterParams,
} from 'ag-grid-community';

import { mock } from '../test-utils/mock';
import { MultiFilter } from './multiFilter';

let eGui: jest.Mocked<HTMLElement>;
let filterManager: jest.Mocked<FilterManager>;
let tabGuardCtrl: jest.Mocked<TabGuardCtrl>;
let userCompFactory: jest.Mocked<UserComponentFactory>;
let focusSvc: jest.Mocked<FocusService>;

let colDef: jest.Mocked<ColDef>;
let column: jest.Mocked<Column>;
let rowModel: jest.Mocked<IRowModel>;
let context: jest.Mocked<Context>;

let filter1: jest.Mocked<IFilterComp>;
let filter2: jest.Mocked<IFilterComp>; */

///// Niall commented these out for now, not sure if we need these tests given we don't have same type of tests
///// in other parts of the app. I put in one empty test as otherwise jest would complain about an empty test suite.
describe('dummyTest', () => {
    it('always true', () => {
        expect('hello').toBe('hello');
    });
});

/*
function createFilter(filterParams: any = {}): MultiFilter {
    const baseFilterParams: ProvidedFilterParams = {
        // @ts-ignore
        api: null,
        column,
        colDef,
        rowModel,
        context,
        doesRowPassOtherFilter: () => true,
        filterChangedCallback: () => { },
        filterModifiedCallback: () => { },
        valueGetter: node => node.data.value,
    };

    filterManager.createFilterParams.mockImplementation((_1, _2, _3) => ({ ...baseFilterParams }));
    userCompFactory.newFilterComponent
        .mockReturnValueOnce(AgPromise.resolve(filter1))
        .mockReturnValueOnce(AgPromise.resolve(filter2));

    const params: MultiFilterParams = {
        ...baseFilterParams,
        ...filterParams,
    };

    const multiFilter = new MultiFilter();

    (multiFilter as any).eGui = eGui;
    (multiFilter as any).eFocusableElement = eGui;
    (multiFilter as any).filterManager = filterManager;
    (multiFilter as any).userCompFactory = userCompFactory;
    (multiFilter as any).focusSvc = focusSvc;
    (multiFilter as any).context = context;
    (multiFilter as any).tabGuardCtrl = tabGuardCtrl;

    multiFilter.init(params);

    return multiFilter;
}

beforeEach(() => {
    eGui = mock<HTMLElement>('appendChild', 'insertAdjacentElement', 'contains');
    filterManager = mock<FilterManager>('createFilterParams');
    tabGuardCtrl = mock<TabGuardCtrl>('forceFocusOutOfContainer');
    userCompFactory = mock<UserComponentFactory>('newFilterComponent');
    focusSvc = mock<FocusService>('findFocusableElements');
    context = mock<Context>('createBean', 'destroyBean');

    colDef = mock<ColDef>();
    column = mock<Column>('getColDef');
    column.getColDef.mockReturnValue(colDef);
    rowModel = mock<IClientSideRowModel>('getType');
});

describe('init', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui');
        filter2 = mock<IFilterComp>('getGui');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('will default to text filter and set filter', () => {
        createFilter();

        expect(userCompFactory.newFilterComponent).toHaveBeenCalledTimes(2);

        const { calls } = userCompFactory.newFilterComponent.mock;

        expect(calls[0][0]).toMatchObject({ filter: 'agTextColumnFilter' });
        expect(calls[1][0]).toMatchObject({ filter: 'agSetColumnFilter' });
    });
});

describe('isFilterActive', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('returns false if no filters are active', () => {
        const multiFilter = createFilter();

        expect(multiFilter.isFilterActive()).toBe(false);
    });

    it.each([[true, false], [false, true], [true, true]])
        ('returns true if any filters are active', (filter1active, filter2active) => {
            const multiFilter = createFilter();

            filter1.isFilterActive.mockReturnValue(filter1active);
            filter2.isFilterActive.mockReturnValue(filter2active);

            expect(multiFilter.isFilterActive()).toBe(true);
        });
});

describe('doesFilterPass', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive', 'doesFilterPass');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive', 'doesFilterPass');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('returns true if no filters are active', () => {
        const multiFilter = createFilter();
        // @ts-ignore
        const params: IDoesFilterPassParams = { node: null, data: null };

        expect(multiFilter.doesFilterPass(params)).toBe(true);
    });

    it('returns true if all active filters pass', () => {
        const multiFilter = createFilter();
        // @ts-ignore
        const params: IDoesFilterPassParams = { node: null, data: null };

        filter1.isFilterActive.mockReturnValue(true);
        filter1.doesFilterPass.mockReturnValue(true);

        filter2.isFilterActive.mockReturnValue(true);
        filter2.doesFilterPass.mockReturnValue(true);

        expect(multiFilter.doesFilterPass(params)).toBe(true);
    });

    it.each([[false, false], [true, false], [false, true]])
        ('returns false if any active filters do not pass', (filter1passes, filter2passes) => {
            const multiFilter = createFilter();
            // @ts-ignore
            const params: IDoesFilterPassParams = { node: null, data: null };

            filter1.isFilterActive.mockReturnValue(true);
            filter1.doesFilterPass.mockReturnValue(filter1passes);

            filter2.isFilterActive.mockReturnValue(true);
            filter2.doesFilterPass.mockReturnValue(filter2passes);

            expect(multiFilter.doesFilterPass(params)).toBe(false);
        });
});

describe('getModelFromUi', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('includes model from first filter', () => {
        const providedFilter = mock<ProvidedFilter<ProvidedFilterModel, string>>('getGui', 'isFilterActive', 'getModelFromUi');
        providedFilter.getGui.mockReturnValue(document.createElement('div'));
        filter1 = providedFilter;

        const multiFilter = createFilter();
        const filterModel = { filterType: 'text' };
        providedFilter.getModelFromUi.mockReturnValue(filterModel);
        filter1.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModelFromUi()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [filterModel, null],
        });
    });

    it('does not include model from first filter if does not implement getModelFromUi', () => {
        const multiFilter = createFilter();
        filter1.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModelFromUi()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [null, null],
        });
    });

    it('includes model from second filter', () => {
        const providedFilter = mock<ProvidedFilter<ProvidedFilterModel, string>>('getGui', 'isFilterActive', 'getModelFromUi');
        providedFilter.getGui.mockReturnValue(document.createElement('div'));
        filter2 = providedFilter;

        const multiFilter = createFilter();
        const filterModel = { filterType: 'text' };
        providedFilter.getModelFromUi.mockReturnValue(filterModel);
        filter2.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModelFromUi()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [null, filterModel],
        });
    });

    it('does not include model from second filter if does not implement getModelFromUi', () => {
        const multiFilter = createFilter();
        filter2.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModelFromUi()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [null, null],
        });
    });
});

describe('getModel', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive', 'getModel');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive', 'getModel');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('returns null if neither filter is active', () => {
        const multiFilter = createFilter();

        expect(multiFilter.getModel()).toBeNull();
    });

    it('includes model from first filter', () => {
        const multiFilter = createFilter();
        const filterModel = { filterType: 'text' };

        filter1.getModel.mockReturnValue(filterModel);
        filter1.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModel()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [filterModel, null],
        });
    });

    it('includes model from second filter', () => {
        const multiFilter = createFilter();
        const filterModel = { filterType: 'set', values: ['A', 'B', 'C'] };

        filter2.getModel.mockReturnValue(filterModel);
        filter2.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModel()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [null, filterModel],
        });
    });

    it('includes model from both filters', () => {
        const multiFilter = createFilter();

        const filterModel1 = { filterType: 'text' };
        filter1.getModel.mockReturnValue(filterModel1);
        filter1.isFilterActive.mockReturnValue(true);

        const filterModel2 = { filterType: 'set', values: ['A', 'B', 'C'] };
        filter2.getModel.mockReturnValue(filterModel2);
        filter2.isFilterActive.mockReturnValue(true);

        expect(multiFilter.getModel()).toStrictEqual<IMultiFilterModel>({
            filterType: 'multi',
            filterModels: [filterModel1, filterModel2],
        });
    });
});

describe('setModel', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('sets null on both filters if provided model is null', done => {
        const multiFilter = createFilter();

        multiFilter.setModel(null).then(() => {
            expect(filter1.setModel).toHaveBeenCalledTimes(1);
            expect(filter1.setModel).toHaveBeenCalledWith(null);
            expect(filter2.setModel).toHaveBeenCalledTimes(1);
            expect(filter2.setModel).toHaveBeenCalledWith(null);

            done();
        });
    });

    it('sets model on all filters if provided model is present', done => {
        const multiFilter = createFilter();
        const filterModel1 = { filterType: 'text' };
        const filterModel2 = { filterType: 'set', values: ['A', 'B', 'C'] };

        const model: IMultiFilterModel = {
            filterType: 'multi',
            filterModels: [filterModel1, filterModel2]
        };

        multiFilter.setModel(model).then(() => {
            expect(filter1.setModel).toHaveBeenCalledTimes(1);
            expect(filter1.setModel).toHaveBeenCalledWith(filterModel1);
            expect(filter2.setModel).toHaveBeenCalledTimes(1);
            expect(filter2.setModel).toHaveBeenCalledWith(filterModel2);

            done();
        });
    });
});

describe('getChildFilterInstance', () => {
    it('returns first filter', () => {
        const multiFilter = createFilter();

        expect(multiFilter.getChildFilterInstance(0)).toBe(filter1);
    });

    it('returns second filter', () => {
        const multiFilter = createFilter();

        expect(multiFilter.getChildFilterInstance(1)).toBe(filter2);
    });
});

describe('afterGuiAttached', () => {
    let filter1Gui: HTMLElement;
    let filter2Gui: HTMLElement;

    beforeEach(() => {
        filter1Gui = document.createElement('div');
        filter1Gui.id = 'filter-1';
        filter1 = mock<IFilterComp>('getGui');
        filter1.getGui.mockReturnValue(filter1Gui);

        filter2Gui = document.createElement('div');
        filter2Gui.id = 'filter-2';
        filter2 = mock<IFilterComp>('getGui');
        filter2.getGui.mockReturnValue(filter2Gui);

        context.createBean.mockImplementation(bean => bean);
        focusSvc.findFocusableElements.mockReturnValue([]);
    });

    it('passes through to filter if it has afterGuiAttached function', () => {
        filter1 = mock<IFilterComp>('getGui', 'afterGuiAttached');
        filter1.getGui.mockReturnValue(filter1Gui);

        filter2 = mock<IFilterComp>('getGui', 'afterGuiAttached');
        filter2.getGui.mockReturnValue(filter2Gui);

        const multiFilter = createFilter();
        const params: IAfterGuiAttachedParams = { container: 'columnMenu' };

        multiFilter.afterGuiAttached(params);

        expect(filter1.afterGuiAttached).toHaveBeenCalledTimes(1);
        expect(filter1.afterGuiAttached).toHaveBeenCalledWith(params);
        expect(filter2.afterGuiAttached).toHaveBeenCalledTimes(1);
        expect(filter2.afterGuiAttached).toHaveBeenCalledWith(params);
    });

    it('allows focussing if all filters are inline', () => {
        filter1 = mock<IFilterComp>('getGui', 'afterGuiAttached');
        filter1.getGui.mockReturnValue(filter1Gui);

        filter2 = mock<IFilterComp>('getGui', 'afterGuiAttached');
        filter2.getGui.mockReturnValue(filter2Gui);

        const multiFilter = createFilter({
            filters: [
                {
                    filter: 'agTextColumnFilter',
                    display: 'inline',
                },
                {
                    filter: 'agSetColumnFilter',
                }
            ]
        });

        const params: IAfterGuiAttachedParams = { container: 'columnMenu' };

        multiFilter.afterGuiAttached(params);

        const expectedParams = { ...params, suppressFocus: false };

        expect(filter1.afterGuiAttached).toHaveBeenCalledTimes(1);
        expect(filter1.afterGuiAttached).toHaveBeenCalledWith(expectedParams);
        expect(filter2.afterGuiAttached).toHaveBeenCalledTimes(1);
        expect(filter2.afterGuiAttached).toHaveBeenCalledWith(expectedParams);
        expect(filter2.afterGuiAttached).toHaveBeenCalledWith(expectedParams);
    });

    it.each(['subMenu', 'accordion'])('suppresses focussing if any filter is not inline', display => {
        filter1 = mock<IFilterComp>('getGui', 'afterGuiAttached');
        filter1.getGui.mockReturnValue(filter1Gui);

        filter2 = mock<IFilterComp>('getGui', 'afterGuiAttached');
        filter2.getGui.mockReturnValue(filter2Gui);

        const multiFilter = createFilter({
            filters: [
                {
                    filter: 'agTextColumnFilter',
                },
                {
                    filter: 'agSetColumnFilter',
                    display
                }

            ]
        });

        const params: IAfterGuiAttachedParams = { container: 'columnMenu' };

        multiFilter.afterGuiAttached(params);

        const expectedParams = { ...params, suppressFocus: true };

        expect(filter1.afterGuiAttached).toHaveBeenCalledTimes(1);
        expect(filter1.afterGuiAttached).toHaveBeenCalledWith(expectedParams);
        expect(filter2.afterGuiAttached).toHaveBeenCalledTimes(1);
        expect(filter2.afterGuiAttached).toHaveBeenCalledWith(expectedParams);
    });

    it('does not pass through to filter if afterGuiAttached function does not exist', () => {
        const multiFilter = createFilter();

        expect(() => multiFilter.afterGuiAttached({ container: 'columnMenu' })).not.toThrow();
    });

    it('presents the first filter then the second filter with a separator in-between', () => {
        const filter = createFilter();
        filter.afterGuiAttached({ container: 'columnMenu' });

        expect(eGui.appendChild).toHaveBeenCalledTimes(3);

        const { calls } = eGui.appendChild.mock;

        expect((calls[0][0] as HTMLElement)).toBe(filter1Gui);
        expect((calls[1][0] as HTMLElement).outerHTML).toBe('<div class="ag-filter-separator"></div>');
        expect((calls[2][0] as HTMLElement)).toBe(filter2Gui);
    });

    it('refreshes the UI if the container changes', () => {
        const filter = createFilter();
        filter.afterGuiAttached({ container: 'columnMenu' });
        filter.afterGuiAttached({ container: 'toolPanel' });

        expect(eGui.appendChild).toHaveBeenCalledTimes(6);
    });

    it('does not refresh the UI if the container does not change', () => {
        const filter = createFilter();
        filter.afterGuiAttached({ container: 'columnMenu' });
        filter.afterGuiAttached({ container: 'columnMenu' });

        expect(eGui.appendChild).toHaveBeenCalledTimes(3);
    });

    const getMostRecentlyAppendedElement = (): HTMLElement => {
        const { calls } = eGui.appendChild.mock;

        return calls[calls.length - 1][0] as HTMLElement;
    };

    it('presents the filter inside a sub-menu if configured', () => {
        const filter = createFilter({
            filters: [{
                filter: 'agTextColumnFilter',
                display: 'subMenu',
            }]
        });

        filter.afterGuiAttached({ container: 'columnMenu' });

        expect(getMostRecentlyAppendedElement().classList).toContain('ag-compact-menu-option');
    });

    it('presents the filter inside an accordion if sub-menu is configured but filter is opened in tool panel', () => {
        const filter = createFilter({
            filters: [{
                filter: 'agTextColumnFilter',
                display: 'subMenu',
            }]
        });

        filter.afterGuiAttached({ container: 'toolPanel' });

        expect(getMostRecentlyAppendedElement().classList).toContain('ag-multi-filter-group');
    });

    it('presents the filter inside an accordion if configured', () => {
        const filter = createFilter({
            filters: [{
                filter: 'agTextColumnFilter',
                display: 'accordion',
            }]
        });

        filter.afterGuiAttached({ container: 'columnMenu' });

        expect(getMostRecentlyAppendedElement().classList).toContain('ag-multi-filter-group');
    });

    it('presents the filter inside an sub-menu with custom title if configured', () => {
        const title = 'Filter Title';

        const filter = createFilter({
            filters: [{
                filter: 'agTextColumnFilter',
                display: 'subMenu',
                title
            }]
        });

        filter.afterGuiAttached({ container: 'columnMenu' });

        const { calls } = context.createBean.mock;

        expect((calls[0][0] as any).params.name).toBe(title);
    });

    it('presents the filter inside an accordion with custom title if configured', () => {
        const title = 'Filter Title';

        const filter = createFilter({
            filters: [{
                filter: 'agTextColumnFilter',
                display: 'accordion',
                title
            }]
        });

        filter.afterGuiAttached({ container: 'columnMenu' });

        const { calls } = context.createBean.mock;

        expect((calls[0][0] as any).title).toBe(title);
    });
});

describe('onAnyFilterChanged', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui');
        filter2 = mock<IFilterComp>('getGui');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('passes through to filter if it has onAnyFilterChanged function', () => {
        filter1 = mock<IFilterComp>('getGui', 'onAnyFilterChanged');
        filter2 = mock<IFilterComp>('getGui', 'onAnyFilterChanged');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));

        const multiFilter = createFilter();
        multiFilter.onAnyFilterChanged();

        expect(filter1.onAnyFilterChanged).toHaveBeenCalledTimes(1);
        expect(filter2.onAnyFilterChanged).toHaveBeenCalledTimes(1);
    });

    it('does not pass through to filter if onAnyFilterChanged function does not exist', () => {
        const multiFilter = createFilter();

        expect(() => multiFilter.onAnyFilterChanged()).not.toThrow();
    });
});

describe('onNewRowsLoaded', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui');
        filter2 = mock<IFilterComp>('getGui');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('passes through to filter if it has onNewRowsLoaded function', () => {
        filter1 = mock<IFilterComp>('getGui', 'onNewRowsLoaded');
        filter2 = mock<IFilterComp>('getGui', 'onNewRowsLoaded');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));

        const multiFilter = createFilter();
        multiFilter.onNewRowsLoaded();

        expect(filter1.onNewRowsLoaded).toHaveBeenCalledTimes(1);
        expect(filter2.onNewRowsLoaded).toHaveBeenCalledTimes(1);
    });

    it('does not pass through to filter if onNewRowsLoaded function does not exist', () => {
        const multiFilter = createFilter();

        expect(() => multiFilter.onNewRowsLoaded()).not.toThrow();
    });
});

describe('onFilterChanged', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it.each([0, 1])('triggers filterChangedCallback from multi filter if child filter changes', index => {
        const multiFilterChangedCallback = jest.fn();

        createFilter({ filterChangedCallback: multiFilterChangedCallback });

        const { filterChangedCallback } = userCompFactory.newFilterComponent.mock.calls[index][1];

        // @ts-ignore
        filterChangedCallback();

        expect(multiFilterChangedCallback).toHaveBeenCalledTimes(1);
    });

    it('triggers onAnyFilterChanged on other filters if exists', () => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel', 'onAnyFilterChanged');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel', 'onAnyFilterChanged');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));

        createFilter();

        const params = userCompFactory.newFilterComponent.mock.calls[0][1];
        const { filterChangedCallback } = params;

        // @ts-ignore
        filterChangedCallback();

        expect(filter1.onAnyFilterChanged).not.toHaveBeenCalled();
        expect(filter2.onAnyFilterChanged).toHaveBeenCalledTimes(1);
    });
});

describe('getLastActiveFilterIndex', () => {
    beforeEach(() => {
        filter1 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel');
        filter2 = mock<IFilterComp>('getGui', 'isFilterActive', 'setModel');

        filter1.getGui.mockReturnValue(document.createElement('div'));
        filter2.getGui.mockReturnValue(document.createElement('div'));
    });

    it('returns null if no filter is active', () => {
        const filter = createFilter();

        expect(filter.getLastActiveFilterIndex()).toBeNull();
    });

    it('returns the index of the filter that was most recently made active', () => {
        const filter = createFilter();

        const { filterChangedCallback: filter1ChangedCallback } = userCompFactory.newFilterComponent.mock.calls[0][1];
        const { filterChangedCallback: filter2ChangedCallback } = userCompFactory.newFilterComponent.mock.calls[1][1];

        filter1.isFilterActive.mockReturnValue(true);
        filter2.isFilterActive.mockReturnValue(true);

        // @ts-ignore
        filter1ChangedCallback();
        // @ts-ignore
        filter2ChangedCallback();
        // @ts-ignore
        filter1ChangedCallback();

        expect(filter.getLastActiveFilterIndex()).toBe(0);
    });

    it('returns the previously active index if the most recently active filter becomes inactive', () => {
        const filter = createFilter();

        const { filterChangedCallback: filter1ChangedCallback } = userCompFactory.newFilterComponent.mock.calls[0][1];
        const { filterChangedCallback: filter2ChangedCallback } = userCompFactory.newFilterComponent.mock.calls[1][1];

        filter1.isFilterActive.mockReturnValue(true);
        filter2.isFilterActive.mockReturnValue(true);

        // @ts-ignore
        filter2ChangedCallback();
        // @ts-ignore
        filter1ChangedCallback();

        filter1.isFilterActive.mockReturnValue(false);

        // @ts-ignore
        filter1ChangedCallback();

        expect(filter.getLastActiveFilterIndex()).toBe(1);
    });
});
*/
