import type { Framework, Library } from '@ag-grid-types';
import Note from '@ag-website-shared/components/alert/Note';
import Success from '@ag-website-shared/components/alert/Success';
import Warning from '@ag-website-shared/components/alert/Warning';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Snippet } from '@ag-website-shared/components/snippet/Snippet';
import fwLogos from '@ag-website-shared/images/fw-logos';
import { FrameworkSelectorInsideDocs } from '@components/framework-selector-inside-doc/FrameworkSelectorInsideDocs';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import classnames from 'classnames';
import { useMemo } from 'react';
import type { FunctionComponent } from 'react';

import { getBootstrapSnippet, getDependenciesSnippet, getNpmInstallSnippet } from '../utils/getSnippets';
import { hasValue } from '../utils/hasValue';
import { useLicenseData } from '../utils/useLicenseData';
import styles from './LicenseSetup.module.scss';

interface SeedRepo {
    name: string;
    framework: Framework;
    licenseType: 'enterprise' | 'enterprise-bundle';
    devEnvironment: string;
    url: string;
}

interface Props {
    library: Library;
    framework: Framework;
    path: string;
    seedRepos: SeedRepo[];
}

const DUMMY_LICENSE_KEY =
    'Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-963284}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{AcmeCorp}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{AcmeApp}_only_for_{1}_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_{AcmeApp}_need_to_be_licensed___{AcmeApp}_has_been_granted_a_Deployment_License_Add-on_for_{1}_Production_Environment___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{04_May_2024}____[v3]_[0102]_4F37JqkNmUUpwds1nG==WwlRFepEGJshElLJE3uKnQ6vcbwTaJF6';

const EmailSales = () => {
    return (
        <>
            Please contact <a href="mailto:info@ag-grid.com">info@ag-grid.com</a> for assistance
        </>
    );
};

