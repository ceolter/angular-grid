import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

export function renderPdfLink() {
    const linkText = '';

    const linkElement = document.createElement('button');
    linkElement.textContent = linkText;
    linkElement.classList.add('button-secondary', 'advice'); // Add multiple classes

    const imgElement = document.createElement('img');
    imgElement.src = urlWithBaseUrl(`/example/finance/icons/documentation.svg`);
    imgElement.classList.add('adviceIcon'); // Add class to the image
    imgElement.alt = 'Documentation Icon'; // Add alt text for accessibility

    linkElement.insertBefore(imgElement, linkElement.firstChild); // Insert image before text

    return linkElement.outerHTML;
}
