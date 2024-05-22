export function tagCellRenderer(params) {
    const department = params.data.department;

    // Create a span for the department name
    const span = document.createElement('span');
    span.innerText = department;

    // Create a circle element
    const circle = document.createElement('div');
    circle.classList.add('circle'); // Add a base class for the circle

    // Create the container div
    const container = document.createElement('div');
    container.classList.add('tag'); // Add a base class for the tag

    // Assign different classes based on the department name
    switch(department) {
        case 'Design':
            container.classList.add('design-tag');
            circle.classList.add('design-circle');
            break;
        case 'Engineering':
            container.classList.add('engineering-tag');
            circle.classList.add('engineering-circle');
            break;
        case 'Executive Management':
            container.classList.add('executive-management-tag');
            circle.classList.add('executive-management-circle');
            break;
        case 'Product':
            container.classList.add('product-tag');
            circle.classList.add('product-circle');
            break;
        default:
            container.classList.add('default-tag'); // Optional: for departments not listed
            circle.classList.add('default-circle');
    }

    container.appendChild(circle); // Append the circle before the department name
    container.appendChild(span);

    return container;
}