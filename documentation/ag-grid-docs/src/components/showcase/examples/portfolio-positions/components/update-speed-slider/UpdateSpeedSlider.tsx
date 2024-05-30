import { type FunctionComponent } from 'react';

import styles from './UpdateSpeedSlider.module.css';

interface Props {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}

export const UpdateSpeedSlider: FunctionComponent<Props> = ({ value, min, max, step, onChange }) => {
    return (
        <div className={styles.slider}>
            <label htmlFor="update-speed-slider">
                <span className="text-secondary">Update speed:</span>{' '}
                <span className={styles.updateSpeed}>{value <= 0 ? '0' : `${value}x`}</span>
            </label>
            <input
                type="range"
                id="update-speed-slider"
                name="update-speed-slider"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(parseFloat(event.target?.value))}
            />
        </div>
    );
};
