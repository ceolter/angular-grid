import type { InternalFramework, ParsedBindings } from '../types';
import type { ExampleConfig, FileContents } from '../types';
interface FrameworkFiles {
    files: FileContents;
    hasProvidedExamples?: boolean;
    scriptFiles?: string[];
}
type ConfigGenerator = ({ entryFile, indexHtml, isEnterprise, bindings, typedBindings, componentScriptFiles, otherScriptFiles, styleFiles, ignoreDarkMode, isDev, exampleConfig, }: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: ParsedBindings;
    typedBindings: ParsedBindings;
    componentScriptFiles: FileContents;
    otherScriptFiles: FileContents;
    styleFiles: FileContents;
    ignoreDarkMode?: boolean;
    isDev: boolean;
    exampleConfig: ExampleConfig;
}) => Promise<FrameworkFiles>;
export declare const frameworkFilesGenerator: Partial<Record<InternalFramework, ConfigGenerator>>;
export {};
