export type TransformTsFileExt = undefined | '.js' | '.tsx' | '.jsx';
export interface ExampleSettings {
    enterprise?: boolean;
}
export type FileContents = Record<string, string>;
/** Matches the JSON file exampleConfig.json and the schema defined in .vscode/settings.json */
export interface ExampleConfig {
    extras?: string[];
    noStyle?: boolean;
    licenseKey?: boolean;
    supportedFrameworks?: InternalFramework[];
    /**
     * Example uses `#myGrid`, which needs to be generated in framework examples
     */
    myGridReference?: boolean;
}
export interface BindingImport {
    isNamespaced: boolean;
    module: string;
    namedImport?: string;
    imports: string[];
}
export interface InlineGridStyles {
    width: string;
    height: string;
    className?: string;
}
export interface EventHandler {
    name: string;
    handlerName: string;
    handler: string;
}
export interface ExternalEventHandlers {
    name: string;
    params: string[];
    body: string;
}
export interface DataCallback {
    url: string;
    callback: string;
}
export interface Property {
    name: string;
    value: string;
    typings: GridOptionsType;
}
export interface Component {
    name: string;
    value: string;
}
export interface GridOptionsType {
    typeName: string;
    typesToInclude: string[];
}
export interface ParsedBindings {
    eventHandlers: EventHandler[];
    properties: Property[];
    components: Component[];
    vuePropertyBindings: Record<string, any>;
    defaultColDef: string;
    autoGroupColumnDef: string;
    onGridReady: string;
    globalComponents: string[];
    parsedColDefs: string;
    instanceMethods: string[];
    externalEventHandlers: ExternalEventHandlers[];
    utils: string[];
    declarations: string[];
    callbackDependencies: Record<string, any>;
    template: string;
    imports: BindingImport[];
    typeDeclares: string[];
    classes: string[];
    interfaces: string[];
    exampleName: string;
    moduleRegistration: string | undefined;
    inlineGridStyles: InlineGridStyles;
    data: DataCallback;
    tData: string;
}
export interface GeneratedContents extends ExampleConfig {
    isEnterprise: boolean;
    isIntegratedCharts: boolean;
    entryFileName: string;
    mainFileName: string;
    files: FileContents;
    scriptFiles: string[];
    styleFiles: string[];
    boilerPlateFiles: FileContents;
    packageJson: Record<string, any>;
}
export type InternalFramework = 'vanilla' | 'typescript' | 'reactFunctional' | 'reactFunctionalTs' | 'angular' | 'vue3';
export declare const FRAMEWORKS: InternalFramework[];
export declare const TYPESCRIPT_INTERNAL_FRAMEWORKS: InternalFramework[];
