import type { MutableRefObject } from 'react';
import { useCallback, useContext, useEffect } from 'react';

import type { ICellRendererComp } from 'ag-grid-community';

import { BeansContext } from '../beansContext';
import type { RenderDetails } from './cellComp';

const useJsCellRenderer = (
    showDetails: RenderDetails | undefined,
    showTools: boolean,
    eCellValue: HTMLElement | undefined | null,
    cellValueVersion: number,
    jsCellRendererRef: MutableRefObject<ICellRendererComp | undefined>,
    eGui: MutableRefObject<any>
) => {
    const { context } = useContext(BeansContext);

    const destroyCellRenderer = useCallback(() => {
        const comp = jsCellRendererRef.current;
        if (!comp) {
            return;
        }

        const compGui = comp.getGui();

        if (compGui && compGui.parentElement) {
            compGui.parentElement.removeChild(compGui);
        }

        context.destroyBean(comp);
        jsCellRendererRef.current = undefined;
    }, []);

    // create or refresh JS cell renderer
    useEffect(() => {
        const showValue = showDetails != null;
        const jsCompDetails = showDetails?.compDetails && !showDetails.compDetails.componentFromFramework;
        const waitingForToolsSetup = showTools && eCellValue == null;
        const showComp = showValue && jsCompDetails && !waitingForToolsSetup;

        // if not showing comp, destroy any existing one and return
        if (!showComp) {
            destroyCellRenderer();
            return;
        }

        const compDetails = showDetails!.compDetails;

        if (jsCellRendererRef.current) {
            // attempt refresh if refresh method exists
            const comp = jsCellRendererRef.current;
            const attemptRefresh = comp.refresh != null && showDetails!.force == false;
            const refreshResult = attemptRefresh ? comp.refresh(compDetails!.params) : false;
            const refreshWorked = refreshResult === true || refreshResult === undefined;

            // if refresh worked, nothing else to do
            if (refreshWorked) {
                return;
            }

            // if refresh didn't work, we destroy it and continue, so new cell renderer created below
            destroyCellRenderer();
        }

        const promise = compDetails!.newAgStackInstance();

        promise.then((comp) => {
            if (!comp) {
                return;
            }

            const compGui = comp.getGui();
            if (!compGui) {
                return;
            }

            const parent = showTools ? eCellValue! : eGui.current!;
            parent.appendChild(compGui);

            jsCellRendererRef.current = comp;
        });
        // We do not return the destroy here as we want to keep the comp alive for our custom refresh approach above
    }, [showDetails, showTools, cellValueVersion]);

    // this effect makes sure destroyCellRenderer gets called when the
    // component is destroyed. as the other effect only updates when there
    // is a change in state
    useEffect(() => {
        return destroyCellRenderer;
    }, []);
};

export default useJsCellRenderer;
