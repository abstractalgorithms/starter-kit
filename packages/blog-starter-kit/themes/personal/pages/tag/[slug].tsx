import type { GetStaticPaths, GetStaticProps } from 'next';

type Params = {
	slug: string;
};

export default function LegacyTagRedirect() {
	return null;
}

export const getStaticProps: GetStaticProps<Record<string, never>, Params> = async ({ params }) => {
	if (!params?.slug) {
		return { notFound: true };
	}

	return {
		redirect: {
			destination: `/topic/${params.slug}`,
			permanent: true,
		},
	};
};

export const getStaticPaths: GetStaticPaths<Params> = async () => ({
	paths: [],
	fallback: 'blocking',
});
