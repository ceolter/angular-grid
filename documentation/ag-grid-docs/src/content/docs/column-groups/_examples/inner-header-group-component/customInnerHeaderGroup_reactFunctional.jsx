import React from 'react';

export default (props) => {
    return (
        <div className="customInnerHeaderGroup">
            {props.icon && <i className={`fa ${props.icon}`}></i>}
            <span>{props.displayName}</span>
        </div>
    );
};
