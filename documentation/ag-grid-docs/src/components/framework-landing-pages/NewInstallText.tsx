import { Icon } from '@ag-website-shared/components/icon/Icon';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import classnames from 'classnames';
import { useRef, useState } from 'react';

import styles from './NewInstallText.module.scss';

const fwLogos = 'images/fw-logos/';

const InstallText = () => {
    const [activeTab, setActiveTab] = useState('React'); // Manage active tab state
    const [isCopied, setIsCopied] = useState(false);
    const installTextRef = useRef(null);

    // Define the install commands and names for each tab
    const tabs = {
        React: { command: 'npm install ag-grid-react', iconName: 'react', name: 'React' },
        Angular: { command: 'npm install ag-grid-angular', iconName: 'angular', name: 'Angular' },
        Vue: { command: 'npm install ag-grid-vue', iconName: 'vue', name: 'Vue' },
        JavaScript: { command: 'npm install ag-grid-community', iconName: 'javascript', name: 'JavaScript' },
    };

    const copyToClipboard = () => {
        const text = installTextRef?.current?.innerText?.replace('$', '');
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.tabs}>
                    {Object.keys(tabs).map((tab) => {
                        const framework = tabs[tab];
                        return (
                            <div
                                key={tab}
                                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                                onClick={() => handleTabClick(tab)}
                            >
                                <img
                                    src={urlWithBaseUrl(`/${fwLogos}${framework.iconName}.svg`)}
                                    alt={`${framework.name} logo`}
                                    className={styles.tabIcon}
                                />
                                <span className={styles.tabName}>{framework.name}</span>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.installContainer}>
                    <span ref={installTextRef} className={styles.installText}>
                        $ {tabs[activeTab].command}
                    </span>
                    <span
                        className={`plausible-event-name=${activeTab.toLowerCase()}-table-copy-cta`}
                        onClick={copyToClipboard}
                    >
                        <Icon svgClasses={styles.copyToClipboardIcon} name={isCopied ? 'tick' : 'copy'} />
                    </span>
                </div>
            </div>
            <div className={styles.getStartedCta}>
                <a className={classnames([styles.primaryCtaButton, 'button-tertiary'])}>
                    Get Started <Icon name="chevronRight" svgClasses={styles.primaryCtaIcon} />
                </a>
                <a className={classnames([styles.secondaryCtaButton, 'button-tertiary'])}>
                    See Demos <Icon name="chevronRight" />
                </a>
            </div>
        </>
    );
};

export default InstallText;
