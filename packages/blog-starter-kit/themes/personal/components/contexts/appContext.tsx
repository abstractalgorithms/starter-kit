import React, { createContext, useContext } from 'react';
import {
	PageByPublicationQuery,
	PostFullFragment,
	PostFragment,
	PublicationFragment,
} from '../../generated/graphql';

type AppContext = {
	publication: PublicationFragment;
	posts: PostFragment[];
	footerPosts: PostFragment[];
	post: PostFullFragment | null;
	page: NonNullable<PageByPublicationQuery['publication']>['staticPage'];
};

const AppContext = createContext<AppContext | null>(null);

const AppProvider = ({
	children,
	publication,
	posts = [],
	footerPosts,
	post,
	page,
}: {
	children: React.ReactNode;
	publication: PublicationFragment;
	posts?: PostFragment[];
	footerPosts?: PostFragment[];
	post?: PostFullFragment | null;
	page?: NonNullable<PageByPublicationQuery['publication']>['staticPage'];
}) => {
	return (
		<AppContext.Provider
			value={{
				publication,
				posts,
				footerPosts: footerPosts ?? posts,
				post: post ?? null,
				page: page ?? null,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

const useAppContext = () => {
	const context = useContext(AppContext);

	if (!context) {
		throw new Error('useAppContext must be used within a <AppProvider />');
	}

	return context;
};
export { AppProvider, useAppContext };
