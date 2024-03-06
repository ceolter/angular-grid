import { Add, ChevronDown, TrashCan } from '@carbon/icons-react';
import { Dropdown, IconButton, Menu, MenuButton, MenuItem, Stack, styled } from '@mui/joy';
import { FC, ReactNode } from 'react';
import { withErrorBoundary } from '../../components/ErrorBoundary';
import { Cell } from '../../components/Table';
import {
  PartModel,
  allPartModels,
  usePartEnabledAtom,
  usePartPresetAtom,
} from '../../model/PartModel';
import { PresetPreview } from './preset-preview/PresetPreview';

export const PartsEditor = withErrorBoundary(() => (
  <PartsTable>
    {allPartModels().map((part) => (
      <PartEditor key={part.partId} part={part} />
    ))}
  </PartsTable>
));

type PartEditorProps = {
  part: PartModel;
};

const PartEditor = ({ part }: PartEditorProps) => {
  const [enabled, setEnabled] = usePartEnabledAtom(part);
  const [presetString, setPresetString] = usePartPresetAtom(part);

  const { presets } = part;

  if (!presets) return null;

  const preset = presets.find((p) => p.presetId === presetString) || part.defaultPreset;

  return (
    <>
      <Cell>{part.label}</Cell>
      <Cell>
        {!enabled ? (
          <StateAndIconButton label="none" icon={<Add />} onClick={() => setEnabled(true)} />
        ) : (
          <Dropdown>
            <PartsMenuButton size="sm" endDecorator={<DropdownIcon />}>
              {preset ? <PresetPreview part={part} preset={preset} /> : 'enabled'}
            </PartsMenuButton>
            <Menu placement="bottom-start">
              {part.presets?.map((preset) => (
                <MenuItem
                  key={preset.presetId}
                  onClick={() => setPresetString(preset.presetId)}
                  selected={presetString === preset.presetId}
                >
                  <PresetPreview part={part} preset={preset} />
                </MenuItem>
              ))}

              {/* 
              <ListItemButton
                onClick={() => {
                  setValue(getPartPreset(partId, defaultPresetId || activePresetId).params);
                  setShowEditor(true);
                }}
              >
                <SettingsAdjust /> Customise
              </ListItemButton>
               */}
              {!part.alwaysPresent && (
                <MenuItem onClick={() => setEnabled(false)}>
                  <TrashCan /> Remove
                </MenuItem>
              )}
            </Menu>
          </Dropdown>
        )}
      </Cell>
      {/* <ExpandingParamsEditor {...props} show={showEditor} onHide={() => setShowEditor(false)} /> */}
    </>
  );
};

const DropdownIcon = styled(ChevronDown)`
  zoom: 80%;
`;

const PartsTable = styled('div')`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 16px;
  grid-row-gap: 8px;
`;

const StateAndIconButton: FC<{
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}> = (props) => (
  <Stack minHeight={36} direction="row" alignItems="center" fontStyle="italic">
    {props.label}
    <IconButton
      size="sm"
      variant={props.active ? 'solid' : 'outlined'}
      sx={{
        '--IconButton-size': '20px',
      }}
      onClick={props.onClick}
    >
      {props.icon}
    </IconButton>
  </Stack>
);

const PartsMenuButton = styled(MenuButton)`
  font-weight: 500;
`;
