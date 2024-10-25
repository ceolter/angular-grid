import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { ColumnEventType } from '../events';
import { dispatchColumnResizedEvent } from './columnEventUtils';
import type { VisibleColsService } from './visibleColsService';

type FlexItem = {
    col: AgColumn;
    isFlex: boolean;
    flex: number;
    min: number;
    max: number;
    initialSize: number;
    targetSize: number;
    frozenSize?: number;
    violationType?: 'min' | 'max';
};

export class ColumnFlexService extends BeanStub implements NamedBean {
    beanName = 'colFlex' as const;

    private visibleCols: VisibleColsService;

    public wireBeans(beans: BeanCollection): void {
        this.visibleCols = beans.visibleCols;
    }

    private flexViewportWidth: number;

    public refreshFlexedColumns(
        params: {
            skipSetLeft?: boolean;
            viewportWidth?: number;
            source?: ColumnEventType;
            fireResizedEvent?: boolean;
            updateBodyWidths?: boolean;
        } = {}
    ): AgColumn[] {
        const source = params.source ? params.source : 'flex';

        if (params.viewportWidth != null) {
            this.flexViewportWidth = params.viewportWidth;
        }

        const totalSpace = this.flexViewportWidth;

        if (!totalSpace) {
            return [];
        }

        // NOTE this is an implementation of the "Resolve Flexible Lengths" part
        // of the flex spec, simplified because we only support flex growing not
        // shrinking, and don't support flex-basis.
        // https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths
        let hasFlexItems = false;
        const items = this.visibleCols.centerCols.map((col): FlexItem => {
            const flex = col.getFlex();
            const isFlex = flex != null;

            hasFlexItems ||= isFlex;

            return {
                col,
                isFlex,
                flex: Math.max(0, flex ?? 0),
                initialSize: col.getActualWidth(),
                min: col.getMinWidth(),
                max: col.getMaxWidth(),
                targetSize: 0,
            };
        });

        if (!hasFlexItems) {
            return [];
        }

        let unfrozenItemCount = items.length;
        let unfrozenFlex = items.reduce((acc, item) => acc + item.flex, 0);
        let unfrozenSpace = totalSpace;

        const freeze = (item: FlexItem, width: number) => {
            item.frozenSize = width;
            item.col.setActualWidth(width, source);
            unfrozenSpace -= width;
            unfrozenFlex -= item.flex;
            unfrozenItemCount -= 1;
        };

        const isFrozen = (item: FlexItem) => item.frozenSize != null;

        // Freeze inflexible columns
        for (const item of items) {
            if (!item.isFlex) {
                freeze(item, item.initialSize);
            }
        }

        // a. Check for flexible items. If all the flex items on the line are
        // frozen, free space has been distributed; exit this loop.
        while (unfrozenItemCount > 0) {
            // b. Calculate the remaining free space as for initial free space,
            // above. If the sum of the unfrozen flex items’ flex factors is
            // less than one, multiply the initial free space by this sum.
            const spaceToFill = Math.round(unfrozenFlex < 1 ? unfrozenSpace * unfrozenFlex : unfrozenSpace);

            // c. Distribute free space proportional to the flex factors.
            let lastUnfrozenItem: FlexItem | undefined;
            let actualLeft = 0;
            let idealRight = 0;

            for (const item of items) {
                if (isFrozen(item)) {
                    continue;
                }

                lastUnfrozenItem = item;
                idealRight += spaceToFill * (item.flex / unfrozenFlex);

                const idealSize = idealRight - actualLeft;
                const roundedSize = Math.round(idealSize);

                item.targetSize = roundedSize;
                actualLeft += roundedSize;
            }

            if (lastUnfrozenItem) {
                // Correct cumulative rounding errors: adjust the size of the
                // last item to fill any remaining space
                lastUnfrozenItem.targetSize += spaceToFill - actualLeft;
            }

            // d. Fix min/max violations. Clamp each non-frozen item’s target
            // main size by its used min and max main sizes... If the item’s
            // target main size was made smaller by this, it’s a max violation.
            // If the item’s target main size was made larger by this, it’s a
            // min violation.
            let totalViolation = 0;
            for (const item of items) {
                if (isFrozen(item)) {
                    continue;
                }

                const unclampedSize = item.targetSize;
                const clampedSize = Math.min(Math.max(unclampedSize, item.min), item.max);

                totalViolation += clampedSize - unclampedSize;
                item.violationType =
                    clampedSize === unclampedSize ? undefined : clampedSize < unclampedSize ? 'max' : 'min';

                item.targetSize = clampedSize;
            }

            // e. Freeze over-flexed items. The total violation is the sum of
            // the adjustments from the previous step.
            // If the total violation is:
            //     - Zero, Freeze all items
            //     - Positive, Freeze all the items with min violations
            //     - Negative, Freeze all the items with max violations
            const freezeType = totalViolation === 0 ? 'all' : totalViolation > 0 ? 'min' : 'max';

            for (const item of items) {
                if (isFrozen(item)) {
                    continue;
                }

                if (freezeType === 'all' || item.violationType === freezeType) {
                    freeze(item, item.targetSize);
                }
            }
        }

        if (!params.skipSetLeft) {
            this.visibleCols.setLeftValues(source);
        }

        if (params.updateBodyWidths) {
            this.visibleCols.updateBodyWidths();
        }

        const unconstrainedFlexColumns = items
            .filter((item) => item.isFlex && !item.violationType)
            .map((item) => item.col);

        if (params.fireResizedEvent) {
            const changedColumns = items.filter((item) => item.initialSize !== item.frozenSize).map((item) => item.col);
            const flexingColumns = items.filter((item) => item.flex).map((item) => item.col);

            dispatchColumnResizedEvent(this.eventSvc, changedColumns, true, source, flexingColumns);
        }

        return unconstrainedFlexColumns;
    }
}
