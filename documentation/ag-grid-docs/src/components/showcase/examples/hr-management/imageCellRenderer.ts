export function imageCellRenderer(params) {
    console.log(arguments)
    const image = params.value.toLowerCase();
    const tickerNormal = params.value;
    const number = params.data.image
    const title = params.data.jobTitle
    const imgSrc = `/example/hr/${number}.png`; // Replace with the correct path to your images

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = image;
    img.style.width = '40x'; // Set image width
    img.style.height = '40px'; // Set image height
    img.style.marginRight = '5px'; // Space between image and text
    img.style.borderRadius= '100px';

    const span = document.createElement('span');
    span.innerText = tickerNormal;


    const spanDescription = document.createElement('span');
    spanDescription.innerText = title
    spanDescription.classList.add('description')

    const container = document.createElement('div');

    const employeeData = document.createElement('div');

    container.appendChild(employeeData)
    container.appendChild(img);
    container.classList.add('employee-cell')
    employeeData.appendChild(span);
    employeeData.appendChild(spanDescription);
    employeeData.classList.add('employee-data')

    return container;
}
