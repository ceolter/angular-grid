import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { HeaderGroupCellCtrl, IHeaderGroupCellComp, IHeaderGroupComp, UserCompDetails } from 'ag-grid-community';
import { _EmptyBean } from 'ag-grid-community';

import { BeansContext } from '../beansContext';
import { showJsComp } from '../jsComp';
import { CssClasses, isComponentStateless } from '../utils';

const HeaderGroupCellComp = ({ ctrl }: { ctrl: HeaderGroupCellCtrl }) => {
    const { context } = useContext(BeansContext);

    const [cssClasses, setCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [cssResizableClasses, setResizableCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [resizableAriaHidden, setResizableAriaHidden] = useState<'true' | 'false'>('false');
    const [ariaExpanded, setAriaExpanded] = useState<'true' | 'false' | undefined>();
    const [userCompDetails, setUserCompDetails] = useState<UserCompDetails>();
    const colId = useMemo(() => ctrl.column.getUniqueId(), []);

    const compBean = useRef<_EmptyBean>();
    const eGui = useRef<HTMLDivElement | null>(null);
    const eResize = useRef<HTMLDivElement>(null);
    const eHeaderCompWrapper = useRef<HTMLDivElement>(null);
    const userCompRef = useRef<IHeaderGroupComp>();

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGui.current = eRef;
        compBean.current = eRef ? context.createBean(new _EmptyBean()) : context.destroyBean(compBean.current);
        if (!eRef) {
            return;
        }
        const compProxy: IHeaderGroupCellComp = {
            setWidth: (width: string) => {
                if (eGui.current) {
                    eGui.current.style.width = width;
                }
            },
            addOrRemoveCssClass: (name: string, on: boolean) => setCssClasses((prev) => prev.setClass(name, on)),
            setHeaderWrapperHidden: (hidden: boolean) => {
                const headerCompWrapper = eHeaderCompWrapper.current;

                if (!headerCompWrapper) {
                    return;
                }

                if (hidden) {
                    headerCompWrapper.style.setProperty('display', 'none');
                } else {
                    headerCompWrapper.style.removeProperty('display');
                }
            },
            setHeaderWrapperMaxHeight: (value: number | null) => {
                const headerCompWrapper = eHeaderCompWrapper.current;

                if (!headerCompWrapper) {
                    return;
                }

                if (value != null) {
                    headerCompWrapper.style.setProperty('max-height', `${value}px`);
                } else {
                    headerCompWrapper.style.removeProperty('max-height');
                }

                headerCompWrapper.classList.toggle('ag-header-cell-comp-wrapper-limited-height', value != null);
            },
            setUserCompDetails: (compDetails: UserCompDetails) => setUserCompDetails(compDetails),
            setResizableDisplayed: (displayed: boolean) => {
                setResizableCssClasses((prev) => prev.setClass('ag-hidden', !displayed));
                setResizableAriaHidden(!displayed ? 'true' : 'false');
            },
            setAriaExpanded: (expanded: 'true' | 'false' | undefined) => setAriaExpanded(expanded),
            getUserCompInstance: () => userCompRef.current || undefined,
        };

        ctrl.setComp(compProxy, eRef, eResize.current!, eHeaderCompWrapper.current!, compBean.current);
    }, []);

    // js comps
    useLayoutEffect(() => showJsComp(userCompDetails, context, eHeaderCompWrapper.current!), [userCompDetails]);

    // add drag handling, must be done after component is added to the dom
    useEffect(() => {
        if (eGui.current) {
            ctrl.setDragSource(eGui.current);
        }
    }, [userCompDetails]);

    const userCompStateless = useMemo(() => {
        const res = userCompDetails?.componentFromFramework && isComponentStateless(userCompDetails.componentClass);
        return !!res;
    }, [userCompDetails]);

    const className = useMemo(() => 'ag-header-group-cell ' + cssClasses.toString(), [cssClasses]);
    const resizableClassName = useMemo(
        () => 'ag-header-cell-resize ' + cssResizableClasses.toString(),
        [cssResizableClasses]
    );

    const reactUserComp = userCompDetails && userCompDetails.componentFromFramework;
    const UserCompClass = userCompDetails && userCompDetails.componentClass;

    return (
        <div ref={setRef} className={className} col-id={colId} role="columnheader" aria-expanded={ariaExpanded}>
            <div ref={eHeaderCompWrapper} className="ag-header-cell-comp-wrapper" role="presentation">
                {reactUserComp && userCompStateless && <UserCompClass {...userCompDetails!.params} />}
                {reactUserComp && !userCompStateless && (
                    <UserCompClass {...userCompDetails!.params} ref={userCompRef} />
                )}
            </div>
            <div ref={eResize} aria-hidden={resizableAriaHidden} className={resizableClassName}></div>
        </div>
    );
};

export default memo(HeaderGroupCellComp);
