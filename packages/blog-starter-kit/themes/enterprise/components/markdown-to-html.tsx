import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { useQuizHandler } from '@starter-kit/utils/renderer/hooks/useQuizHandler';
import { markdownToHtml } from '@starter-kit/utils/renderer/markdownToHtml';
import { memo, useEffect } from 'react';

type Props = {
	contentMarkdown: string;
};

const _MarkdownToHtml = ({ contentMarkdown }: Props) => {
	const content = markdownToHtml(contentMarkdown);
	useEmbeds({ enabled: true });
	useQuizHandler();

	// Initialize Mermaid diagrams
	useEffect(() => {
		const initMermaid = async () => {
			try {
				// @ts-ignore
				const mermaid = (await import('mermaid')).default;
				mermaid.contentLoaded();
			} catch (e) {
				console.warn('Mermaid initialization skipped:', e);
			}
		};

		const hasContent = document.querySelector('.mermaid');
		if (hasContent) {
			initMermaid();
		}
	}, [content]);

	return (
		<>
			<style jsx>{`
				:global(.mermaid-container) {
					display: flex;
					justify-content: center;
					margin: 2rem 0;
					padding: 1.5rem;
					background: #f9fafb;
					border-radius: 0.5rem;
					overflow-x: auto;
				}

				:global(.mermaid) {
					display: flex;
					justify-content: center;
				}

				:global(.quiz-container) {
					background: #e0f2fe;
					border: 2px solid #0284c7;
					border-radius: 0.5rem;
					padding: 1.5rem;
					margin: 2rem 0;
				}

				:global(.quiz-wrapper) {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}

				:global(.quiz-question) {
					background: white;
					border-radius: 0.25rem;
					padding: 1rem;
				}

				:global(.quiz-question p) {
					margin: 0 0 1rem 0;
				}

				:global(.quiz-options) {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
					margin: 1rem 0;
				}

				:global(.quiz-option) {
					display: flex;
					align-items: flex-start;
					gap: 0.75rem;
					padding: 0.75rem;
					border-radius: 0.25rem;
					cursor: pointer;
					transition: background-color 0.2s;
				}

				:global(.quiz-option:hover) {
					background: #f3f4f6;
				}

				:global(.quiz-option input) {
					margin-top: 0.25rem;
					cursor: pointer;
				}

				:global(.option-label) {
					font-weight: 600;
					min-width: 2rem;
				}

				:global(.quiz-check-btn) {
					background: #0284c7;
					color: white;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 0.25rem;
					cursor: pointer;
					font-size: 0.875rem;
					font-weight: 500;
					transition: background-color 0.2s;
					margin-top: 1rem;
				}

				:global(.quiz-check-btn:hover) {
					background: #0369a1;
				}

				:global(.quiz-feedback) {
					margin-top: 1rem;
					padding: 0.75rem;
					border-radius: 0.25rem;
					display: none;
					font-weight: 500;
				}

				:global(.quiz-feedback.show) {
					display: block;
				}

				:global(.quiz-feedback.correct) {
					background: #d1fae5;
					color: #065f46;
					border: 1px solid #a7f3d0;
				}

				:global(.quiz-feedback.incorrect) {
					background: #fee2e2;
					color: #7f1d1d;
					border: 1px solid #fecaca;
				}
			`}</style>
			<div
				className="hashnode-content-style mx-auto w-full px-5 md:max-w-screen-md"
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		</>
	);
};

export const MarkdownToHtml = memo(_MarkdownToHtml);
