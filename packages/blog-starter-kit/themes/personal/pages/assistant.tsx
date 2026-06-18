import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useFeatureConfig } from '../components/contexts/featureConfigContext';
import type { AssistantResponse } from './api/learning-assistant-mentor';

export default function AssistantPage() {
	const { features, loading: featureLoading } = useFeatureConfig();
	const [query, setQuery] = useState('');
	const [answer, setAnswer] = useState<AssistantResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!query.trim() || loading) return;
		setLoading(true);
		setError('');
		try {
			const response = await fetch('/api/learning-assistant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query.trim() }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Assistant request failed');
			setAnswer(data);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Assistant request failed');
		} finally {
			setLoading(false);
		}
	};

	if (featureLoading) return null;
	if (!features.assistant) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950"><div><h1 className="text-3xl font-black text-slate-950 dark:text-white">AI Assistant is currently unavailable</h1><p className="mt-3 text-slate-500">This feature can be enabled by an administrator.</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Return home</Link></div></main>;

	return <><Head><title>AI Assistant · Abstract Algorithms</title></Head><main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950"><div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Learning assistant</p><h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Ask about software engineering</h1></div><Link href="/" className="text-sm font-semibold text-blue-600">Back to blog</Link></div><form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={4} placeholder="Ask about system design, distributed systems, AI engineering…" className="w-full resize-none rounded-xl border border-slate-200 bg-transparent p-4 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white" /><button disabled={loading || !query.trim()} className="mt-3 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? 'Thinking…' : 'Ask Assistant'}</button></form>{error ? <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}{answer ? <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><p className="leading-7 text-slate-700 dark:text-slate-200">{answer.overview}</p>{answer.answerBullets?.length ? <ul className="mt-5 space-y-3">{answer.answerBullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300"><span className="text-blue-600">●</span>{bullet}</li>)}</ul> : null}{answer.recommendedSequence?.length ? <div className="mt-7"><h2 className="font-black text-slate-900 dark:text-white">Recommended reading</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{answer.recommendedSequence.slice(0, 4).map((item) => <Link key={item.slug} href={`/${item.slug}`} className="rounded-xl border border-slate-200 p-4 hover:border-blue-400 dark:border-slate-700"><p className="font-bold text-slate-900 dark:text-white">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.reason}</p></Link>)}</div></div> : null}</section> : null}</div></main></>;
}
