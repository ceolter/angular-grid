import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import type { FakeHScrollComp } from './gridBodyComp/fakeHScrollComp';
import type { FakeVScrollComp } from './gridBodyComp/fakeVScrollComp';
import type { GridBodyCtrl } from './gridBodyComp/gridBodyCtrl';
import type { RowContainerCtrl } from './gridBodyComp/rowContainer/rowContainerCtrl';
import type { GridCtrl } from './gridComp/gridCtrl';
import type { GridHeaderCtrl } from './headerRendering/gridHeaderCtrl';
import type { HeaderRowContainerCtrl } from './headerRendering/rowContainer/headerRowContainerCtrl';
import type { ColumnPinnedType } from './interfaces/iColumn';

/** If adding or removing a control, update `NUM_CTRLS` below. */
interface ReadyParams {
    gridCtrl: GridCtrl;
    gridBodyCtrl: GridBodyCtrl;

    center: RowContainerCtrl;
    left: RowContainerCtrl;
    right: RowContainerCtrl;

    bottomCenter: RowContainerCtrl;
    bottomLeft: RowContainerCtrl;
    bottomRight: RowContainerCtrl;

    topCenter: RowContainerCtrl;
    topLeft: RowContainerCtrl;
    topRight: RowContainerCtrl;

    stickyTopCenter: RowContainerCtrl;
    stickyTopLeft: RowContainerCtrl;
    stickyTopRight: RowContainerCtrl;

    stickyBottomCenter: RowContainerCtrl;
    stickyBottomLeft: RowContainerCtrl;
    stickyBottomRight: RowContainerCtrl;

    fakeHScrollComp: FakeHScrollComp;
    fakeVScrollComp: FakeVScrollComp;
    gridHeaderCtrl: GridHeaderCtrl;

    centerHeader: HeaderRowContainerCtrl;
    leftHeader: HeaderRowContainerCtrl;
    rightHeader: HeaderRowContainerCtrl;
}

/**
 * This is the number of controls defined above in `ReadyParams`.
 * This allows us to quickly know when all controls have been registered.
 */
const NUM_CTRLS = 23;

type CtrlType = keyof ReadyParams;

type BeanDestroyFunc = Pick<BeanStub<any>, 'addDestroyFunc'>;

// for all controllers that are singletons, they can register here so other parts
// of the application can access them.
export class CtrlsService extends BeanStub<'ready'> implements NamedBean {
    beanName = 'ctrlsSvc' as const;

    private params: ReadyParams = {} as any;
    private ready = false;
    private readyCallbacks: ((p: ReadyParams) => void)[] = [];

    private runReadyCallbacksAsync = false;

    public wireBeans(beans: BeanCollection) {
        // With React 19 StrictMode, ctrlService can be ready twice.
        // The first time after the first render cycle, and the second time after the second render cycle which is only done in StrictMode.
        // By making the local events async, we effectively debounce the first ready event until after the second render cycle has completed.
        // This means that the ready logic across the grid will run against the currently rendered components and controllers.
        // We make this async only for React 19 as StrictMode in React 19 double fires ref callbacks whereas previous versions of React do not.
        this.runReadyCallbacksAsync = beans.frameworkOverrides.runWhenReadyAsync?.() ?? false;
    }

    public postConstruct() {
        this.addEventListener(
            'ready',
            () => {
                this.updateReady();
                if (this.ready) {
                    this.readyCallbacks.forEach((c) => c(this.params));
                    this.readyCallbacks.length = 0;
                }
            },
            this.runReadyCallbacksAsync
        );
    }
    private updateReady(): void {
        const values = Object.values(this.params);
        // ready when all ctrls have been registered and are alive
        this.ready =
            values.length === NUM_CTRLS &&
            values.every((ctrl: BeanStub<any> | undefined) => {
                return ctrl?.isAlive() ?? false;
            });
    }

    public whenReady(caller: BeanDestroyFunc, callback: (p: ReadyParams) => void): void {
        if (this.ready) {
            callback(this.params);
        } else {
            this.readyCallbacks.push(callback);
        }
        caller.addDestroyFunc(() => {
            // remove the callback if the caller is destroyed so that we don't call it against a destroyed component
            const index = this.readyCallbacks.indexOf(callback);
            if (index >= 0) {
                this.readyCallbacks.splice(index, 1);
            }
        });
    }

    public register<K extends CtrlType, T extends ReadyParams[K]>(ctrlType: K, ctrl: T): void {
        this.params[ctrlType] = ctrl;
        this.updateReady();
        if (this.ready) {
            this.dispatchLocalEvent({ type: 'ready' });
        }

        ctrl.addDestroyFunc(() => {
            // Ensure ready is false when a controller is destroyed
            // We do not clear them as a lot of code still runs during destroy logic which may need access to the controllers
            // NOTE: This is not ideal and we should look to stop logic using controllers during destroy
            this.updateReady();
        });
    }

    public get<K extends CtrlType>(ctrlType: K): ReadyParams[K] {
        return this.params[ctrlType];
    }

    public getGridBodyCtrl(): GridBodyCtrl {
        return this.params.gridBodyCtrl;
    }

    public getHeaderRowContainerCtrls(): HeaderRowContainerCtrl[] {
        const { leftHeader, centerHeader, rightHeader } = this.params;
        return [leftHeader, rightHeader, centerHeader];
    }

    public getHeaderRowContainerCtrl(pinned?: ColumnPinnedType): HeaderRowContainerCtrl | undefined {
        const params = this.params;
        switch (pinned) {
            case 'left':
                return params.leftHeader;
            case 'right':
                return params.rightHeader;
            default:
                return params.centerHeader;
        }
    }
}
