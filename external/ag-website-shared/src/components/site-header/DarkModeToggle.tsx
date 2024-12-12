import { useDarkmode } from '@utils/hooks/useDarkmode';
import classNames from 'classnames';

import styles from './SiteHeader.module.scss';

export const DarkModeToggle = () => {
    const [darkmode, setDarkmode] = useDarkmode();

    return (
        <li className={classNames(styles.navItem, styles.buttonItem)}>
            <button
                className={classNames(styles.navLink, 'button-style-none')}
                aria-label="Dark mode selector"
                onClick={() => setDarkmode(!darkmode)}
            >
                <div className={classNames(styles.icon, styles.pseudoIcon)} />

                <span>{darkmode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
        </li>
    );
};
