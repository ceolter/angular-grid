// ag-grid-react v29.3.3
import { VanillaFrameworkOverrides } from "ag-grid-community";
export declare class ReactFrameworkOverrides extends VanillaFrameworkOverrides {
    private frameworkComponents;
    frameworkComponent(name: string): any;
    isFrameworkComponent(comp: any): boolean;
}
