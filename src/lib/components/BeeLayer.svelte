<script lang="ts">
	import { onMount } from 'svelte';
	import { bees } from '$lib/state/bees.svelte';

	// Physics carried over from v1's edge-particles.svelte, unchanged.
	const MAX_PARTICLES = 300;
	const SPAWN_RATE = 0.13; //changed from 0.23
	const SPRING = 0.001;
	const FRICTION = 0.98;
	const INSET = 10;
	const POP_CHANCE = 0.12;
	const POP_FORCE = 0.8;
	const DRIFT = 0.04;
	const REPEL_RADIUS = 80;
	const REPEL_STRENGTH = 0.7; //changed from 0.9
	const TRAIL_LENGTH = 8;
	const BEE_COLOUR = '218, 165, 32';
	const TRAIL_COLOUR = '128, 128, 128';

	// Smoke: hold the mouse over the Honeycomb to push Bees away from farther off.
	const SMOKE_DELAY_MS = 100;
	const SMOKE_RADIUS = 200;
	const SMOKE_STRENGTH = 0.9;
	const SMOKE_PUFFS_PER_FRAME = 3;
	const SMOKE_PUFF_LIFE = 90; // frames, about 1.5s
	const SMOKE_COLOUR = '150, 150, 150';

	// The Queen: summoned by double-click, recruits nearby Bees into Swarming.
	const QUEEN_LIFE_MS = 15000;
	const QUEEN_GLOW_COLOUR = '200, 170, 255';
	const QUEEN_FADE_MS = 1500;
	const QUEEN_REPLACE_FADE_MS = 300;
	const QUEEN_SPEED = 0.25;
	const QUEEN_TETHER = 0.002;
	const QUEEN_SMOKE_SHARE = 0.08; // she feels Smoke, but far less than a Bee
	const RECRUIT_FRACTION = 0.25; // of the smaller viewport side
	const SWARM_SPREAD = 70;
	const SWARM_PULL = 0.004;
	const RELEASE_SPREAD_MS = 1000;

	/** Smoke and the Queen respond only to clicks on bare Honeycomb, never on content. */
	const CONTENT_SELECTOR = [
		'a',
		'button',
		'input',
		'textarea',
		'select',
		'label',
		'summary',
		'[role]',
		'[contenteditable]',
		'img',
		'svg',
		'video',
		'header',
		'footer',
		'p',
		'li',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'pre',
		'code',
		'blockquote',
		'figure',
		'time',
		'[data-card]'
	].join(',');

	function isHoneycomb(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) return false;
		if (target.closest(CONTENT_SELECTOR)) return false;
		// A bare container holding its own text (a span, a div of prose) is content too.
		return ![...target.childNodes].some(
			(node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
		);
	}

	interface Force {
		x: number;
		y: number;
		radius: number;
		strength: number;
	}

	function push(body: { x: number; y: number; vx: number; vy: number }, force: Force, share = 1) {
		const dx = body.x - force.x;
		const dy = body.y - force.y;
		const distance = Math.hypot(dx, dy);
		if (distance < force.radius && distance > 0) {
			const amount = ((force.radius - distance) / force.radius) * force.strength * share;
			body.vx += (dx / distance) * amount;
			body.vy += (dy / distance) * amount;
		}
	}

	class Puff {
		x: number;
		y: number;
		vx = (Math.random() - 0.5) * 0.6;
		vy = -0.4 - Math.random() * 0.5;
		radius = 4 + Math.random() * 4;
		age = 0;

		constructor(x: number, y: number) {
			this.x = x + (Math.random() - 0.5) * 10;
			this.y = y + (Math.random() - 0.5) * 10;
		}

		get dead() {
			return this.age >= SMOKE_PUFF_LIFE;
		}

		update() {
			this.age++;
			this.x += this.vx;
			this.y += this.vy;
			this.vx *= 0.99;
			this.radius += 0.35;
		}

		draw(ctx: CanvasRenderingContext2D) {
			const alpha = 0.22 * (1 - this.age / SMOKE_PUFF_LIFE);
			const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
			gradient.addColorStop(0, `rgba(${SMOKE_COLOUR}, ${alpha})`);
			gradient.addColorStop(1, `rgba(${SMOKE_COLOUR}, 0)`);
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = gradient;
			ctx.fill();
		}
	}

	class Queen {
		x: number;
		y: number;
		homeX: number;
		homeY: number;
		vx = 0;
		vy = 0;
		heading = Math.random() * Math.PI * 2;
		born: number;
		fadeStart: number;
		fadeMs = QUEEN_FADE_MS;
		alpha = 0;

		constructor(x: number, y: number, now: number) {
			this.x = this.homeX = x;
			this.y = this.homeY = y;
			this.born = now;
			this.fadeStart = now + QUEEN_LIFE_MS - QUEEN_FADE_MS;
		}

		/** Begin fading now (or sooner than planned), e.g. when replaced or the Bees go off. */
		dismiss(now: number, fadeMs: number) {
			if (now >= this.fadeStart && this.fadeMs <= fadeMs) return;
			this.fadeStart = now;
			this.fadeMs = fadeMs;
		}

		fading(now: number) {
			return now >= this.fadeStart;
		}

		dead(now: number) {
			return now >= this.fadeStart + this.fadeMs;
		}

		update(now: number, smoke: Force | null) {
			const fadeIn = Math.min(1, (now - this.born) / 400);
			const fadeOut = this.fading(now) ? Math.max(0, 1 - (now - this.fadeStart) / this.fadeMs) : 1;
			this.alpha = Math.min(fadeIn, fadeOut);

			// A slow wander, tethered loosely to where she was summoned.
			this.heading += (Math.random() - 0.5) * 0.08;
			this.vx +=
				Math.cos(this.heading) * QUEEN_SPEED * 0.05 + (this.homeX - this.x) * QUEEN_TETHER * 0.05;
			this.vy +=
				Math.sin(this.heading) * QUEEN_SPEED * 0.05 + (this.homeY - this.y) * QUEEN_TETHER * 0.05;
			if (smoke) push(this, smoke, QUEEN_SMOKE_SHARE);
			this.vx *= 0.95;
			this.vy *= 0.95;
			this.x += this.vx;
			this.y += this.vy;
		}

		draw(ctx: CanvasRenderingContext2D, frameCount: number) {
			if (this.alpha <= 0) return;
			const y = this.y + Math.sin(frameCount * 0.05) * 1.5;
			ctx.save();
			ctx.globalAlpha = this.alpha;
			ctx.translate(this.x, y);

			const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 13.5);
			glow.addColorStop(0, `rgba(${QUEEN_GLOW_COLOUR}, 0.95)`);
			glow.addColorStop(0.45, `rgba(${QUEEN_GLOW_COLOUR}, 0.6)`);
			glow.addColorStop(1, `rgba(${QUEEN_GLOW_COLOUR}, 0)`);
			ctx.beginPath();
			ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
			ctx.fillStyle = glow;
			ctx.fill();

			ctx.beginPath();
			ctx.arc(0, 0, 7, 0, Math.PI * 2);
			ctx.fillStyle = `rgb(${BEE_COLOUR})`;
			ctx.fill();

			// Crown: three points, one ruby in the middle.
			const base = -9;
			const width = 10;
			const height = 7;
			ctx.beginPath();
			ctx.moveTo(-width / 2, base);
			for (let i = 0; i <= 6; i++) {
				ctx.lineTo(
					-width / 2 + (width * i) / 6,
					i % 2 === 0 ? base - height : base - height * 0.45
				);
			}
			ctx.lineTo(width / 2, base);
			ctx.closePath();
			ctx.fillStyle = '#f5c518';
			ctx.strokeStyle = '#8a6d00';
			ctx.lineWidth = 0.8;
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(0, base - height * 0.25, 1.4, 0, Math.PI * 2);
			ctx.fillStyle = '#e0115f';
			ctx.fill();

			ctx.restore();
		}
	}

	let canvas = $state<HTMLCanvasElement | null>(null);

	class Bee {
		x: number;
		y: number;
		vx = (Math.random() - 0.5) * 2;
		vy = (Math.random() - 0.5) * 2;
		size = Math.random() * 2 + 1;
		alpha = 0;
		life = Math.random() * 250 + 150;
		trail: Array<{ x: number; y: number }> = [];
		expiring = false;
		dead = false;
		/** The Queen this Bee is Swarming around, if any. */
		queen: Queen | null = null;
		releaseAt = Infinity;

		constructor(w: number, h: number) {
			// Spawn on a random edge, which is why they read as drifting in from outside.
			const edge = Math.floor(Math.random() * 4);
			if (edge === 0) {
				this.x = Math.random() * w;
				this.y = Math.random() * (2 * INSET);
			} else if (edge === 1) {
				this.x = w - Math.random() * (2 * INSET);
				this.y = Math.random() * h;
			} else if (edge === 2) {
				this.x = Math.random() * w;
				this.y = h - Math.random() * (2 * INSET);
			} else {
				this.x = Math.random() * (2 * INSET);
				this.y = Math.random() * h;
			}
		}

		/** Called when the reader switches the Bees off: fade out rather than vanish. */
		retire() {
			this.expiring = true;
		}

		recruit(queen: Queen) {
			this.queen = queen;
			this.releaseAt = Infinity;
			this.life = Math.random() * 250 + 150;
			this.expiring = false;
		}

		update(w: number, h: number, mouseX: number, mouseY: number, now: number, smoke: Force | null) {
			if (this.queen && now >= this.releaseAt) {
				this.queen = null;
				this.releaseAt = Infinity;
			}

			this.life--;
			if (this.life <= 0) this.expiring = true;

			this.trail.push({ x: this.x, y: this.y });
			if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

			if (this.expiring) {
				this.alpha -= 0.01;
				if (this.alpha <= 0) this.dead = true;
			} else if (this.alpha < 0.6) {
				this.alpha += 0.02;
			}

			const left = INSET;
			const right = w - INSET;
			const top = INSET;
			const bottom = h - INSET;

			if (this.queen) {
				// Swarming: spring toward a jittering spot near her, a loose buzzing cloud.
				const targetX = this.queen.x + (Math.random() - 0.5) * SWARM_SPREAD;
				const targetY = this.queen.y + (Math.random() - 0.5) * SWARM_SPREAD;
				this.vx += (targetX - this.x) * SWARM_PULL;
				this.vy += (targetY - this.y) * SWARM_PULL;
			} else if (this.x < left || this.x > right || this.y < top || this.y > bottom) {
				// Outside the inset: spring back toward it.
				if (this.x < left) this.vx += (left - this.x) * SPRING;
				if (this.x > right) this.vx += (right - this.x) * SPRING;
				if (this.y < top) this.vy += (top - this.y) * SPRING;
				if (this.y > bottom) this.vy += (bottom - this.y) * SPRING;
			} else {
				// Inside: drift back toward the nearest edge, with the occasional pop.
				const distances = [this.x - left, right - this.x, this.y - top, bottom - this.y];
				const nearest = distances.indexOf(Math.min(...distances));
				const pops = Math.random() < POP_CHANCE;
				const jitter = (Math.random() - 0.5) * POP_FORCE;

				if (nearest === 0) {
					this.vx -= DRIFT;
					if (pops) {
						this.vx += POP_FORCE * Math.random();
						this.vy += jitter;
					}
				} else if (nearest === 1) {
					this.vx += DRIFT;
					if (pops) {
						this.vx -= POP_FORCE * Math.random();
						this.vy += jitter;
					}
				} else if (nearest === 2) {
					this.vy -= DRIFT;
					if (pops) {
						this.vy += POP_FORCE * Math.random();
						this.vx += jitter;
					}
				} else {
					this.vy += DRIFT;
					if (pops) {
						this.vy -= POP_FORCE * Math.random();
						this.vx += jitter;
					}
				}
			}

			// Cursor avoidance is per-particle, and always was: v1's separate
			// repeller.svelte was a different effect entirely, and is not ported.
			push(this, { x: mouseX, y: mouseY, radius: REPEL_RADIUS, strength: REPEL_STRENGTH });
			if (smoke) push(this, smoke);

			this.vx *= FRICTION;
			this.vy *= FRICTION;
			this.x += this.vx;
			this.y += this.vy;
		}

		draw(ctx: CanvasRenderingContext2D) {
			if (this.alpha <= 0) return;
			for (let i = 0; i < this.trail.length; i++) {
				const point = this.trail[i];
				const ratio = i / this.trail.length;
				ctx.beginPath();
				ctx.arc(point.x, point.y, this.size * ratio, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(${TRAIL_COLOUR}, ${this.alpha * ratio * 0.5})`;
				ctx.fill();
			}
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${BEE_COLOUR}, ${this.alpha})`;
			ctx.fill();
		}
	}

	onMount(() => {
		const element = canvas;
		if (!element) return;
		const ctx = element.getContext('2d');
		if (!ctx) return;

		let flying: Bee[] = [];
		let puffs: Puff[] = [];
		let queen: Queen | null = null;
		let fadingQueens: Queen[] = [];
		let smoking = false;
		let holdTimer: ReturnType<typeof setTimeout> | undefined;
		let lastPointerType = '';
		let frameCount = 0;
		let frame = 0;
		let mouseX = -9999;
		let mouseY = -9999;
		let width = window.innerWidth;
		let height = window.innerHeight;

		function resize() {
			if (!element) return;
			const ratio = window.devicePixelRatio || 1;
			width = window.innerWidth;
			height = window.innerHeight;
			element.width = width * ratio;
			element.height = height * ratio;
			element.style.width = `${width}px`;
			element.style.height = `${height}px`;
			ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
		}

		/** Let a Queen's Swarming Bees go, a few at a time rather than all at once. */
		function release(old: Queen, now: number) {
			for (const bee of flying) {
				if (bee.queen === old && bee.releaseAt === Infinity) {
					bee.releaseAt = now + Math.random() * RELEASE_SPREAD_MS;
				}
			}
		}

		function stopSmoke() {
			clearTimeout(holdTimer);
			smoking = false;
		}

		function tick() {
			if (!ctx) return;
			const now = performance.now();
			frameCount++;
			ctx.clearRect(0, 0, width, height);

			if (bees.active && flying.length < MAX_PARTICLES && Math.random() < SPAWN_RATE) {
				flying.push(new Bee(width, height));
			}

			const smoke: Force | null = smoking
				? { x: mouseX, y: mouseY, radius: SMOKE_RADIUS, strength: SMOKE_STRENGTH }
				: null;

			if (smoking) {
				for (let i = 0; i < SMOKE_PUFFS_PER_FRAME; i++) puffs.push(new Puff(mouseX, mouseY));
			}

			if (queen?.fading(now)) {
				release(queen, now);
				fadingQueens.push(queen);
				queen = null;
			}
			queen?.update(now, smoke);
			for (const old of fadingQueens) old.update(now, smoke);
			fadingQueens = fadingQueens.filter((old) => !old.dead(now));

			if (queen) {
				const reach = RECRUIT_FRACTION * Math.min(width, height);
				for (const bee of flying) {
					if (bee.queen === queen || bee.expiring) continue;
					if (Math.hypot(bee.x - queen.x, bee.y - queen.y) < reach) bee.recruit(queen);
				}
			}

			ctx.globalCompositeOperation = 'source-over';
			for (let i = puffs.length - 1; i >= 0; i--) {
				puffs[i].update();
				puffs[i].draw(ctx);
				if (puffs[i].dead) puffs.splice(i, 1);
			}

			ctx.globalCompositeOperation = 'lighter';
			for (let i = flying.length - 1; i >= 0; i--) {
				const bee = flying[i];
				bee.update(width, height, mouseX, mouseY, now, smoke);
				bee.draw(ctx);
				if (bee.dead) flying.splice(i, 1);
			}

			// The Queen has dark details that additive blending would wash out.
			ctx.globalCompositeOperation = 'source-over';
			for (const old of fadingQueens) old.draw(ctx, frameCount);
			queen?.draw(ctx, frameCount);

			// The whole point of the rewrite: v1 kept requestAnimationFrame running
			// forever and merely stopped spawning. Here the loop ends once the last
			// bee has faded, so switching them off costs nothing at all.
			const idle = flying.length === 0 && puffs.length === 0 && !queen && fadingQueens.length === 0;
			if (!bees.active && idle) {
				frame = 0;
				ctx.clearRect(0, 0, width, height);
				return;
			}
			frame = requestAnimationFrame(tick);
		}

		function start() {
			if (frame === 0) frame = requestAnimationFrame(tick);
		}

		function onPointerMove(event: PointerEvent) {
			mouseX = event.clientX;
			mouseY = event.clientY;
		}

		function onPointerLeave() {
			mouseX = -9999;
			mouseY = -9999;
			stopSmoke();
		}

		function onPointerDown(event: PointerEvent) {
			lastPointerType = event.pointerType;
			if (!bees.active || event.pointerType !== 'mouse' || event.button !== 0) return;
			if (!isHoneycomb(event.target)) return;
			clearTimeout(holdTimer);
			holdTimer = setTimeout(() => (smoking = true), SMOKE_DELAY_MS);
		}

		/**
		 * A press on bare Honeycomb is a Smoke or Queen gesture, not the start of a text
		 * selection, so a drag from there must not highlight the page.
		 */
		function onMouseDown(event: MouseEvent) {
			if (!bees.active || event.button !== 0 || !isHoneycomb(event.target)) return;
			event.preventDefault();
			window.getSelection()?.removeAllRanges();
		}

		function onDoubleClick(event: MouseEvent) {
			if (!bees.active || lastPointerType !== 'mouse' || !isHoneycomb(event.target)) return;
			const now = performance.now();
			if (queen) {
				queen.dismiss(now, QUEEN_REPLACE_FADE_MS);
				release(queen, now);
				fadingQueens.push(queen);
			}
			queen = new Queen(event.clientX, event.clientY, now);
			start();
		}

		resize();
		window.addEventListener('resize', resize);
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		document.addEventListener('pointerleave', onPointerLeave);
		window.addEventListener('pointerdown', onPointerDown, { passive: true });
		window.addEventListener('pointerup', stopSmoke);
		window.addEventListener('pointercancel', stopSmoke);
		window.addEventListener('blur', stopSmoke);
		window.addEventListener('dblclick', onDoubleClick);
		window.addEventListener('mousedown', onMouseDown);

		const stopWatching = $effect.root(() => {
			$effect(() => {
				if (bees.active) start();
				else {
					const now = performance.now();
					flying.forEach((bee) => bee.retire());
					queen?.dismiss(now, QUEEN_FADE_MS);
					stopSmoke();
				}
			});
		});

		return () => {
			stopWatching();
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerleave', onPointerLeave);
			window.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointerup', stopSmoke);
			window.removeEventListener('pointercancel', stopSmoke);
			window.removeEventListener('blur', stopSmoke);
			window.removeEventListener('dblclick', onDoubleClick);
			window.removeEventListener('mousedown', onMouseDown);
			clearTimeout(holdTimer);
		};
	});
</script>

<canvas bind:this={canvas} aria-hidden="true" class="pointer-events-none fixed inset-0 -z-[5]"
></canvas>
