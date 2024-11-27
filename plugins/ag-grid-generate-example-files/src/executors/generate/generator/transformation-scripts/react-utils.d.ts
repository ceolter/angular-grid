export declare function convertTemplate(template: string): string;
export declare function convertFunctionalTemplate(template: string): string;
export declare const getImport: (filename: string) => string;
export declare const getValueType: (value: string) => string;
export declare const convertFunctionToConstCallback: (code: string, callbackDependencies: Record<string, any>) => string;
export declare const convertFunctionToConstCallbackTs: (code: string, callbackDependencies: Record<string, any>) => string;
export declare const EventAndCallbackNames: Set<string>;
