import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { ColumnSortState, HeaderCellCtrl, IHeader, IHeaderCellComp, UserCompDetails } from 'ag-grid-community';
import { CssClassManager, _EmptyBean, _removeAriaSort, _setAriaSort } from 'ag-grid-community';

import { BeansContext } from '../beansContext';
import { showJsComp } from '../jsComp';
import { isComponentStateless } from '../utils';

const HeaderCellComp = ({ ctrl }: { ctrl: HeaderCellCtrl }) => {
    const isAlive = ctrl.isAlive();

    const { context } = useContext(BeansContext);
    const colId = isAlive ? ctrl.column.getColId() : undefined;
    const [userCompDetails, setUserCompDetails] = useState<UserCompDetails>();

    const compBean = useRef<_EmptyBean>();
    const eGui = useRef<HTMLDivElement | null>(null);
    const eResize = useRef<HTMLDivElement>(null);
    const eHeaderCompWrapper = useRef<HTMLDivElement>(null);
    const userCompRef = useRef<IHeader>();

    const cssClassManager = useRef<CssClassManager>();
    if (isAlive && !cssClassManager.current) {
        cssClassManager.current = new CssClassManager(() => eGui.current);
    }
    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGui.current = eRef;
        compBean.current = eRef ? context.createBean(new _EmptyBean()) : context.destroyBean(compBean.current);
        if (!eRef || !isAlive) {
            return;
        }

        const compProxy: IHeaderCellComp = {
            setWidth: (width: string) => {
                if (eGui.current) {
                    eGui.current.style.width = width;
                }
            },
            addOrRemoveCssClass: (name: string, on: boolean) => cssClassManager.current!.addOrRemoveCssClass(name, on),
            setAriaSort: (sort?: ColumnSortState) => {
                if (eGui.current) {
                    sort ? _setAriaSort(eGui.current, sort) : _removeAriaSort(eGui.current);
                }
            },
            setUserCompDetails: (compDetails: UserCompDetails) => setUserCompDetails(compDetails),
            getUserCompInstance: () => userCompRef.current || undefined,
        };

        ctrl.setComp(compProxy, eRef, eResize.current!, eHeaderCompWrapper.current!, compBean.current);

        const selectAllGui = ctrl.getSelectAllGui();
        if (selectAllGui) {
            eResize.current?.insertAdjacentElement('afterend', selectAllGui);
            compBean.current!.addDestroyFunc(() => selectAllGui.remove());
        }
    }, []);

    // js comps
    useLayoutEffect(
        () => showJsComp(userCompDetails, context, eHeaderCompWrapper.current!, userCompRef),
        [userCompDetails]
    );

    // add drag handling, must be done after component is added to the dom
    useEffect(() => {
        ctrl.setDragSource(eGui.current!);
    }, [userCompDetails]);

    const userCompStateless = useMemo(() => {
        const res = userCompDetails?.componentFromFramework && isComponentStateless(userCompDetails.componentClass);
        return !!res;
    }, [userCompDetails]);

    const reactUserComp = userCompDetails && userCompDetails.componentFromFramework;
    const UserCompClass = userCompDetails && userCompDetails.componentClass;

    return (
        <div ref={setRef} className="ag-header-cell" col-id={colId} role="columnheader">
            <div ref={eResize} className="ag-header-cell-resize" role="presentation"></div>
            <div ref={eHeaderCompWrapper} className="ag-header-cell-comp-wrapper" role="presentation">
                {reactUserComp && userCompStateless && <UserCompClass {...userCompDetails!.params} />}
                {reactUserComp && !userCompStateless && (
                    <UserCompClass {...userCompDetails!.params} ref={userCompRef} />
                )}
            </div>
        </div>
    );
};

export default memo(HeaderCellComp);
