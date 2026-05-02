'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '../pages/api/chat';

type Props = {
	postTitle?: string;
	postContent?: string;
};

type ChatMessage = Message & { id: number; streaming?: boolean; suggestions?: string[] };

const WIKI_CHAT_API = '/api/wiki-chat';
const PRIMARY_SITE_ORIGIN = 'https://abstractalgorithms.dev';
const HASHNODE_HOST_MATCH = /(^|\.)hashnode\.(dev|com)$/i;

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

function sanitizeHref(rawHref: string): string | null {
	const href = rawHref.trim().replace(/^<|>$/g, '');
	if (!href) return null;
	const lowered = href.toLowerCase();
	if (DANGEROUS_PROTOCOLS.some((p) => lowered.startsWith(p))) return null;
	return href;
}

function normalizeToPrimaryDomain(href: string): string {
	if (href.startsWith('/') || href.startsWith('#')) return href;

	try {
		const parsed = new URL(href);
		const isHashnode = HASHNODE_HOST_MATCH.test(parsed.hostname);
		if (!isHashnode) return href;

		const target = new URL(PRIMARY_SITE_ORIGIN);
		target.pathname = parsed.pathname;
		target.search = parsed.search;
		target.hash = parsed.hash;
		return target.toString();
	} catch {
		return href;
	}
}

function wikiPathToHref(path: string): string {
	return `${PRIMARY_SITE_ORIGIN}/${path}`;
}

function resolveInlineLinkHref(rawHref: string): string | null {
	const safe = sanitizeHref(rawHref);
	if (!safe) return null;

	if (
		safe.startsWith('/') ||
		safe.startsWith('#') ||
		safe.startsWith('http://') ||
		safe.startsWith('https://')
	) {
		return normalizeToPrimaryDomain(safe);
	}

	if (safe.startsWith('wiki/') || safe.startsWith('tags/') || safe.startsWith('series/') || safe.startsWith('tag/')) {
		return wikiPathToHref(safe);
	}

	if (/^[a-z0-9][a-z0-9-]*$/i.test(safe)) {
		return `/${safe}`;
	}

	return null;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const ChatIcon = () => (
	<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
		/>
	</svg>
);

const CloseIcon = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
	</svg>
);

const SendIcon = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
	</svg>
);

const SparkleIcon = () => (
	<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
		<path d="M12 2l2.09 6.41L20.5 9l-5 4.59L17 21l-5-3.91L7 21l1.5-7.41L3.5 9l6.41-.59L12 2z" />
	</svg>
);

const Spinner = () => (
	<svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
	</svg>
);

// ── Simple inline markdown renderer (links, bold, code, line breaks) ───────────

