import { type FunctionComponent } from 'react';

import styles from './EmployeeDetailsRenderer.module.css';

interface Props {}

export const EmployeeDetailsRenderer: FunctionComponent<Props> = () => {
    return (
        <div className={styles.employeeCell}>
            <div className={styles.employeeData}>
                <span className={styles.employeeName}>Office Supplies Allowance</span>
                <span className={styles.description}>Effective Payroll: June 2024</span>
            </div>
        </div>
    );
};
