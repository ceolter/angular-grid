import type { BeanCollection } from '../../context/context';
import type { RowStyle } from '../../entities/gridOptions';
import type { RowContainerType } from '../../gridBodyComp/rowContainer/rowContainerCtrl';
import type { UserCompDetails } from '../../interfaces/iUserCompDetails';
import { _setAriaRole } from '../../utils/aria';
import { _addStylesToElement, _setDomChildOrder } from '../../utils/dom';
import { Component } from '../../widgets/component';
import { CellComp } from '../cell/cellComp';
import type { CellCtrl, CellCtrlInstanceId } from '../cell/cellCtrl';
import type { ICellRendererComp } from '../cellRenderers/iCellRenderer';
import type { IRowComp, RowCtrl } from './rowCtrl';

export class RowComp extends Component {
    private fullWidthCellRenderer: ICellRendererComp | null | undefined;

    private rowCtrl: RowCtrl;

    private domOrder: boolean;
    private cellComps: { [key: CellCtrlInstanceId]: CellComp | null } = {};

    constructor(ctrl: RowCtrl, beans: BeanCollection, containerType: RowContainerType) {
        super();

        this.beans = beans;
        this.rowCtrl = ctrl;

        const rowDiv = document.createElement('div');
        rowDiv.setAttribute('comp-id', `${this.getCompId()}`);
        rowDiv.setAttribute('style', this.getInitialStyle(containerType));
        this.setTemplateFromElement(rowDiv);

        const eGui = this.getGui();
        const style = eGui.style;
        this.domOrder = this.rowCtrl.getDomOrder();
        _setAriaRole(eGui, 'row');

        const compProxy: IRowComp = {
            setDomOrder: (domOrder) => (this.domOrder = domOrder),
            setCellCtrls: (cellCtrls) => this.setCellCtrls(cellCtrls),
            showFullWidth: (compDetails) => this.showFullWidth(compDetails),
            getFullWidthCellRenderer: () => this.fullWidthCellRenderer,
            addOrRemoveCssClass: (name, on) => this.addOrRemoveCssClass(name, on),
            setUserStyles: (styles: RowStyle | undefined) => _addStylesToElement(eGui, styles),
            setTop: (top) => (style.top = top),
            setTransform: (transform) => (style.transform = transform),
            setRowIndex: (rowIndex) => eGui.setAttribute('row-index', rowIndex),
            setRowId: (rowId: string) => eGui.setAttribute('row-id', rowId),
            setRowBusinessKey: (businessKey) => eGui.setAttribute('row-business-key', businessKey),
            refreshFullWidth: (getUpdatedParams) => this.fullWidthCellRenderer?.refresh?.(getUpdatedParams()) ?? false,
        };

        ctrl.setComp(compProxy, this.getGui(), containerType, undefined);
        this.addDestroyFunc(() => {
            ctrl.unsetComp(containerType);
        });
    }

    private getInitialStyle(containerType: RowContainerType): string {
        const transform = this.rowCtrl.getInitialTransform(containerType);
        return transform ? `transform: ${transform}` : `top: ${this.rowCtrl.getInitialRowTop(containerType)}`;
    }

    private showFullWidth(compDetails: UserCompDetails): void {
        const callback = (cellRenderer: ICellRendererComp) => {
            if (this.isAlive()) {
                const eGui = cellRenderer.getGui();
                this.getGui().appendChild(eGui);
                this.rowCtrl.setupDetailRowAutoHeight(eGui);
                this.setFullWidthRowComp(cellRenderer);
            } else {
                this.beans.context.destroyBean(cellRenderer);
            }
        };

        // if not in cache, create new one
        const res = compDetails.newAgStackInstance();

        res.then(callback);
    }

    private setCellCtrls(cellCtrls: CellCtrl[]): void {
        const cellsToRemove = Object.assign({}, this.cellComps);

        cellCtrls.forEach((cellCtrl) => {
            const key = cellCtrl.instanceId;
            const existingCellComp = this.cellComps[key];

            if (existingCellComp == null) {
                this.newCellComp(cellCtrl);
            } else {
                cellsToRemove[key] = null;
            }
        });

        const cellCompsToRemove = Object.values(cellsToRemove).filter((cellComp) => cellComp != null);

        this.destroyCells(cellCompsToRemove as CellComp[]);
        this.ensureDomOrder(cellCtrls);
    }

    private ensureDomOrder(cellCtrls: CellCtrl[]): void {
        if (!this.domOrder) {
            return;
        }

        const elementsInOrder: HTMLElement[] = [];
        cellCtrls.forEach((cellCtrl) => {
            const cellComp = this.cellComps[cellCtrl.instanceId];
            if (cellComp) {
                elementsInOrder.push(cellComp.getGui());
            }
        });

        _setDomChildOrder(this.getGui(), elementsInOrder);
    }

    private newCellComp(cellCtrl: CellCtrl): void {
        const cellComp = new CellComp(
            this.beans,
            cellCtrl,
            this.rowCtrl.printLayout,
            this.getGui(),
            this.rowCtrl.editing
        );
        this.cellComps[cellCtrl.instanceId] = cellComp;
        this.getGui().appendChild(cellComp.getGui());
    }

    public override destroy(): void {
        super.destroy();
        this.destroyAllCells();
    }

    private destroyAllCells(): void {
        const cellsToDestroy = Object.values(this.cellComps).filter((cp) => cp != null);
        this.destroyCells(cellsToDestroy as CellComp[]);
    }

    private setFullWidthRowComp(fullWidthRowComponent: ICellRendererComp): void {
        this.fullWidthCellRenderer = fullWidthRowComponent;
        this.addDestroyFunc(() => {
            this.fullWidthCellRenderer = this.beans.context.destroyBean(this.fullWidthCellRenderer);
        });
    }

    private destroyCells(cellComps: CellComp[]): void {
        cellComps.forEach((cellComp) => {
            // could be old reference, ie removed cell
            if (!cellComp) {
                return;
            }

            // check cellComp belongs in this container
            const instanceId = cellComp.cellCtrl.instanceId;
            if (this.cellComps[instanceId] !== cellComp) {
                return;
            }

            cellComp.detach();
            cellComp.destroy();
            this.cellComps[instanceId] = null;
        });
    }
}
