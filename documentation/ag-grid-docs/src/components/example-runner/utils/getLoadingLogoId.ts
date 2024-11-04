export function getLoadingLogoId({ pageName, exampleName }: { pageName: string; exampleName: string }) {
    return `loading-${pageName}-${exampleName}`;
}

export function getLoadingIFrameId({ pageName, exampleName }: { pageName: string; exampleName: string }) {
    return `loading-frame-${pageName}-${exampleName}`;
}
