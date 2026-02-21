'use client';

import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { useQuizHandler } from '@starter-kit/utils/renderer/hooks/useQuizHandler';
import { markdownToHtml } from '@starter-kit/utils/renderer/markdownToHtml';
import renderMathInElement from 'katex/contrib/auto-render';
import { memo, useEffect, useRef } from 'react';

type Props = {
	contentMarkdown: string;
};

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
							element.innerHTML = svg;
						}).catch((err) => {
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
