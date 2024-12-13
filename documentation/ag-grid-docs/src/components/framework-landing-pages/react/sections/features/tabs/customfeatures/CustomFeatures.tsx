import { Snippet } from '@ag-website-shared/components/snippet/Snippet';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import React from 'react';

import styles from '../FeatureTabs.module.scss';

const CustomFeatures: React.FC = () => {
    const codeExample = `import { themeQuartz } from "ag-grid-community"; // or themeBalham, themeAlpine

const myTheme = themeQuartz
    // Customise Theme Parameters 
    .withParams({ 
        spacing: 2,
        foregroundColor: 'rgb(14, 68, 145)',
    })
    // Use Material Icons
    .withPart(iconSetMaterial);

return (
    <AgGridReact theme={myTheme} ... />
)
`;

    return (
        <div className={styles.columnContainer}>
            <div className={styles.column}>
                <div className={styles.featureContainer}>
                    <h3 className={styles.title}>Customise</h3>
                    <div className={styles.feature}>
                        <h5 className={styles.featureHeading}>Flexible Theming API</h5>
                        <span className={styles.featureDetail}>
                            Customise our <a href="./react-data-grid/themes/">Built-in Themes</a> with the{' '}
                            <a href="./react-data-grid/theming/">Theming API</a>. Define a{' '}
                            <a href="./react-data-grid/theming-colors/#color-schemes">Color Scheme</a>, modify{' '}
                            <a href="/react-data-grid/theming-parameters/">Theme Parameters</a>, mix and match{' '}
                            <a href=".react-data-grid/theming-parts/">Theme Parts</a>, and use{' '}
                            <a href="./react-data-grid/theming-css/">CSS</a> for unlimited control.
                        </span>
                    </div>
                    <div className={styles.feature}>
                        <h5 className={styles.featureHeading}>Powerful Theming Tools</h5>
                        <span className={styles.featureDetail}>
                            Use our <a href={urlWithBaseUrl('./theme-builder/')}>Theme Builder</a> to create
                            ready-to-use custom themes which can be imported into your app, or build them from scratch
                            with our{' '}
                            <a href={urlWithBaseUrl('./react-data-grid/ag-grid-design-system/')}>Figma Design System</a>
                            .
                        </span>
                    </div>
                    <div className={styles.feature}>
                        <h5 className={styles.featureHeading}>Custom Components</h5>
                        <span className={styles.featureDetail}>
                            Override the default rendering of any part of the grid with your own{' '}
                            <a href={urlWithBaseUrl('./react-data-grid/component-cell-renderer/')}>
                                Custom React Components
                            </a>
                            . Add buttons to cells, define your own filtering logic, and add custom functionality.
                        </span>
                    </div>
                </div>
            </div>
            <div className={styles.column}>
                <Snippet framework={'react'} language={'js'} content={codeExample} transform={false} copyToClipboard />
            </div>
        </div>
    );
};

export default CustomFeatures;
