import type { BeanStubEvent } from '../context/beanStub';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { BaseBean, ComponentBean } from '../context/genericContext';
import type { AgEvent } from '../events';
import { CssClassManager } from '../rendering/cssClassManager';
import {
    _copyNodeList,
    _isNodeOrElement,
    _iterateNamedNodeMap,
    _loadTemplate,
    _setDisplayed,
    _setVisible,
} from '../utils/dom';

let compIdSequence = 0;

/** The RefPlaceholder is used to control when data-ref attribute should be applied to the component
 * There are hanging data-refs in the DOM that are not being used internally by the component which we don't want to apply to the component.
 * There is also the case where data-refs are solely used for passing parameters to the component and should not be applied to the component.
 * It also enables validation to catch typo errors in the data-ref attribute vs component name.
 * The value is `null` so that it can be identified in the component and distinguished from just missing with undefined.
 * The `null` value also allows for existing falsy checks to work as expected when code can be run before the template is setup.
 */
export const RefPlaceholder: any = null;

export type ComponentEvent = 'displayChanged' | BeanStubEvent;
export interface VisibleChangedEvent extends AgEvent<'displayChanged'> {
    visible: boolean;
}

export type ComponentSelector = { component: { new (params?: any): Component<any> }; selector: AgComponentSelector };

