/**
 * ENHANCED 3D SIMULATION CONTROLLER & REALISTIC RENDER ENGINE
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Provides crystal-clear rendering, PBR lighting, procedural sky/atmosphere,
 * camera presets, HUD toggle for full 3D visibility, and dynamic laser targeting.
 */

class SmartHarvestSimulation {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();

        // Core Three.js systems
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Application modules
        this.kinematics = null;
        this.robot = null;
        this.orchard = null;
        this.harvestFSM = null;
        this.visionHUD = null;

        // Camera presets & state
        this.cameraMode = 'ORBIT'; // 'ORBIT', 'CLOSE_UP', 'CHASE', 'TOOL', 'TOP_DOWN'
        this.chaseCamOffset = new THREE.Vector3(0, 2.0, -3.4);
        this.closeUpOffset = new THREE.Vector3(-2.2, 1.4, 1.8);

        // Environment lighting
        this.sunLight = null;
        this.hemiLight = null;
        this.currentLighting = 'DAY';

        // HUD visibility
        this.isHudVisible = true;

        // Operational mode
        this.controlMode = 'AUTO';
        this.manualKeys = { w: false, s: false, a: false, d: false };

        // 3D Laser Targeting Indicator
        this.laserMesh = null;

        this._initEngine();
        this._initLighting();
        this._initModules();
        this._initLaserIndicator();
        this._bindUI();
        this._bindKeyboard();
        this._startLoop();
    }

    _initEngine() {
        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x93c5fd);

        // Crystal-clear linear atmosphere: NO milky fog in near/mid field!
        this.scene.fog = new THREE.Fog(0xdbeafe, 42, 95);

        // 2. Camera: Open directly at close cinematic angle
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 160);
        this.camera.position.set(-2.8, 1.8, -5.6);

        // 3. WebGL Renderer with High-Fidelity PBR Tone Mapping
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.22; // Vivid & clear exposure
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // 4. Orbit Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep above terrain
        this.controls.minDistance = 0.8;
        this.controls.maxDistance = 45.0;
        this.controls.target.set(0, 1.05, -7.8);

        // Window resize handler
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    _initLighting() {
        // Natural sky / ground hemisphere bounce light (Global Illumination feel)
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.85);
        this.hemiLight.position.set(0, 50, 0);
        this.scene.add(this.hemiLight);

        // Directional Sunlight (Crisp contact shadows)
        this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
        this.sunLight.position.set(16, 28, 14);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 50;
        const d = 14;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0002;
        this.scene.add(this.sunLight);

        // Soft ambient fill light for shaded side of trees
        const ambientFill = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientFill);
    }

    _initModules() {
        // Kinematics solver
        this.kinematics = new ArmKinematics();

        // 3D Robot
        this.robot = new SmartHarvestingRobot(this.scene, this.kinematics);
        this.robot.chassisPosition.set(0, 0, -8.0);
        this.robot.root.position.copy(this.robot.chassisPosition);

        // Orchard terrain & fruit trees with PBR textures
        this.orchard = new OrchardEnvironment(this.scene);

        // Vision HUD
        this.visionHUD = new VisionHUD('vision-canvas', this.robot, this.orchard, this.camera);

        // Harvesting FSM
        this.harvestFSM = new HarvestFSM(this.robot, this.kinematics, this.orchard, this.visionHUD);
        this.harvestFSM.onTelemetryUpdate = (data) => this._updateTelemetryDisplay(data);

        // Focus orbit target on initial robot arm position
        this.controls.target.set(0, 1.05, -7.8);

        // Auto-start rover navigation immediately on load
        setTimeout(() => {
            if (this.harvestFSM && this.controlMode === 'AUTO') {
                this.harvestFSM.startAutoHarvest();
            }
        }, 300);
    }

    _initLaserIndicator() {
        // Real-time 3D Laser Targeting Beam
        const laserMat = new THREE.LineBasicMaterial({
            color: 0xef4444,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
        });
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)];
        const laserGeo = new THREE.BufferGeometry().setFromPoints(points);
        this.laserMesh = new THREE.Line(laserGeo, laserMat);
        this.laserMesh.visible = false;
        this.scene.add(this.laserMesh);
    }

    _bindUI() {
        // Toggle Fullscreen / HUD Visibility
        const btnToggleHud = document.getElementById('btn-toggle-hud');
        const hudBody = document.getElementById('hud-body-container');
        if (btnToggleHud && hudBody) {
            btnToggleHud.addEventListener('click', () => {
                this.isHudVisible = !this.isHudVisible;
                hudBody.classList.toggle('hud-collapsed', !this.isHudVisible);
                btnToggleHud.textContent = this.isHudVisible ? "👁 HIDE HUD" : "👁 SHOW HUD";
                btnToggleHud.classList.toggle('active', !this.isHudVisible);
            });
        }

        // Camera Preset Buttons
        const cameraPresets = {
            'cam-orbit': 'ORBIT',
            'cam-closeup': 'CLOSE_UP',
            'cam-chase': 'CHASE',
            'cam-tool': 'TOOL',
            'cam-topdown': 'TOP_DOWN'
        };

        for (const [btnId, mode] of Object.entries(cameraPresets)) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.btn-cam-preset').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.setCameraMode(mode);
                });
            }
        }

        // Mode switch tabs (Autonomous vs Manual)
        const btnAuto = document.getElementById('btn-mode-auto');
        const btnManual = document.getElementById('btn-mode-manual');
        const panelManual = document.getElementById('manual-controls-panel');

        if (btnAuto && btnManual) {
            btnAuto.addEventListener('click', () => {
                this.controlMode = 'AUTO';
                btnAuto.classList.add('active');
                btnManual.classList.remove('active');
                if (panelManual) panelManual.style.display = 'none';
                this.harvestFSM.startAutoHarvest();
            });

            btnManual.addEventListener('click', () => {
                this.controlMode = 'MANUAL';
                btnManual.classList.add('active');
                btnAuto.classList.remove('active');
                if (panelManual) panelManual.style.display = 'block';
                this.harvestFSM.pauseHarvest();
                this.robot.setStatus('IDLE');
            });
        }

        // Play, Pause, Reset Buttons
        const btnPlay = document.getElementById('btn-play');
        const btnPause = document.getElementById('btn-pause');
        const btnReset = document.getElementById('btn-reset');

        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                if (this.controlMode === 'AUTO') {
                    this.harvestFSM.startAutoHarvest();
                } else {
                    this.harvestFSM.resumeHarvest();
                }
            });
        }

        if (btnPause) {
            btnPause.addEventListener('click', () => {
                this.harvestFSM.pauseHarvest();
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.harvestFSM.resetHarvest();
            });
        }

        // Speed Buttons (1x, 2x, 4x)
        ['1x', '2x', '4x'].forEach(speedStr => {
            const btn = document.getElementById(`btn-speed-${speedStr}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.harvestFSM.simSpeedMultiplier = parseFloat(speedStr);
                });
            }
        });

        // Lighting / Time of day dropdown
        const lightSelect = document.getElementById('select-lighting');
        if (lightSelect) {
            lightSelect.addEventListener('change', (e) => {
                this.setLightingMode(e.target.value);
            });
        }

        // Manual Joint Sliders
        for (let j = 1; j <= 5; j++) {
            const slider = document.getElementById(`slider-j${j}`);
            const valSpan = document.getElementById(`val-j${j}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    if (this.controlMode !== 'MANUAL') return;
                    const rad = parseFloat(e.target.value) * (Math.PI / 180);
                    this.kinematics.targetAngles[`theta${j}`] = rad;
                    if (valSpan) valSpan.textContent = `${e.target.value}°`;
                });
            }
        }

        // Manual Gripper Open/Close
        const btnGripOpen = document.getElementById('btn-grip-open');
        const btnGripClose = document.getElementById('btn-grip-close');
        if (btnGripOpen) {
            btnGripOpen.addEventListener('click', () => {
                this.robot.setGripper(1.0);
            });
        }
        if (btnGripClose) {
            btnGripClose.addEventListener('click', () => {
                this.robot.setGripper(0.08);
            });
        }

        // Manual Stem Cutter
        const btnCutter = document.getElementById('btn-toggle-cutter');
        if (btnCutter) {
            btnCutter.addEventListener('click', () => {
                const nextState = !this.robot.isCutting;
                this.robot.setCutterActive(nextState);
                btnCutter.textContent = nextState ? "STOP CUTTER" : "ACTUATE CUTTER";
                btnCutter.classList.toggle('active', nextState);
            });
        }
    }

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            // Toggle HUD with 'h'
            if (key === 'h') {
                const btn = document.getElementById('btn-toggle-hud');
                if (btn) btn.click();
            }

            // Keyboard AGV navigation
            if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                if (key === 'w' || key === 'arrowup') this.manualKeys.w = true;
                if (key === 's' || key === 'arrowdown') this.manualKeys.s = true;
                if (key === 'a' || key === 'arrowleft') this.manualKeys.a = true;
                if (key === 'd' || key === 'arrowright') this.manualKeys.d = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.manualKeys.w = false;
            if (key === 's' || key === 'arrowdown') this.manualKeys.s = false;
            if (key === 'a' || key === 'arrowleft') this.manualKeys.a = false;
            if (key === 'd' || key === 'arrowright') this.manualKeys.d = false;
        });
    }

    setCameraMode(mode) {
        this.cameraMode = mode;
        if (mode === 'ORBIT') {
            this.controls.enabled = true;
            this.controls.target.copy(this.robot.chassisPosition).add(new THREE.Vector3(0, 1.0, 0.2));
        } else {
            this.controls.enabled = false;
        }

        if (mode === 'TOP_DOWN') {
            this.camera.position.set(0, 15.0, this.robot.chassisPosition.z);
            this.camera.lookAt(0, 0, this.robot.chassisPosition.z);
        } else if (mode === 'CLOSE_UP') {
            const pos = this.robot.chassisPosition.clone().add(new THREE.Vector3(-2.2, 1.4, 1.4));
            this.camera.position.copy(pos);
            this.camera.lookAt(this.robot.chassisPosition.x, this.robot.chassisPosition.y + 1.1, this.robot.chassisPosition.z + 0.3);
        }
    }

    setLightingMode(mode) {
        this.currentLighting = mode;
        switch (mode) {
            case 'DAY':
                this.scene.background.set(0x93c5fd);
                this.scene.fog.color.set(0xdbeafe);
                this.sunLight.color.set(0xfffbeb);
                this.sunLight.intensity = 1.8;
                this.sunLight.position.set(16, 28, 14);
                this.hemiLight.intensity = 0.85;
                this.robot.headlights.forEach(hl => hl.intensity = 0);
                break;

            case 'SUNSET':
                this.scene.background.set(0xfdba74);
                this.scene.fog.color.set(0xfdba74);
                this.sunLight.color.set(0xf97316);
                this.sunLight.intensity = 1.9;
                this.sunLight.position.set(28, 9, 16);
                this.hemiLight.intensity = 0.55;
                this.robot.headlights.forEach(hl => hl.intensity = 0.9);
                break;

            case 'NIGHT':
                this.scene.background.set(0x030712);
                this.scene.fog.color.set(0x0f172a);
                this.sunLight.color.set(0x38bdf8);
                this.sunLight.intensity = 0.2; // Moonlight
                this.hemiLight.intensity = 0.15;
                this.robot.headlights.forEach(hl => hl.intensity = 2.8);
                break;
        }
    }

    _updateCameraViews() {
        const robotPos = this.robot.chassisPosition;

        if (this.cameraMode === 'CHASE') {
            // Smoothly track behind vehicle
            const rotY = this.robot.chassisRotation;
            const offset = this.chaseCamOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
            const desiredCamPos = robotPos.clone().add(offset);

            this.camera.position.lerp(desiredCamPos, 0.08);
            this.camera.lookAt(robotPos.x, robotPos.y + 1.1, robotPos.z + 1.4);
        } else if (this.cameraMode === 'CLOSE_UP') {
            // Action close-up tracking the arm and target tree
            const desiredPos = robotPos.clone().add(new THREE.Vector3(-2.2, 1.4, 0.9));
            this.camera.position.lerp(desiredPos, 0.06);
            this.camera.lookAt(robotPos.x, robotPos.y + 1.05, robotPos.z + 0.3);
        } else if (this.cameraMode === 'TOOL') {
            // Tool Eye-in-Hand camera POV
            const graspPos = this.robot.getGraspWorldPosition();
            this.camera.position.set(graspPos.x, graspPos.y + 0.08, graspPos.z - 0.18);
            this.camera.lookAt(graspPos.x, graspPos.y, graspPos.z + 0.9);
        } else if (this.cameraMode === 'TOP_DOWN') {
            this.camera.position.set(0, 15.0, robotPos.z);
            this.camera.lookAt(0, 0, robotPos.z);
        }
    }

    _updateLaserTargeting() {
        if (!this.laserMesh) return;

        const target = this.harvestFSM.currentTarget;
        const state = this.harvestFSM.currentState;
        const isTracking = target && ['TARGET_LOCK', 'APPROACH_ARM', 'GRASP_FRUIT', 'CUT_STEM'].includes(state);

        if (isTracking) {
            const graspPos = this.robot.getGraspWorldPosition();
            const targetPos = target.getWorldPosition();

            const posAttr = this.laserMesh.geometry.attributes.position;
            posAttr.setXYZ(0, graspPos.x, graspPos.y, graspPos.z);
            posAttr.setXYZ(1, targetPos.x, targetPos.y, targetPos.z);
            posAttr.needsUpdate = true;
            this.laserMesh.visible = true;
        } else {
            this.laserMesh.visible = false;
        }
    }

    _updateManualDrive(dt) {
        if (this.controlMode !== 'MANUAL') return;

        let forward = 0;
        let turn = 0;
        const driveSpeed = 1.3 * dt;
        const turnSpeed = 1.8 * dt;

        if (this.manualKeys.w) forward += driveSpeed;
        if (this.manualKeys.s) forward -= driveSpeed;
        if (this.manualKeys.a) turn += turnSpeed;
        if (this.manualKeys.d) turn -= turnSpeed;

        if (forward !== 0 || turn !== 0) {
            this.robot.drive(forward, turn);
            if (this.controls.enabled) {
                this.controls.target.copy(this.robot.chassisPosition).add(new THREE.Vector3(0, 1.0, 0));
            }
        }
    }

    _updateTelemetryDisplay(data) {
        // Status Badge
        const badge = document.getElementById('telemetry-status-badge');
        if (badge) {
            badge.textContent = data.state;
            badge.className = `status-badge status-${data.state.toLowerCase()}`;
        }

        // Metrics
        this._setTxt('metric-harvested-count', data.harvestedCount);
        this._setTxt('metric-weight', `${data.totalWeightKg} kg`);
        this._setTxt('metric-rate', `${data.pickingRatePerHour} / hr`);
        this._setTxt('metric-hopper-bar', `${data.hopperCapacityPercent}%`);
        const barElem = document.getElementById('hopper-progress-bar');
        if (barElem) barElem.style.width = `${data.hopperCapacityPercent}%`;

        // Robot Position & Gripper
        this._setTxt('metric-pos-x', data.robotPosition.x);
        this._setTxt('metric-pos-z', data.robotPosition.z);
        this._setTxt('metric-gripper', `${data.gripperOpenPercent}%`);
        this._setTxt('metric-cutter', data.cutterActive ? 'SPINNING 4500 RPM' : 'IDLE');

        // Joint Angle Displays
        for (let j = 1; j <= 5; j++) {
            const angleVal = data.jointAnglesDeg[`j${j}`];
            this._setTxt(`disp-j${j}`, `${angleVal}°`);
            if (this.controlMode === 'AUTO') {
                const s = document.getElementById(`slider-j${j}`);
                if (s) s.value = angleVal;
                const v = document.getElementById(`val-j${j}`);
                if (v) v.textContent = `${angleVal}°`;
            }
        }
    }

    _setTxt(id, txt) {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = txt;
    }

    _startLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            const dt = Math.min(0.05, this.clock.getDelta());

            // 1. Update Keyboard Driving
            this._updateManualDrive(dt);

            // 2. Animate gentle orchard wind breeze (leaves & apples sway)
            if (this.orchard && this.orchard.update) {
                this.orchard.update(this.clock.getElapsedTime());
            }

            // 3. Update Robot animations & joints
            this.robot.update(dt);

            // 4. Update Harvesting Autonomous FSM
            this.harvestFSM.update(dt);

            // 5. Update 3D Laser Targeting
            this._updateLaserTargeting();

            // 6. Update Camera Rig & glide with rover in orbit mode
            if (this.controls.enabled) {
                const targetPos = this.robot.chassisPosition.clone().add(new THREE.Vector3(0, 1.05, 0.2));
                this.controls.target.lerp(targetPos, 0.04);
                this.controls.update();
            } else {
                this._updateCameraViews();
            }

            // 7. Render 3D WebGL Scene
            this.renderer.render(this.scene, this.camera);

            // 8. Render AI Computer Vision Overlay
            this.visionHUD.render(this.harvestFSM.currentState);
        };

        animate();
    }
}

// Auto-instantiate when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.simulationApp = new SmartHarvestSimulation();
});
