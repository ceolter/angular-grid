import { Icon } from '@ag-website-shared/components/icon/Icon';

import styles from '../MatrixTable.module.scss';

function TickCrossIcon({ isTick }: { isTick: boolean }) {
    return isTick ? <Icon name="tick" svgClasses={styles.tick} /> : <Icon name="cross" svgClasses={styles.cross} />;
}

export function TickCross({ value }: { value: boolean | string }) {
    if (typeof value === 'boolean') {
        return <TickCrossIcon isTick={value} />;
    } else if (value === 'N/A') {
        return value;
    } else if (typeof value === 'string') {
        return (
            <>
                <TickCrossIcon isTick={true} /> ({value})
            </>
        );
    }

    return value;
}

/**
 * Features tick cross, where if value doesn't exist,
 * it renders as the feature existing ie, `true`
 */
export function FeaturesTickCross({ value }: { value: boolean | string }) {
    return <TickCross value={value === undefined ? true : value} />;
}
