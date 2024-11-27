import type { InternalFramework, TransformTsFileExt } from '../types';
export declare const getBoilerPlateName: (internalFramework: InternalFramework) => string;
export declare const getTransformTsFileExt: (internalFramework: InternalFramework) => TransformTsFileExt;
export declare const getBoilerPlateFiles: (isDev: boolean, internalFramework: InternalFramework) => Promise<Record<string, string>>;
export declare const getFrameworkFromInternalFramework: (internalFramework: InternalFramework) => "angular" | "react" | "javascript" | "vue";
/**
 * Entry filename to execute code
 */
export declare const getEntryFileName: (internalFramework: InternalFramework) => "main.ts" | "index.jsx" | "index.tsx" | "main.js";
/**
 * Main filename showing code that is run
 */
export declare const getMainFileName: (internalFramework: InternalFramework) => "main.ts" | "app.component.ts" | "index.jsx" | "index.tsx" | "main.js";
export declare const getProvidedExampleFolder: ({ folderPath, internalFramework, }: {
    folderPath: string;
    internalFramework: InternalFramework;
}) => string;
export declare const getProvidedExampleFiles: ({ folderPath, internalFramework, }: {
    folderPath: string;
    internalFramework: InternalFramework;
}) => string[];
export declare const getFileList: ({ folderPath, fileList }: {
    folderPath: string;
    fileList: string[];
}) => Promise<Record<string, string>>;
export declare const getIsEnterprise: ({ entryFile }: {
    entryFile: string;
}) => boolean;
export declare const getIsLocale: ({ entryFile }: {
    entryFile: string;
}) => boolean;
