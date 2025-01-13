import { Alert } from '@ag-website-shared/components/alert/Alert';
import { getFrameworkFromPath } from '@components/docs/utils/urlPaths';
import { urlWithPrefix } from '@utils/urlWithPrefix';

export const ModuleCallout = () => {
    const framework = getFrameworkFromPath(window.location.pathname);
    return (
        <>
            <Alert type="info">
                <p>
                    If you are selecting modules, you will need to import <code>PinnedRowModule</code>. More information
                    in{' '}
                    <a
                        href={urlWithPrefix({
                            framework,
                            url: `./modules`,
                        })}
                        target={'_blank'}
                    >
                        Modules
                    </a>
                    .
                </p>
            </Alert>
        </>
    );
};
