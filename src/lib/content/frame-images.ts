/**
 * A remark plugin that wraps every image in a Post or Project writeup in the
 * honeycomb frame the project Cards use, so a new image gets the frame without
 * anyone remembering to add it.
 *
 * Writeups mostly use raw `<img ... />` tags (for width, height and a class), and
 * mdsvex hands those to remark as `html` nodes holding the markup as a string,
 * so those are wrapped textually. Markdown `![alt](src)` images arrive as
 * `image` nodes and are rewritten to the same markup. The wrapper is a `<span>`
 * so it stays valid even when an image sits inside a paragraph.
 */

interface MdNode {
	type: string;
	value?: string;
	url?: string;
	alt?: string | null;
	title?: string | null;
	children?: MdNode[];
}

const IMG_TAG = /<img\b[^>]*>/g;
const OPEN = '<span class="img-frame">';
const CLOSE = '</span>';

const escapeAttr = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const dimension = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="(\\d+)"`))?.[1];

/**
 * The frame needs the image's size before the image loads, or a lazy image's
 * frame collapses to its padding and the page jumps when it arrives. So the
 * width and height attributes are handed to the frame as unitless custom
 * properties, which app.css turns into a width that respects every cap.
 */
function open(tag: string): string {
	const width = dimension(tag, 'width');
	const height = dimension(tag, 'height');
	if (!width || !height) return OPEN;
	return `<span class="img-frame" style="--img-w: ${width}; --img-h: ${height}">`;
}

export function frameHtml(html: string): string {
	// Already framed by hand: leave it alone rather than nest a second frame.
	if (html.includes('img-frame')) return html;
	return html.replace(IMG_TAG, (tag) => `${open(tag)}${tag}${CLOSE}`);
}

function walk(node: MdNode) {
	if (node.type === 'html' && node.value) {
		node.value = frameHtml(node.value);
		return;
	}
	if (node.type === 'image' && node.url) {
		const alt = escapeAttr(node.alt ?? '');
		const title = node.title ? ` title="${escapeAttr(node.title)}"` : '';
		const img = `<img src="${escapeAttr(node.url)}" alt="${alt}"${title} loading="lazy" />`;
		Object.assign(node, { type: 'html', value: `${OPEN}${img}${CLOSE}` });
		delete node.url;
		delete node.alt;
		delete node.title;
		return;
	}
	node.children?.forEach(walk);
}

export function frameImages() {
	return (tree: MdNode) => walk(tree);
}
