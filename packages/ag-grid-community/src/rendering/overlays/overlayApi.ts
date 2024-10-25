import type { BeanCollection } from '../../context/context';

export function showLoadingOverlay(beans: BeanCollection): void {
    beans.overlays?.showLoadingOverlay();
}

export function showNoRowsOverlay(beans: BeanCollection): void {
    beans.overlays?.showNoRowsOverlay();
}

export function hideOverlay(beans: BeanCollection): void {
    beans.overlays?.hideOverlay();
}
