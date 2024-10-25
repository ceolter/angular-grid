import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';

export class ColumnAnimationService extends BeanStub implements NamedBean {
    beanName = 'colAnimation' as const;

    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private gridBodyCtrl: GridBodyCtrl;

    private executeNextFuncs: ((...args: any[]) => any)[] = [];
    private executeLaterFuncs: ((...args: any[]) => any)[] = [];

    private active = false;
    // activeNext starts with active but it is reset earlier after the nextFuncs are cleared
    // to prevent calls made to executeNextVMTurn from queuing functions after executeNextFuncs has already been flushed,
    private activeNext = false;
    private suppressAnimation = false;

    private animationThreadCount = 0;

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => (this.gridBodyCtrl = p.gridBodyCtrl));
    }

    public isActive(): boolean {
        return this.active && !this.suppressAnimation;
    }

    public setSuppressAnimation(suppress: boolean): void {
        this.suppressAnimation = suppress;
    }

    public start(): void {
        if (this.active) {
            return;
        }

        if (this.gos.get('suppressColumnMoveAnimation')) {
            return;
        }

        // if doing RTL, we don't animate open / close as due to how the pixels are inverted,
        // the animation moves all the row the the right rather than to the left (ie it's the static
        // columns that actually get their coordinates updated)
        if (this.gos.get('enableRtl')) {
            return;
        }

        this.ensureAnimationCssClassPresent();

        this.active = true;
        this.activeNext = true;
    }

    public finish(): void {
        if (!this.active) {
            return;
        }
        this.flush(
            () => (this.activeNext = false),
            () => (this.active = false)
        );
    }

    public executeNextVMTurn(func: (...args: any[]) => any): void {
        if (this.activeNext) {
            this.executeNextFuncs.push(func);
        } else {
            func();
        }
    }

    public executeLaterVMTurn(func: (...args: any[]) => any): void {
        if (this.active) {
            this.executeLaterFuncs.push(func);
        } else {
            func();
        }
    }

    private ensureAnimationCssClassPresent(): void {
        // up the count, so we can tell if someone else has updated the count
        // by the time the 'wait' func executes
        this.animationThreadCount++;
        const animationThreadCountCopy = this.animationThreadCount;
        this.gridBodyCtrl.setColumnMovingCss(true);

        this.executeLaterFuncs.push(() => {
            // only remove the class if this thread was the last one to update it
            if (this.animationThreadCount === animationThreadCountCopy) {
                this.gridBodyCtrl.setColumnMovingCss(false);
            }
        });
    }

    private flush(callbackNext: () => void, callbackLater: () => void): void {
        if (this.executeNextFuncs.length === 0 && this.executeLaterFuncs.length === 0) {
            callbackNext();
            callbackLater();
            return;
        }

        const runFuncs = (queue: ((...args: any[]) => any)[]) => {
            while (queue.length) {
                const func = queue.pop();
                if (func) {
                    func();
                }
            }
        };

        this.beans.frameworkOverrides.wrapIncoming(() => {
            window.setTimeout(() => {
                callbackNext();
                runFuncs(this.executeNextFuncs);
            }, 0);
            window.setTimeout(() => {
                // run the callback before executeLaterFuncs
                // because some functions being executed later
                // check if this service is `active`.
                callbackLater();
                runFuncs(this.executeLaterFuncs);
            }, 200);
        });
    }
}
