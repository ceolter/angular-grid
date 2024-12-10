import type { IDoesFilterPassParams, IFilterComp, IFilterParams } from 'ag-grid-community';

export class PartialMatchFilter implements IFilterComp {
    filterParams!: IFilterParams;
    gui!: HTMLDivElement;
    filterText: string = '';
    eFilterText!: HTMLInputElement;

    init(params: IFilterParams): void {
        this.filterParams = params;
        this.gui = document.createElement('div');
        this.gui.style.borderRadius = '5px';
        this.gui.style.width = '200px';
        this.gui.style.height = '50px';
        this.gui.style.padding = '10px';
        this.gui.innerHTML = `Partial Match Filter: <input id="filterText" type="text" style="height: 20px" />`;
        this.eFilterText = this.gui.querySelector('#filterText')!;
        const listener = (event: any) => {
            this.filterText = event.target.value;
            params.filterChangedCallback();
        };
        this.eFilterText.addEventListener('changed', listener);
        this.eFilterText.addEventListener('paste', listener);
        this.eFilterText.addEventListener('input', listener);
    }

    isFilterActive(): boolean {
        return this.filterText != null && this.filterText !== '';
    }

    doesFilterPass(params: IDoesFilterPassParams): boolean {
        const { node } = params;
        const value = this.filterParams.getValue(node).toString().toLowerCase();

        return this.filterText
            .toLowerCase()
            .split(' ')
            .every((filterWord) => value.indexOf(filterWord) >= 0);
    }

    getModel() {
        if (!this.isFilterActive()) {
            return null;
        }

        return { value: this.filterText };
    }

    setModel(model: any): void {
        this.eFilterText.value = model == null ? '' : model.value;
    }

    getGui(): HTMLElement {
        return this.gui;
    }

    afterGuiAttached() {
        this.eFilterText.focus();
    }

    componentMethod(message: string): void {
        alert(`Alert from PartialMatchFilterComponent: ${message}`);
    }
}
