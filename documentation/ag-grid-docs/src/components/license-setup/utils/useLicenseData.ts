import type { Library } from '@ag-grid-types';
import { AgCharts } from 'ag-charts-enterprise';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LicenseManager } from 'ag-grid-enterprise';

import type { LicenseDetails, LicensedProducts } from '../types';
import { hasValue } from './hasValue';
import { updateSearchParams } from './updateSearchParams';
import { useLicenseDebug } from './useLicenseDebug';
import { useUpdateDataFromUrl } from './useUpdateDataFromUrl';

export type LicenseStateKey = keyof typeof licenseDataState;
type LicenseState = Record<LicenseStateKey, string | undefined>;
interface DataState {
    library: Library;
    userLicense: string;
    licensedProducts: LicensedProducts;
    isIntegratedCharts: boolean;
    userLicenseVersion?: string;
    userLicenseExpiry?: string;
    userLicenseIsValid: boolean;
    userLicenseIsTrial: boolean;
    userLicenseIsExpired: boolean;
    userLicenseTrialIsExpired: boolean;
}

const licenseDataState = {
    validGridLicense: {
        getIsState: ({ userLicense, licensedProducts }: DataState) =>
            hasValue(userLicense) && !licensedProducts.charts && licensedProducts.grid,
        message: `Valid AG Grid Enterprise license key`,
    },
    validChartsLicense: {
        getIsState: ({ userLicense, licensedProducts }: DataState) =>
            hasValue(userLicense) && licensedProducts.charts && !licensedProducts.grid,
        message: `Valid AG Charts Enterprise license key`,
    },
    validIntegratedChartsLicense: {
        getIsState: ({ userLicense, licensedProducts }: DataState) =>
            hasValue(userLicense) && licensedProducts.charts && licensedProducts.grid,
        message: `Valid Enterprise Bundle license key. Includes AG Grid Enterprise and AG Charts Enterprise`,
    },
    minimalModulesInfo: {
        getIsState: ({ licensedProducts }: DataState) => licensedProducts.grid,
        message:
            "This is the minimal set of modules needed to render AG Grid Enterprise. You may need to include additional modules to this list of dependencies according to the AG Grid Enterprise feature you're using",
    },

    // On Grid website, error if only have AG Charts Enterprise
    chartsNoGridEnterpriseError: {
        getIsState: ({ library, licensedProducts }: DataState) =>
            library === 'grid' && licensedProducts.charts && !licensedProducts.grid,
        message: `Your license key does not include AG Grid Enterprise`,
    },
    // On Charts website, error if only have AG Grid Enterprise
    gridNoChartsEnterpriseError: {
        getIsState: ({ library, licensedProducts }: DataState) =>
            library === 'charts' && !licensedProducts.charts && licensedProducts.grid,
        message: `Your license key does not include AG Charts Enterprise`,
    },
    integratedChartsNoChartsError: {
        getIsState: ({ licensedProducts, isIntegratedCharts }: DataState) =>
            !licensedProducts.charts && licensedProducts.grid && isIntegratedCharts,
        message: `Your license key does not include Integrated Charts`,
    },

    userLicenseError: {
        getIsState: ({ userLicense, userLicenseIsValid }: DataState) => {
            return hasValue(userLicense) && !userLicenseIsValid;
        },
        message:
            'License key is not valid. Make sure you are copying the whole license key which was originally provided',
    },
    expiredError: {
        getIsState: ({ userLicense, userLicenseIsExpired }: DataState) => {
            return hasValue(userLicense) && userLicenseIsExpired;
        },
        message: 'This license key has expired and cannot be used with the latest version',
    },
    expiredTrialError: {
        getIsState: ({ userLicense, userLicenseTrialIsExpired }: DataState) => {
            return hasValue(userLicense) && userLicenseTrialIsExpired;
        },
        message: 'This trial license key has expired and can no longer be used',
    },
};

const licenseValidKeys: LicenseStateKey[] = ['validGridLicense', 'validChartsLicense', 'validIntegratedChartsLicense'];
const licenseInvalidKeys: LicenseStateKey[] = ['expiredError', 'expiredTrialError', 'userLicenseError'];

