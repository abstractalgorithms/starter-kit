'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from './contexts/authContext';
import { useUserProgress } from '../hooks/useProgress';
import { useFeatureConfig } from './contexts/featureConfigContext';

type UserProfileProps = {
	onLoginClick: () => void;
};

type MenuIconName = 'book' | 'chart' | 'bookmark' | 'star' | 'practice' | 'ai' | 'theme' | 'logout';

const MenuIcon = ({ name }: { name: MenuIconName }) => {
	const paths: Record<MenuIconName, React.ReactNode> = {
		book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></>,
		chart: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19V3" /></>,
		bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
		star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
		practice: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m15 9 5-5" /></>,
		ai: <><rect x="4" y="6" width="16" height="13" rx="3" /><path d="M9 11h.01M15 11h.01M9 15h6M12 6V3" /></>,
		theme: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
		logout: <><path d="M10 5H5v14h5" /><path d="m15 8 4 4-4 4M8 12h11" /></>,
	};
	return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

export const UserProfile = ({ onLoginClick }: UserProfileProps) => {
	const { user, logout } = useAuth();
	const { posts, learningStreak } = useUserProgress();
	const { resolvedTheme, setTheme } = useTheme();
	const { features } = useFeatureConfig();
	const [isOpen, setIsOpen] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const bookmarkedCount = useMemo(() => posts.filter((post) => post.isBookmarked).length, [posts]);
	const ratingCount = useMemo(() => posts.filter((post) => post.rating !== null).length, [posts]);

	useEffect(() => {
		if (!user) {
			setIsAdmin(false);
			return;
		}
		void user.getIdTokenResult().then((result) => setIsAdmin(result.claims.admin === true)).catch(() => setIsAdmin(false));
	}, [user]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
		};
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsOpen(false);
		};
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEscape);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isOpen]);

	if (!user) {
		return <button onClick={onLoginClick} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="hidden sm:inline">Sign in</span></button>;
	}

	const initials = (user.displayName || user.email || 'User').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
	const menuGroups = [
		[
			{ label: 'Continue Learning', href: '/posts', icon: 'book' as const },
			{ label: 'My Progress', href: '/progress', icon: 'chart' as const },
			{ label: 'Bookmarks', href: '/progress#bookmarks', icon: 'bookmark' as const, badge: bookmarkedCount },
			{ label: 'My Ratings', href: '/progress#ratings', icon: 'star' as const, badge: ratingCount },
		],
		[
			...(features.interviewPrep ? [{ label: 'Interview Prep', href: '/interview-prep', icon: 'practice' as const }] : []),
			...(features.assistant ? [{ label: 'AI Assistant', href: '/assistant', icon: 'ai' as const }] : []),
		],
		...(isAdmin ? [[{ label: 'Admin Panel', href: '/admin', icon: 'chart' as const }]] : []),
	];

	return (
		<div className="relative" ref={menuRef}>
			<button onClick={() => setIsOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full" aria-label="Account menu" aria-haspopup="menu" aria-expanded={isOpen}>
				<span className="rounded-full border-2 border-blue-500 p-0.5">
					{user.photoURL ? <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{initials}</span>}
				</span>
				<svg className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" /></svg>
			</button>

			{isOpen ? (
				<div role="menu" className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900">
					<div className="flex items-center gap-3 px-5 py-5">
						{user.photoURL ? <img src={user.photoURL} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">{initials}</span>}
						<div className="min-w-0"><p className="truncate text-base font-extrabold text-slate-950 dark:text-white">{user.displayName || 'Reader'}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p><p className="mt-1 text-xs font-semibold text-orange-600">🔥 {learningStreak} day learning streak</p></div>
					</div>

					{menuGroups.filter((group) => group.length > 0).map((group, groupIndex) => <div key={groupIndex} className="border-t border-slate-200 py-2 dark:border-slate-700">{group.map((item) => <Link key={item.label} href={item.href} role="menuitem" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"><MenuIcon name={item.icon} /><span className="flex-1">{item.label}</span>{'badge' in item && (item.badge ?? 0) > 0 ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span> : null}<span className="text-lg text-slate-400">›</span></Link>)}</div>)}

					<div className="border-t border-slate-200 py-2 dark:border-slate-700"><button type="button" role="menuitem" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800"><MenuIcon name="theme" /><span className="flex-1">Appearance</span><span className="text-xs text-slate-400">{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</span></button></div>

					<div className="border-t border-slate-200 p-2 dark:border-slate-700"><button type="button" role="menuitem" onClick={async () => { await logout(); setIsOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"><MenuIcon name="logout" />Sign out</button></div>
				</div>
			) : null}
		</div>
	);
};
