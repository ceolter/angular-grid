import { Icon } from '@ag-website-shared/components/icon/Icon';
import { FRAMEWORK_DISPLAY_TEXT } from '@constants';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classnames from 'classnames';
import React from 'react';

import styles from './FrameworkSelector.module.scss';

const fwLogos = 'images/fw-logos/';

export default function FrameworkSelector({ data, currentFramework, isFullWidth, showSelectedFramework }) {
    return (
        <div
            className={classnames(styles.frameworkSelector, {
                [styles.fullWidth]: isFullWidth,
                [styles.showSelected]: showSelectedFramework,
            })}
        >
            {data.map((framework) => {
                const isSelected = showSelectedFramework && framework.name === currentFramework;
                const frameworkDisplay = FRAMEWORK_DISPLAY_TEXT[framework.name];
                const alt = `${frameworkDisplay} Data Grid`;

                return (
                    <a
                        href={urlWithPrefix({ url: './getting-started', framework: framework.name })}
                        key={framework.name}
                        className={classnames(styles.option, {
                            [styles.selected]: isSelected,
                        })}
                    >
                        <img src={urlWithBaseUrl(`/${fwLogos}${framework.name}.svg`)} alt={alt} />

                        <span>
                            {frameworkDisplay} <Icon name="chevronRight" />
                        </span>
                    </a>
                );
            })}
        </div>
    );
}
