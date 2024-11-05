import { _setAriaRowIndex } from '../../utils/aria';
import { _setDomChildOrder } from '../../utils/dom';
import { Component } from '../../widgets/component';
import type { AbstractHeaderCellComp } from '../cells/abstractCell/abstractHeaderCellComp';
import type { AbstractHeaderCellCtrl, HeaderCellCtrlInstanceId } from '../cells/abstractCell/abstractHeaderCellCtrl';
import { HeaderCellComp } from '../cells/column/headerCellComp';
import type { HeaderCellCtrl } from '../cells/column/headerCellCtrl';
import { HeaderGroupCellComp } from '../cells/columnGroup/headerGroupCellComp';
import type { HeaderGroupCellCtrl } from '../cells/columnGroup/headerGroupCellCtrl';
import { HeaderFilterCellComp } from '../cells/floatingFilter/headerFilterCellComp';
import type { HeaderFilterCellCtrl } from '../cells/floatingFilter/headerFilterCellCtrl';
import type { HeaderRowCtrl, IHeaderRowComp } from './headerRowCtrl';

export type HeaderRowType = 'group' | 'column' | 'filter';

export class HeaderRowComp extends Component {
    private ctrl: HeaderRowCtrl;

    private headerComps: { [key: HeaderCellCtrlInstanceId]: AbstractHeaderCellComp<AbstractHeaderCellCtrl> } = {};

    constructor(ctrl: HeaderRowCtrl) {
        super();

        this.ctrl = ctrl;
        this.setTemplate(/* html */ `<div class="${this.ctrl.headerRowClass}" role="row"></div>`);
    }

    public postConstruct(): void {
        _setAriaRowIndex(this.getGui(), this.ctrl.getAriaRowIndex());

        const compProxy: IHeaderRowComp = {
            setHeight: (height) => (this.getGui().style.height = height),
            setTop: (top) => (this.getGui().style.top = top),
            setHeaderCtrls: (ctrls, forceOrder) => this.setHeaderCtrls(ctrls, forceOrder),
            setWidth: (width) => (this.getGui().style.width = width),
        };

        this.ctrl.setComp(compProxy, undefined);
    }

    public override destroy(): void {
        this.setHeaderCtrls([], false);
        super.destroy();
    }

    private setHeaderCtrls(ctrls: AbstractHeaderCellCtrl[], forceOrder: boolean): void {
        if (!this.isAlive()) {
            return;
        }

        const oldComps = this.headerComps;
        this.headerComps = {};

        ctrls.forEach((ctrl) => {
            const id = ctrl.instanceId;
            let comp = oldComps[id];
            delete oldComps[id];

            if (comp == null) {
                comp = this.createHeaderComp(ctrl);
                this.getGui().appendChild(comp.getGui());
            }

            this.headerComps[id] = comp;
        });

        Object.values(oldComps).forEach((comp: AbstractHeaderCellComp<AbstractHeaderCellCtrl>) => {
            this.getGui().removeChild(comp.getGui());
            this.destroyBean(comp);
        });

        if (forceOrder) {
            const comps = Object.values(this.headerComps);
            // ordering the columns by left position orders them in the order they appear on the screen
            comps.sort(
                (
                    a: AbstractHeaderCellComp<AbstractHeaderCellCtrl>,
                    b: AbstractHeaderCellComp<AbstractHeaderCellCtrl>
                ) => {
                    const leftA = a.getCtrl().column.getLeft()!;
                    const leftB = b.getCtrl().column.getLeft()!;
                    return leftA - leftB;
                }
            );
            const elementsInOrder = comps.map((c) => c.getGui());
            _setDomChildOrder(this.getGui(), elementsInOrder);
        }
    }

    private createHeaderComp(headerCtrl: AbstractHeaderCellCtrl): AbstractHeaderCellComp<AbstractHeaderCellCtrl> {
        let result: AbstractHeaderCellComp<AbstractHeaderCellCtrl>;

        switch (this.ctrl.type) {
            case 'group':
                result = new HeaderGroupCellComp(headerCtrl as HeaderGroupCellCtrl);
                break;
            case 'filter':
                result = new HeaderFilterCellComp(headerCtrl as HeaderFilterCellCtrl);
                break;
            default:
                result = new HeaderCellComp(headerCtrl as HeaderCellCtrl);
                break;
        }

        this.createBean(result);
        result.setParentComponent(this);

        return result;
    }
}
