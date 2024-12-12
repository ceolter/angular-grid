import { parseVersion } from './parseVersion';

export const versionIsGreaterOrEqual = (baseVersion: string, versionToCompare: string) => {
    const parsedBase = parseVersion(baseVersion);
    const parsedCompare = parseVersion(versionToCompare);
    const base = [parsedBase.major, parsedBase.minor, parsedBase.patchNum];
    const compare = [parsedCompare.major, parsedCompare.minor, parsedCompare.patchNum];

    for (let i = 0; i < 3; i++) {
        if (base[i] > compare[i]) {
            return true;
        } else if (base[i] < compare[i]) {
            return false;
        }
    }

    return true;
};
