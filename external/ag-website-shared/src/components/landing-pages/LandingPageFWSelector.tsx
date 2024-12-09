import { Icon } from '@ag-website-shared/components/icon/Icon';
import { FRAMEWORK_DISPLAY_TEXT } from '@constants';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';

import styles from './LandingPageFWSelector.module.scss';

const fwLogos = 'images/fw-logos/';

export function LandingPageFWSelector({ data }) {
    return (
        <div className={styles.frameworkSelector}>
            {data.map((framework) => {
                const frameworkDisplay = FRAMEWORK_DISPLAY_TEXT[framework.name];
                const alt = `${frameworkDisplay} Data Grid`;

                const href = framework.url
                    ? framework.url
                    : urlWithPrefix({ url: './getting-started', framework: framework.name });

                return (
                    <a href={href} key={framework.name} className={styles.option}>
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
