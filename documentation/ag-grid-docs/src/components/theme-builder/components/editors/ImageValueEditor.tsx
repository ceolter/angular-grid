import styled from '@emotion/styled';
import { Info } from 'lucide-react';

import { type ValueEditorProps } from './ValueEditorProps';

export const ImageValueEditor = (_: ValueEditorProps<unknown>) => {
    return (
        <NotSupported>
            <InfoIcon data-lucide="align-center" width={14} /> Image values can't be edited in the theme builder, export
            the theme and use <a href="/react-data-grid/theming-parameters/#image-values">theme parameters</a> to embed
            an SVG image.
        </NotSupported>
    );
};

const InfoIcon = styled(Info)`
    margin-top: -4px;
`;

const NotSupported = styled('span')`
    font-style: italic;
    opacity: 0.7;
    padding-left: 8px;
    font-size: 0.8em;
`;
