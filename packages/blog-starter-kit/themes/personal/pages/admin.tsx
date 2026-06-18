import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../components/contexts/authContext';
import type { FeatureConfig } from '../components/contexts/featureConfigContext';

type Overview = { totalUsers: number; features: FeatureConfig };

export default function AdminPage() {
	const { user, loading: authLoading } = useAuth();
	const [overview, setOverview] = useState<Overview | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<keyof FeatureConfig | null>(null);
	const [error, setError] = useState('');

	const loadOverview = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError('');
		try {
			const token = await user.getIdToken(true);
			const response = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Unable to load admin dashboard');
			setOverview(data);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard');
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => { if (!authLoading) void loadOverview(); }, [authLoading, loadOverview]);

	const toggleFeature = async (feature: keyof FeatureConfig) => {
		if (!user || !overview || saving) return;
		setSaving(feature);
		setError('');
		const next = { ...overview.features, [feature]: !overview.features[feature] };
		try {
			const token = await user.getIdToken();
			const response = await fetch('/api/admin/overview', {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify(next),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || 'Unable to save feature configuration');
			setOverview((current) => current ? { ...current, features: data.features } : current);
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : 'Unable to save feature configuration');
		} finally {
			setSaving(null);
		}
	};

	return <>
		<Head><title>Admin · Abstract Algorithms</title></Head>
		<main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950">
			<div className="mx-auto w-full max-w-[1440px]">
				<div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Administration</p><h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Site controls</h1><p className="mt-2 text-sm text-slate-500">Manage live blog features and view Firebase Authentication usage.</p></div><Link href="/" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Back to site</Link></div>
				{loading ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Loading admin data…</div> : error && !overview ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div> : overview ? <>
					<div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold text-slate-500">Total users</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{overview.totalUsers}</p><p className="mt-1 text-xs text-slate-400">Firebase Authentication accounts</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold text-slate-500">Enabled features</p><p className="mt-2 text-3xl font-black text-emerald-600">{Object.values(overview.features).filter(Boolean).length}</p><p className="mt-1 text-xs text-slate-400">of {Object.keys(overview.features).length} configurable</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-semibold text-slate-500">Configuration</p><p className="mt-2 text-lg font-black text-blue-600">Live</p><p className="mt-1 text-xs text-slate-400">Stored in Firestore</p></div></div>
					<section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><div className="mb-5"><h2 className="text-lg font-black text-slate-950 dark:text-white">Feature configuration</h2><p className="mt-1 text-sm text-slate-500">Enabled features appear in account navigation and their routes become available.</p></div><div className="divide-y divide-slate-200 dark:divide-slate-800">{([
						{ key: 'interviewPrep' as const, name: 'Interview Prep', description: 'Practice dashboard, mock interview workflows, and interview learning paths.' },
						{ key: 'assistant' as const, name: 'AI Assistant', description: 'Blog learning assistant for questions and guided article discovery.' },
					] as const).map((feature) => <div key={feature.key} className="flex items-center justify-between gap-5 py-5"><div><p className="font-bold text-slate-900 dark:text-white">{feature.name}</p><p className="mt-1 text-sm text-slate-500">{feature.description}</p></div><button type="button" disabled={saving !== null} onClick={() => void toggleFeature(feature.key)} aria-pressed={overview.features[feature.key]} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${overview.features[feature.key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${overview.features[feature.key] ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>)}</div></section>
					{error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
				</> : <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">Sign in with an administrator account to continue.</div>}
			</div>
		</main>
	</>;
}
