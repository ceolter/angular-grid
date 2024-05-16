export function imageCellRenderer(params) {
    const ticker = params.value.toLowerCase();
    const tickerNormal = params.value;
    const imgSrc = `/example/finance/logos/${ticker}.png`; // Replace with the correct path to your images

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = ticker;
    img.style.width = '20px'; // Set image width
    img.style.height = '20px'; // Set image height
    img.style.marginRight = '5px'; // Space between image and text
    img.style.borderRadius= '100px';

    const span = document.createElement('span');
    span.innerText = tickerNormal;

    const container = document.createElement('div');
    container.appendChild(img);
    container.appendChild(span);

    return container;
}
