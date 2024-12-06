import React from 'react';

import styles from './Showcase.module.scss';
import AerospaceIcon from './images/aerospace.svg?react';
import AIIcon from './images/ai.svg?react';
import DashboardIcon from './images/dashboard.svg?react';
import FinanceIcon from './images/finance.svg?react';
import JPMorgan from './images/jpmorgan.svg?react';
import Microsoft from './images/microsoft.svg?react';
import ModelIcon from './images/model.svg?react';
import MongoDB from './images/mongodb.svg?react';
import Nasa from './images/nasa.svg?react';
import RA from './images/ra.svg?react';

const SHOWCASE_ITEMS = [
    {
        title: 'Finance',
        titleIcon: <FinanceIcon />,
        description:
            "Salt is J.P. Morgan's open-source design system for financial services and other industries, which uses AG Grid for its Data Grid component.",
        projectName: 'J.P. Morgan',
        projectLogo: <JPMorgan />,
        projectHref: 'https://www.saltdesignsystem.com/salt/index',
    },
    {
        title: 'ML/AI',
        titleIcon: <AIIcon />,
        description:
            'MSR Gamut is a design probe that leverages AG Grid to help data scientists effectively visualize and understand their Machine Learning models and data.',
        projectName: 'Microsoft',
        projectLogo: <Microsoft />,
        projectHref: 'https://microsoft.github.io/msrgamut/',
    },
    {
        title: 'Databases',
        titleIcon: <ModelIcon />,
        description:
            "Compass is the GUI for MongoDB that uses AG Grid to visualize and manage users' databases, providing an intuitive interface to explore and interact with data.",
        projectName: 'MongoDB',
        projectLogo: <MongoDB />,
        projectHref: 'https://www.mongodb.com/products/tools/compass',
    },
    {
        title: 'Aerospace',
        titleIcon: <AerospaceIcon />,
        description:
            'NASA AMMOS is a tool for planning, scheduling, and sequencing tools for modern space missions that uses AG Grid to help visualise mission data.',
        projectName: 'NASA',
        projectLogo: <Nasa />,
        projectHref: 'https://nasa-ammos.github.io/aerie-docs/',
    },
    {
        title: 'Developer Tools',
        titleIcon: <DashboardIcon />,
        description:
            'React Admin is an open source framework for building admin interfaces with React which uses AG Grid for its Data Grid functionality.',
        projectName: 'React Admin',
        projectLogo: <RA />,
        projectHref: 'https://marmelab.com/react-admin/',
    },
];

const ShowcaseItem: React.FC = ({ title, titleIcon, description, projectName, projectLogo, projectHref }) => {
    return (
        <div className={styles.showcaseGridItem}>
            <div className={styles.showcaseIconWrapper}>
                <span className={styles.showcaseIcon}>{titleIcon}</span>
                <span className={styles.showcaseLogo}>{projectLogo}</span>
            </div>
            <h3 className={styles.showcaseTitle}>
                {title}
                <span className={styles.showcaseName}></span>
            </h3>
            <p className={styles.showcaseDescription}>{description}</p>
            <div className={styles.showcaseLinksWrapper}>
                <a href={projectHref} target="_blank" rel="noopener noreferrer">
                    Visit {projectName}
                </a>
            </div>
        </div>
    );
};

const Showcase: React.FC = () => {
    return (
        <div className={styles.showcaseContainer}>
            {SHOWCASE_ITEMS.map((showcaseItem) => {
                return <ShowcaseItem key={showcaseItem.title} {...showcaseItem} />;
            })}
        </div>
    );
};

export default Showcase;