export class Component<TLocalEvent extends string = ComponentEvent>
    extends BeanStub<TLocalEvent | ComponentEvent>
    implements ComponentBean, BaseBean<BeanCollection>
{
    private eGui: HTMLElement;
    private componentSelectors: Map<AgComponentSelector, ComponentSelector>;
    private suppressDataRefValidation: boolean = false;

    // if false, then CSS class "ag-hidden" is applied, which sets "display: none"
    private displayed = true;

    // if false, then CSS class "ag-invisible" is applied, which sets "visibility: hidden"
    private visible = true;

    private css: string[] | undefined;

    protected parentComponent: Component | undefined;

    // unique id for this row component. this is used for getting a reference to the HTML dom.
    // we cannot use the RowNode id as this is not unique (due to animation, old rows can be lying
    // around as we create a new rowComp instance for the same row node).
    private compId = compIdSequence++;

    private cssClassManager: CssClassManager;

    constructor(template?: string, componentSelectors?: ComponentSelector[]) {
        super();

        this.cssClassManager = new CssClassManager(() => this.eGui);

        this.componentSelectors = new Map((componentSelectors ?? []).map((comp) => [comp.selector, comp]));
        if (template) {
            this.setTemplate(template);
        }
    }

    public preConstruct(): void {
        this.wireTemplate(this.getGui());
        this.css?.forEach((css) => this.beans.environment.addGlobalCSS(css));
    }

    private wireTemplate(element: HTMLElement | undefined, paramsMap?: { [key: string]: any }): void {
        // ui exists if user sets template in constructor. when this happens,
        // We have to wait for the context to be autoWired first before we can create child components.
        if (element && this.gos) {
            this.applyElementsToComponent(element);
            this.createChildComponentsFromTags(element, paramsMap);
        }
    }

    public getCompId(): number {
        return this.compId;
    }

    private getDataRefAttribute(element: Element): string | null {
        if (element.getAttribute) {
            return element.getAttribute('data-ref');
        }
        // Plain text nodes don't have attributes or getAttribute method
        return null;
    }

    private applyElementsToComponent(
        element: Element,
        elementRef?: string | null,
        paramsMap?: { [key: string]: any },
        newComponent: Component | null = null
    ) {
        if (elementRef === undefined) {
            elementRef = this.getDataRefAttribute(element);
        }
        if (elementRef) {
            // We store the reference to the element in the parent component under that same name
            // if there is a placeholder property with the same name.
            const current = (this as any)[elementRef];
            if (current === RefPlaceholder) {
                (this as any)[elementRef] = newComponent ?? element;
            } else {
                // Don't warn if the data-ref is used for passing parameters to the component
                const usedAsParamRef = paramsMap && paramsMap[elementRef];
                if (!this.suppressDataRefValidation && !usedAsParamRef) {
                    // This can happen because of:
                    // 1. The data-ref has a typo and doesn't match the property in the component
                    // 2. The  property is not initialised with the RefPlaceholder and should be.
                    // 3. The property is on a child component and not available on the parent during construction.
                    //    In which case you may need to pass the template via setTemplate() instead of in the super constructor.
                    // 4. The data-ref is not used by the component and should be removed from the template.
                    throw new Error(`Issue with data-ref: ${elementRef} on ${this.constructor.name} with ${current}`);
                }
            }
        }
    }

    // for registered components only, eg creates AgCheckbox instance from ag-checkbox HTML tag
    private createChildComponentsFromTags(parentNode: Element, paramsMap?: { [key: string]: any }): void {
        // we MUST take a copy of the list first, as the 'swapComponentForNode' adds comments into the DOM
        // which messes up the traversal order of the children.
        const childNodeList: Node[] = _copyNodeList(parentNode.childNodes);

        childNodeList.forEach((childNode) => {
            if (!(childNode instanceof HTMLElement)) {
                return;
            }

            const childComp = this.createComponentFromElement(
                childNode,
                (childComp) => {
                    // copy over all attributes, including css classes, so any attributes user put on the tag
                    // wll be carried across
                    const childGui = childComp.getGui();
                    if (childGui) {
                        this.copyAttributesFromNode(childNode, childComp.getGui());
                    }
                },
                paramsMap
            );

            if (childComp) {
                if ((childComp as any).addItems && childNode.children.length) {
                    this.createChildComponentsFromTags(childNode, paramsMap);

                    // converting from HTMLCollection to Array
                    const items = Array.prototype.slice.call(childNode.children);

                    (childComp as any).addItems(items);
                }
                // replace the tag (eg ag-checkbox) with the proper HTMLElement (eg 'div') in the dom
                this.swapComponentForNode(childComp, parentNode, childNode);
            } else if (childNode.childNodes) {
                this.createChildComponentsFromTags(childNode, paramsMap);
            }
        });
    }

    private createComponentFromElement(
        element: HTMLElement,
        afterPreCreateCallback?: (comp: Component) => void,
        paramsMap?: { [key: string]: any }
    ): Component | null {
        const key = element.nodeName;

        const elementRef = this.getDataRefAttribute(element);

        const isAgGridComponent = key.indexOf('AG-') === 0;
        const componentSelector = isAgGridComponent ? this.componentSelectors.get(key as AgComponentSelector) : null;
        let newComponent: Component | null = null;
        if (componentSelector) {
            const componentParams = paramsMap && elementRef ? paramsMap[elementRef] : undefined;
            newComponent = new componentSelector.component(componentParams);
            newComponent.setParentComponent(this as Component);

            this.createBean(newComponent, null, afterPreCreateCallback);
        } else if (isAgGridComponent) {
            throw new Error(`Missing selector: ${key}`);
        }

        this.applyElementsToComponent(element, elementRef, paramsMap, newComponent);

        return newComponent;
    }

    private copyAttributesFromNode(source: Element, dest: Element): void {
        _iterateNamedNodeMap(source.attributes, (name, value) => dest.setAttribute(name, value));
    }

    private swapComponentForNode(newComponent: Component, parentNode: Element, childNode: Node): void {
        const eComponent = newComponent.getGui();
        parentNode.replaceChild(eComponent, childNode);
        parentNode.insertBefore(document.createComment(childNode.nodeName), eComponent);
        this.addDestroyFunc(this.destroyBean.bind(this, newComponent));
    }

    protected activateTabIndex(elements?: Element[]): void {
        const tabIndex = this.gos.get('tabIndex');

        if (!elements) {
            elements = [];
        }

        if (!elements.length) {
            elements.push(this.getGui());
        }

        elements.forEach((el) => el.setAttribute('tabindex', tabIndex.toString()));
    }

    public setTemplate(
        template: string | null | undefined,
        componentSelectors?: ComponentSelector[],
        paramsMap?: { [key: string]: any }
    ): void {
        const eGui = _loadTemplate(template as string);
        this.setTemplateFromElement(eGui, componentSelectors, paramsMap);
    }

    public setTemplateFromElement(
        element: HTMLElement,
        components?: ComponentSelector[],
        paramsMap?: { [key: string]: any },
        suppressDataRefValidation = false
    ): void {
        this.eGui = element;
        this.suppressDataRefValidation = suppressDataRefValidation;
        if (components) {
            for (let i = 0; i < components.length; i++) {
                const component = components[i];
                this.componentSelectors.set(component.selector, component);
            }
        }
        this.wireTemplate(element, paramsMap);
    }

    public getGui(): HTMLElement {
        return this.eGui;
    }

    public getFocusableElement(): HTMLElement {
        return this.eGui;
    }

    public getAriaElement(): Element {
        return this.getFocusableElement();
    }

    public setParentComponent(component: Component<any>) {
        this.parentComponent = component;
    }

    public getParentComponent(): Component | undefined {
        return this.parentComponent;
    }

    // this method is for older code, that wants to provide the gui element,
    // it is not intended for this to be in ag-Stack
    protected setGui(eGui: HTMLElement): void {
        this.eGui = eGui;
    }

    protected queryForHtmlElement(cssSelector: string): HTMLElement {
        return this.eGui.querySelector(cssSelector) as HTMLElement;
    }

    private getContainerAndElement(
        newChild: Component<any> | HTMLElement,
        container?: HTMLElement
    ): { element: HTMLElement; parent: HTMLElement } | null {
        let parent = container;

        if (newChild == null) {
            return null;
        }

        if (!parent) {
            parent = this.eGui;
        }

        if (_isNodeOrElement(newChild)) {
            return {
                element: newChild,
                parent,
            };
        }

        return {
            element: newChild.getGui(),
            parent,
        };
    }

    public prependChild(newChild: HTMLElement | Component<any>, container?: HTMLElement) {
        const { element, parent } = this.getContainerAndElement(newChild, container) || {};

        if (!element || !parent) {
            return;
        }

        parent.insertAdjacentElement('afterbegin', element);
    }

    public appendChild(newChild: HTMLElement | Component<any>, container?: HTMLElement): void {
        const { element, parent } = this.getContainerAndElement(newChild, container) || {};

        if (!element || !parent) {
            return;
        }

        parent.appendChild(element);
    }

    public isDisplayed(): boolean {
        return this.displayed;
    }

    public setVisible(visible: boolean, options: { skipAriaHidden?: boolean } = {}): void {
        if (visible !== this.visible) {
            this.visible = visible;
            const { skipAriaHidden } = options;
            _setVisible(this.eGui, visible, { skipAriaHidden });
        }
    }

    public setDisplayed(displayed: boolean, options: { skipAriaHidden?: boolean } = {}): void {
        if (displayed !== this.displayed) {
            this.displayed = displayed;
            const { skipAriaHidden } = options;
            _setDisplayed(this.eGui, displayed, { skipAriaHidden });

            const event: VisibleChangedEvent = {
                type: 'displayChanged',
                visible: this.displayed,
            };

            this.dispatchLocalEvent(event);
        }
    }

    public override destroy(): void {
        if (this.parentComponent) {
            this.parentComponent = undefined;
        }

        super.destroy();
    }

    public addGuiEventListener(event: string, listener: (event: any) => void, options?: AddEventListenerOptions): void {
        this.eGui.addEventListener(event, listener, options);
        this.addDestroyFunc(() => this.eGui.removeEventListener(event, listener));
    }

    public addCssClass(className: string): void {
        this.cssClassManager.addCssClass(className);
    }

    public removeCssClass(className: string): void {
        this.cssClassManager.removeCssClass(className);
    }

    public containsCssClass(className: string): boolean {
        return this.cssClassManager.containsCssClass(className);
    }

    public addOrRemoveCssClass(className: string, addOrRemove: boolean): void {
        this.cssClassManager.addOrRemoveCssClass(className, addOrRemove);
    }

    protected registerCSS(css: string): void {
        this.css ||= [];
        this.css.push(css);
    }
}

