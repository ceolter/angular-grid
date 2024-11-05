import type {
    GroupCellRendererParams,
    ICellRendererComp,
    IGroupCellRenderer,
    UserCompDetails,
} from 'ag-grid-community';
import { Component, RefPlaceholder, _setAriaRole, _setDisplayed } from 'ag-grid-community';

import { GroupCellRendererCtrl } from './groupCellRendererCtrl';

const groupTemplate =
    /* html */
    `<span class="ag-cell-wrapper">
        <span class="ag-group-expanded" data-ref="eExpanded"></span>
        <span class="ag-group-contracted" data-ref="eContracted"></span>
        <span class="ag-group-checkbox ag-invisible" data-ref="eCheckbox"></span>
        <span class="ag-group-value" data-ref="eValue"></span>
        <span class="ag-group-child-count" data-ref="eChildCount"></span>
    </span>`;

export class GroupCellRenderer extends Component implements ICellRendererComp {
    private readonly eExpanded: HTMLElement = RefPlaceholder;
    private readonly eContracted: HTMLElement = RefPlaceholder;
    private readonly eCheckbox: HTMLElement = RefPlaceholder;
    private readonly eValue: HTMLElement = RefPlaceholder;
    private readonly eChildCount: HTMLElement = RefPlaceholder;

    // this cell renderer
    private innerCellRenderer: ICellRendererComp;

    constructor() {
        super(groupTemplate);
    }

    public init(params: GroupCellRendererParams): void {
        const compProxy: IGroupCellRenderer = {
            setInnerRenderer: (compDetails, valueToDisplay) => this.setRenderDetails(compDetails, valueToDisplay),
            setChildCount: (count) => (this.eChildCount.textContent = count),
            addOrRemoveCssClass: (cssClass, value) => this.addOrRemoveCssClass(cssClass, value),
            setContractedDisplayed: (expanded) => _setDisplayed(this.eContracted, expanded),
            setExpandedDisplayed: (expanded) => _setDisplayed(this.eExpanded, expanded),
            setCheckboxVisible: (visible) => this.eCheckbox.classList.toggle('ag-invisible', !visible),
        };

        const ctrl = this.createManagedBean(new GroupCellRendererCtrl());
        const fullWidth = !params.colDef;
        const eGui = this.getGui();
        ctrl.init(compProxy, eGui, this.eCheckbox, this.eExpanded, this.eContracted, this.constructor, params);

        if (fullWidth) {
            _setAriaRole(eGui, ctrl.getCellAriaRole());
        }
    }

    private setRenderDetails(compDetails: UserCompDetails | undefined, valueToDisplay: any): void {
        if (compDetails) {
            const componentPromise = compDetails.newAgStackInstance();
            if (componentPromise == null) {
                return;
            }
            componentPromise.then((comp) => {
                if (!comp) {
                    return;
                }
                const destroyComp = () => this.destroyBean(comp);
                if (this.isAlive()) {
                    this.eValue.appendChild(comp.getGui());
                    this.addDestroyFunc(destroyComp);
                } else {
                    destroyComp();
                }
            });
        } else {
            this.eValue.innerText = valueToDisplay;
        }
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to have public here instead of private or protected
    public override destroy(): void {
        this.destroyBean(this.innerCellRenderer);
        super.destroy();
    }

    public refresh(): boolean {
        return false;
    }
}
