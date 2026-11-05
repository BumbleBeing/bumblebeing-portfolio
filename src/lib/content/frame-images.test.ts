import { describe, expect, it } from 'vitest';
import { frameHtml, frameImages } from './frame-images';

describe('frameImages', () => {
	it('wraps a raw img tag, attributes and all', () => {
		const html = '<img\n\tsrc="/a.webp"\n\talt="A"\n\tclass="post-screenshot"\n/>';
		expect(frameHtml(html)).toBe(`<span class="img-frame">${html}</span>`);
	});

	it('hands the image size to the frame so it is reserved before loading', () => {
		const html = '<img src="/a.webp" width="1290" height="730" loading="lazy" />';
		expect(frameHtml(html)).toBe(
			`<span class="img-frame" style="--img-w: 1290; --img-h: 730">${html}</span>`
		);
	});

	it('wraps each image in a block that holds several', () => {
		const html = '<div class="card-row">\n<img src="/a.webp" />\n<img src="/b.webp" />\n</div>';
		expect(frameHtml(html).match(/class="img-frame"/g)).toHaveLength(2);
	});

	it('leaves html without images and hand-framed images alone', () => {
		expect(frameHtml('<p class="book-author">X</p>')).toBe('<p class="book-author">X</p>');
		const framed = '<span class="img-frame"><img src="/a.webp" /></span>';
		expect(frameHtml(framed)).toBe(framed);
	});

	it('rewrites a markdown image into framed markup', () => {
		const tree = {
			type: 'root',
			children: [
				{ type: 'paragraph', children: [{ type: 'image', url: '/a.webp', alt: 'A "quoted" cat' }] }
			]
		};
		frameImages()(tree);
		expect(tree.children[0].children[0]).toEqual({
			type: 'html',
			value:
				'<span class="img-frame"><img src="/a.webp" alt="A &quot;quoted&quot; cat" loading="lazy" /></span>'
		});
	});
});
