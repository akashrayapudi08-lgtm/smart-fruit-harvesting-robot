/**
 * PROCEDURAL PBR TEXTURE GENERATOR
 * Generates high-resolution textures (diffuse, bump, roughness) using HTML5 Canvas
 * for photorealistic rendering without external network downloads.
 */

class TextureGenerator {
    /**
     * Create realistic orchard grass texture with layered grass blades and soil
     */
    static createGrassTexture(size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base soil / dark turf
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(0, 0, size, size);

        // Noise base
        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 35;
            data[i] = Math.max(20, Math.min(80, data[i] + noise));
            data[i + 1] = Math.max(60, Math.min(130, data[i + 1] + noise * 1.2));
            data[i + 2] = Math.max(10, Math.min(50, data[i + 2] + noise * 0.5));
        }
        ctx.putImageData(imgData, 0, 0);

        // Overlay grass blades
        const bladeColors = ['#3f7e28', '#4d9931', '#5cb33a', '#2d601b', '#6bbd44', '#365314'];
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 18000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = 4 + Math.random() * 8;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;

            ctx.strokeStyle = bladeColors[Math.floor(Math.random() * bladeColors.length)];
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(16, 16);
        return texture;
    }

    /**
     * Create compacted orchard tractor track / dirt lane texture
     */
    static createDirtTexture(size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#6b4f2c';
        ctx.fillRect(0, 0, size, size);

        // Noise & pebbles
        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 40;
            data[i] = Math.max(50, Math.min(140, data[i] + noise));
            data[i + 1] = Math.max(35, Math.min(110, data[i + 1] + noise * 0.8));
            data[i + 2] = Math.max(15, Math.min(70, data[i + 2] + noise * 0.5));
        }
        ctx.putImageData(imgData, 0, 0);

        // Tire track grooves
        ctx.fillStyle = 'rgba(40, 25, 12, 0.35)';
        for (let y = 0; y < size; y += 12) {
            ctx.fillRect(0, y, size, 4);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 20);
        return texture;
    }

    /**
     * Create vertical fibrous tree bark texture with fissures
     */
    static createBarkTexture(size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#3a2312';
        ctx.fillRect(0, 0, size, size);

        // Vertical ridges and fissures
        const barkTones = ['#2b180a', '#4a301a', '#54371e', '#231408', '#634226'];
        for (let i = 0; i < 1200; i++) {
            const x = Math.random() * size;
            const w = 2 + Math.random() * 5;
            const h = 20 + Math.random() * 60;
            const y = Math.random() * size;
            ctx.fillStyle = barkTones[Math.floor(Math.random() * barkTones.length)];
            ctx.fillRect(x, y, w, h);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 4);
        return texture;
    }

    /**
     * Create realistic apple skin texture with sun-blushing and lenticels (speckles)
     */
    static createAppleTexture(isRipe = true, size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (isRipe) {
            // Radial blush gradient (Golden Yellow to Ruby Red)
            const grad = ctx.createLinearGradient(0, 0, size, size);
            grad.addColorStop(0, '#ef4444');   // Bright crimson
            grad.addColorStop(0.3, '#dc2626'); // Deep ruby
            grad.addColorStop(0.7, '#b91c1c'); // Maroon
            grad.addColorStop(0.9, '#f59e0b'); // Golden undertone on shaded side
            grad.addColorStop(1.0, '#ea580c'); // Warm amber
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);

            // Subtle vertical striations
            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            for (let x = 0; x < size; x += 3 + Math.random() * 4) {
                ctx.fillRect(x, 0, 1.5, size);
            }

            // Golden lenticels (tiny natural pores on apple skin)
            ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
            for (let i = 0; i < 400; i++) {
                const px = Math.random() * size;
                const py = Math.random() * size;
                ctx.fillRect(px, py, 1.2, 1.2);
            }
        } else {
            // Unripe Granny Smith / Green Apple skin
            const grad = ctx.createLinearGradient(0, 0, size, size);
            grad.addColorStop(0, '#84cc16'); // Bright lime
            grad.addColorStop(0.5, '#65a30d'); // Olive green
            grad.addColorStop(1, '#4d7c0f'); // Deep leaf green
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);

            // Pale green lenticels
            ctx.fillStyle = 'rgba(236, 252, 203, 0.5)';
            for (let i = 0; i < 300; i++) {
                ctx.fillRect(Math.random() * size, Math.random() * size, 1.2, 1.2);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    /**
     * Create realistic leaf card texture with organic leaves, veins, and transparent background
     */
    static createLeafCardTexture(size = 512) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Clear transparent background
        ctx.clearRect(0, 0, size, size);

        // Draw multiple clustered apple leaves radiating outward
        const leafClusters = [
            { cx: 256, cy: 256, angle: 0, scale: 1.0 },
            { cx: 256, cy: 256, angle: Math.PI * 0.45, scale: 0.9 },
            { cx: 256, cy: 256, angle: -Math.PI * 0.45, scale: 0.88 },
            { cx: 256, cy: 256, angle: Math.PI * 0.85, scale: 0.95 },
            { cx: 256, cy: 256, angle: -Math.PI * 0.85, scale: 0.92 }
        ];

        // Central twig
        ctx.strokeStyle = '#4a2f16';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(256, 450);
        ctx.lineTo(256, 256);
        ctx.stroke();

        leafClusters.forEach(lc => {
            ctx.save();
            ctx.translate(lc.cx, lc.cy);
            ctx.rotate(lc.angle);
            ctx.scale(lc.scale, lc.scale);

            // Leaf twig petiole
            ctx.strokeStyle = '#5c3a1e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -60);
            ctx.stroke();

            // Leaf blade (pointed oval with serrated edges)
            const leafLen = 130;
            const leafWidth = 60;
            const grad = ctx.createLinearGradient(-leafWidth, -60, leafWidth, -60 - leafLen);
            grad.addColorStop(0, '#2e7d32');
            grad.addColorStop(0.5, '#388e3c');
            grad.addColorStop(1, '#1b5e20');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, -60);
            // Left curve
            ctx.bezierCurveTo(-leafWidth, -90, -leafWidth * 0.9, -150, 0, -60 - leafLen);
            // Right curve
            ctx.bezierCurveTo(leafWidth * 0.9, -150, leafWidth, -90, 0, -60);
            ctx.fill();

            // Serrated edge highlights
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Central main vein
            ctx.strokeStyle = '#81c784';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -60);
            ctx.quadraticCurveTo(2, -120, 0, -60 - leafLen);
            ctx.stroke();

            // Lateral veins
            ctx.lineWidth = 1.2;
            for (let v = -80; v > -60 - leafLen + 20; v -= 16) {
                // Left vein
                ctx.beginPath();
                ctx.moveTo(0, v);
                ctx.lineTo(-leafWidth * 0.55, v - 12);
                ctx.stroke();
                // Right vein
                ctx.beginPath();
                ctx.moveTo(0, v);
                ctx.lineTo(leafWidth * 0.55, v - 12);
                ctx.stroke();
            }

            ctx.restore();
        });

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    /**
     * Create industrial hazard warning stripes for chassis
     */
    static createHazardStripesTexture(size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f59e0b'; // Industrial yellow
        ctx.fillRect(0, 0, size, size);

        // 45-degree diagonal black stripes
        ctx.fillStyle = '#0f172a'; // Carbon black
        const stripeWidth = 32;
        for (let x = -size; x < size * 2; x += stripeWidth * 2) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + stripeWidth, 0);
            ctx.lineTo(x + stripeWidth - size, size);
            ctx.lineTo(x - size, size);
            ctx.closePath();
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        return texture;
    }

    /**
     * Create tire tread pattern bump map
     */
    static createTireTreadTexture(size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, size, size);

        // Heavy Chevron / Lug tread blocks
        ctx.fillStyle = '#ffffff';
        const blockW = 28;
        for (let y = 0; y < size; y += 32) {
            // Left lug
            ctx.beginPath();
            ctx.moveTo(10, y);
            ctx.lineTo(size * 0.45, y + 12);
            ctx.lineTo(size * 0.45, y + 24);
            ctx.lineTo(10, y + 12);
            ctx.closePath();
            ctx.fill();

            // Right lug (offset)
            ctx.beginPath();
            ctx.moveTo(size - 10, y + 16);
            ctx.lineTo(size * 0.55, y + 28);
            ctx.lineTo(size * 0.55, y + 40);
            ctx.lineTo(size - 10, y + 28);
            ctx.closePath();
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 6);
        return texture;
    }
}

// Export for module or global use
if (typeof module !== 'undefined') {
    module.exports = TextureGenerator;
}

