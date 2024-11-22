import { Icon } from '@ag-website-shared/components/icon/Icon';
import { type FunctionComponent, type RefObject, useCallback } from 'react';

import type { AgGridReact } from 'ag-grid-react';

import styles from './ModuleSearch.module.scss';

interface Props {
    gridRef: RefObject<AgGridReact>;
}

export const ModuleSearch: FunctionComponent<Props> = ({ gridRef }) => {
    const onInput = useCallback(
        (searchText: string) => {
            gridRef?.current?.api.setGridOption('quickFilterText', searchText);
        },
        [gridRef]
    );

    return (
        <div className={styles.searchBox}>
            <Icon name="search" svgClasses={styles.searchIcon} />

            <input
                className={styles.searchInput}
                type="search"
                placeholder="Search modules"
                onInput={(event) => {
                    onInput((event.target as HTMLInputElement).value);
                }}
            />
        </div>
    );
};
