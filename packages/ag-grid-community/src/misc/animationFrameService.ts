import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { GridOptionsService } from '../gridOptionsService';
import { _getWindow } from '../gridOptionsUtils';
import type { PaginationService } from '../pagination/paginationService';
import { _warn } from '../validation/logging';

interface TaskItem {
    task: () => void;
    index: number;
    createOrder: number;
}

interface TaskList {
    list: TaskItem[];
    sorted: boolean;
}

export function _requestAnimationFrame(gos: GridOptionsService, callback: any) {
    const win = _getWindow(gos);

    if (win.requestAnimationFrame) {
        win.requestAnimationFrame(callback);
    } else if ((win as any).webkitRequestAnimationFrame) {
        (win as any).webkitRequestAnimationFrame(callback);
    } else {
        win.setTimeout(callback, 0);
    }
}

export class AnimationFrameService extends BeanStub implements NamedBean {
    beanName = 'animationFrameSvc' as const;

    private ctrlsSvc: CtrlsService;
    private pagination?: PaginationService;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.pagination = beans.pagination;
    }

    // p1 and p2 are create tasks are to do with row and cell creation.
    // for them we want to execute according to row order, so we use
    // TaskItem so we know what index the item is for.
    private createTasksP1: TaskList = { list: [], sorted: false }; // eg drawing back-ground of rows
    private createTasksP2: TaskList = { list: [], sorted: false }; // eg cell renderers, adding hover functionality

    // destroy tasks are to do with row removal. they are done after row creation as the user will need to see new
    // rows first (as blank is scrolled into view), when we remove the old rows (no longer in view) is not as
    // important.
    private destroyTasks: (() => void)[] = [];
    private ticking = false;
    private useAnimationFrame: boolean;

    // we need to know direction of scroll, to build up rows in the direction of
    // the scroll. eg if user scrolls down, we extend the rows by building down.
    private scrollGoingDown = true;
    private lastPage = 0;
    private lastScrollTop = 0;

    private taskCount = 0;
    private cancelledTasks = new Set();

    public setScrollTop(scrollTop: number): void {
        const isPaginationActive = this.gos.get('pagination');
        this.scrollGoingDown = scrollTop >= this.lastScrollTop;

        if (isPaginationActive && scrollTop === 0) {
            const currentPage = this.pagination?.getCurrentPage() ?? 0;
            if (currentPage !== this.lastPage) {
                this.lastPage = currentPage;
                this.scrollGoingDown = true;
            }
        }

        this.lastScrollTop = scrollTop;
    }

    public postConstruct(): void {
        this.useAnimationFrame = !this.gos.get('suppressAnimationFrame');
    }

    public isOn(): boolean {
        return this.useAnimationFrame;
    }

    // this method is for our AG Grid sanity only - if animation frames are turned off,
    // then no place in the code should be looking to add any work to be done in animation
    // frames. this stops bugs - where some code is asking for a frame to be executed
    // when it should not.
    private verifyAnimationFrameOn(methodName: string): void {
        if (this.useAnimationFrame === false) {
            _warn(92, { methodName });
        }
    }

    public createTask(task: () => void, index: number, list: 'createTasksP1' | 'createTasksP2') {
        this.verifyAnimationFrameOn(list);
        const taskItem: TaskItem = { task, index, createOrder: ++this.taskCount };
        this.addTaskToList(this[list], taskItem);
        this.schedule();
    }

    public cancelTask(task: () => void) {
        this.cancelledTasks.add(task);
    }

    private addTaskToList(taskList: TaskList, task: TaskItem): void {
        taskList.list.push(task);
        taskList.sorted = false;
    }

    private sortTaskList(taskList: TaskList) {
        if (taskList.sorted) {
            return;
        }

        const sortDirection = this.scrollGoingDown ? 1 : -1;

        // sort first by row index (taking into account scroll direction), then by
        // order of task creation (always ascending, so cells will render left-to-right)
        taskList.list.sort((a, b) =>
            a.index !== b.index ? sortDirection * (b.index - a.index) : b.createOrder - a.createOrder
        );
        taskList.sorted = true;
    }

    public addDestroyTask(task: () => void): void {
        this.verifyAnimationFrameOn('createTasksP3');
        this.destroyTasks.push(task);
        this.schedule();
    }

    private executeFrame(millis: number): void {
        this.verifyAnimationFrameOn('executeFrame');

        const p1TaskList = this.createTasksP1;
        const p1Tasks = p1TaskList.list;

        const p2TaskList = this.createTasksP2;
        const p2Tasks = p2TaskList.list;

        const destroyTasks = this.destroyTasks;

        const frameStart = new Date().getTime();
        let duration = new Date().getTime() - frameStart;

        // 16ms is 60 fps
        const noMaxMillis = millis <= 0;

        const gridBodyCon = this.ctrlsSvc.getGridBodyCtrl();

        while (noMaxMillis || duration < millis) {
            const gridBodyDidSomething = gridBodyCon.getScrollFeature().scrollGridIfNeeded();

            if (!gridBodyDidSomething) {
                let task: () => void;
                if (p1Tasks.length) {
                    this.sortTaskList(p1TaskList);
                    task = p1Tasks.pop()!.task;
                } else if (p2Tasks.length) {
                    this.sortTaskList(p2TaskList);
                    task = p2Tasks.pop()!.task;
                } else if (destroyTasks.length) {
                    task = destroyTasks.pop()!;
                } else {
                    this.cancelledTasks.clear();
                    break;
                }

                if (!this.cancelledTasks.has(task)) {
                    task();
                }
            }

            duration = new Date().getTime() - frameStart;
        }

        if (p1Tasks.length || p2Tasks.length || destroyTasks.length) {
            this.requestFrame();
        } else {
            this.stopTicking();
        }
    }

    private stopTicking(): void {
        this.ticking = false;
    }

    public flushAllFrames(): void {
        if (!this.useAnimationFrame) {
            return;
        }
        this.executeFrame(-1);
    }

    public schedule(): void {
        if (!this.useAnimationFrame) {
            return;
        }
        if (!this.ticking) {
            this.ticking = true;
            this.requestFrame();
        }
    }

    private requestFrame(): void {
        // check for the existence of requestAnimationFrame, and if
        // it's missing, then we polyfill it with setTimeout()
        const callback = this.executeFrame.bind(this, 60);
        _requestAnimationFrame(this.gos, callback);
    }

    public isQueueEmpty(): boolean {
        return !this.ticking;
    }
}
