import { Icon } from '@ag-website-shared/components/icon/Icon';
import tools from '@ag-website-shared/content/community/tools-extensions.json';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useState } from 'react';

import styles from './ToolsExtensions.module.scss';

const frameworks = [
    'React',
    'JavaScript',
    'TypeScript',
    'Angular',
    'Vue',
    'Python',
    'Svelte',
    'SolidJS',
    'Laravel',
    '.NET',
    'Rust',
];

const ToolsExtensions = ({ limit = -1 }) => {
    const applyLimit = (arr) => arr?.slice(0, limit == -1 ? tools.length : limit);
    const filterFrameworks = (framework) => {
        const filter = framework ? tools.filter((item) => item.frameworks?.includes(framework)) : tools;
        setSelectedFramework(framework);
        setFilteredTools(applyLimit(filter));
    };

    const [filteredTools, setFilteredTools] = useState(applyLimit(tools));
    const [selectedFramework, setSelectedFramework] = useState();

    const getGithubImage = (repo) => {
        // Extract the 'owner' and 'repo' from the GitHub URL
        const regex = /github\.com\/([^/]+)\/([^/]+)/;
        const match = repo.match(regex);
        if (match && match.length >= 3) {
            const owner = match[1];
            const repo = match[2];
            return `https://opengraph.githubassets.com/${new Date().getMilliseconds}/${owner}/${repo}`;
        } else {
            throw new Error('Invalid GitHub repository URL.');
        }
    };

    return (
        <div className={styles.container}>
            <div>
                <div className={styles.filterPanel}>
                    <div className={styles.filterButtonContainer}>
                        {/* Default / Reset Filter */}
                        <button
                            className={styles.filterButton}
                            {...(!selectedFramework ? { active: 'true' } : {})}
                            onClick={() => filterFrameworks(null)}
                        >
                            <Icon alt={`... logo`} name="listBoxes" svgClasses={styles.filterIcon} />
                            All
                        </button>

                        {/* Display all frameworks */}
                        {frameworks.map((framework, index) => (
                            <button
                                key={index}
                                className={styles.filterButton}
                                {...(selectedFramework === framework ? { active: 'true' } : {})}
                                onClick={() => filterFrameworks(framework)}
                            >
                                <img
                                    className={framework === 'Rust' ? styles.invert : ''}
                                    src={urlWithBaseUrl(`/community/frameworks/${framework.toLowerCase()}.svg`)}
                                    alt={`${framework}`}
                                />
                                {framework}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.listContainer}>
                {filteredTools.map((tool, index) => {
                    const link = tool.link ? tool.link : tool.repo;
                    return (
                        (!selectedFramework || tool.frameworks?.includes(selectedFramework)) && (
                            <div className={styles.linkWrapper} key={index}>
                                <div key={index} className={styles.itemContainer}>
                                    <a href={link} target="_blank" className={styles.image}>
                                        {
                                            <img
                                                src={`${tool.img ? urlWithBaseUrl(`/community/tools-extensions/${tool.img}`) : getGithubImage(tool.repo)}`}
                                                alt={`${tool.name} logo`}
                                            />
                                        }
                                    </a>
                                    <div className={styles.content}>
                                        <div className={styles.toolHeader}>
                                            <a href={link} target="_blank" className={styles.title}>
                                                {tool.title}
                                            </a>
                                            {tool.repo && (
                                                <a href={tool.repo} target="_blank">
                                                    <div className={styles.logoContainer}>
                                                        <Icon
                                                            alt={`GitHub logo`}
                                                            name="github"
                                                            svgClasses={styles.githubIcon}
                                                        />
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                        <a href={link} target="_blank" className={styles.description}>
                                            {tool.description}
                                        </a>
                                        <div className={styles.tagContainer}>
                                            {tool?.frameworks?.map((framework, index) => (
                                                <span key={index} className={styles.tag}>
                                                    <img
                                                        src={urlWithBaseUrl(
                                                            `/community/frameworks/${framework.toLowerCase()}.svg`
                                                        )}
                                                        className={styles.frameworkLogo}
                                                        alt={`${framework} logo`}
                                                    />
                                                    {framework}
                                                </span>
                                            ))}
                                            {tool?.tags?.map((tag, index) => (
                                                <span key={index} className={styles.tag}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    );
                })}
            </div>
        </div>
    );
};

export default ToolsExtensions;
