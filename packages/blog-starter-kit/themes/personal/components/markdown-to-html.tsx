'use client';

import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { useQuizHandler } from '@starter-kit/utils/renderer/hooks/useQuizHandler';
import { markdownToHtml } from '@starter-kit/utils/renderer/markdownToHtml';
import { initDiagramEnhancements } from '../utils/diagram-enhancements';
import renderMathInElement from 'katex/contrib/auto-render';
import { memo, useEffect, useRef } from 'react';

type Props = {
	contentMarkdown: string;
};

// ── Expand modal (lazy singleton) ────────────────────────────────────────────
let _backdrop: HTMLDivElement | null = null;
let _modalBody: HTMLDivElement | null = null;

function ensureModal() {
	if (_backdrop) return;
	_backdrop = document.createElement('div');
	_backdrop.className = 'code-expand-backdrop';
	const inner = document.createElement('div');
	inner.className = 'code-expand-inner';
	const closeBtn = document.createElement('button');
	closeBtn.className = 'code-expand-close';
	closeBtn.title = 'Close (Esc)';
	closeBtn.setAttribute('aria-label', 'Close');
	closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
	closeBtn.addEventListener('click', closeExpandModal);
	_modalBody = document.createElement('div');
	_modalBody.className = 'code-expand-body';
	inner.appendChild(closeBtn);
	inner.appendChild(_modalBody);
	_backdrop.appendChild(inner);
	document.body.appendChild(_backdrop);
	_backdrop.addEventListener('click', (e) => { if (e.target === _backdrop) closeExpandModal(); });
	document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeExpandModal(); });
}

function openExpandModal(html: string) {
	if (typeof document === 'undefined') return;
	ensureModal();
	_modalBody!.innerHTML = html;
	_backdrop!.classList.add('is-open');
	document.body.style.overflow = 'hidden';
	_modalBody!.querySelectorAll('svg').forEach((svg) => {
		svg.removeAttribute('width');
		svg.removeAttribute('height');
		svg.style.maxWidth = '100%';
		svg.style.height = 'auto';
	});
}

function closeExpandModal() {
	_backdrop?.classList.remove('is-open');
	document.body.style.overflow = '';
}

function makeExpandBtn(getHtml: () => string): HTMLButtonElement {
	const btn = document.createElement('button');
	btn.className = 'code-expand-btn';
	btn.title = 'Expand';
	btn.setAttribute('aria-label', 'Expand');
	btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
	btn.addEventListener('click', (e) => { e.preventDefault(); openExpandModal(getHtml()); });
	return btn;
}

const COPY_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const LINK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

const INLINE_GLOSSARY: Array<{ term: string; definition: string }> = [
	{ term: 'CAP', definition: 'Consistency, Availability, and Partition tolerance tradeoff model.' },
	{ term: 'RAG', definition: 'Retrieval-Augmented Generation using external context for responses.' },
	{ term: 'latency', definition: 'Delay between request start and response completion.' },
	{ term: 'quorum', definition: 'Minimum number of nodes required to accept an operation.' },
	{ term: 'replication', definition: 'Maintaining synchronized copies of data across nodes.' },
];

// ── Toast (lazy singleton) ────────────────────────────────────────────────
let _toast: HTMLDivElement | null = null;
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string) {
	if (typeof document === 'undefined') return;
	if (!_toast) {
		_toast = document.createElement('div');
		_toast.className = 'heading-anchor-toast';
		// Append inside <main> so the --font-plus-jakarta-sans CSS variable is in scope
		const mount = document.querySelector('main') ?? document.body;
		mount.appendChild(_toast);
	}
	_toast.textContent = message;
	_toast.classList.add('is-visible');
	if (_toastTimer) clearTimeout(_toastTimer);
	_toastTimer = setTimeout(() => _toast?.classList.remove('is-visible'), 2000);
}

