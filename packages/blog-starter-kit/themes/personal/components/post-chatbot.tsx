'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '../pages/api/chat';

type Props = {
	postTitle: string;
	postContent: string;
};

type ChatMessage = Message & { id: number; streaming?: boolean };

const CHAT_API = '/api/chat';

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

// ── Simple inline markdown renderer (bold, code, line breaks) ─────────────────

function renderAnswer(text: string) {
	const lines = text.split('\n');
	return lines.map((line, li) => {
		// inline bold + code
		const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
		const rendered = parts.map((part, pi) => {
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

export function PostChatbot({ postTitle, postContent }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const startTyping = useTypewriter(messages, setMessages);

	const isStreaming = messages.some((m) => m.streaming);
	const isBusy = loading || isStreaming;

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

	const send = async () => {
		const question = input.trim();
		if (!question || isBusy) return;

		const userMsg: ChatMessage = { id: nextId(), role: 'user', content: question };
		setMessages((prev) => [...prev, userMsg]);
		setInput('');
		setError(null);
		setLoading(true);

		try {
			const history: Message[] = messages.map(({ role, content }) => ({ role, content }));

			const res = await fetch(CHAT_API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question, history, postTitle, postContent }),
			});

			const data = await res.json();

			if (!res.ok || 'error' in data) {
				throw new Error((data as { error: string }).error ?? 'Unknown error');
			}

			// Insert the bot message as empty+streaming, then type it out
			const botId = nextId();
			const botMsg: ChatMessage = { id: botId, role: 'assistant', content: '', streaming: true };
			setMessages((prev) => [...prev, botMsg]);
			startTyping(botId, data.answer);
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
		setMessages([]);
		setError(null);
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
								Ask about this post
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
									Hi! Ask me anything about this post.
								</p>
								<p className="text-xs text-neutral-400 dark:text-neutral-500">
									I&apos;m powered by AI and know the full article content.
								</p>
							</div>
						)}

						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
								onClick={send}
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
