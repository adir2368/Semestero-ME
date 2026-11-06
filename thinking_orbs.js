/**
 * ThinkingOrbs - Zero-Dependency 2D Canvas Cognitive State Animations (ADR-075)
 * Inspired by modern AI agent state visualization.
 * Replaces generic loading spinners with responsive, hand-tuned kinetic particle animations.
 */

(function(window) {
    'use strict';

    const activeOrbs = new Map();

    class CanvasOrbInstance {
        constructor(container, options = {}) {
            this.container = typeof container === 'string' ? document.getElementById(container) : container;
            if (!this.container) return;

            this.options = Object.assign({
                state: 'solving', // 'solving' | 'searching' | 'connecting'
                size: 72,
                color: '#38bdf8',
                accentColor: '#818cf8',
                label: '',
                dotCount: 36
            }, options);

            this.animId = null;
            this.time = 0;
            this.init();
        }

        init() {
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'thinking-orb-wrapper';
            this.wrapper.style.cssText = 'display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; user-select: none;';

            this.canvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.options.size * dpr;
            this.canvas.height = this.options.size * dpr;
            this.canvas.style.width = this.options.size + 'px';
            this.canvas.style.height = this.options.size + 'px';
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(dpr, dpr);

            this.wrapper.appendChild(this.canvas);

            if (this.options.label) {
                this.labelEl = document.createElement('div');
                this.labelEl.className = 'thinking-orb-label';
                this.labelEl.textContent = this.options.label;
                this.labelEl.style.cssText = 'font-size: 0.82rem; font-weight: 600; color: #94a3b8; font-family: system-ui, sans-serif; letter-spacing: 0.3px;';
                this.wrapper.appendChild(this.labelEl);
            }

            this.container.innerHTML = '';
            this.container.appendChild(this.wrapper);

            // Generate particles
            this.dots = [];
            for (let i = 0; i < this.options.dotCount; i++) {
                this.dots.push({
                    angle: (i / this.options.dotCount) * Math.PI * 2,
                    radius: (this.options.size * 0.32) * (0.6 + Math.random() * 0.5),
                    speed: 0.02 + Math.random() * 0.03,
                    size: 1.8 + Math.random() * 1.5,
                    phase: Math.random() * Math.PI * 2
                });
            }

            this.start();
        }

        start() {
            const render = () => {
                if (!document.body.contains(this.canvas)) {
                    this.stop();
                    return;
                }

                // Auto-pause if container or canvas is hidden
                const rect = this.canvas.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 &&
                                  window.getComputedStyle(this.container).display !== 'none';

                if (isVisible) {
                    this.draw();
                }

                this.time += 0.03;
                this.animId = requestAnimationFrame(render);
            };

            this.stop();
            this.animId = requestAnimationFrame(render);
        }

        stop() {
            if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
            }
        }

        setState(newState, newLabel) {
            this.options.state = newState;
            if (newLabel !== undefined && this.labelEl) {
                this.labelEl.textContent = newLabel;
            }
        }

        draw() {
            const ctx = this.ctx;
            const size = this.options.size;
            const cx = size / 2;
            const cy = size / 2;

            ctx.clearRect(0, 0, size, size);

            if (this.options.state === 'solving') {
                // Kinetic vortex: dots swirl around center in a gravitational field
                for (let i = 0; i < this.dots.length; i++) {
                    const dot = this.dots[i];
                    const currentAngle = dot.angle + this.time * dot.speed * 2.5;
                    const rOffset = Math.sin(this.time * 2 + dot.phase) * (size * 0.08);
                    const r = Math.max(4, dot.radius + rOffset);

                    const x = cx + Math.cos(currentAngle) * r;
                    const y = cy + Math.sin(currentAngle) * r;

                    const alpha = 0.3 + 0.7 * ((Math.sin(currentAngle + this.time) + 1) / 2);
                    ctx.beginPath();
                    ctx.arc(x, y, dot.size, 0, Math.PI * 2);
                    ctx.fillStyle = i % 2 === 0 ? this.options.color : this.options.accentColor;
                    ctx.globalAlpha = alpha;
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

            } else if (this.options.state === 'searching') {
                // Radial radar scan & pulsing outward rings
                const pulse = (Math.sin(this.time * 3) + 1) / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.2 + pulse * (size * 0.15), 0, Math.PI * 2);
                ctx.strokeStyle = this.options.color;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.4 * (1 - pulse);
                ctx.stroke();

                for (let i = 0; i < this.dots.length; i++) {
                    const dot = this.dots[i];
                    const angle = dot.angle + this.time * 0.8;
                    const r = (size * 0.15) + ((i / this.dots.length) * (size * 0.3));
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;

                    ctx.beginPath();
                    ctx.arc(x, y, dot.size * 0.9, 0, Math.PI * 2);
                    ctx.fillStyle = this.options.color;
                    ctx.globalAlpha = 0.3 + 0.6 * ((Math.sin(this.time * 4 - i) + 1) / 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

            } else if (this.options.state === 'connecting') {
                // Dual oscillating intertwined particle rings
                const offset = Math.sin(this.time * 2) * (size * 0.15);
                const c1x = cx - offset;
                const c2x = cx + offset;

                for (let i = 0; i < this.dots.length; i++) {
                    const dot = this.dots[i];
                    const targetX = i % 2 === 0 ? c1x : c2x;
                    const color = i % 2 === 0 ? this.options.color : this.options.accentColor;
                    const angle = dot.angle + (i % 2 === 0 ? 1 : -1) * this.time * 1.5;
                    const x = targetX + Math.cos(angle) * (dot.radius * 0.7);
                    const y = cy + Math.sin(angle) * (dot.radius * 0.7);

                    ctx.beginPath();
                    ctx.arc(x, y, dot.size, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.time * 3 + dot.phase);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        }

        destroy() {
            this.stop();
            if (this.wrapper && this.wrapper.parentNode) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
        }
    }

    const ThinkingOrb = {
        attach: function(container, options) {
            const key = typeof container === 'string' ? container : container.id;
            if (key && activeOrbs.has(key)) {
                activeOrbs.get(key).destroy();
                activeOrbs.delete(key);
            }
            const instance = new CanvasOrbInstance(container, options);
            if (key) activeOrbs.set(key, instance);
            return instance;
        },

        detach: function(container) {
            const key = typeof container === 'string' ? container : container.id;
            if (key && activeOrbs.has(key)) {
                activeOrbs.get(key).destroy();
                activeOrbs.delete(key);
            }
        },

        get: function(key) {
            return activeOrbs.get(key);
        }
    };

    window.ThinkingOrb = ThinkingOrb;

})(typeof window !== 'undefined' ? window : this);
