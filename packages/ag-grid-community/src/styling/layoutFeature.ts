import { BeanStub } from '../context/beanStub';

export interface LayoutView {
    updateLayoutClasses(layoutClass: string, params: UpdateLayoutClassesParams): void;
}

export const LayoutCssClasses = {
    AUTO_HEIGHT: 'ag-layout-auto-height',
    NORMAL: 'ag-layout-normal',
    PRINT: 'ag-layout-print',
} as const;

export interface UpdateLayoutClassesParams {
    autoHeight: boolean;
    normal: boolean;
    print: boolean;
}

export class LayoutFeature extends BeanStub {
    constructor(private view: LayoutView) {
        super();
    }

    public postConstruct(): void {
        this.addManagedPropertyListener('domLayout', this.updateLayoutClasses.bind(this));
        this.updateLayoutClasses();
    }

    private updateLayoutClasses(): void {
        const domLayout = this.gos.get('domLayout');
        const params = {
            autoHeight: domLayout === 'autoHeight',
            normal: domLayout === 'normal',
            print: domLayout === 'print',
        };
        const cssClass = params.autoHeight
            ? LayoutCssClasses.AUTO_HEIGHT
            : params.print
              ? LayoutCssClasses.PRINT
              : LayoutCssClasses.NORMAL;
        this.view.updateLayoutClasses(cssClass, params);
    }
}