function renderAnswer(text: string) {
	const lines = text.split('\n');
	return lines.map((line, li) => {
		// inline markdown: links + code + bold
		const parts = line.split(/(\[[^\]]+\]\([^\)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g);
		const rendered = parts.map((part, pi) => {
			const markdownLink = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
			if (markdownLink) {
				const label = markdownLink[1];
				const rawHref = markdownLink[2].trim();
				const href = resolveInlineLinkHref(rawHref);
				if (href) {
					const isExternal = href.startsWith('http://') || href.startsWith('https://');
					return (
						<a
							key={pi}
							href={href}
							className="underline underline-offset-2 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200"
							target={isExternal ? '_blank' : undefined}
							rel={isExternal ? 'noopener noreferrer' : undefined}
						>
							{label}
						</a>
					);
				}
				return label;
			}

			if (part.startsWith('`') && part.endsWith('`')) {
				return (
					<code
						key={pi}
						className="rounded px-1 py-0.5 text-[0.8em] bg-neutral-100 dark:bg-neutral-800 font-mono"
					>
						{part.slice(1, -1)}
					</code>
				);
			}
			if (part.startsWith('**') && part.endsWith('**')) {
				return <strong key={pi}>{part.slice(2, -2)}</strong>;
			}
			return part;
		});
		return (
			<span key={li}>
				{rendered}
				{li < lines.length - 1 && <br />}
			</span>
		);
	});
}

// ── Typewriter hook ───────────────────────────────────────────────────────────

const CHARS_PER_TICK = 4; // characters revealed per frame
const TICK_MS = 16;        // ~60 fps

function useTypewriter(
	messages: ChatMessage[],
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
	const queueRef = useRef<Map<number, { full: string; pos: number }>>(new Map());
	const rafRef = useRef<number | null>(null);

	const tick = () => {
		let stillStreaming = false;
		queueRef.current.forEach((entry, id) => {
			if (entry.pos >= entry.full.length) return;
			entry.pos = Math.min(entry.pos + CHARS_PER_TICK, entry.full.length);
			const revealed = entry.full.slice(0, entry.pos);
			const done = entry.pos >= entry.full.length;
			setMessages((prev) =>
				prev.map((m) =>
					m.id === id
						? { ...m, content: revealed, streaming: !done }
						: m,
				),
			);
			if (!done) stillStreaming = true;
		});

		if (stillStreaming) {
			rafRef.current = window.setTimeout(tick, TICK_MS);
		} else {
			rafRef.current = null;
		}
	};

	const startTyping = (id: number, full: string) => {
		queueRef.current.set(id, { full, pos: 0 });
		if (rafRef.current === null) {
			rafRef.current = window.setTimeout(tick, TICK_MS);
		}
	};

	useEffect(() => () => {
		if (rafRef.current !== null) clearTimeout(rafRef.current);
	}, []);

	return startTyping;
}

// ── Component ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
const nextId = () => ++_idCounter;

const CHAT_STORAGE_KEY = 'aa_chat_messages';
const MAX_HISTORY_MESSAGES_FOR_API = 8;
const MAX_HISTORY_CONTENT_CHARS = 360;
const MAX_SUMMARY_ITEMS = 4;
const MAX_STARTER_QUESTIONS = 3;

function loadMessagesFromSession(key: string): ChatMessage[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = sessionStorage.getItem(key);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as ChatMessage[];
		// strip streaming flag on restore so bubbles render fully
		return parsed.map((m) => ({ ...m, streaming: false }));
	} catch {
		return [];
	}
}

function saveMessagesToSession(key: string, messages: ChatMessage[]): void {
	if (typeof window === 'undefined') return;
	try {
		// only persist completed messages (not ones mid-stream)
		const toSave = messages.filter((m) => !m.streaming);
		sessionStorage.setItem(key, JSON.stringify(toSave));
	} catch {
		// storage quota or private mode — silently ignore
	}
}

function compactHistoryForApi(messages: ChatMessage[]): Message[] {
	const normalize = (text: string, maxLen = MAX_HISTORY_CONTENT_CHARS): string => {
		const cleaned = text.replace(/\s+/g, ' ').trim();
		if (cleaned.length <= maxLen) return cleaned;
		return `${cleaned.slice(0, maxLen - 3)}...`;
	};

	const cleaned = messages
		.filter((m) => !m.streaming && (m.role === 'user' || m.role === 'assistant'))
		.map(({ role, content }) => ({ role, content: normalize(content) }))
		.filter((m) => m.content.length > 0);

	if (cleaned.length <= MAX_HISTORY_MESSAGES_FOR_API) {
		return cleaned;
	}

	const recent = cleaned.slice(-MAX_HISTORY_MESSAGES_FOR_API);
	const older = cleaned.slice(0, -MAX_HISTORY_MESSAGES_FOR_API);

	const olderUser = older
		.filter((m) => m.role === 'user')
		.slice(-MAX_SUMMARY_ITEMS)
		.map((m) => `Q: ${normalize(m.content, 90)}`);

	const olderAssistant = older
		.filter((m) => m.role === 'assistant')
		.slice(-MAX_SUMMARY_ITEMS)
		.map((m) => `A: ${normalize(m.content, 90)}`);

	const summaryLines = [...olderUser, ...olderAssistant].slice(-MAX_SUMMARY_ITEMS * 2);
	if (summaryLines.length === 0) return recent;

	return [
		{
			role: 'assistant',
			content: `Earlier conversation summary:\n${summaryLines.join('\n')}`,
		},
		...recent,
	];
}

