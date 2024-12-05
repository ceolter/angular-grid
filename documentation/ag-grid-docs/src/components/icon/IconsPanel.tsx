import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Tabs } from '@ag-website-shared/components/tabs/Tabs';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';

import styles from './IconsPanel.module.scss';

type Theme = 'quartz' | 'balham' | 'material' | 'alpine';
const THEMES: Theme[] = ['quartz', 'balham', 'material', 'alpine'];
const ICONS = [
    'aggregation',
    'arrows',
    'asc',
    'cancel',
    'chart',
    'color-picker',
    'columns',
    'contracted',
    'copy',
    'cut',
    'cross',
    'csv',
    'desc',
    'down',
    'excel',
    'expanded',
    'eye-slash',
    'eye',
    'filter',
    'first',
    'grip',
    'group',
    'last',
    'left',
    'linked',
    'loading',
    'maximize',
    'menu',
    'menu-alt',
    'minimize',
    'minus',
    'next',
    'none',
    'not-allowed',
    'paste',
    'pin',
    'pivot',
    'plus',
    'previous',
    'right',
    'save',
    'small-down',
    'small-left',
    'small-right',
    'small-up',
    'tick',
    'tree-closed',
    'tree-indeterminate',
    'tree-open',
    'unlinked',
    'up',
];

const capitalizeName = (name: string) => `${name.slice(0, 1).toUpperCase()}${name.slice(1)}`;

const IconsList = ({ theme }: { theme: Theme }) => (
    <>
        {ICONS.map((icon) => (
            <div key={icon} className={styles.iconItem}>
                <img src={urlWithBaseUrl(`/theme-icons/${theme}/${icon}.svg`)} alt={icon} title={icon}></img>
                <p className={styles.iconName}>{icon}</p>
            </div>
        ))}
    </>
);

const PanelWrapper = ({ theme }: { theme: Theme }) => (
    <div className={styles.iconList} role="tabpanel" aria-labelledby={`${theme}-tab`}>
        <IconsList theme={theme} />
    </div>
);

const BottomBar = ({ theme }: { theme: Theme }) => (
    <footer className={styles.footer}>
        <a
            className={classnames('button', styles.downloadButton)}
            href={urlWithBaseUrl(`/theme-icons/${theme}/${theme}-icons.zip`)}
        >
            Download All <Icon name="download" />
        </a>
    </footer>
);

const Tab = ({ theme }: { theme: Theme }) => {
    return (
        <>
            <PanelWrapper theme={theme} />
            <BottomBar theme={theme} />
        </>
    );
};

/**
 * This is a viewer for the available theme icons, and will also let the user download the icons.
 */
export const IconsPanel = () => {
    return (
        <Tabs>
            {THEMES.map((theme) => (
                <Tab key={theme} tab-label={`${capitalizeName(theme)} Icons`} theme={theme} />
            ))}
        </Tabs>
    );
};
