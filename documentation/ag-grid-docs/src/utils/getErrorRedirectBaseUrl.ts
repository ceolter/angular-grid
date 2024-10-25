import { GRID_ARCHIVE_BASE_URL } from '@constants';

interface Params {
    errorVersion: string;
    pageVersion: string;
}

export function getErrorRedirectBaseUrl({ errorVersion, pageVersion }: Params) {
    if (!errorVersion || errorVersion === pageVersion) {
        return;
    }

    return `${GRID_ARCHIVE_BASE_URL}/${errorVersion}`;
}
