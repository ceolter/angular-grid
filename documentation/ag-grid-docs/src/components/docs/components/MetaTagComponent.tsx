interface Props {
    tags: string[];
}

export const MetaTagComponent = ({ tags }: Props) => {
    return <div data-meta={JSON.stringify(tags).replaceAll('"', '&quot;')} />;
};
