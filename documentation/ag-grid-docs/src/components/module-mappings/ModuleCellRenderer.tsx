import { Icon } from '@ag-website-shared/components/icon/Icon';
import { getFrameworkFromPath } from '@components/docs/utils/urlPaths';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ModuleCellRenderer.module.scss';

export function ModuleCellRenderer({ data }: CustomCellRendererProps) {
    const { isEnterprise, path, name } = data;
    const framework = getFrameworkFromPath(window.location.pathname);

    const moduleValue = path ? (
        <span>
            <span>{name}</span>
            <a
                href={urlWithPrefix({
                    framework,
                    url: `./${path}`,
                })}
                className={styles.link}
            >
                <Icon name="newTab" svgClasses={styles.newTabIcon} />
            </a>
        </span>
    ) : (
        name
    );

    return isEnterprise ? (
        <span className={styles.container}>
            {moduleValue} <Icon name="enterprise" />
        </span>
    ) : (
        <span className={styles.container}>{moduleValue}</span>
    );
}
