export function statusCellRenderer(params) {
    const status = params.data.status.toLowerCase();

    const containerDiv = document.createElement('div');
    containerDiv.className = 'status-cell';

    if (status === 'active') {
        containerDiv.classList.add('active-tag');
    }

    const statusDiv = document.createElement('div');
    statusDiv.textContent = params.data.status;

    containerDiv.appendChild(statusDiv);

    return containerDiv;
}