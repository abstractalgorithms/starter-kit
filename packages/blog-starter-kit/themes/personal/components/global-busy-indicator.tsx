import { useRouter } from 'next/router';
import { startTransition, useEffect, useRef, useState } from 'react';

const TRACKED_API_PATTERN = /\/api\/(?!analytics|og\/|progress\/track-time)/;
const SHOW_DELAY_MS = 180;

const shouldTrackRequest = (input: RequestInfo | URL) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
	if (!url) return false;

	try {
		const parsed = new URL(url, window.location.origin);
		if (parsed.origin !== window.location.origin) return false;
		return TRACKED_API_PATTERN.test(parsed.pathname);
	} catch {
		return TRACKED_API_PATTERN.test(url);
	}
};

export const GlobalBusyIndicator = () => {
	const router = useRouter();
	const [pendingCount, setPendingCount] = useState(0);
	const [visible, setVisible] = useState(false);
	const hideTimerRef = useRef<number | null>(null);
	const showTimerRef = useRef<number | null>(null);

	const begin = () => startTransition(() => setPendingCount((count) => count + 1));
	const end = () => startTransition(() => setPendingCount((count) => Math.max(0, count - 1)));

	useEffect(() => {
		const routeStart = () => begin();
		const routeDone = () => end();

		router.events.on('routeChangeStart', routeStart);
		router.events.on('routeChangeComplete', routeDone);
		router.events.on('routeChangeError', routeDone);

		return () => {
			router.events.off('routeChangeStart', routeStart);
			router.events.off('routeChangeComplete', routeDone);
			router.events.off('routeChangeError', routeDone);
		};
	}, [router.events]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const originalFetch = window.fetch.bind(window);

		window.fetch = async (input, init) => {
			const tracked = shouldTrackRequest(input);
			if (tracked) begin();
			try {
				return await originalFetch(input, init);
			} finally {
				if (tracked) end();
			}
		};

		return () => {
			window.fetch = originalFetch;
		};
	}, []);

	useEffect(() => {
		if (pendingCount > 0) {
			if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
			showTimerRef.current = window.setTimeout(() => startTransition(() => setVisible(true)), SHOW_DELAY_MS);
			return;
		}

		if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
		hideTimerRef.current = window.setTimeout(() => startTransition(() => setVisible(false)), 120);
	}, [pendingCount]);

	useEffect(
		() => () => {
			if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
			if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
		},
		[],
	);

	if (!visible) return null;

	return (
		<div aria-live="polite" aria-label="Updating content" className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
			<div className="h-0.5 w-full overflow-hidden bg-blue-500/10">
				<div className="aa-global-busy-bar h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400" />
			</div>
			<div className="mx-auto mt-3 flex max-w-7xl justify-end px-4">
				<div className="rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-[11px] font-bold text-neutral-600 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-300">
					Updating
				</div>
			</div>
		</div>
	);
};
