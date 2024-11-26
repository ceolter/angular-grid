import type { GenericBean } from './genericBean';

type BeanComparator<TBeanName extends string, TBeanCollection extends { [key in TBeanName]?: any }> = (
    bean1: GenericBean<TBeanName, TBeanCollection>,
    bean2: GenericBean<TBeanName, TBeanCollection>
) => number;

export interface GenericContextParams<TBeanName extends string, TBeanCollection extends { [key in TBeanName]?: any }> {
    providedBeanInstances: Partial<{ [key in TBeanName]: GenericBean<TBeanName, TBeanCollection> }>;
    beanClasses: GenericSingletonBean<TBeanName, TBeanCollection>[];
    derivedBeans?: ((context: GenericContext<TBeanName, TBeanCollection>) => {
        beanName: TBeanName;
        bean: TBeanCollection[TBeanName];
    })[];
    beanInitComparator?: BeanComparator<TBeanName, TBeanCollection>;
    beanDestroyComparator?: BeanComparator<TBeanName, TBeanCollection>;
}

export interface GenericSingletonBean<TBeanName extends string, TBeanCollection extends { [key in TBeanName]?: any }> {
    new (): GenericBean<TBeanName, TBeanCollection>;
}

export interface ComponentBean {
    preConstruct(): void;
}

/**
 * The BaseBean can be used to avoid having to call super.wireBeans() in every subclass of a shared base bean, .i.e BeanStub, Component
 * It is used to pre-wire beans before the wireBeans() method is called which is equivalent to calling super.wireBeans() in a sub class
 */
export interface BaseBean<TBeanCollection> {
    preWireBeans?(beans: TBeanCollection): void;
}

export class GenericContext<TBeanName extends string, TBeanCollection extends { [key in TBeanName]?: any }> {
    protected beans: TBeanCollection = {} as TBeanCollection;
    private createdBeans: GenericBean<TBeanName, TBeanCollection>[] = [];
    private beanDestroyComparator?: BeanComparator<TBeanName, TBeanCollection>;

    private destroyed = false;

    constructor(params: GenericContextParams<TBeanName, TBeanCollection>) {
        if (!params || !params.beanClasses) {
            return;
        }

        this.beanDestroyComparator = params.beanDestroyComparator;

        this.init(params);
    }

    protected init(params: GenericContextParams<TBeanName, TBeanCollection>): void {
        Object.entries(params.providedBeanInstances).forEach(([beanName, beanInstance]: [TBeanName, any]) => {
            this.beans[beanName] = beanInstance;
        });

        params.beanClasses.forEach((BeanClass) => {
            const instance = new BeanClass();
            if (instance.beanName) {
                this.beans[instance.beanName] = instance as any;
            } else {
                // eslint-disable-next-line no-console
                console.error(`Bean ${BeanClass.name} is missing beanName`);
            }
            this.createdBeans.push(instance);
        });

        params.derivedBeans?.forEach((beanFunc) => {
            const { beanName, bean } = beanFunc(this);
            this.beans[beanName] = bean;
            this.createdBeans.push(bean);
        });

        if (params.beanInitComparator) {
            // sort the beans so that they are in a consistent order
            this.createdBeans.sort(params.beanInitComparator);
        }

        this.initBeans(this.createdBeans);
    }

    private getBeanInstances(): GenericBean<TBeanName, TBeanCollection>[] {
        return Object.values(this.beans);
    }

    public createBean<T extends GenericBean<TBeanName, TBeanCollection> | null | undefined>(
        bean: T,
        afterPreCreateCallback?: (bean: GenericBean<TBeanName, TBeanCollection>) => void
    ): T {
        if (!bean) {
            throw Error('null bean');
        }
        this.initBeans([bean], afterPreCreateCallback);
        return bean;
    }

    private initBeans(
        beanInstances: GenericBean<TBeanName, TBeanCollection>[],
        afterPreCreateCallback?: (bean: GenericBean<TBeanName, TBeanCollection>) => void
    ): void {
        beanInstances.forEach((instance) => {
            // used by BaseBeans to avoid the need for calling super.wireBeans() in every subclasses
            (instance as BaseBean<TBeanCollection>).preWireBeans?.(this.beans);
            instance.wireBeans?.(this.beans);
        });

        // used by the component class
        beanInstances.forEach((instance) => (instance as ComponentBean).preConstruct?.());
        if (afterPreCreateCallback) {
            beanInstances.forEach(afterPreCreateCallback);
        }
        beanInstances.forEach((instance) => instance.postConstruct?.());
    }

    public getBeans(): TBeanCollection {
        return this.beans;
    }

    public getBean<T extends TBeanName>(name: T): TBeanCollection[T] {
        return this.beans[name];
    }

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        // Set before doing the destroy, so if context.destroy() gets called via another bean
        // we are marked as destroyed already to prevent running destroy() twice
        this.destroyed = true;

        const beanInstances = this.getBeanInstances();
        if (this.beanDestroyComparator) {
            beanInstances.sort(this.beanDestroyComparator);
        }
        this.destroyBeans(beanInstances);

        this.beans = {} as TBeanCollection;
        this.createdBeans = [];
    }

    /**
     * Destroys a bean and returns undefined to support destruction and clean up in a single line.
     * this.dateComp = this.context.destroyBean(this.dateComp);
     */
    public destroyBean(bean: GenericBean<TBeanName, TBeanCollection> | null | undefined): undefined {
        bean?.destroy?.();
    }

    /**
     * Destroys an array of beans and returns an empty array to support destruction and clean up in a single line.
     * this.dateComps = this.context.destroyBeans(this.dateComps);
     */
    public destroyBeans(beans: (GenericBean<TBeanName, TBeanCollection> | null | undefined)[]): [] {
        if (beans) {
            for (let i = 0; i < beans.length; i++) {
                this.destroyBean(beans[i]);
            }
        }
        return [];
    }

    public isDestroyed(): boolean {
        return this.destroyed;
    }
}
