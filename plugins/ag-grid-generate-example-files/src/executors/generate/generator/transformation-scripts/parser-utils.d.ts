import ts from 'typescript';
import type { BindingImport, ExampleConfig, InternalFramework, ParsedBindings } from '../types';
export declare function readAsJsFile(srcFile: any, internalFramework: InternalFramework): string;
export declare function parseFile(src: any): ts.SourceFile;
export declare function tsGenerate(node: any, srcFile: any): string;
export declare function removeFunctionKeyword(code: string): string;
export declare function getFunctionName(code: string): string;
export declare const convertFunctionToProperty: (code: string) => string;
export declare const convertFunctionToConstProperty: (code: string) => string;
export declare const convertFunctionToConstPropertyTs: (code: string) => string;
export declare function isInstanceMethod(methods: string[], property: any): boolean;
export declare const enum NodeType {
    Variable = "VariableDeclaration",
    Function = "FunctionDeclaration",
    Expression = "ExpressionStatement"
}
export declare function tsCollect(tsTree: any, tsBindings: ParsedBindings, collectors: any, recurse?: boolean): ParsedBindings;
export declare function tsNodeIsGlobalVarWithName(node: any, name: string): boolean;
export declare function tsNodeIsPropertyWithName(node: ts.Node, name: string): boolean;
export declare function tsNodeIsTopLevelVariable(node: ts.Node, registered?: string[]): boolean;
export declare function tsNodeIsFunctionWithName(node: ts.Node, name: string): boolean;
export declare function tsNodeIsUnusedFunction(node: any, used: string[]): boolean;
export declare function tsNodeIsTypeDeclaration(node: any): boolean;
export declare function tsNodeIsFunctionCall(node: any): boolean;
export declare const recognizedDomEvents: string[];
export declare function extractEventHandlers(domTree: any, eventNames: string[]): any[];
export declare function extractImportStatements(srcFile: ts.SourceFile): BindingImport[];
export declare function addLicenseManager(imports: any[], exampleConfig: ExampleConfig): void;
export declare function addEnterprisePackage(imports: any[], bindings: ParsedBindings): void;
export declare function extractModuleRegistration(srcFile: ts.SourceFile): string;
export declare function extractTypeDeclarations(srcFile: ts.SourceFile): any[];
export declare function extractClassDeclarations(srcFile: ts.SourceFile): any[];
export declare function extractInterfaces(srcFile: ts.SourceFile): any[];
export declare function tsNodeIsTopLevelFunction(node: any): boolean;
/**
 * Find all the variables defined in this node tree recursively
 */
export declare function findAllVariables(node: any): any[];
/**
 * Find all the properties accessed in this node.
 */
export declare function findAllAccessedProperties(node: any): any[];
export declare function stripTypescriptSuffix(modulePackage: string): string;
export declare function getImport(filename: string): string;
export declare function getPropertyInterfaces(properties: any): any[];
/**
 *  Add the imports from the parsed file
 * We ignore any component files as those imports are generated for each framework.
 */
export declare function addBindingImports(bindingImports: any, imports: string[], ignoreTsImports: boolean): void;
/** Add imports such as "import { colors } from './colors.js';"
 * Does not include the imports for framework component
 */
export declare function addRelativeImports(bindings: ParsedBindings, imports: string[], extension: string): void;
export declare function removeModuleRegistration(code: string): string;
export declare function handleRowGenericInterface(fileTxt: string, tData: string): string;
export declare function addGenericInterfaceImport(imports: string[], tData: string, bindings: any): void;
export declare function replaceGridReadyRowData(callback: string, rowDataSetter: string): string;
export declare function preferParamsApi(code: string): string;
export declare function getInterfaceFileContents(tsBindings: ParsedBindings, currentFile: any): string;
export declare function findLocaleImport(bindingImports: any): any;
export declare const DARK_INTEGRATED_START = "/** DARK INTEGRATED START **/";
export declare const DARK_INTEGRATED_END = "/** DARK INTEGRATED END **/";
export declare function getIntegratedDarkModeCode(exampleName: string, typescript?: boolean, apiName?: string): string;
