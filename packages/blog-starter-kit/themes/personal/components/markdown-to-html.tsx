'use client';

import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { useQuizHandler } from '@starter-kit/utils/renderer/hooks/useQuizHandler';
import { markdownToHtml } from '@starter-kit/utils/renderer/markdownToHtml';
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

const MarkdownToHtmlComponent = ({ contentMarkdown }: Props) => {
	const content = markdownToHtml(contentMarkdown);
	useEmbeds({ enabled: true });
	useQuizHandler();
	const containerRef = useRef<HTMLDivElement>(null);

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
						const id = `mermaid-${Date.now()}-${index}`;
						const graphDefinition = element.textContent || '';
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
