import type { InternalFramework } from '../types';
interface Params {
    isLocale: boolean;
    internalFramework: InternalFramework;
}
export declare function getPackageJson({ isLocale, internalFramework }: Params): {
    name: string;
    dependencies: {};
};
export {};
