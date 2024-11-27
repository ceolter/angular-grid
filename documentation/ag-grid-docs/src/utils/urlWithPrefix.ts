import type { Framework } from '@ag-grid-types';
import { isExternalLink } from '@ag-website-shared/utils/isExternalLink';
import { getFrameworkPath } from '@components/docs/utils/urlPaths';
import { SITE_BASE_URL } from '@constants';
import { getIsDev } from '@utils/env';
import { pathJoin } from '@utils/pathJoin';

import { getFileExtension } from './client/getFileExtension';

export const urlWithPrefix = ({
    url = '',
    framework,
    siteBaseUrl = SITE_BASE_URL,
    trailingSlash = true,
}: {
    url: string;
    framework?: Framework;
    siteBaseUrl?: string;
    trailingSlash?: boolean;
}): string => {
    let path = url;
    const urlHasTrailingSlash = url.endsWith('/');
    const hasFileExt = Boolean(getFileExtension(url));
    const isExternal = isExternalLink(url);
    if (url.startsWith('./')) {
        const frameworkPath = getFrameworkPath(framework!);
        path = pathJoin('/', siteBaseUrl, frameworkPath, url.slice('./'.length));
    } else if (url.startsWith('/')) {
        path = pathJoin('/', siteBaseUrl, url);
    } else if (!url.startsWith('#') && !isExternal) {
        const errorMessage = `Invalid url: ${url} - use './' for framework urls, '/' for root urls, '#' for anchor links, and http/mailto for external urls`;
        if (getIsDev()) {
            // eslint-disable-next-line no-console
            console.warn(errorMessage);
        } else {
            throw new Error(errorMessage);
        }
    }

    if (
        (trailingSlash ||
            // Add the trailing slash back if input had one
            urlHasTrailingSlash) &&
        !path.includes('#') &&
        !path.includes('?') &&
        !isExternal &&
        !hasFileExt
    ) {
        path = path + '/';
    }

    return path;
};
