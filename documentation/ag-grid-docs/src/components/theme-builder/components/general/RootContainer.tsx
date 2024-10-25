import styled from '@emotion/styled';

import { useRenderedTheme } from '../../model/rendered-theme';
import { EditorPanel } from '../editors/EditorPanel';
import { PresetSelector } from '../presets/PresetSelector';
import { GetThemeButton } from './GetTheme';
import { GridPreview } from './GridPreview';

export const RootContainer = () => {
    // makes variables available for use by editors
    useRenderedTheme();

    return (
        <Container>
            <Menu>
                <EditorScroller>
                    <EditorPanel />
                </EditorScroller>
                <MenuBottom>
                    <GetThemeButton />
                </MenuBottom>
            </Menu>
            <Main>
                <PresetSelector />
                <GridPreview />
            </Main>
        </Container>
    );
};

const Container = styled('div')`
    --layout-site-header-height: 120px;

    width: 100%;
    height: calc(100vh - var(--layout-site-header-height) - 32px);
    min-height: 600px;
    margin-top: 16px;
    display: flex;
    user-select: none;
    cursor: default;

    font-family: -apple-system, BlinkMacSystemFont, 'IBM Plex Sans', sans-serif;

    .tooltip {
        max-width: 400px;
    }

    @media screen and (max-width: 799px) {
        display: none;
    }

    @media (min-width: 1052px) {
        --layout-site-header-height: 64px;
    }
`;

const EditorScroller = styled('div')`
    position: absolute;
    inset: 0 0 48px 0;
    overflow-y: auto;
    z-index: 0; // z-index:0 prevents a Safari rendering bug where scrollbars appear over tooltips
`;

const Menu = styled('div')`
    min-width: 300px;
    flex: 0;
    position: relative;
`;

const MenuBottom = styled('div')`
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: space-between;

    &:after {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: 12px;
        margin-top: -12px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--color-bg-primary) 100%);
    }
`;

const Main = styled('div')`
    flex-grow: 1;
    min-width: 0;
    grid-area: main;
    padding-left: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 20px;
`;
