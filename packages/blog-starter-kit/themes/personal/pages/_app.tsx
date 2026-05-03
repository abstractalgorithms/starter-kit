import { ThemeProvider } from 'next-themes';
import { AppProps } from 'next/app';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { useEffect } from 'react';
import 'katex/dist/katex.min.css';
import '../styles/index.css';
import '../styles/diagram-enhancements.css';

// Next.js 13 passes fetchPriority (camelCase) to <img> which React 18.3 warns about.
// This is a framework-level issue, not our code. Suppress only this specific warning.
if (typeof window !== 'undefined') {
	const _consoleError = console.error.bind(console);
	console.error = (...args: unknown[]) => {
		if (typeof args[0] === 'string' && args[0].includes('fetchPriority')) return;
		_consoleError(...args);
	};
}

const plusJakartaSans = Plus_Jakarta_Sans({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
	variable: '--font-plus-jakarta-sans',
});

export default function MyApp({ Component, pageProps }: AppProps) {
	useEffect(() => {
		(window as any).adjustIframeSize = (id: string, newHeight: string) => {
			const i = document.getElementById(id);
			if (!i) return;
			// eslint-disable-next-line radix
			i.style.height = `${parseInt(newHeight)}px`;
		};
	}, []);
	return (
		<ThemeProvider attribute="class">
			<main className={`${plusJakartaSans.variable} font-sans`}>
				<Component {...pageProps} />
			</main>
		</ThemeProvider>
	);
}
