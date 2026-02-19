import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from './analytics';
import { Integrations } from './integrations';
import { Meta } from './meta';
import { Scripts } from './scripts';
import NewsletterFloater from './newsletter-floater';

type Props = {
	children: React.ReactNode;
};

export const Layout = ({ children }: Props) => {
	return (
		<>
			<Meta />
			<Scripts />
			<div className="min-h-screen bg-white dark:bg-neutral-950">
				<main>{children}</main>
				<NewsletterFloater />
			</div>
			<Analytics />
			<Integrations />
			<SpeedInsights />
		</>
	);
};
