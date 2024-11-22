import type {
    ComponentType,
    IToolPanelComp,
    IToolPanelParams,
    ToolPanelDef,
    UserCompDetails,
    UserComponentFactory,
    WithoutGridCommon,
} from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import { AgHorizontalResize } from './agHorizontalResize';

function getToolPanelCompDetails(
    userCompFactory: UserComponentFactory,
    toolPanelDef: ToolPanelDef,
    params: WithoutGridCommon<IToolPanelParams>
): UserCompDetails<IToolPanelComp> | undefined {
    return userCompFactory.getCompDetails(toolPanelDef, ToolPanelComponent, undefined, params, true);
}

const ToolPanelComponent: ComponentType = {
    name: 'toolPanel',
    optionalMethods: ['refresh', 'getState'],
};

export class ToolPanelWrapper extends Component {
    private toolPanelCompInstance: IToolPanelComp | undefined;
    private toolPanelId: string;
    private resizeBar: AgHorizontalResize;
    private width: number | undefined;
    private params: IToolPanelParams;

    constructor() {
        super(/* html */ `<div class="ag-tool-panel-wrapper" role="tabpanel"/>`);
    }

    public postConstruct(): void {
        const eGui = this.getGui();
        const resizeBar = (this.resizeBar = this.createManagedBean(new AgHorizontalResize()));

        eGui.setAttribute('id', `ag-${this.getCompId()}`);

        resizeBar.elementToResize = eGui;
        this.appendChild(resizeBar);
    }

    public getToolPanelId(): string {
        return this.toolPanelId;
    }

    public setToolPanelDef(toolPanelDef: ToolPanelDef, params: WithoutGridCommon<IToolPanelParams>): boolean {
        const { id, minWidth, maxWidth, width } = toolPanelDef;

        this.toolPanelId = id;
        this.width = width;

        const compDetails = getToolPanelCompDetails(this.beans.userCompFactory, toolPanelDef, params);
        if (compDetails == null) {
            return false;
        }

        const componentPromise = compDetails.newAgStackInstance();
        this.params = compDetails.params;

        componentPromise.then(this.setToolPanelComponent.bind(this));

        const resizeBar = this.resizeBar;
        if (minWidth != null) {
            resizeBar.minWidth = minWidth;
        }

        if (maxWidth != null) {
            resizeBar.maxWidth = maxWidth;
        }

        return true;
    }

    private setToolPanelComponent(compInstance: IToolPanelComp): void {
        this.toolPanelCompInstance = compInstance;

        this.appendChild(compInstance.getGui());
        this.addDestroyFunc(() => {
            this.destroyBean(compInstance);
        });

        const width = this.width;
        if (width) {
            this.getGui().style.width = `${width}px`;
        }
    }

    public getToolPanelInstance(): IToolPanelComp | undefined {
        return this.toolPanelCompInstance;
    }

    public setResizerSizerSide(side: 'right' | 'left') {
        const isRtl = this.gos.get('enableRtl');
        const isLeft = side === 'left';
        const inverted = isRtl ? isLeft : !isLeft;

        this.resizeBar.inverted = inverted;
    }

    public refresh(): void {
        this.toolPanelCompInstance?.refresh(this.params);
    }
}
