export function imageCellRenderer(params) {
    const imageUrl = params.value;
    const cellElement = document.createElement('div');

    // Create img element
    const imgElement = document.createElement('div');
    imgElement.classList.add('image-container');
    imgElement.style.maxWidth = '100%'; // Ensure the image fits within the cell width
    imgElement.style.maxHeight = '100px'; // Set max height for the image (adjust as needed)

    // Append img element to cell element
    cellElement.appendChild(imgElement);

    return cellElement;
}
