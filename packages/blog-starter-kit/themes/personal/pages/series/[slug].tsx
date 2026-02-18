import { GetStaticProps } from 'next';

// Series functionality is currently not fully available via Hashnode GraphQL
// Series can be viewed through tags using the tag pages

type Params = {
	slug: string;
};

export const getStaticProps: GetStaticProps<{}, Params> = async ({ params }) => {
	// Series detail pages are not available - redirect to using tag pages instead
	return {
		notFound: true,
	};
};

export async function getStaticPaths() {
	return {
		paths: [],
		fallback: 'blocking',
	};
}

export default function SeriesDetailPage() {
	return null;
}
