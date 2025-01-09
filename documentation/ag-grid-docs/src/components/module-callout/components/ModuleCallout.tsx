import { Alert } from '@ag-website-shared/components/alert/Alert';

export const ModuleCallout = () => {
    return (
        <>
            <Alert type="module">
                <p>
                    To use this feature you will need to import the <code>PinnedRowModule</code>.
                </p>
            </Alert>
        </>
    );
};