export const LicenseSetup: FunctionComponent<Props> = ({ library, framework, path, seedRepos }) => {
    const {
        userLicense,
        setUserLicense,
        licensedProducts,
        isIntegratedCharts,
        updateIsIntegratedChartsWithUrlUpdate,
        userLicenseExpiry,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
        licenseState,
        licenseInvalidErrors,
        licenseValidMessage,
    } = useLicenseData({ library });
    const dependenciesSnippet = useMemo(
        () =>
            getDependenciesSnippet({
                library,
                framework,
                isIntegratedCharts,
            }),
        [library, framework, isIntegratedCharts]
    );
    const npmInstallSnippet = useMemo(
        () =>
            getNpmInstallSnippet({
                library,
                framework,
                isIntegratedCharts,
            }),
        [library, framework, isIntegratedCharts]
    );
    const bootstrapSnippet = useMemo(
        () =>
            getBootstrapSnippet({
                framework,
                license: (licenseState.chartsNoGridEnterpriseError ? '' : userLicense) || 'your License Key',
                isIntegratedCharts,
            }),
        [framework, licenseState, userLicense, isIntegratedCharts]
    );
    const selectedSeedRepos = useMemo(
        () =>
            seedRepos
                .filter(({ licenseType }) => {
                    return isIntegratedCharts ? licenseType === 'enterprise-bundle' : licenseType === 'enterprise';
                })
                .filter((seedRepo) => {
                    return seedRepo.framework === framework;
                }),
        [seedRepos, isIntegratedCharts, framework]
    );
    const productName = 'AG Grid';

    return (
        <>
            <form>
                <h2 id="validate-your-license">Validate Your Licence</h2>

                <div className={styles.licenceWrapper}>
                    <textarea
                        className={classnames(styles.license, {
                            [styles.error]: licenseState.userLicenseError,
                        })}
                        placeholder="Paste your License Key here."
                        value={userLicense}
                        onChange={(e) => {
                            setUserLicense(e.target.value);
                        }}
                    ></textarea>

                    {userLicense === '' && (
                        <span className={styles.licencePlaceholder}>
                            <b>Paste your License Key here, e.g., </b>
                            <span>{DUMMY_LICENSE_KEY}</span>
                        </span>
                    )}
                </div>

                {licenseValidMessage.map((message) => (
                    <Success key={message}>{message}</Success>
                ))}
                {licenseInvalidErrors.map((message) => (
                    <Warning key={message}>
                        {message}. <EmailSales />
                    </Warning>
                ))}

                <div className={styles.licenseData}>
                    {hasValue(userLicense) && (
                        <div>
                            <label>Licence key expires: </label>
                            <b
                                className={
                                    (licenseState.expiredError || licenseState.expiredTrialError) && styles.expired
                                }
                            >
                                {userLicenseExpiry ? userLicenseExpiry : '--'}
                            </b>
                        </div>
                    )}

                    <div>
                        <h3 id="configure-your-application">Configure Your Application</h3>

                        <div className={styles.icQuestion}>
                            <label
                                className={classnames(styles.licensedProduct, styles.integratedProduct, {
                                    [styles.valid]: licensedProducts.grid && licensedProducts.charts,
                                    [styles.trial]:
                                        userLicenseIsTrial && licensedProducts.grid && licensedProducts.charts,
                                    [styles.expired]:
                                        (userLicenseIsExpired || userLicenseTrialIsExpired) &&
                                        licensedProducts.grid &&
                                        licensedProducts.charts,
                                })}
                            >
                                Are you using Integrated Charts?{' '}
                                <input
                                    type="checkbox"
                                    name="products"
                                    value="integratedEnterprise"
                                    checked={isIntegratedCharts}
                                    onChange={() => {
                                        updateIsIntegratedChartsWithUrlUpdate(!isIntegratedCharts);
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    {licenseState.integratedChartsNoChartsError && (
                        <Warning>
                            {licenseState.integratedChartsNoChartsError}. <EmailSales />
                        </Warning>
                    )}

                    <div className={styles.frameworkContainer}>
                        <label>Framework</label>
                        <FrameworkSelectorInsideDocs path={path} currentFramework={framework} />
                    </div>
                </div>

                <div className={styles.results}>
                    <h3 id="add-your-dependencies">Add Your Dependencies</h3>

                    {licenseState.chartsNoGridEnterpriseError && (
                        <Warning>
                            {licenseState.chartsNoGridEnterpriseError}. <EmailSales />
                        </Warning>
                    )}
                    {licenseState.gridNoChartsEnterpriseError && (
                        <Warning>
                            {licenseState.gridNoChartsEnterpriseError}. <EmailSales />
                        </Warning>
                    )}

                    <p>
                        Copy the following dependencies into your <code>package.json</code>:
                    </p>

                    {dependenciesSnippet && (
                        <Snippet framework={framework} content={dependenciesSnippet} copyToClipboard />
                    )}

                    <Note>
                        If you are using an older version of AG Grid, before v33.0.0, please see the relevant{' '}
                        <a href={urlWithBaseUrl('/documentation-archive')}>documentation</a> for help on installing your
                        license key
                    </Note>

                    <p>Or install using npm:</p>

                    {npmInstallSnippet && (
                        <Snippet framework={framework} content={npmInstallSnippet} language="bash" copyToClipboard />
                    )}

                    <h3 id="set-up-your-application">Set Up Your Application</h3>

                    {licenseState.chartsNoGridEnterpriseError && (
                        <Warning>
                            {licenseState.chartsNoGridEnterpriseError}. <EmailSales />
                        </Warning>
                    )}
                    {licenseState.gridNoChartsEnterpriseError && (
                        <Warning>
                            {licenseState.gridNoChartsEnterpriseError}. <EmailSales />
                        </Warning>
                    )}

                    <p>An example of how to set up your {productName} Enterprise License Key:</p>

                    {licenseState.minimalModulesInfo && <Note>{licenseState.minimalModulesInfo}</Note>}

                    <Snippet
                        framework={framework}
                        content={bootstrapSnippet[library as keyof typeof bootstrapSnippet]}
                        copyToClipboard
                    />

                    <h2 id="seed-repos">Seed Repositories</h2>

                    {selectedSeedRepos.length ? (
                        <>
                            <p>Here are some seed code repositories to get you started:</p>

                            <table className={styles.reposTable} role="grid">
                                <thead>
                                    <tr>
                                        <th scope="col">Github Repo</th>
                                        <th scope="col">Framework</th>
                                        <th scope="col">Development Environment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSeedRepos.map(({ name, url, framework, devEnvironment }) => {
                                        return (
                                            <tr key={url}>
                                                <td>
                                                    <a
                                                        className={classnames(styles.repoButton, 'button-secondary')}
                                                        href={url}
                                                    >
                                                        <Icon name="github" />
                                                        {name}
                                                    </a>
                                                </td>
                                                <td>
                                                    <img
                                                        className={styles.frameworkLogo}
                                                        src={fwLogos[framework]}
                                                        alt={framework}
                                                    />{' '}
                                                    {framework}
                                                </td>
                                                <td>{devEnvironment}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <p>Select your enterprise products above to view seed repositories.</p>
                    )}
                </div>
            </form>
        </>
    );
};