/** All the AG Grid components that are used within internal templates via <ag-autocomplete> syntax */
export type AgComponentSelector =
    | 'AG-AUTOCOMPLETE'
    | 'AG-CHECKBOX'
    | 'AG-COLOR-INPUT'
    | 'AG-COLOR-PICKER'
    | 'AG-FAKE-HORIZONTAL-SCROLL'
    | 'AG-FAKE-VERTICAL-SCROLL'
    | 'AG-FILTERS-TOOL-PANEL-HEADER'
    | 'AG-FILTERS-TOOL-PANEL-LIST'
    | 'AG-GRID-BODY'
    | 'AG-GRID-HEADER-DROP-ZONES'
    | 'AG-GROUP-COMPONENT'
    | 'AG-HEADER-ROOT'
    | 'AG-INPUT-DATE-FIELD'
    | 'AG-INPUT-NUMBER-FIELD'
    | 'AG-INPUT-RANGE'
    | 'AG-INPUT-TEXT-AREA'
    | 'AG-INPUT-TEXT-FIELD'
    | 'AG-NAME-VALUE'
    | 'AG-OVERLAY-WRAPPER'
    | 'AG-PAGE-SIZE-SELECTOR'
    | 'AG-PAGINATION'
    | 'AG-PRIMARY-COLS-HEADER'
    | 'AG-PRIMARY-COLS-LIST'
    | 'AG-PRIMARY-COLS'
    | 'AG-ROW-CONTAINER'
    | 'AG-SELECT'
    | 'AG-SIDE-BAR'
    | 'AG-SIDE-BAR-BUTTONS'
    | 'AG-SLIDER'
    | 'AG-SORT-INDICATOR'
    | 'AG-STATUS-BAR'
    | 'AG-TOGGLE-BUTTON'
    | 'AG-WATERMARK';
