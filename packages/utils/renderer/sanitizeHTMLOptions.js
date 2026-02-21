const sanitizeHtml = require('sanitize-html');

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
	'h1',
	'h2',
	'h3',
	'span',
	'img',
	'div',
	'iframe',
	'abbr',
	'kbd',
	'cite',
	'dl',
	'dt',
	'dd',
	's',
	'sub',
	'sup',
	'details',
	'summary',
	'button',
	'label',
	'input',
]);
const allowedAttributes = {
	'*': ['id'],
	iframe: ['src', 'class', 'sandbox', 'style', 'width', 'height'],
	div: ['class', 'data-*'],
	a: ['href', 'class', 'target'],
	img: ['src', 'alt', 'class'],
	code: ['class'],
	span: ['class'],
	abbr: ['title'],
	pre: ['class'],
	button: ['class', 'onclick', 'type'],
	label: ['class', 'for'],
	input: ['type', 'name', 'value', 'data-*', 'class'],
};
// const disallowedTagsMode = 'discard';

const sanitizeHtmlOptions = { allowedTags, allowedAttributes };

module.exports = sanitizeHtmlOptions;
