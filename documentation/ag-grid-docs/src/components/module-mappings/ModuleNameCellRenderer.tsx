import { Icon } from '@ag-website-shared/components/icon/Icon';
import { getFrameworkFromPath } from '@components/docs/utils/urlPaths';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ModuleCellRenderer.module.scss';

export function ModuleNameCellRenderer({ data }: CustomCellRendererProps) {
    const moduleName = data.moduleName;

    return moduleName ? <code>{moduleName}</code> : <span></span>;
}
