import { RowComp } from '../../rendering/row/rowComp';
import type { RowCtrl, RowCtrlInstanceId } from '../../rendering/row/rowCtrl';
import { _setAriaRole } from '../../utils/aria';
import { _ensureDomOrder, _insertWithDomOrder } from '../../utils/dom';
import type { ComponentSelector } from '../../widgets/component';
import { Component, RefPlaceholder } from '../../widgets/component';
import type { IRowContainerComp, RowContainerName, RowContainerOptions } from './rowContainerCtrl';
import { RowContainerCtrl, _getRowContainerOptions } from './rowContainerCtrl';

function templateFactory(options: RowContainerOptions): string {
    let res: string;
    if (options.type === 'center') {
        res =
            /* html */
            `<div class="${options.viewport}" data-ref="eViewport" role="presentation">
                <div class="${options.container}" data-ref="eContainer"></div>
            </div>`;
    } else {
        res = /* html */ `<div class="${options.container}" data-ref="eContainer"></div>`;
    }

    return res;
}

export class RowContainerComp extends Component {
    private readonly eViewport: HTMLElement = RefPlaceholder;
    private readonly eContainer: HTMLElement = RefPlaceholder;

    private readonly name: RowContainerName;
    private readonly options: RowContainerOptions;

    private rowComps: { [id: RowCtrlInstanceId]: RowComp } = {};

    // we ensure the rows are in the dom in the order in which they appear on screen when the
    // user requests this via gridOptions.ensureDomOrder. this is typically used for screen readers.
    private domOrder: boolean;
    private lastPlacedElement: HTMLElement | null;

    constructor(params?: { name: string }) {
        super();
        this.name = params?.name as RowContainerName;
        this.options = _getRowContainerOptions(this.name);
        this.setTemplate(templateFactory(this.options));
    }

    public postConstruct(): void {
        const compProxy: IRowContainerComp = {
            setHorizontalScroll: (offset: number) => (this.eViewport.scrollLeft = offset),
            setViewportHeight: (height) => (this.eViewport.style.height = height),
            setRowCtrls: ({ rowCtrls }) => this.setRowCtrls(rowCtrls),
            setDomOrder: (domOrder) => {
                this.domOrder = domOrder;
            },
            setContainerWidth: (width) => (this.eContainer.style.width = width),
            setOffsetTop: (offset) => (this.eContainer.style.transform = `translateY(${offset})`),
        };

        const ctrl = this.createManagedBean(new RowContainerCtrl(this.name));
        ctrl.setComp(compProxy, this.eContainer, this.eViewport);
    }

    public override destroy(): void {
        // destroys all row comps
        this.setRowCtrls([]);
        super.destroy();
    }

    private setRowCtrls(rowCtrls: RowCtrl[]): void {
        const oldRows = { ...this.rowComps };
        this.rowComps = {};

        this.lastPlacedElement = null;

        const processRow = (rowCon: RowCtrl) => {
            const instanceId = rowCon.instanceId;
            const existingRowComp = oldRows[instanceId];

            if (existingRowComp) {
                this.rowComps[instanceId] = existingRowComp;
                delete oldRows[instanceId];
                this.ensureDomOrder(existingRowComp.getGui());
            } else {
                // don't create new row comps for rows which are not displayed. still want the existing components
                // as they may be animating out.
                if (!rowCon.rowNode.displayed) {
                    return;
                }
                const rowComp = new RowComp(rowCon, this.beans, this.options.type);
                this.rowComps[instanceId] = rowComp;
                this.appendRow(rowComp.getGui());
            }
        };

        rowCtrls.forEach(processRow);
        Object.values(oldRows).forEach((oldRowComp) => {
            this.eContainer.removeChild(oldRowComp.getGui());
            oldRowComp.destroy();
        });

        _setAriaRole(this.eContainer, 'rowgroup');
    }

    public appendRow(element: HTMLElement) {
        if (this.domOrder) {
            _insertWithDomOrder(this.eContainer, element, this.lastPlacedElement);
        } else {
            this.eContainer.appendChild(element);
        }
        this.lastPlacedElement = element;
    }

    private ensureDomOrder(eRow: HTMLElement): void {
        if (this.domOrder) {
            _ensureDomOrder(this.eContainer, eRow, this.lastPlacedElement);
            this.lastPlacedElement = eRow;
        }
    }
}

export const RowContainerSelector: ComponentSelector = {
    selector: 'AG-ROW-CONTAINER',
    component: RowContainerComp,
};