const MarkdownToHtmlComponent = ({ contentMarkdown }: Props) => {
	const content = markdownToHtml(contentMarkdown);
	useEmbeds({ enabled: true });
	useQuizHandler();
	const containerRef = useRef<HTMLDivElement>(null);

	// Inject copy buttons into all <pre> code blocks
	useEffect(() => {
		if (!containerRef.current) return;
		const DIAGRAM_LANGUAGES = ['mermaid', 'chart', 'plantuml', 'graphviz', 'dot', 'ditaa', 'nomnoml'];
		containerRef.current.querySelectorAll('pre').forEach((pre) => {
			if (pre.parentElement?.classList.contains('code-block-outer')) return;
			// Skip diagram blocks (mermaid, etc.) — marked.js uses `lang-X` prefix
			if (pre.classList.contains('mermaid')) return;
			const codeEl = pre.querySelector('code');
			if (codeEl && DIAGRAM_LANGUAGES.some(
				(lang) => codeEl.classList.contains(`lang-${lang}`) || codeEl.classList.contains(`language-${lang}`)
			)) return;
			if (pre.querySelector('svg')) return;

			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-outer';
			pre.parentNode!.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);

			const copyBtn = document.createElement('button');
			copyBtn.className = 'code-copy-btn';
			copyBtn.title = 'Copy code';
			copyBtn.setAttribute('aria-label', 'Copy code');
			copyBtn.innerHTML = COPY_ICON;

			copyBtn.addEventListener('click', async (e) => {
				e.preventDefault();
				const code = pre.querySelector('code')?.innerText ?? pre.innerText;
				try {
					await navigator.clipboard.writeText(code);
				} catch {
					const ta = document.createElement('textarea');
					ta.value = code;
					ta.style.cssText = 'position:fixed;opacity:0';
					document.body.appendChild(ta);
					ta.select();
					document.execCommand('copy');
					document.body.removeChild(ta);
				}
				copyBtn.innerHTML = CHECK_ICON;
				copyBtn.classList.add('code-copy-btn--copied');
				setTimeout(() => {
					copyBtn.innerHTML = COPY_ICON;
					copyBtn.classList.remove('code-copy-btn--copied');
				}, 2000);
			});

			wrapper.appendChild(copyBtn);
		});
	}, [content]);

	// Inject anchor links into all headings that have an id
	useEffect(() => {
		if (!containerRef.current) return;
		containerRef.current.querySelectorAll<HTMLHeadingElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]').forEach((heading) => {
			if (heading.querySelector('.heading-anchor')) return;
			const anchor = document.createElement('a');
			anchor.href = `#${heading.id}`;
			anchor.className = 'heading-anchor';
			anchor.setAttribute('aria-label', `Link to section: ${heading.textContent}`);
			anchor.innerHTML = LINK_ICON;
			anchor.addEventListener('click', async (e) => {
				e.preventDefault();
				const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
				try {
					await navigator.clipboard.writeText(url);
				} catch {
					const ta = document.createElement('textarea');
					ta.value = url;
					ta.style.cssText = 'position:fixed;opacity:0';
					document.body.appendChild(ta);
					ta.select();
					document.execCommand('copy');
					document.body.removeChild(ta);
				}
				window.history.replaceState(null, '', `#${heading.id}`);
				showToast('Link copied!');
			});
			heading.appendChild(anchor);
		});
	}, [content]);

	useEffect(() => {
		if (containerRef.current) {
			renderMathInElement(containerRef.current, {
				delimiters: [
					{ left: '$$', right: '$$', display: true },
					{ left: '$', right: '$', display: false },
					{ left: '\\(', right: '\\)', display: false },
					{ left: '\\[', right: '\\]', display: true },
				],
				throwOnError: false,
			});
		}
	}, [content]);

	// Initialize Mermaid diagrams
	useEffect(() => {
		const initMermaid = async () => {
			try {
				// @ts-ignore
				const mermaid = (await import('mermaid')).default;
				
				// Initialize mermaid with config
				mermaid.initialize({
					startOnLoad: false,
					theme: 'default',
					securityLevel: 'loose',
				});
				
				// Find all mermaid elements and render them
				const mermaidElements = containerRef.current?.querySelectorAll('.mermaid');
				if (mermaidElements && mermaidElements.length > 0) {
					mermaidElements.forEach((element, index) => {
						element.classList.add('mermaid-container');
						const id = `mermaid-${Date.now()}-${index}`;
						// Decode HTML entities that the markdown pipeline may have encoded
						// (e.g. &quot; → ", &lt; → <) before passing to Mermaid
						const ta = document.createElement('textarea');
						ta.innerHTML = element.textContent || '';
						const graphDefinition = ta.value;
						mermaid.render(id, graphDefinition).then(({ svg }) => {
							element.innerHTML = svg;								// Remove the fixed dimensions Mermaid injects so the SVG
								// scales to fill its container instead of staying tiny
								const svgEl = element.querySelector('svg');
								if (svgEl) {
									svgEl.removeAttribute('width');
									svgEl.removeAttribute('height');
									svgEl.style.maxWidth = '100%';
									svgEl.style.width = '100%';
									svgEl.style.height = 'auto';
								}						}).catch((err) => {
							console.error('Mermaid render error:', err);
							element.innerHTML = `<pre>Error rendering diagram: ${err.message}</pre>`;
						});
					});
				}
			} catch (e) {
				console.warn('Mermaid initialization skipped:', e);
			}
		};

		if (containerRef.current?.querySelector('.mermaid')) {
			initMermaid();
		}
	}, [content]);

	// Lightweight inline glossary decoration for key technical terms
	useEffect(() => {
		if (!containerRef.current) return;
		const seenTerms = new Set<string>();
		const nodes = containerRef.current.querySelectorAll('p, li');
		nodes.forEach((node) => {
			if (node.querySelector('code, pre, a, .inline-glossary-term')) return;
			let html = node.innerHTML;
			let changed = false;
			INLINE_GLOSSARY.forEach(({ term, definition }) => {
				if (seenTerms.has(term.toLowerCase())) return;
				const regex = new RegExp(`\\b(${term})\\b`, 'i');
				if (regex.test(html)) {
					html = html.replace(
						regex,
						`<span class="inline-glossary-term" title="${definition}">$1</span>`,
					);
					seenTerms.add(term.toLowerCase());
					changed = true;
				}
			});
			if (changed) {
				node.innerHTML = html;
			}
		});
	}, [content]);

	// Initialize diagram enhancements (zoom, pan, copy)
	useEffect(() => {
		const cleanup = initDiagramEnhancements();
		return cleanup;
	}, [content]);

	return (
		<div
			ref={containerRef}
			className="hashnode-content-style w-full max-w-none font-sans"
			style={{ maxWidth: 'none' }}
			dangerouslySetInnerHTML={{ __html: content }}
		/>
	);
};

export const MarkdownToHtml = memo(MarkdownToHtmlComponent);
