export function productCellRenderer(params) {
    const productName = params.data.product;
    const availableStock = params.data.available;

    const containerDiv = document.createElement('div');
    containerDiv.className = 'product-cell';
  

    const productDiv = document.createElement('div');
    productDiv.textContent = productName;

    const stockDiv = document.createElement('div');
    stockDiv.textContent = `${availableStock} in stock`;

    containerDiv.appendChild(productDiv);
    containerDiv.appendChild(stockDiv);
    stockDiv.className = 'stock-cell'

    return containerDiv;
}