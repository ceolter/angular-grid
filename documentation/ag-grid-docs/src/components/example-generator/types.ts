export type TransformTsFileExt = undefined | '.js' | '.tsx';

export interface ExampleSettings {
    enterprise?: boolean;
}

export type FileContents = Record<string, string>;

export interface GeneratedContents {
    files: FileContents;
    entryFileName: string;
    mainFileName: string;
    scriptFiles: string[];
    styleFiles: string[];
    isEnterprise: boolean;
    isLocale: boolean;
    boilerPlateFiles: FileContents;
    packageJson: Record<string, string>;
    extras?: string[];
    supportedFrameworks?: InternalFramework[];
}

export type InternalFramework = 'vanilla' | 'typescript' | 'reactFunctional' | 'reactFunctionalTs' | 'angular' | 'vue3';

export const TYPESCRIPT_INTERNAL_FRAMEWORKS: InternalFramework[] = ['typescript', 'reactFunctionalTs', 'angular'];
