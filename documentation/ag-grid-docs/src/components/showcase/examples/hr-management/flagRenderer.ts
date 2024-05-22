export function flagRenderer(params) {
    console.log(arguments)
    const flag = params.data.flag
    const location = params.data.location
    const imgSrc = `/example/hr/${flag}.svg`; // Replace with the correct path to your images

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = location;
    img.style.width = '24x'; // Set image width
    img.style.height = '24px'; // Set image height

    const span = document.createElement('span');
    span.innerText = location;

    const container = document.createElement('div');

    const employeeData = document.createElement('div');

    container.appendChild(employeeData)
    container.appendChild(img);
    container.classList.add('employee-cell')
    employeeData.appendChild(span);
    employeeData.classList.add('employee-data')

    return container;
}
