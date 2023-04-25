// Type definitions for @ag-grid-community/core v29.3.3
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { BeanStub } from "../../context/beanStub";
export declare class SetHeightFeature extends BeanStub {
    private maxDivHeightScaler;
    private eContainer;
    private eWrapper;
    constructor(eContainer: HTMLElement, eWrapper?: HTMLElement);
    private postConstruct;
    private onHeightChanged;
}
