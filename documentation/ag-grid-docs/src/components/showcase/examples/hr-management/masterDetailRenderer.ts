export function masterDetailRenderer(params) {
    const span = document.createElement('span');
    span.innerText = 'Office Supplies Allowance';
    span.classList.add('employee-name');

    const spanDescription = document.createElement('span');
    spanDescription.innerText = 'Effective Payroll: June 2024';
    spanDescription.classList.add('description');

    const container = document.createElement('div');

    const employeeData = document.createElement('div');

    container.appendChild(employeeData);
    container.classList.add('employee-cell');
    employeeData.appendChild(span);
    employeeData.appendChild(spanDescription);
    employeeData.classList.add('employee-data');

    return container;
}
