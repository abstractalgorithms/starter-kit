declare namespace NodeJS {
	interface ProcessEnv {
		[key: string]: string | undefined;
		NEXT_PUBLIC_ENABLE_NEWSLETTER_SUBSCRIBE?: 'true' | 'false';
		NEXT_PUBLIC_ENABLE_VISUALIZATION_LAB?: 'true' | 'false';
		NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT: string;
		NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST: string;
		// add more environment variables and their types here
	}
}
