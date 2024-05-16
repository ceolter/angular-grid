import HRManagementExample from '@components/showcase/examples/hr-management/index.astro';
import { useState } from 'react';

import styles from './tabs.module.scss';

const tabsData = [
    {
        src: '/example/grid-illustration.png',
        title: 'Inventory',
        description: 'An example inventory dashboard that let’s you manage product inventory',
    },
    {
        src: '/example/grid-illustration.png',
        title: 'Finance',
        description: 'An example of a finance app with integrated charts and live-updating data',
    },
    {
        src: '/example/grid-illustration.png',
        title: 'CRM',
        description: 'An example inventory dashboard that let’s you manage employees',
    },
    {
        src: '/example/grid-illustration.png',
        title: 'Complete',
        description: 'See all of the AG Grid features combined into one fully-functional datagrid solution',
    },
];

const Tabs = () => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className={styles.topHeader}>
            <div>
                <h1 className={styles.headerHeading}>{tabsData[activeTab].title}</h1>
                <p className={styles.headerDescription}>{tabsData[activeTab].description}</p>
            </div>

            <div className={styles.tabs}>
                {tabsData.map((tab, index) => (
                    <img
                        key={index}
                        className={`${styles.showcaseItemTab} ${activeTab === index ? styles.tabActive : ''}`}
                        src={tab.src}
                        onClick={() => setActiveTab(index)}
                        alt={`Tab ${index}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Tabs;
