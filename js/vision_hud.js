/**
 * AI COMPUTER VISION & DIGITAL TWIN HUD
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Simulates real-time RGB-D camera perception, YOLOv8 object detection,
 * ripeness classification, 3D spatial target projection, and depth measurement.
 */

class VisionHUD {
    constructor(canvasId, robot, orchard, camera) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn("VisionHUD: Canvas element not found:", canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.robot = robot;
        this.orchard = orchard;
        this.mainCamera = camera;

        this.currentTarget = null;
        this.detectedFruits = [];
        this.scanAngle = 0;
        this.fps = 30;

        // Initialize canvas sizing
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.width = this.canvas.clientWidth || 320;
        this.height = this.canvas.clientHeight || 220;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setTargetFruit(fruit) {
        this.currentTarget = fruit;
    }

    /**
     * Render simulated camera viewport with AI bounding boxes & analytics
     */
    render(activeState = 'SCANNING') {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 1. Dark HUD Camera Feed Background with slight green/blue tint
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Simulated camera video feed scanlines / grid
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.25)';
        ctx.lineWidth = 1;
        const gridStep = 30;
        for (let x = 0; x < w; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // 2. Camera Sensor Metadata Overlay (Top Bar)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('RGB-D EYE-IN-HAND [REALSENSE D435i]', 8, 18);

        ctx.fillStyle = activeState === 'HARVESTING' ? '#ef4444' : '#22c55e';
        ctx.beginPath();
        ctx.arc(w - 18, 14, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(activeState, w - 85, 17);

        // 3. Central Aiming Reticle / Optical Crosshairs
        const cx = w / 2;
        const cy = h / 2 + 10;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy);
        ctx.lineTo(cx - 6, cy);
        ctx.moveTo(cx + 6, cy);
        ctx.lineTo(cx + 20, cy);
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx, cy - 6);
        ctx.moveTo(cx, cy + 6);
        ctx.lineTo(cx, cy + 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.stroke();

        // 4. Project 3D fruits into camera perspective
        const robotGraspPos = this.robot.getGraspWorldPosition();
        let ripeCount = 0;
        let unripeCount = 0;

        // Filter fruits near robot arm
        const visibleFruits = this.orchard.fruits.filter(f => {
            if (f.harvested) return false;
            const wp = f.getWorldPosition();
            const d = wp.distanceTo(robotGraspPos);
            return d < 2.5;
        });

        visibleFruits.forEach(f => {
            const wp = f.getWorldPosition();
            const dist = wp.distanceTo(robotGraspPos);

            // Approximate screen projection relative to robot facing
            const dx = (wp.x - robotGraspPos.x);
            const dy = (wp.y - robotGraspPos.y);
            const dz = (wp.z - robotGraspPos.z);

            // Project to 2D HUD space
            const screenX = cx + (dx * 120) / Math.max(0.4, dist);
            const screenY = cy - (dy * 120) / Math.max(0.4, dist);

            // Screen boundary check
            if (screenX > 15 && screenX < w - 15 && screenY > 35 && screenY < h - 25) {
                const isTarget = (this.currentTarget && this.currentTarget.id === f.id);
                const isRipe = f.isRipe;

                if (isRipe) ripeCount++;
                else unripeCount++;

                const boxSize = Math.max(24, Math.min(65, (75 / dist)));

                // Box colors
                const primaryColor = isTarget ? '#f59e0b' : (isRipe ? '#22c55e' : '#64748b');
                const boxBg = isTarget ? 'rgba(245, 158, 11, 0.15)' : (isRipe ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.08)');

                ctx.fillStyle = boxBg;
                ctx.fillRect(screenX - boxSize / 2, screenY - boxSize / 2, boxSize, boxSize);

                // Corner bracket bounding box
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = isTarget ? 2 : 1.5;
                const cornerLen = boxSize * 0.28;
                const bx = screenX - boxSize / 2;
                const by = screenY - boxSize / 2;

                // Top-Left
                ctx.beginPath();
                ctx.moveTo(bx, by + cornerLen);
                ctx.lineTo(bx, by);
                ctx.lineTo(bx + cornerLen, by);
                // Top-Right
                ctx.moveTo(bx + boxSize - cornerLen, by);
                ctx.lineTo(bx + boxSize, by);
                ctx.lineTo(bx + boxSize, by + cornerLen);
                // Bottom-Left
                ctx.moveTo(bx, by + boxSize - cornerLen);
                ctx.lineTo(bx, by + boxSize);
                ctx.lineTo(bx + cornerLen, by + boxSize);
                // Bottom-Right
                ctx.moveTo(bx + boxSize - cornerLen, by + boxSize);
                ctx.lineTo(bx + boxSize, by + boxSize);
                ctx.lineTo(bx + boxSize, by + boxSize - cornerLen);
                ctx.stroke();

                // Target lock line from reticle to target fruit
                if (isTarget) {
                    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(screenX, screenY);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // AI Detection Label (YOLO Style)
                ctx.fillStyle = primaryColor;
                ctx.fillRect(bx, by - 14, Math.min(105, boxSize + 30), 13);
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 8px monospace';
                const labelText = isRipe ?
                    `${isTarget ? 'LOCK' : 'RIPE'} ${f.ripenessScore}%` :
                    `UNRIPE ${f.ripenessScore}%`;
                ctx.fillText(labelText, bx + 3, by - 4);

                // Distance annotation below box
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '8px monospace';
                ctx.fillText(`Z:${dist.toFixed(2)}m  Ø:${f.diameterMm}mm`, bx, by + boxSize + 11);
            }
        });

        // 5. Radar / HUD Bottom Telemetry Bar
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, h - 22, w, 22);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px monospace';
        ctx.fillText(`AI YOLOv8: ${visibleFruits.length} OBJS`, 8, h - 8);

        ctx.fillStyle = '#22c55e';
        ctx.fillText(`RIPE:${ripeCount}`, 125, h - 8);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`UNRIPE:${unripeCount}`, 175, h - 8);

        // Animated laser scanline
        this.scanAngle += 0.04;
        const scanY = 32 + ((Math.sin(this.scanAngle) + 1) / 2) * (h - 55);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();
    }
}

// Export for module or global use
if (typeof module !== 'undefined') {
    module.exports = VisionHUD;
}

