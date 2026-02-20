import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { markdownToHtml } from '@starter-kit/utils/renderer/markdownToHtml';
import renderMathInElement from 'katex/contrib/auto-render';
import { memo, useEffect, useRef } from 'react';

type Props = {
	contentMarkdown: string;
};

const MarkdownToHtmlComponent = ({ contentMarkdown }: Props) => {
	const content = markdownToHtml(contentMarkdown);
	useEmbeds({ enabled: true });
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

	return (
		<div
			ref={containerRef}
			className="hashnode-content-style w-full max-w-none"
			style={{ maxWidth: 'none' }}
			dangerouslySetInnerHTML={{ __html: content }}
		/>
	);
};

export const MarkdownToHtml = memo(MarkdownToHtmlComponent);
