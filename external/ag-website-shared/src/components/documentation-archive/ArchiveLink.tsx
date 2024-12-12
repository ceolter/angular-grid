import type { Library } from '@ag-grid-types';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import { LEGACY_CHARTS_SITE_URL, PRODUCTION_CHARTS_SITE_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';
import type { FunctionComponent } from 'react';

interface Props {
    version: string;
    site: Library;
    useDocumentationLink?: boolean;
}

const getArchiveUrl = ({ version, site }: { version: string; site: Library }) => {
    const archiveBaseUrl = '/archive';
    const [versionMajor, versionMinor] = version.split('.');
    const major = parseInt(versionMajor, 10);
    const minor = parseInt(versionMinor, 10);

    let baseUrl = 'https://www.ag-grid.com';
    if (site === 'charts') {
        baseUrl = (major === 10 && minor >= 1) || major > 10 ? PRODUCTION_CHARTS_SITE_URL : LEGACY_CHARTS_SITE_URL;
    }

    return pathJoin(baseUrl, archiveBaseUrl, version);
};

export const ArchiveLink: FunctionComponent<Props> = ({ version, site, useDocumentationLink }) => {
    const versionArchiveLink = getArchiveUrl({ version, site });
    const archiveLink = useDocumentationLink ? pathJoin(versionArchiveLink, '/documentation') : versionArchiveLink;
    return (
        <a href={archiveLink}>
            Documentation <Icon name="arrowRight" />
        </a>
    );
};
