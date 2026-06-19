import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from './analytics';
import { Integrations } from './integrations';
import { Meta } from './meta';
import { PostChatbot } from './post-chatbot';
import { Scripts } from './scripts';

type Props = {
	children: React.ReactNode;
};

export const Layout = ({ children }: Props) => {
	const speedInsightsEnabled =
		process.env.NEXT_PUBLIC_ENABLE_SPEED_INSIGHTS === 'true';

	return (
		<>
			<Meta />
			<Scripts />
			<div className="min-h-screen bg-white dark:bg-neutral-950">
				<main>{children}</main>
			</div>
			<PostChatbot />
			<Analytics />
			<Integrations />
			{speedInsightsEnabled ? <SpeedInsights /> : null}
		</>
	);
};
