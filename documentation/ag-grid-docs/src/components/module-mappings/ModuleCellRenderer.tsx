import { EnterpriseIcon } from '@ag-website-shared/components/icon/EnterpriseIcon';
import { getFrameworkFromPath } from '@components/docs/utils/urlPaths';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ModuleCellRenderer.module.scss';

export function ModuleCellRenderer({ data }: CustomCellRendererProps) {
    const { isEnterprise, path, name } = data;
    const framework = getFrameworkFromPath(window.location.pathname);
    const moduleValue = path ? (
        <a
            href={urlWithPrefix({
                framework,
                url: `./${path}`,
            })}
        >
            {name}
        </a>
    ) : (
        name
    );

    return isEnterprise ? (
        <span className={styles.container}>
            {moduleValue} <EnterpriseIcon />
        </span>
    ) : (
        moduleValue
    );
}
