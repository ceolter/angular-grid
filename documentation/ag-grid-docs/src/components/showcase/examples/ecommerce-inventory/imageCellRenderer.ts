export function imageCellRenderer(params) {
    var imageUrl = params.value;
    var cellElement = document.createElement('div');

    // Create img element
    var imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.style.maxWidth = '100%'; // Ensure the image fits within the cell width
    imgElement.style.maxHeight = '100px'; // Set max height for the image (adjust as needed)

    // Append img element to cell element
    cellElement.appendChild(imgElement);

    return cellElement;
}
