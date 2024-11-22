import { BeanStub, _isCellSelectionEnabled } from 'ag-grid-community';

export class DragListenerFeature extends BeanStub {
    constructor(private readonly eContainer: HTMLElement) {
        super();
    }

    public postConstruct(): void {
        const { beans, gos, eContainer } = this;
        const rangeSvc = beans.rangeSvc!;
        const params = {
            eElement: eContainer,
            onDragStart: rangeSvc.onDragStart.bind(rangeSvc),
            onDragStop: rangeSvc.onDragStop.bind(rangeSvc),
            onDragging: rangeSvc.onDragging.bind(rangeSvc),
        };

        const dragSvc = beans.dragSvc!;
        const enableFeature = dragSvc.addDragSource.bind(dragSvc, params);
        const disableFeature = dragSvc.removeDragSource.bind(dragSvc, params);

        this.addManagedPropertyListeners(['enableRangeSelection', 'cellSelection'], () => {
            if (_isCellSelectionEnabled(gos)) {
                enableFeature();
            } else {
                disableFeature();
            }
        });

        this.addDestroyFunc(disableFeature);

        if (_isCellSelectionEnabled(gos)) {
            enableFeature();
        }
    }
}
