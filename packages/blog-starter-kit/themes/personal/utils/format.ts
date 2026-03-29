/**
 * Converts a tag name or slug to Pascal Case with spaces.
 * Splits on hyphens and whitespace, capitalises the first letter of every
 * word and lowercases the rest.
 *
 * Examples:
 *   "distributed-systems"  → "Distributed Systems"
 *   "llm engineering"      → "Llm Engineering"
 *   "System Design"        → "System Design"
 */
export const formatTagName = (str: string): string =>
	str
		.split(/[-\s]+/)
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
