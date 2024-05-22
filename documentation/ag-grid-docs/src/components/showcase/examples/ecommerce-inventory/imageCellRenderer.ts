export function imageCellRenderer(params) {
    const imageUrl = params.value;
    const cellElement = document.createElement('div');

    // const imgSrc = `/example/inventory/product-item.svg`; // Replace with the correct path to your images

    // const img = document.createElement('img');
    // img.src = imgSrc;
    // img.alt = "Product item";
    // img.style.width = '20px'; // Set image width
    // img.style.height = '20px'; // Set image height
    // img.style.marginRight = '5px'; // Space between image and text
    // img.style.borderRadius= '100px';

    // Create img element
    const imgElement = document.createElement('div');
    imgElement.classList.add('image-container');
    imgElement.style.maxWidth = '100%'; // Ensure the image fits within the cell width
    imgElement.style.maxHeight = '100px'; // Set max height for the image (adjust as needed)

    // Append img element to cell element
    cellElement.appendChild(imgElement);
    // imgElement.appendChild(img);

    cellElement.classList.add('product-cell-image')
    
    return cellElement;
}
