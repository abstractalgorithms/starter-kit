/**
 * Enhanced diagram interaction utilities
 * Provides improved UX for Mermaid diagrams, PlantUML, and architecture visualizations
 */

const DIAGRAM_ENHANCED_MARKER = 'data-diagram-enhanced';

export const enhanceDiagramInteractivity = () => {
	if (typeof document === 'undefined') return;

	// Add zoom and pan functionality to Mermaid diagrams
	const mermaidDiagrams = document.querySelectorAll<HTMLDivElement>('.mermaid-container:not([' + DIAGRAM_ENHANCED_MARKER + '])');
	mermaidDiagrams.forEach((container) => {
		// Mark as enhanced to prevent re-processing
		container.setAttribute(DIAGRAM_ENHANCED_MARKER, 'true');

		const svgElement = container.querySelector('svg');
		if (!svgElement) return;

		// Create wrapper for zoom controls
		const wrapper = document.createElement('div');
		wrapper.className = 'diagram-wrapper relative overflow-auto group';
		wrapper.style.width = '100%';
		wrapper.style.maxWidth = '100%';
		wrapper.style.maxHeight = '600px';
		container.replaceWith(wrapper);
		wrapper.appendChild(container);

		// Create zoom controls
		const controls = document.createElement('div');
		controls.className = 'diagram-controls absolute top-3 right-3 z-10 flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-2 opacity-0 group-hover:opacity-100 transition-opacity';

		// Zoom in button
		const zoomIn = document.createElement('button');
		zoomIn.className = 'p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors';
		zoomIn.title = 'Zoom in';
		zoomIn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6m3-3H8"/></svg>';
		zoomIn.addEventListener('click', () => {
			const transform = svgElement.style.transform || '';
			const currentScale = parseFloat(transform.match(/scale\(([\d.]+)\)/)?.[1] ?? '1');
			svgElement.style.transform = `scale(${Math.min(currentScale + 0.2, 3)})`;
		});

		// Zoom out button
		const zoomOut = document.createElement('button');
		zoomOut.className = 'p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors';
		zoomOut.title = 'Zoom out';
		zoomOut.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>';
		zoomOut.addEventListener('click', () => {
			const transform = svgElement.style.transform || '';
			const currentScale = parseFloat(transform.match(/scale\(([\d.]+)\)/)?.[1] ?? '1');
			svgElement.style.transform = `scale(${Math.max(currentScale - 0.2, 0.5)})`;
		});

		// Reset button
		const reset = document.createElement('button');
		reset.className = 'p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors';
		reset.title = 'Reset zoom';
		reset.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 16 0A8 8 0 0 0 4 12m8-5v5l4 2"/></svg>';
		reset.addEventListener('click', () => {
			svgElement.style.transform = 'scale(1)';
		});

		// Copy diagram button
		const copy = document.createElement('button');
		copy.className = 'p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors';
		copy.title = 'Copy diagram';
		copy.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
		copy.addEventListener('click', async () => {
			try {
				const svg = svgElement.outerHTML;
				await navigator.clipboard.writeText(svg);
				const originalText = copy.innerHTML;
				copy.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
				setTimeout(() => { copy.innerHTML = originalText; }, 2000);
			} catch (e) {
				console.error('Failed to copy diagram:', e);
			}
		});

		controls.appendChild(zoomIn);
		controls.appendChild(zoomOut);
		controls.appendChild(reset);
		controls.appendChild(copy);
		wrapper.appendChild(controls);

		// Enable pan with mouse
		let isPanning = false;
		let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;

		const handleMouseDown = (e: MouseEvent) => {
			isPanning = true;
			startX = e.pageX - wrapper.offsetLeft;
			startY = e.pageY - wrapper.offsetTop;
			scrollLeft = wrapper.scrollLeft;
			scrollTop = wrapper.scrollTop;
		};

		const handleMouseUp = () => {
			isPanning = false;
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isPanning) return;
			e.preventDefault();
			const x = e.pageX - wrapper.offsetLeft;
			const y = e.pageY - wrapper.offsetTop;
			wrapper.scrollLeft = scrollLeft - (x - startX);
			wrapper.scrollTop = scrollTop - (y - startY);
		};

		container.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseleave', handleMouseUp);
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('mousemove', handleMouseMove);
	});

	// Add copy button to code blocks with enterprise language support
	const ENTERPRISE_LANGUAGES = [
		'terraform', 'hcl', 'puppet', 'ansible', 'yaml', 'dockerfile', 'dockerfile',
		'groovy', 'kotlin', 'scala', 'clojure', 'elixir', 'erlang', 'rust', 'go',
		'c++', 'cpp', 'c#', 'csharp', 'powershell', 'batch', 'bash', 'sh',
		'solidity', 'vyper', 'protobuf', 'avro', 'graphql', 'sql', 'plsql', 'tsql',
	];

	const codeBlocks = document.querySelectorAll<HTMLPreElement>('pre code:not([' + DIAGRAM_ENHANCED_MARKER + '])');
	codeBlocks.forEach((code) => {
		// Mark as enhanced to prevent re-processing
		code.setAttribute(DIAGRAM_ENHANCED_MARKER, 'true');

		const pre = code.closest('pre');
		if (!pre || pre.querySelector('.lang-badge')) return;

		// Detect language from class
		const langClass = Array.from(code.classList).find((c) => c.startsWith('language-') || c.startsWith('lang-'));
		const lang = langClass?.replace(/^(language-|lang-)/, '').toUpperCase() || 'CODE';
		const isEnterprise = ENTERPRISE_LANGUAGES.some((l) => lang.toLowerCase().includes(l));

		// Add language badge
		const badge = document.createElement('div');
		badge.className = 'lang-badge absolute top-2 right-10 px-2 py-1 rounded text-xs font-mono font-semibold opacity-50 group-hover:opacity-100 transition-opacity';
		if (isEnterprise) {
			badge.className += ' bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
		} else {
			badge.className += ' bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
		}
		badge.textContent = lang;

		const wrapper = pre.closest('.code-block-outer');
		if (wrapper) {
			wrapper.classList.add('group', 'relative');
			wrapper.appendChild(badge);
		}
	});
};

export const initDiagramEnhancements = () => {
	if (typeof window === 'undefined') return;
	
	// Run on mount
	enhanceDiagramInteractivity();
};
