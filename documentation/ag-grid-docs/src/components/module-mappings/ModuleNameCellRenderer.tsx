import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ModuleNameCellRenderer.module.scss';

export function ModuleNameCellRenderer({ data }: CustomCellRendererProps) {
    const moduleName = data.moduleName;

    return moduleName ? <code className={styles.moduleName}>{moduleName}</code> : null;
}
