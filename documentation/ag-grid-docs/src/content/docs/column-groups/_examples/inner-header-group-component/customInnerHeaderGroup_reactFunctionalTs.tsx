import React from 'react';

import type { CustomHeaderGroupProps } from 'ag-grid-react';

export interface MyCustomInnerHeaderGroupProps extends CustomHeaderGroupProps {
    icon: string;
}

export default (props: MyCustomInnerHeaderGroupProps) => {
    return (
        <div className="customInnerHeaderGroup">
            {props.icon && <i className={`fa ${props.icon}`}></i>}
            <span>{props.displayName}</span>
        </div>
    );
};
