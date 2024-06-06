import { Icon } from '@ag-website-shared/components/icon/Icon';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import styles from './Demos.module.scss';

const GitHubDetails = ({ favouritesOnly, repo }) => {
    if (repo != '' && repo != undefined && favouritesOnly) {
        const regex = /github\.com\/([^/]+)\/([^/]+)/;
        const match = repo?.match(regex);
        return (
            <div className={styles.gitHubDetails}>
                <img alt="GitHub Repo stars" src={`https://img.shields.io/github/stars/${match[1]}/${match[2]}`} />
            </div>
        );
    } else {
        return (
            <div className={styles.gitHubDetails}>
                <Icon name="github" svgClasses={styles.gibHubIcon} />
            </div>
        );
    }
};

const Showcase = ({ showcase, favouritesOnly = false, maxItems = -1 }) => {
    const selectedShowcase = favouritesOnly ? showcase.favourites : showcase.other;
    const productsSortedByStars = selectedShowcase.sort((a, b) => b.stars - a.stars);
    const products = maxItems === -1 ? productsSortedByStars : productsSortedByStars.slice(0, maxItems);

    return (
        <div className={styles.cardContainer}>
            {products.map((product) => (
                <div key={product.title} className={`${styles.card} ${favouritesOnly ? '' : styles.smallCard}`}>
                    {favouritesOnly && (
                        <a href={product.link} target="_blank" className={styles.header}>
                            <img
                                className={styles.image}
                                src={urlWithBaseUrl(
                                    product.img
                                        ? `/community/showcase/${product.img}`
                                        : '/community/showcase/sample.png'
                                )}
                                alt={product.title}
                            />
                        </a>
                    )}
                    <div className={styles.body}>
                        <a target="_blank" href={product.repo}>
                            <GitHubDetails favouritesOnly={favouritesOnly} repo={product.repo} />
                        </a>
                        <a href={product.link} target="_blank">
                            <div className={styles.titleContainer}>
                                <p className={styles.title}>{product.title}</p>
                            </div>
                            <p className={styles.description}>{product.description}</p>
                        </a>
                    </div>
                    {favouritesOnly && (
                        <div className={styles.footer}>
                            {product.frameworks?.map((framework, index) => (
                                <span key={'framework-' + index} className={styles.tags}>
                                    <img
                                        src={urlWithBaseUrl(`/community/frameworks/${framework.toLowerCase()}.svg`)}
                                        style={{ width: 18, height: 18, marginRight: 6 }}
                                        alt={`${framework} logo`}
                                    />
                                    <p>{framework}</p>
                                </span>
                            ))}
                            {product.tags?.map((tag, index) => (
                                <span key={'tag-' + index} className={styles.tags}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Showcase;
