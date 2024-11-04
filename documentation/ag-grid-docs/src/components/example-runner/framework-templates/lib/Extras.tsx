import { Scripts } from './Scripts';
import { Styles } from './Styles';

const extrasMap = {
    jquery: {
        scripts: ['https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.1/jquery.min.js'],
    },
    jqueryui: {
        scripts: ['https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js'],
        styles: ['https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css'],
    },
    alasql: {
        scripts: ['https://cdnjs.cloudflare.com/ajax/libs/alasql/0.5.5/alasql.min.js'],
    },
    flatpickr: {
        scripts: ['https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.5.2/flatpickr.min.js'],
        styles: [
            'https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.5.2/flatpickr.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.5.2/themes/dark.css',
        ],
    },
    fontawesome: {
        styles: ['https://use.fontawesome.com/releases/v5.6.3/css/all.css'],
    },
    'xlsx-style': {
        scripts: ['https://cdn.jsdelivr.net/npm/xlsx-style@0.8.13/dist/xlsx.full.min.js'],
    },
    materialdesignicons: {
        styles: ['https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.css'],
    },
};

interface Props {
    extras?: string[];
}

/**
 * These are the extra scripts or styles that an example can import.
 */
export const Extras = ({ extras }: Props) => {
    if (!extras) {
        return null;
    }

    const requiredExtras = new Set();

    extras.forEach((extra) => {
        requiredExtras.add(extra);

        if (extra === 'jqueryui') {
            // jQuery UI require jQuery
            requiredExtras.add('jquery');
        }
    });

    const styles = [];
    const scripts = [];

    // iterate over all possible scripts to ensure they are included in the correct order
    Object.keys(extrasMap).forEach((key) => {
        if (!requiredExtras.has(key)) {
            return;
        }

        const config = extrasMap[key];

        if (config.styles) {
            styles.push(...config.styles);
        }

        if (config.scripts) {
            scripts.push(...config.scripts);
        }
    });

    return (
        <>
            <Styles files={styles} />
            <Scripts files={scripts} />
        </>
    );
};
