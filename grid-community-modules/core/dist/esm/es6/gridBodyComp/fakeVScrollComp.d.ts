// Type definitions for @ag-grid-community/core v29.3.3
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { AbstractFakeScrollComp } from "./abstractFakeScrollComp";
export declare class FakeVScrollComp extends AbstractFakeScrollComp {
    private static TEMPLATE;
    constructor();
    protected postConstruct(): void;
    protected setScrollVisible(): void;
}
