import type {
    BeanCollection,
    ComponentSelector,
    ComponentType,
    IStatusPanelComp,
    IStatusPanelParams,
    StatusPanelDef,
    UserCompDetails,
    UserComponentFactory,
    WithoutGridCommon,
} from 'ag-grid-community';
import { AgPromise, Component, RefPlaceholder, _removeFromParent } from 'ag-grid-community';

import { agStatusBarCSS } from './agStatusBar.css-GENERATED';
import type { StatusBarService } from './statusBarService';

function getStatusPanelCompDetails(
    userCompFactory: UserComponentFactory,
    def: StatusPanelDef,
    params: WithoutGridCommon<IStatusPanelParams>
): UserCompDetails {
    return userCompFactory.getCompDetails(def, StatusPanelComponent, null, params, true)!;
}

const StatusPanelComponent: ComponentType = {
    name: 'statusPanel',
    optionalMethods: ['refresh'],
};

export class AgStatusBar extends Component {
    private userCompFactory: UserComponentFactory;
    private statusBarService: StatusBarService;
    private updateQueued: boolean = false;
    private panelsPromise: AgPromise<(void | null)[]> = AgPromise.resolve();

    public wireBeans(beans: BeanCollection) {
        this.userCompFactory = beans.userCompFactory;
        this.statusBarService = beans.statusBarService as StatusBarService;
    }

    private readonly eStatusBarLeft: HTMLElement = RefPlaceholder;
    private readonly eStatusBarCenter: HTMLElement = RefPlaceholder;
    private readonly eStatusBarRight: HTMLElement = RefPlaceholder;

    private compDestroyFunctions: { [key: string]: () => void } = {};

    constructor() {
        super(/* html */ `<div class="ag-status-bar">
            <div data-ref="eStatusBarLeft" class="ag-status-bar-left" role="status"></div>
            <div data-ref="eStatusBarCenter" class="ag-status-bar-center" role="status"></div>
            <div data-ref="eStatusBarRight" class="ag-status-bar-right" role="status"></div>
        </div>`);
        this.registerCSS(agStatusBarCSS);
    }

    public postConstruct(): void {
        this.processStatusPanels(new Map());
        this.addManagedPropertyListeners(['statusBar'], this.handleStatusBarChanged.bind(this));
    }

    private processStatusPanels(existingStatusPanelsToReuse: Map<string, IStatusPanelComp>): void {
        const statusPanels = this.gos.get('statusBar')?.statusPanels;
        if (statusPanels) {
            const leftStatusPanelComponents = statusPanels.filter(
                (componentConfig) => componentConfig.align === 'left'
            );
            const centerStatusPanelComponents = statusPanels.filter(
                (componentConfig) => componentConfig.align === 'center'
            );
            const rightStatusPanelComponents = statusPanels.filter(
                (componentConfig) => !componentConfig.align || componentConfig.align === 'right'
            );
            this.panelsPromise = AgPromise.all([
                this.createAndRenderComponents(
                    leftStatusPanelComponents,
                    this.eStatusBarLeft,
                    existingStatusPanelsToReuse
                ),
                this.createAndRenderComponents(
                    centerStatusPanelComponents,
                    this.eStatusBarCenter,
                    existingStatusPanelsToReuse
                ),
                this.createAndRenderComponents(
                    rightStatusPanelComponents,
                    this.eStatusBarRight,
                    existingStatusPanelsToReuse
                ),
            ]);
        } else {
            this.setDisplayed(false);
        }
    }

    private handleStatusBarChanged(): void {
        if (this.updateQueued) {
            return;
        }
        this.updateQueued = true;
        this.panelsPromise.then(() => {
            this.updateStatusBar();
            this.updateQueued = false;
        });
    }

    private updateStatusBar(): void {
        const statusPanels = this.gos.get('statusBar')?.statusPanels;
        const validStatusBarPanelsProvided = Array.isArray(statusPanels) && statusPanels.length > 0;
        this.setDisplayed(validStatusBarPanelsProvided);

        const existingStatusPanelsToReuse: Map<string, IStatusPanelComp> = new Map();

        if (validStatusBarPanelsProvided) {
            statusPanels.forEach((statusPanelConfig) => {
                const key = statusPanelConfig.key ?? statusPanelConfig.statusPanel;
                const existingStatusPanel = this.statusBarService.getStatusPanel(key);
                if (existingStatusPanel?.refresh) {
                    const newParams = this.gos.addGridCommonParams(statusPanelConfig.statusPanelParams ?? {});
                    const hasRefreshed = existingStatusPanel.refresh(newParams);
                    if (hasRefreshed) {
                        existingStatusPanelsToReuse.set(key, existingStatusPanel);
                        delete this.compDestroyFunctions[key];
                        _removeFromParent(existingStatusPanel.getGui());
                    }
                }
            });
        }

        this.resetStatusBar();
        if (validStatusBarPanelsProvided) {
            this.processStatusPanels(existingStatusPanelsToReuse);
        }
    }

    resetStatusBar(): void {
        this.eStatusBarLeft.innerHTML = '';
        this.eStatusBarCenter.innerHTML = '';
        this.eStatusBarRight.innerHTML = '';

        this.destroyComponents();
        this.statusBarService.unregisterAllComponents();
    }

    public override destroy(): void {
        this.destroyComponents();
        super.destroy();
    }

    private destroyComponents(): void {
        Object.values(this.compDestroyFunctions).forEach((func) => func());
        this.compDestroyFunctions = {};
    }

    private createAndRenderComponents(
        statusBarComponents: StatusPanelDef[],
        ePanelComponent: HTMLElement,
        existingStatusPanelsToReuse: Map<string, IStatusPanelComp>
    ): AgPromise<void> {
        const componentDetails: { key: string; promise: AgPromise<IStatusPanelComp> }[] = [];

        statusBarComponents.forEach((componentConfig) => {
            // default to the component name if no key supplied
            const key = componentConfig.key || componentConfig.statusPanel;
            const existingStatusPanel = existingStatusPanelsToReuse.get(key);
            let promise: AgPromise<IStatusPanelComp>;
            if (existingStatusPanel) {
                promise = AgPromise.resolve(existingStatusPanel);
            } else {
                const params: WithoutGridCommon<IStatusPanelParams> = {};

                const compDetails = getStatusPanelCompDetails(this.userCompFactory, componentConfig, params);
                promise = compDetails.newAgStackInstance();

                if (promise == null) {
                    return;
                }
            }

            componentDetails.push({
                key,
                promise,
            });
        });

        return AgPromise.all(componentDetails.map((details) => details.promise)).then(() => {
            componentDetails.forEach((componentDetail) => {
                componentDetail.promise.then((component: IStatusPanelComp) => {
                    const destroyFunc = () => {
                        this.destroyBean(component);
                    };

                    if (this.isAlive()) {
                        this.statusBarService.registerStatusPanel(componentDetail.key, component);
                        ePanelComponent.appendChild(component.getGui());
                        this.compDestroyFunctions[componentDetail.key] = destroyFunc;
                    } else {
                        destroyFunc();
                    }
                });
            });
        });
    }
}

export const AgStatusBarSelector: ComponentSelector = {
    selector: 'AG-STATUS-BAR',
    component: AgStatusBar,
};
