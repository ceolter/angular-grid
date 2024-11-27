import type { ParsedBindings } from '../types';
export declare function getImport(filename: string): string;
export declare function vanillaToTypescript(bindings: ParsedBindings, mainFilePath: string, tsFile: string): () => string;
