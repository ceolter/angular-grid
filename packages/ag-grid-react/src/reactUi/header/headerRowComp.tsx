import React, { memo, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type {
    AbstractHeaderCellCtrl,
    HeaderCellCtrl,
    HeaderFilterCellCtrl,
    HeaderGroupCellCtrl,
    HeaderRowCtrl,
    IHeaderRowComp,
} from 'ag-grid-community';
import { _EmptyBean } from 'ag-grid-community';

import { BeansContext } from '../beansContext';
import { agFlushSync, getNextValueIfDifferent } from '../utils';
import HeaderCellComp from './headerCellComp';
import HeaderFilterCellComp from './headerFilterCellComp';
import HeaderGroupCellComp from './headerGroupCellComp';

const HeaderRowComp = ({ ctrl }: { ctrl: HeaderRowCtrl }) => {
    const { context } = useContext(BeansContext);

    const { topOffset, rowHeight } = useMemo(() => ctrl.getTopAndHeight(), []);
    const ariaRowIndex = ctrl.getAriaRowIndex();
    const className = ctrl.headerRowClass;

    const [height, setHeight] = useState<string>(() => rowHeight + 'px');
    const [top, setTop] = useState<string>(() => topOffset + 'px');

    const cellCtrlsRef = useRef<AbstractHeaderCellCtrl[] | null>(null);
    const prevCellCtrlsRef = useRef<AbstractHeaderCellCtrl[] | null>(null);
    const [cellCtrls, setCellCtrls] = useState<AbstractHeaderCellCtrl[]>(() => ctrl.getHeaderCtrls());

    const compBean = useRef<_EmptyBean>();
    const eGui = useRef<HTMLDivElement | null>(null);

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGui.current = eRef;
        compBean.current = eRef ? context.createBean(new _EmptyBean()) : context.destroyBean(compBean.current);
        if (!eRef) {
            return;
        }

        const compProxy: IHeaderRowComp = {
            setHeight: (height: string) => setHeight(height),
            setTop: (top: string) => setTop(top),
            setHeaderCtrls: (ctrls: AbstractHeaderCellCtrl[], forceOrder: boolean, afterScroll: boolean) => {
                prevCellCtrlsRef.current = cellCtrlsRef.current;
                cellCtrlsRef.current = ctrls;

                const next = getNextValueIfDifferent(prevCellCtrlsRef.current, ctrls, forceOrder)!;
                if (next !== prevCellCtrlsRef.current) {
                    agFlushSync(afterScroll, () => setCellCtrls(next));
                }
            },
            setWidth: (width: string) => {
                if (eGui.current) {
                    eGui.current.style.width = width;
                }
            },
        };

        ctrl.setComp(compProxy, compBean.current, false);
    }, []);

    const style = useMemo(
        () => ({
            height: height,
            top: top,
        }),
        [height, top]
    );

    const createCellJsx = useCallback((cellCtrl: AbstractHeaderCellCtrl) => {
        switch (ctrl.type) {
            case 'group':
                return <HeaderGroupCellComp ctrl={cellCtrl as HeaderGroupCellCtrl} key={cellCtrl.instanceId} />;

            case 'filter':
                return <HeaderFilterCellComp ctrl={cellCtrl as HeaderFilterCellCtrl} key={cellCtrl.instanceId} />;

            default:
                return <HeaderCellComp ctrl={cellCtrl as HeaderCellCtrl} key={cellCtrl.instanceId} />;
        }
    }, []);

    return (
        <div ref={setRef} className={className} role="row" style={style} aria-rowindex={ariaRowIndex}>
            {cellCtrls.map(createCellJsx)}
        </div>
    );
};

export default memo(HeaderRowComp);