const useLicenseState = ({
    library,
    userLicense,
    licensedProducts,
    isIntegratedCharts,
    userLicenseVersion,
    userLicenseExpiry,
    userLicenseIsValid,
    userLicenseIsTrial,
    userLicenseIsExpired,
    userLicenseTrialIsExpired,
}: DataState) => {
    const [licenseState, setLicenseState] = useState<LicenseState>({} as LicenseState);

    useEffect(() => {
        const newLicenseState = {} as LicenseState;
        (Object.keys(licenseDataState) as LicenseStateKey[]).forEach((key) => {
            const { getIsState, message } = licenseDataState[key];
            const isError = getIsState({
                library,
                userLicense,
                licensedProducts,
                isIntegratedCharts,
                userLicenseVersion,
                userLicenseExpiry,
                userLicenseIsValid,
                userLicenseIsTrial,
                userLicenseIsExpired,
                userLicenseTrialIsExpired,
            });

            if (isError) {
                newLicenseState[key] = message;
            } else {
                newLicenseState[key] = undefined;
            }
        });

        setLicenseState((prevLicenseState: LicenseState) => {
            return {
                ...prevLicenseState,
                ...newLicenseState,
            };
        });
    }, [
        userLicense,
        licensedProducts,
        isIntegratedCharts,
        userLicenseVersion,
        userLicenseExpiry,
        userLicenseIsValid,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
    ]);

    return {
        licenseState,
    };
};

export const useLicenseData = ({ library }: { library: Library }) => {
    /**
     * User input license
     */
    const [userLicense, setUserLicense] = useState<string>('');
    const [isIntegratedCharts, setIsIntegratedCharts] = useState<boolean>(false);

    const updateIsIntegratedChartsWithUrlUpdate = useCallback(
        (isIntegrated: boolean) => {
            setIsIntegratedCharts(isIntegrated);

            if (library === 'grid') {
                updateSearchParams({ integratedCharts: isIntegrated });
            }
        },
        [library]
    );

    /**
     * Licensed products from license
     */
    const [licensedProducts, setLicensedProducts] = useState<LicensedProducts>({
        grid: false,
        charts: false,
    });

    const licenseDetails = useMemo<LicenseDetails>(() => LicenseManager.getLicenseDetails(userLicense), [userLicense]);
    const chartsLicenseDetails = useMemo<LicenseDetails>(
        () => (AgCharts.getLicenseDetails(userLicense) as LicenseDetails) || {},
        [userLicense]
    );

    const {
        userLicenseVersion,
        userLicenseExpiry,
        userLicenseIsValid,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
    } = useMemo(() => {
        let details;
        if (library === 'grid') {
            details = licenseDetails.suppliedLicenseType === 'CHARTS' ? chartsLicenseDetails : licenseDetails;
        } else {
            details = chartsLicenseDetails.suppliedLicenseType === 'GRID' ? licenseDetails : chartsLicenseDetails;
        }

        return {
            userLicenseVersion: details.version || undefined,
            userLicenseExpiry: details.expiry || undefined,
            userLicenseIsValid: Boolean(details.valid),
            userLicenseIsTrial: Boolean(details.isTrial),
            userLicenseIsExpired: Boolean(details.expired),
            userLicenseTrialIsExpired: Boolean(details.trialExpired),
        };
    }, [library, licenseDetails, chartsLicenseDetails]);

    const { licenseState } = useLicenseState({
        library,
        userLicense,
        licensedProducts,
        isIntegratedCharts,
        userLicenseVersion,
        userLicenseExpiry,
        userLicenseIsValid,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
    });

    useUpdateDataFromUrl({ library, setIsIntegratedCharts });
    useLicenseDebug({
        licenseDetails,
        chartsLicenseDetails,
        licenseState,
        userLicenseVersion,
        userLicenseExpiry,
        userLicenseIsValid,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
    });

    useEffect(() => {
        if (!hasValue(userLicense)) {
            return;
        }

        const { suppliedLicenseType, version } = library === 'grid' ? licenseDetails : chartsLicenseDetails;
        const gridEnterprise = version === '2' || suppliedLicenseType === 'GRID' || suppliedLicenseType === 'BOTH';
        const isIntegrated = suppliedLicenseType === 'BOTH';
        const chartsEnterprise = suppliedLicenseType === 'CHARTS' || suppliedLicenseType === 'BOTH';

        setLicensedProducts({
            grid: gridEnterprise,
            charts: chartsEnterprise,
        });

        updateIsIntegratedChartsWithUrlUpdate(isIntegrated);
    }, [library, licenseDetails, chartsLicenseDetails]);

    const licenseInvalidErrors = useMemo(() => {
        return Object.entries(licenseState)
            .filter(([key, value]) => hasValue(value) && licenseInvalidKeys.includes(key as LicenseStateKey))
            .map(([, message]) => message);
    }, [licenseState]);
    const licenseValidMessage = useMemo(() => {
        return Object.entries(licenseState)
            .filter(([key, value]) => hasValue(value) && licenseValidKeys.includes(key as LicenseStateKey))
            .map(([, message]) => message);
    }, [licenseState]);

    return {
        userLicense,
        setUserLicense,
        licensedProducts,
        isIntegratedCharts,
        updateIsIntegratedChartsWithUrlUpdate,

        userLicenseVersion,
        userLicenseExpiry,
        userLicenseIsValid,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
        licenseState,
        licenseInvalidErrors,
        licenseValidMessage,
    };
};
