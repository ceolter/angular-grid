import type { InternalFramework, TransformTsFileExt } from '../types';
export declare const getOtherScriptFiles: ({ folderPath, sourceFileList, transformTsFileExt, internalFramework, }: {
    folderPath: string;
    sourceFileList: string[];
    transformTsFileExt?: TransformTsFileExt;
    internalFramework: InternalFramework;
}) => Promise<{}[]>;
