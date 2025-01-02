import type { ProvidedFilterModel } from '../../interfaces/iFilter';
import type { IRowModel, RowModelType } from '../../interfaces/iRowModel';
import type { PositionableFeature } from '../../rendering/features/positionableFeature';
import { mock } from '../../test-utils/mock';
import type { AgPromise } from '../../utils/promise';
import type { ComponentSelector } from '../../widgets/component';
import type { ProvidedFilterParams } from './iProvidedFilter';
import { ProvidedFilter } from './providedFilter';

class TestFilter extends ProvidedFilter<ProvidedFilterModel, string> {
    private uiModel: ProvidedFilterModel;
    private modelHasChanged = false;

    constructor(params: ProvidedFilterParams, rowModelType: RowModelType = 'clientSide') {
        super('textFilter');

        this.beans = {} as any;

        const eGui = mock<HTMLElement>('appendChild');
        this.setGui(eGui);

        const rowModel = mock<IRowModel>('getType');
        rowModel.getType.mockReturnValue(rowModelType);
        (this as any).rowModel = rowModel;

        (this as any).positionableFeature = mock<PositionableFeature>(
            'restoreLastSize',
            'setResizable',
            'removeSizeFromEl',
            'constrainSizeToAvailableHeight'
        );

        this.setParams(params);
    }

    public doesFilterPass(): boolean {
        throw new Error('Method not implemented.');
    }

    protected updateUiVisibility(): void {
        throw new Error('Method not implemented.');
    }

    protected createBodyTemplate(): string {
        throw new Error('Method not implemented.');
    }
    protected getAgComponents(): ComponentSelector[] {
        throw new Error('Method not implemented.');
    }

    protected getCssIdentifier(): string {
        throw new Error('Method not implemented.');
    }

    protected resetUiToDefaults(): AgPromise<void> {
        throw new Error('Method not implemented.');
    }

    protected setModelIntoUi(): AgPromise<void> {
        throw new Error('Method not implemented.');
    }

    protected areModelsEqual(): boolean {
        return !this.modelHasChanged;
    }

    public readonly filterType = 'text';

    public getModelFromUi(): ProvidedFilterModel {
        return this.uiModel;
    }

    public setModelHasChanged(hasChanged: boolean): void {
        this.modelHasChanged = hasChanged;
    }

    public apply(afterFloatingFilter = false, afterDataChange = false): void {
        this.onBtApply(afterFloatingFilter, afterDataChange);
    }
}

describe('filterChangedCallback', () => {
    it('calls filterChangedCallback when filter has changed', () => {
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        const filter = new TestFilter(params);

        filter.setModelHasChanged(true);
        filter.apply();

        expect(params.filterChangedCallback).toHaveBeenCalledTimes(1);
    });

    it('does not call filterChangedCallback when filter has not changed', () => {
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        const filter = new TestFilter(params);

        filter.apply();

        expect(params.filterChangedCallback).not.toHaveBeenCalled();
    });
});

describe('closeOnApply', () => {
    it('closes popup if closeOnApply is true and apply button is present', () => {
        const hidePopup = jest.fn();
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        params.buttons = ['apply'];
        params.closeOnApply = true;
        const filter = new TestFilter(params);

        filter.afterGuiAttached({ container: 'columnMenu', hidePopup });
        filter.setModelHasChanged(true);
        filter.apply();

        expect(hidePopup).toHaveBeenCalledTimes(1);
    });

    it('closes popup if closeOnApply is true even if model did not change', () => {
        const hidePopup = jest.fn();
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        params.buttons = ['apply'];
        params.closeOnApply = true;

        const filter = new TestFilter(params);

        filter.afterGuiAttached({ container: 'columnMenu', hidePopup });
        filter.apply();

        expect(hidePopup).toHaveBeenCalledTimes(1);
    });

    it('does not close popup if apply button is not present', () => {
        const hidePopup = jest.fn();
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        params.closeOnApply = true;
        const filter = new TestFilter(params);

        filter.afterGuiAttached({ container: 'columnMenu', hidePopup });
        filter.setModelHasChanged(true);
        filter.apply();

        expect(hidePopup).toHaveBeenCalledTimes(0);
    });

    it('does not close popup if from change came from floating filter', () => {
        const hidePopup = jest.fn();
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        params.buttons = ['apply'];
        params.closeOnApply = true;
        const filter = new TestFilter(params);

        filter.afterGuiAttached({ container: 'columnMenu', hidePopup });
        filter.setModelHasChanged(true);
        filter.apply(true);

        expect(hidePopup).toHaveBeenCalledTimes(0);
    });

    it('does not close popup if from change came from data', () => {
        const hidePopup = jest.fn();
        const params = mock<ProvidedFilterParams>('filterChangedCallback');
        params.buttons = ['apply'];
        params.closeOnApply = true;
        const filter = new TestFilter(params);

        filter.afterGuiAttached({ container: 'columnMenu', hidePopup });
        filter.setModelHasChanged(true);
        filter.apply(false, true);

        expect(hidePopup).toHaveBeenCalledTimes(0);
    });

    it.each([undefined, false])('does not close popup if closeOnApply is %s', (value) => {
        const hidePopup = jest.fn();
        const params = mock<ProvidedFilterParams>('filterChangedCallback');

        // mocking library does not set property correctly for falsy values, so we have to do this instead
        Object.defineProperty(params, 'closeOnApply', { get: () => value, set: () => {} });

        const filter = new TestFilter(params);

        filter.afterGuiAttached({ container: 'columnMenu', hidePopup });
        filter.setModelHasChanged(true);
        filter.apply();

        expect(hidePopup).not.toHaveBeenCalled();
    });
});
