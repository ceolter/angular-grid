import { useEffect } from 'react';

import type { LicenseDetails } from '../types';

interface Params {
    licenseDetails: LicenseDetails;
    chartsLicenseDetails: LicenseDetails;
    licenseState: any;
    userLicenseVersion?: string;
    userLicenseExpiry?: string;
    userLicenseIsValid: boolean;
    userLicenseIsTrial: boolean;
    userLicenseIsExpired: boolean;
    userLicenseTrialIsExpired: boolean;
}

export const useLicenseDebug = ({
    licenseDetails,
    chartsLicenseDetails,
    licenseState,
    userLicenseVersion,
    userLicenseExpiry,
    userLicenseIsValid,
    userLicenseIsTrial,
    userLicenseIsExpired,
    userLicenseTrialIsExpired,
}: Params) => {
    useEffect(() => {
        const url = new URL(window.location);
        const isDebug = url.searchParams.get('debug') === 'true';

        if (isDebug) {
            // eslint-disable-next-line no-console
            console.log({
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
        }
    }, [
        licenseDetails,
        chartsLicenseDetails,
        licenseState,
        userLicenseVersion,
        userLicenseExpiry,
        userLicenseIsValid,
        userLicenseIsTrial,
        userLicenseIsExpired,
        userLicenseTrialIsExpired,
    ]);
};
