import type { GridOptionsType, ParsedBindings } from '../types';
export declare const templatePlaceholder = "GRID_TEMPLATE_PLACEHOLDER";
export declare function parser(examplePath: any, srcFile: any, html: any, providedExamples: any, gridOptionsTypes: Record<string, GridOptionsType>): {
    bindings: ParsedBindings;
    typedBindings: ParsedBindings;
};
export default parser;
