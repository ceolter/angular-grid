import { depthFirstOriginalTreeSearch } from '../columns/columnFactoryUtils';
import type { AgColumn } from '../entities/agColumn';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import { isProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { GridOptionsService } from '../gridOptionsService';

export function placeLockedColumns(cols: AgColumn[], gos: GridOptionsService): AgColumn[] {
    const left: AgColumn[] = [];
    const normal: AgColumn[] = [];
    const right: AgColumn[] = [];
    cols.forEach((col: AgColumn) => {
        const position = col.getColDef().lockPosition;
        if (position === 'right') {
            right.push(col);
        } else if (position === 'left' || position === true) {
            left.push(col);
        } else {
            normal.push(col);
        }
    });

    const isRtl = gos.get('enableRtl');
    if (isRtl) {
        return [...right, ...normal, ...left];
    }

    return [...left, ...normal, ...right];
}

export function doesMovePassMarryChildren(
    allColumnsCopy: AgColumn[],
    gridBalancedTree: (AgColumn | AgProvidedColumnGroup)[]
): boolean {
    let rulePassed = true;

    depthFirstOriginalTreeSearch(null, gridBalancedTree, (child) => {
        if (!isProvidedColumnGroup(child)) {
            return;
        }

        const columnGroup = child;
        const colGroupDef = columnGroup.getColGroupDef();
        const marryChildren = colGroupDef && colGroupDef.marryChildren;

        if (!marryChildren) {
            return;
        }

        const newIndexes: number[] = [];
        columnGroup.getLeafColumns().forEach((col) => {
            const newColIndex = allColumnsCopy.indexOf(col);
            newIndexes.push(newColIndex);
        });

        // eslint-disable-next-line prefer-spread
        const maxIndex = Math.max.apply(Math, newIndexes);
        // eslint-disable-next-line prefer-spread
        const minIndex = Math.min.apply(Math, newIndexes);

        // spread is how far the first column in this group is away from the last column
        const spread = maxIndex - minIndex;
        const maxSpread = columnGroup.getLeafColumns().length - 1;

        // if the columns
        if (spread > maxSpread) {
            rulePassed = false;
        }

        // console.log(`maxIndex = ${maxIndex}, minIndex = ${minIndex}, spread = ${spread}, maxSpread = ${maxSpread}, fail = ${spread > (count-1)}`)
        // console.log(allColumnsCopy.map( col => col.getColDef().field).join(','));
    });

    return rulePassed;
}