function extractTopicFromPost(postTitle: string, postContent: string): string | null {
	const headingMatch = postContent.match(/^#{1,3}\s+(.+)$/m);
	if (headingMatch?.[1]) {
		return headingMatch[1].replace(/[`*_#]/g, '').trim().slice(0, 70);
	}

	if (postTitle.trim()) {
		return postTitle.trim().replace(/[`*_#]/g, '').slice(0, 70);
	}

	return null;
}

function buildStarterQuestions(postTitle: string, postContent: string): string[] {
	const topic = extractTopicFromPost(postTitle, postContent);

	const contextual = topic
		? [
			`Can you summarize ${topic} in simple terms?`,
			`What are the key trade-offs in ${topic}?`,
			`How would I apply ${topic} in production?`,
		]
		: [
			'Can you summarize this post in simple terms?',
			'What are the key trade-offs discussed here?',
			'How would I apply this in production?',
		];

	return contextual.slice(0, MAX_STARTER_QUESTIONS);
}

function buildWelcomeAssistantMessage(postTitle: string, postContent: string): ChatMessage {
	const postName = postTitle.trim() || 'this post';
	return {
		id: nextId(),
		role: 'assistant',
		content: `Hi! I can help with ${postName}. Pick a starter question or ask anything about this page.`,
		suggestions: buildStarterQuestions(postTitle, postContent),
	};
}

export function PostChatbot({ postTitle = 'Abstract Algorithms Blog', postContent = '' }: Props) {
	// Use a slug-scoped key so each post has independent chat history
	const storageKey = `${CHAT_STORAGE_KEY}:${typeof window !== 'undefined' ? window.location.pathname : ''}`;

	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessagesFromSession(storageKey));
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const startTyping = useTypewriter(messages, setMessages);

	const isStreaming = messages.some((m) => m.streaming);
	const isBusy = loading || isStreaming;

	// Persist messages to sessionStorage whenever they change
	useEffect(() => {
		saveMessagesToSession(storageKey, messages);
	}, [messages, storageKey]);

	// Auto-scroll to bottom whenever messages change
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, loading]);

	// Focus input when chat opens
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	// Seed a contextual greeting when opening chat without prior history.
	useEffect(() => {
		if (!isOpen || messages.length > 0) return;
		setMessages([buildWelcomeAssistantMessage(postTitle, postContent)]);
	}, [isOpen, messages.length, postTitle, postContent]);

	const send = async (overrideQuestion?: string) => {
		const question = (overrideQuestion ?? input).trim();
		if (!question || isBusy) return;

		const userMsg: ChatMessage = { id: nextId(), role: 'user', content: question };
		setMessages((prev) => [...prev, userMsg]);
		setInput('');
		setError(null);
		setLoading(true);

		try {
			const history = compactHistoryForApi(messages);

			const res = await fetch(WIKI_CHAT_API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question, history, postTitle, postContent }),
			});

			const data = await res.json() as { answer?: string; error?: string; suggestions?: string[] };

			if (!res.ok || 'error' in data) {
				throw new Error((data as { error: string }).error ?? 'Unknown error');
			}

			const botId = nextId();
			const botMsg: ChatMessage = {
				id: botId,
				role: 'assistant',
				content: '',
				streaming: true,
				suggestions: data.suggestions ?? [],
			};
			setMessages((prev) => [...prev, botMsg]);
			startTyping(botId, data.answer ?? '');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	};

	const clearChat = () => {
		setMessages([buildWelcomeAssistantMessage(postTitle, postContent)]);
		setError(null);
		try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
		inputRef.current?.focus();
	};

	return (
		<>
			{/* ── Floating toggle button ── */}
			<button
				onClick={() => setIsOpen((o) => !o)}
				aria-label={isOpen ? 'Close AI chat' : 'Ask AI about this post'}
				className="fixed right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95"
				style={{
					width: '3.25rem',
					height: '3.25rem',
					bottom: 'calc(var(--lp-nav-height, 0px) + 1.5rem)',
				}}
			>
				{isOpen ? <CloseIcon /> : <ChatIcon />}
				{!isOpen && (
					<span className="absolute -top-1 -right-1 text-yellow-300">
						<SparkleIcon />
					</span>
				)}
			</button>

			{/* ── Chat panel ── */}
			{isOpen && (
				<div
					className="fixed right-6 z-50 flex flex-col w-[22rem] sm:w-96 max-h-[70vh] rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden"
					style={{ bottom: 'calc(var(--lp-nav-height, 0px) + 5.5rem)' }}
					role="dialog"
					aria-label="AI Post Assistant"
				>
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
						<div className="flex items-center gap-2">
							<span className="text-yellow-400">
								<SparkleIcon />
							</span>
							<span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
								Ask AI
							</span>
						</div>
						<div className="flex items-center gap-1">
							{messages.length > 0 && (
								<button
									onClick={clearChat}
									className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 px-2 py-1 rounded transition-colors"
								>
									Clear
								</button>
							)}
							<button
								onClick={() => setIsOpen(false)}
								aria-label="Close"
								className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors rounded"
							>
								<CloseIcon />
							</button>
						</div>
					</div>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
						{messages.length === 0 && !isBusy && (
							<div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
								<span className="text-3xl">💬</span>
								<p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
									Hi! Ask me anything.
								</p>
								<p className="text-xs text-neutral-400 dark:text-neutral-500">
									I&apos;m powered by AI and know the full article content.
								</p>
							</div>
						)}

						{messages.map((msg) => (
							<div key={msg.id} className="flex flex-col gap-2">
								<div
									className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
								>
									<div className="max-w-[85%]">
										<div
											className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
											msg.role === 'user'
												? 'bg-blue-600 text-white rounded-br-sm'
												: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-sm'
											}`}
										>
											{msg.role === 'assistant' ? (
												<>
													{renderAnswer(msg.content)}
													{msg.streaming && (
														<span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle animate-pulse" />
													)}
												</>
											) : (
												msg.content
											)}
										</div>
									</div>
								</div>

								{msg.role === 'assistant' && !!msg.suggestions?.length && !msg.streaming && (
									<div className="flex flex-wrap gap-1.5 px-1">
										{msg.suggestions.map((q, idx) => (
											<button
												key={idx}
												onClick={() => send(q)}
												disabled={isBusy}
												className="text-left text-[11px] leading-snug text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
											>
												{q}
											</button>
										))}
									</div>
								)}
							</div>
						))}

					{loading && (
							<div className="flex justify-start">
								<div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-neutral-500 dark:text-neutral-400">
									<Spinner />
									<span>Thinking…</span>
								</div>
							</div>
						)}

						{error && (
							<div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
								{error}
							</div>
						)}

						<div ref={bottomRef} />
					</div>

					{/* Input */}
					<div className="px-3 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
						<div className="flex items-end gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Ask a question… (Enter to send)"
								rows={1}
								disabled={isBusy}
								className="flex-1 resize-none bg-transparent text-sm text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none disabled:opacity-60 max-h-28 leading-relaxed"
								style={{ fieldSizing: 'content' } as React.CSSProperties}
							/>
							<button
								onClick={() => send()}
								disabled={!input.trim() || isBusy}
								aria-label="Send"
								className="flex-shrink-0 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<SendIcon />
							</button>
						</div>
						<p className="mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-600 text-center">
							AI · may contain errors · Shift+Enter for new line
						</p>
					</div>
				</div>
			)}
		</>
	);
}
