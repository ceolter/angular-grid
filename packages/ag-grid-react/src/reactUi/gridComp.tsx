import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
    Component,
    ComponentSelector,
    Context,
    FocusableContainer,
    IGridComp,
    TabGuardComp as JsTabGuardComp,
} from 'ag-grid-community';
import { GridCtrl } from 'ag-grid-community';

import { BeansContext } from './beansContext';
import GridBodyComp from './gridBodyComp';
import useReactCommentEffect from './reactComment';
import type { TabGuardCompCallback } from './tabGuardComp';
import TabGuardComp from './tabGuardComp';
import { classesList } from './utils';

interface GridCompProps {
    context: Context;
}

const GridComp = ({ context }: GridCompProps) => {
    const [rtlClass, setRtlClass] = useState<string>('');
    const [layoutClass, setLayoutClass] = useState<string>('');
    const [cursor, setCursor] = useState<string | null>(null);
    const [userSelect, setUserSelect] = useState<string | null>(null);
    const [initialised, setInitialised] = useState<boolean>(false);
    const [tabGuardReady, setTabGuardReady] = useState<any>();

    const gridCtrlRef = useRef<GridCtrl>();
    const eRootWrapperRef = useRef<HTMLDivElement | null>(null);
    const tabGuardRef = useRef<TabGuardCompCallback>();
    // eGridBodyParent is state as we use it in render
    const [eGridBodyParent, setGridBodyParent] = useState<HTMLDivElement | null>(null);

    const focusInnerElementRef = useRef<(fromBottom?: boolean) => void>(() => undefined);
    const paginationCompRef = useRef<JsTabGuardComp | undefined>();
    const focusableContainersRef = useRef<Component[]>([]);

    const onTabKeyDown = useCallback(() => undefined, []);

    const beans = useMemo(() => {
        if (context.isDestroyed()) {
            return null;
        }
        return context.getBeans();
    }, [context]);

    useReactCommentEffect(' AG Grid ', eRootWrapperRef);

    const setRef = useCallback((eRef: HTMLDivElement) => {
        eRootWrapperRef.current = eRef;
        gridCtrlRef.current = eRef ? context.createBean(new GridCtrl()) : context.destroyBean(gridCtrlRef.current);

        if (!eRef || context.isDestroyed()) {
            return;
        }

        const gridCtrl = gridCtrlRef.current!;

        focusInnerElementRef.current = gridCtrl.focusInnerElement.bind(gridCtrl);

        const compProxy: IGridComp = {
            destroyGridUi: () => {}, // do nothing, as framework users destroy grid by removing the comp
            setRtlClass,
            forceFocusOutOfContainer: (up?: boolean) => {
                if (!up && paginationCompRef.current?.isDisplayed()) {
                    paginationCompRef.current.forceFocusOutOfContainer(up);
                    return;
                }
                tabGuardRef.current?.forceFocusOutOfContainer(up);
            },
            updateLayoutClasses: setLayoutClass,
            getFocusableContainers: () => {
                const comps: FocusableContainer[] = [];
                const gridBodyCompEl = eRootWrapperRef.current?.querySelector('.ag-root');
                if (gridBodyCompEl) {
                    comps.push({ getGui: () => gridBodyCompEl as HTMLElement });
                }
                focusableContainersRef.current.forEach((comp) => {
                    if (comp.isDisplayed()) {
                        comps.push(comp);
                    }
                });
                return comps;
            },
            setCursor,
            setUserSelect,
        };

        gridCtrl.setComp(compProxy, eRef, eRef);

        setInitialised(true);
    }, []);

    // initialise the extra components
    useEffect(() => {
        const gridCtrl = gridCtrlRef.current;
        const eRootWrapper = eRootWrapperRef.current;
        if (!tabGuardReady || !beans || !gridCtrl || !eGridBodyParent || !eRootWrapper) {
            return;
        }

        const beansToDestroy: any[] = [];

        // these components are optional, so we check if they are registered before creating them
        const {
            watermarkSelector,
            paginationSelector,
            sideBarSelector,
            statusBarSelector,
            gridHeaderDropZonesSelector,
        } = gridCtrl.getOptionalSelectors();
        const additionalEls: HTMLElement[] = [];

        if (gridHeaderDropZonesSelector) {
            const headerDropZonesComp = context.createBean(new gridHeaderDropZonesSelector.component());
            const eGui = headerDropZonesComp.getGui();
            eRootWrapper.insertAdjacentElement('afterbegin', eGui);
            additionalEls.push(eGui);
            beansToDestroy.push(headerDropZonesComp);
        }

        if (sideBarSelector) {
            const sideBarComp = context.createBean(new sideBarSelector.component());
            const eGui = sideBarComp.getGui();
            const bottomTabGuard = eGridBodyParent.querySelector('.ag-tab-guard-bottom');
            if (bottomTabGuard) {
                bottomTabGuard.insertAdjacentElement('beforebegin', eGui);
                additionalEls.push(eGui);
            }

            beansToDestroy.push(sideBarComp);
            focusableContainersRef.current.push(sideBarComp);
        }

        const addComponentToDom = (component: ComponentSelector['component']) => {
            const comp = context.createBean(new component());
            const eGui = comp.getGui();
            eRootWrapper.insertAdjacentElement('beforeend', eGui);
            additionalEls.push(eGui);
            beansToDestroy.push(comp);
            return comp;
        };

        if (statusBarSelector) {
            addComponentToDom(statusBarSelector.component);
        }

        if (paginationSelector) {
            const paginationComp = addComponentToDom(paginationSelector.component);
            paginationCompRef.current = paginationComp as JsTabGuardComp;
            focusableContainersRef.current.push(paginationComp);
        }

        if (watermarkSelector) {
            addComponentToDom(watermarkSelector.component);
        }

        return () => {
            context.destroyBeans(beansToDestroy);
            additionalEls.forEach((el) => {
                el.parentElement?.removeChild(el);
            });
        };
    }, [tabGuardReady, eGridBodyParent, beans]);

    const rootWrapperClasses = useMemo(
        () => classesList('ag-root-wrapper', rtlClass, layoutClass),
        [rtlClass, layoutClass]
    );
    const rootWrapperBodyClasses = useMemo(
        () => classesList('ag-root-wrapper-body', 'ag-focus-managed', layoutClass),
        [layoutClass]
    );

    const topStyle: React.CSSProperties = useMemo(
        () => ({
            userSelect: userSelect != null ? (userSelect as any) : '',
            WebkitUserSelect: userSelect != null ? (userSelect as any) : '',
            cursor: cursor != null ? cursor : '',
        }),
        [userSelect, cursor]
    );

    const setTabGuardCompRef = useCallback((ref: TabGuardCompCallback) => {
        tabGuardRef.current = ref;
        setTabGuardReady(ref !== null);
    }, []);

    const isFocusable = useCallback(() => !gridCtrlRef.current?.isFocusable(), []);

    return (
        <div ref={setRef} className={rootWrapperClasses} style={topStyle} role="presentation">
            <div className={rootWrapperBodyClasses} ref={setGridBodyParent} role="presentation">
                {initialised && eGridBodyParent && beans && (
                    <BeansContext.Provider value={beans}>
                        <TabGuardComp
                            ref={setTabGuardCompRef}
                            eFocusableElement={eGridBodyParent}
                            onTabKeyDown={onTabKeyDown}
                            gridCtrl={gridCtrlRef.current!}
                            forceFocusOutWhenTabGuardsAreEmpty={true}
                            isEmpty={isFocusable}
                        >
                            {
                                // we wait for initialised before rending the children, so GridComp has created and registered with it's
                                // GridCtrl before we create the child GridBodyComp. Otherwise the GridBodyComp would initialise first,
                                // before we have set the the Layout CSS classes, causing the GridBodyComp to render rows to a grid that
                                // doesn't have it's height specified, which would result if all the rows getting rendered (and if many rows,
                                // hangs the UI)
                                <GridBodyComp />
                            }
                        </TabGuardComp>
                    </BeansContext.Provider>
                )}
            </div>
        </div>
    );
};

export default memo(GridComp);
