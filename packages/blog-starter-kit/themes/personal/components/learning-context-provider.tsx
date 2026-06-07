import { useRouter } from 'next/router';
import { startTransition, useEffect } from 'react';
import {
	LearningContextSnapshot,
	buildContextPrompt,
	contextAwareHref,
	useLearningContextStore,
} from '../lib/learning-context';

const inferSourceFromPath = (pathname: string): LearningContextSnapshot['source'] => {
	if (pathname === '/') return 'homepage';
	if (pathname === '/visualizations') return 'simulation';
	if (pathname === '/discover' || pathname === '/learn') return 'discover';
	if (pathname === '/guided-topics' || pathname.startsWith('/series') || pathname.startsWith('/topic')) return 'roadmap';
	if (pathname === '/interview-prep') return 'interview-prep';
	if (pathname === '/posts' || pathname === '/progress') return 'library';
	if (pathname !== '/404') return 'article';
	return 'unknown';
};

const getActiveHeading = () => {
	const headings = Array.from(
		document.querySelectorAll<HTMLElement>('article h2[id], article h3[id], main h2[id], main h3[id]'),
	);
	let active: HTMLElement | null = null;
	for (const heading of headings) {
		if (heading.getBoundingClientRect().top <= 140) active = heading;
	}
	return active;
};

export const LearningContextProvider = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const setContext = useLearningContextStore((state) => state.setContext);
	const setSection = useLearningContextStore((state) => state.setSection);
	const rememberPosition = useLearningContextStore((state) => state.rememberPosition);

	useEffect(() => {
		if (!router.isReady) return;
		startTransition(() => {
			setContext({
				source: inferSourceFromPath(router.pathname),
				pathname: router.asPath.split('#')[0].split('?')[0] || '/',
			});
		});
	}, [router.asPath, router.isReady, router.pathname, setContext]);

	useEffect(() => {
		if (!router.isReady || typeof window === 'undefined') return;

		let frame = 0;
		const remember = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const heading = getActiveHeading();
				startTransition(() => {
					if (heading?.id) {
						setSection({
							sectionId: heading.id,
							sectionTitle: heading.textContent?.trim() || heading.id,
						});
					}
					rememberPosition({
						pathname: router.asPath.split('#')[0].split('?')[0] || '/',
						scrollY: window.scrollY,
						sectionId: heading?.id,
						sectionTitle: heading?.textContent?.trim(),
						updatedAt: Date.now(),
					});
				});
			});
		};

		remember();
		window.addEventListener('scroll', remember, { passive: true });
		window.addEventListener('beforeunload', remember);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', remember);
			window.removeEventListener('beforeunload', remember);
			remember();
		};
	}, [rememberPosition, router.asPath, router.isReady, setSection]);

	return <>{children}</>;
};

export const useLearningContext = () => {
	const current = useLearningContextStore((state) => state.current);
	const positions = useLearningContextStore((state) => state.positions);
	const history = useLearningContextStore((state) => state.history);
	const setContext = useLearningContextStore((state) => state.setContext);
	const setSection = useLearningContextStore((state) => state.setSection);
	const rememberPosition = useLearningContextStore((state) => state.rememberPosition);

	const getContextHref = (action: 'assistant' | 'simulation' | 'roadmap' | 'continue') =>
		contextAwareHref(action, current, positions);

	const buildPrompt = (intent: string, extra?: string) => buildContextPrompt(intent, current, extra);

	return {
		context: current,
		positions,
		history,
		setContext,
		setSection,
		rememberPosition,
		getContextHref,
		buildPrompt,
	};
};
