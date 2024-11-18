/*
 * Used for umd bundles without styles
 */
import { AllCommunityModule, ModuleRegistry } from './main';

ModuleRegistry.registerModules([AllCommunityModule]);

export * from './main';
