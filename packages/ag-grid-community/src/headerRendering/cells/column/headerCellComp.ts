import type { UserCompDetails } from '../../../interfaces/iUserCompDetails';
import { _removeAriaSort, _setAriaSort } from '../../../utils/aria';
import { RefPlaceholder } from '../../../widgets/component';
import { AbstractHeaderCellComp } from '../abstractCell/abstractHeaderCellComp';
import type { HeaderCellCtrl, IHeaderCellComp } from './headerCellCtrl';
import type { IHeaderComp } from './headerComp';

export class HeaderCellComp extends AbstractHeaderCellComp<HeaderCellCtrl> {
    private readonly eResize: HTMLElement = RefPlaceholder;
    private readonly eHeaderCompWrapper: HTMLElement = RefPlaceholder;

    private headerComp: IHeaderComp | undefined;
    private headerCompGui: HTMLElement | undefined;
    private headerCompVersion = 0;

    constructor(ctrl: HeaderCellCtrl) {
        super(
            /* html */ `<div class="ag-header-cell" role="columnheader">
            <div data-ref="eResize" class="ag-header-cell-resize" role="presentation"></div>
            <div data-ref="eHeaderCompWrapper" class="ag-header-cell-comp-wrapper" role="presentation"></div>
        </div>`,
            ctrl
        );
    }

    public postConstruct(): void {
        const eGui = this.getGui();

        const setAttribute = (name: string, value: string | null | undefined) => {
            if (value != null && value != '') {
                eGui.setAttribute(name, value);
            } else {
                eGui.removeAttribute(name);
            }
        };

        setAttribute('col-id', this.ctrl.column.getColId());

        const compProxy: IHeaderCellComp = {
            setWidth: (width) => (eGui.style.width = width),
            addOrRemoveCssClass: (cssClassName, on) => this.addOrRemoveCssClass(cssClassName, on),
            setAriaSort: (sort) => (sort ? _setAriaSort(eGui, sort) : _removeAriaSort(eGui)),
            setUserCompDetails: (compDetails) => this.setUserCompDetails(compDetails),
            getUserCompInstance: () => this.headerComp,
        };

        this.ctrl.setComp(compProxy, this.getGui(), this.eResize, this.eHeaderCompWrapper, undefined);

        const selectAllGui = this.ctrl.getSelectAllGui();
        if (selectAllGui) {
            this.eResize.insertAdjacentElement('afterend', selectAllGui);
        }
    }

    public override destroy(): void {
        this.destroyHeaderComp();
        super.destroy();
    }

    private destroyHeaderComp(): void {
        if (this.headerComp) {
            this.eHeaderCompWrapper.removeChild(this.headerCompGui!);
            this.headerComp = this.destroyBean(this.headerComp);
            this.headerCompGui = undefined;
        }
    }

    private setUserCompDetails(compDetails: UserCompDetails): void {
        this.headerCompVersion++;

        const versionCopy = this.headerCompVersion;

        compDetails.newAgStackInstance()!.then((comp) => this.afterCompCreated(versionCopy, comp));
    }

    private afterCompCreated(version: number, headerComp: IHeaderComp): void {
        if (version != this.headerCompVersion || !this.isAlive()) {
            this.destroyBean(headerComp);
            return;
        }

        this.destroyHeaderComp();

        this.headerComp = headerComp;
        this.headerCompGui = headerComp.getGui();
        this.eHeaderCompWrapper.appendChild(this.headerCompGui);
        this.ctrl.setDragSource(this.getGui()!);
    }
}
