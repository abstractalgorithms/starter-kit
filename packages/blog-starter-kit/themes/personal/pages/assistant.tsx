import type { GetStaticProps } from 'next';

export default function AssistantDisabledPage() {
	return null;
}

export const getStaticProps: GetStaticProps = async () => ({
	notFound: true,
});
