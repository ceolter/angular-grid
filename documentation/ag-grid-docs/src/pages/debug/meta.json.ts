import { SITE_BASE_URL, SITE_URL, agChartsVersion, agGridVersion } from '@constants';
import { getIsArchive, getIsDev, getIsProduction, getIsStaging } from '@utils/env';
import { execSync } from 'child_process';

export async function GET() {
    const removeNewlineRegex = /\n/gm;
    const buildDate = new Date();
    const hash = execSync('git rev-parse HEAD').toString().replace(removeNewlineRegex, '');
    const shortHash = execSync('git rev-parse --short HEAD').toString().replace(removeNewlineRegex, '');
    const gitDate = execSync('git --no-pager log -1 --format="%ai"').toString().replace(removeNewlineRegex, '');

    const body = {
        buildDate,
        git: {
            hash,
            shortHash,
            date: gitDate,
        },
        versions: {
            grid: agGridVersion,
            charts: agChartsVersion,
        },
        site: {
            baseUrl: SITE_BASE_URL,
            siteUrl: SITE_URL,
        },
        env: {
            isDev: getIsDev(),
            isStaging: getIsStaging(),
            isProduction: getIsProduction(),
            isArchive: getIsArchive(),
        },
    };

    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
