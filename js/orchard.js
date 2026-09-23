/**
 * BOTANICAL REALISTIC ORCHARD ENVIRONMENT & DYNAMIC FRUIT TREES
 * WITH SOLAR CHARGING BIN & DETERMINISTIC FRUIT DEPLOYMENT
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Features:
 * 1. Industrial-grade Solar Charging Station & Depot Dock at Z = -10.5m
 * 2. Deterministic Fruit Deployment at particular picking stations along the rows
 * 3. Photorealistic botanical apple trees with fruiting spurs, calyx sepals, and wind sway
 * 4. Master crop depot storage bin with dynamic apple accumulation
 */

class OrchardEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.root = new THREE.Group();
        this.root.name = "OrchardEnvironment";
        this.scene.add(this.root);

        this.trees = [];
        this.fruits = [];
        this.harvestCrates = [];
        this.foliageClusters = [];
        this.depotFruits = [];

        // Charging station references
        this.chargingStation = null;
        this.chargingPadMesh = null;
        this.chargingRings = [];
        this.chargingGlowLight = null;
        this.isChargingActive = false;
        this.depotCrateGroup = null;

        this._buildTexturesAndMaterials();
        this._buildSkyDome();
        this._buildTerrain();
        this._buildChargingStation();
        this._buildOrchardRows();
        this._buildDistantScenery();
        this._buildDecorativeProps();
    }

    _buildTexturesAndMaterials() {
        // Procedural Textures
        this.grassTex = TextureGenerator.createGrassTexture();
        this.dirtTex = TextureGenerator.createDirtTexture();
        this.barkTex = TextureGenerator.createBarkTexture();
        this.leafTex = TextureGenerator.createLeafCardTexture();
        this.ripeAppleTex = TextureGenerator.createAppleTexture(true);
        this.unripeAppleTex = TextureGenerator.createAppleTexture(false);
        const hazardTex = TextureGenerator.createHazardStripesTexture();

        // Canvas Solar Cell Grid Texture
        const solarCanvas = document.createElement('canvas');
        solarCanvas.width = 256;
        solarCanvas.height = 256;
        const sctx = solarCanvas.getContext('2d');
        sctx.fillStyle = '#0f172a';
        sctx.fillRect(0, 0, 256, 256);
        sctx.fillStyle = '#1e3a8a';
        sctx.fillRect(4, 4, 120, 120);
        sctx.fillRect(132, 4, 120, 120);
        sctx.fillRect(4, 132, 120, 120);
        sctx.fillRect(132, 132, 120, 120);
        sctx.strokeStyle = '#94a3b8';
        sctx.lineWidth = 1.5;
        // Fine silicon busbars
        for (let y = 16; y < 256; y += 24) {
            sctx.beginPath();
            sctx.moveTo(4, y);
            sctx.lineTo(252, y);
            sctx.stroke();
        }
        const solarTex = new THREE.CanvasTexture(solarCanvas);
        solarTex.wrapS = THREE.RepeatWrapping;
        solarTex.wrapT = THREE.RepeatWrapping;
        solarTex.repeat.set(2, 2);

        this.materials = {
            // Textured Grass Ground
            grass: new THREE.MeshStandardMaterial({
                color: 0x558b2f,
                map: this.grassTex,
                roughness: 0.82,
                metalness: 0.05
            }),
            // Compacted Tractor Dirt Track
            dirtTrack: new THREE.MeshStandardMaterial({
                color: 0x8d6e63,
                map: this.dirtTex,
                roughness: 0.95,
                metalness: 0.0
            }),
            // Natural Fibrous Bark
            woodBark: new THREE.MeshStandardMaterial({
                color: 0x54371e,
                map: this.barkTex,
                roughness: 0.78,
                metalness: 0.05
            }),
            // Alpha-Cutout Realistic Leaf Cards
            leafCard: new THREE.MeshStandardMaterial({
                map: this.leafTex,
                transparent: true,
                alphaTest: 0.35,
                roughness: 0.5,
                metalness: 0.08,
                side: THREE.DoubleSide
            }),
            // Internal Canopy Volume Softening
            leafVolume: new THREE.MeshStandardMaterial({
                color: 0x2e7d32,
                roughness: 0.65,
                metalness: 0.05,
                flatShading: true
            }),
            // Photorealistic Blushed Apple (High Specular Sheen)
            ripeApple: new THREE.MeshStandardMaterial({
                map: this.ripeAppleTex,
                roughness: 0.18,
                metalness: 0.12,
                clearcoat: 0.45,
                clearcoatRoughness: 0.15
            }),
            // Unripe Granny Smith Apple
            unripeApple: new THREE.MeshStandardMaterial({
                map: this.unripeAppleTex,
                roughness: 0.28,
                metalness: 0.08
            }),
            fruitStem: new THREE.MeshStandardMaterial({
                color: 0x3e2723,
                roughness: 0.9
            }),
            fruitLeaf: new THREE.MeshStandardMaterial({
                color: 0x2e7d32,
                roughness: 0.5,
                side: THREE.DoubleSide
            }),
            calyxSepal: new THREE.MeshStandardMaterial({
                color: 0x271910,
                roughness: 0.9
            }),
            crateWood: new THREE.MeshStandardMaterial({
                color: 0xa16207,
                roughness: 0.75,
                metalness: 0.05
            }),
            trellisWire: new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.95,
                roughness: 0.2
            }),
            hazardStripe: new THREE.MeshStandardMaterial({
                map: hazardTex,
                roughness: 0.4,
                metalness: 0.2
            }),
            // Charging Station PBR Materials
            solarCell: new THREE.MeshStandardMaterial({
                map: solarTex,
                roughness: 0.12,
                metalness: 0.88
            }),
            solarFrame: new THREE.MeshStandardMaterial({
                color: 0xcfd8dc,
                metalness: 0.92,
                roughness: 0.2
            }),
            dockSteel: new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.7,
                roughness: 0.3
            }),
            dockYellow: new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                metalness: 0.4,
                roughness: 0.35
            }),
            chargingPlate: new THREE.MeshStandardMaterial({
                color: 0x0f172a,
                metalness: 0.85,
                roughness: 0.25
            }),
            chargingNeonCyan: new THREE.MeshBasicMaterial({
                color: 0x06b6d4,
                transparent: true,
                opacity: 0.75
            }),
            chargingNeonGreen: new THREE.MeshBasicMaterial({
                color: 0x10b981,
                transparent: true,
                opacity: 0.85
            }),
            screenDisplay: new THREE.MeshBasicMaterial({
                color: 0x0284c7
            })
        };
    }

    _buildSkyDome() {
        const skyGeo = new THREE.SphereGeometry(75, 32, 24);
        skyGeo.scale(-1, 1, 1);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.0, '#1e3a8a');
        grad.addColorStop(0.35, '#38bdf8');
        grad.addColorStop(0.70, '#bae6fd');
        grad.addColorStop(0.92, '#fef08a');
        grad.addColorStop(1.0, '#86efac');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 512);

        const skyTex = new THREE.CanvasTexture(canvas);
        const skyMat = new THREE.MeshBasicMaterial({ map: skyTex });
        const skyDome = new THREE.Mesh(skyGeo, skyMat);
        skyDome.name = "SkyDome";
        this.root.add(skyDome);

        // 3D Sun Disc
        const sunDiscGeo = new THREE.CircleGeometry(3.5, 32);
        const sunDiscMat = new THREE.MeshBasicMaterial({ color: 0xfffde7 });
        const sunDisc = new THREE.Mesh(sunDiscGeo, sunDiscMat);
        sunDisc.position.set(24, 38, 20);
        sunDisc.lookAt(0, 0, 0);
        this.root.add(sunDisc);
    }

    _buildTerrain() {
        const groundGeo = new THREE.PlaneGeometry(70, 70, 48, 48);
        groundGeo.rotateX(-Math.PI / 2);

        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);
            if (Math.abs(vx) > 1.8) {
                pos.setY(i, Math.sin(vx * 0.18) * Math.cos(vz * 0.18) * 0.14);
            }
        }
        groundGeo.computeVertexNormals();

        const groundMesh = new THREE.Mesh(groundGeo, this.materials.grass);
        groundMesh.receiveShadow = true;
        this.root.add(groundMesh);

        // Center Aisle Dirt Track
        const trackGeo = new THREE.PlaneGeometry(2.5, 60);
        trackGeo.rotateX(-Math.PI / 2);
        const trackMesh = new THREE.Mesh(trackGeo, this.materials.dirtTrack);
        trackMesh.position.set(0, 0.015, 0);
        trackMesh.receiveShadow = true;
        this.root.add(trackMesh);

        // Wheel Rut Tracks
        [-0.52, 0.52].forEach(rx => {
            const rutGeo = new THREE.PlaneGeometry(0.38, 60);
            rutGeo.rotateX(-Math.PI / 2);
            const rutMat = new THREE.MeshStandardMaterial({
                color: 0x5d4037,
                roughness: 0.98
            });
            const rut = new THREE.Mesh(rutGeo, rutMat);
            rut.position.set(rx, 0.02, 0);
            rut.receiveShadow = true;
            this.root.add(rut);
        });
    }

    /**
     * Build the 3D Solar Charging Station & Depot Dock at Z = -10.5m
     */
    _buildChargingStation() {
        const dockGroup = new THREE.Group();
        dockGroup.name = "SolarChargingStation";
        dockGroup.position.set(0, 0, -10.5);
        this.root.add(dockGroup);
        this.chargingStation = dockGroup;

        // 1. Reinforced Steel Ground Platform (2.4m wide x 3.0m deep)
        const platGeo = new THREE.BoxGeometry(2.4, 0.08, 3.0);
        platGeo.translate(0, 0.04, 0);
        const platMesh = new THREE.Mesh(platGeo, this.materials.dockSteel);
        platMesh.receiveShadow = true;
        dockGroup.add(platMesh);

        // Hazard warning perimeter apron
        const apronFront = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.085, 0.08), this.materials.hazardStripe);
        apronFront.position.set(0, 0.042, 1.48);
        dockGroup.add(apronFront);

        // 2. Dual Wheel Alignment Guide Rails (ensure AGV drives straight onto pad)
        [-0.50, 0.50].forEach(gx => {
            const railGeo = new THREE.BoxGeometry(0.08, 0.14, 2.6);
            const rail = new THREE.Mesh(railGeo, this.materials.dockYellow);
            rail.position.set(gx, 0.11, -0.1);
            rail.castShadow = true;
            dockGroup.add(rail);

            // Chamfered Entry Funnels
            const entryGeo = new THREE.BoxGeometry(0.08, 0.14, 0.4);
            entryGeo.rotateY(gx < 0 ? 0.35 : -0.35);
            const entry = new THREE.Mesh(entryGeo, this.materials.dockYellow);
            entry.position.set(gx < 0 ? gx - 0.07 : gx + 0.07, 0.11, 1.3);
            dockGroup.add(entry);
        });

        // 3. Inductive Fast-Charging Ground Pad
        const padBaseGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.04, 24);
        const padBase = new THREE.Mesh(padBaseGeo, this.materials.chargingPlate);
        padBase.position.set(0, 0.085, 0);
        dockGroup.add(padBase);
        this.chargingPadMesh = padBase;

        // Concentric Illuminated Neon Charging Rings
        [0.22, 0.36, 0.44].forEach((radius, idx) => {
            const ringGeo = new THREE.RingGeometry(radius - 0.02, radius, 32);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = this.materials.chargingNeonCyan.clone();
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.set(0, 0.106 + idx * 0.001, 0);
            dockGroup.add(ringMesh);
            this.chargingRings.push(ringMesh);
        });

        // Magnetic Inductive Alignment Contacts
        [-0.22, 0.22].forEach(cx => {
            const contactGeo = new THREE.BoxGeometry(0.06, 0.02, 0.14);
            const contact = new THREE.Mesh(contactGeo, this.materials.solarFrame);
            contact.position.set(cx, 0.108, 0);
            dockGroup.add(contact);
        });

        // Dynamic Charging Uplight (Pulses during charge cycle)
        this.chargingGlowLight = new THREE.PointLight(0x06b6d4, 0.3, 3.5);
        this.chargingGlowLight.position.set(0, 0.4, 0);
        dockGroup.add(this.chargingGlowLight);

        // 4. Heavy Structural Support Columns for Solar Canopy
        const colCoords = [
            { x: -1.05, z: -1.3 },
            { x:  1.05, z: -1.3 },
            { x: -1.05, z:  0.8 },
            { x:  1.05, z:  0.8 }
        ];

        colCoords.forEach(c => {
            const colGeo = new THREE.CylinderGeometry(0.05, 0.06, 2.7, 12);
            const col = new THREE.Mesh(colGeo, this.materials.dockSteel);
            col.position.set(c.x, 1.35, c.z);
            col.castShadow = true;
            dockGroup.add(col);

            // Column base flange
            const flangeGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.08, 12);
            const flange = new THREE.Mesh(flangeGeo, this.materials.dockYellow);
            flange.position.set(c.x, 0.08, c.z);
            dockGroup.add(flange);
        });

        // 5. Overhead Angled Solar Panel Array Canopy
        const canopyGroup = new THREE.Group();
        canopyGroup.position.set(0, 2.75, -0.25);
        canopyGroup.rotation.x = 0.28; // Tilted 16 degrees toward South
        dockGroup.add(canopyGroup);

        // Canopy Aluminum Truss Frame (3.0m wide x 2.4m deep)
        const frameGeo = new THREE.BoxGeometry(3.0, 0.08, 2.4);
        const frame = new THREE.Mesh(frameGeo, this.materials.solarFrame);
        canopyGroup.add(frame);

        // 6 Large Photovoltaic Solar Modules
        const pvGeo = new THREE.BoxGeometry(2.88, 0.04, 2.28);
        const pvMesh = new THREE.Mesh(pvGeo, this.materials.solarCell);
        pvMesh.position.y = 0.045;
        canopyGroup.add(pvMesh);

        // 6. Station Status Telemetry Terminal Pillar
        const kioskGroup = new THREE.Group();
        kioskGroup.position.set(-1.18, 0.08, 0.9);
        dockGroup.add(kioskGroup);

        const pillarGeo = new THREE.BoxGeometry(0.22, 1.35, 0.22);
        pillarGeo.translate(0, 1.35 / 2, 0);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.dockSteel);
        kioskGroup.add(pillar);

        // Angled Screen Pod
        const screenPodGeo = new THREE.BoxGeometry(0.34, 0.26, 0.12);
        screenPodGeo.rotateX(-0.35);
        screenPodGeo.translate(0, 1.45, 0.05);
        const screenPod = new THREE.Mesh(screenPodGeo, this.materials.dockYellow);
        kioskGroup.add(screenPod);

        const screenFaceGeo = new THREE.PlaneGeometry(0.28, 0.18);
        screenFaceGeo.rotateX(-0.35);
        screenFaceGeo.translate(0, 1.46, 0.11);
        const screenFace = new THREE.Mesh(screenFaceGeo, this.materials.screenDisplay);
        kioskGroup.add(screenFace);
        this.kioskScreen = screenFace;

        // Overhead Station Indicator Beacon
        const beaconGeo = new THREE.SphereGeometry(0.06, 12, 8);
        const beacon = new THREE.Mesh(beaconGeo, this.materials.chargingNeonGreen);
        beacon.position.set(-1.18, 1.85, 0.9);
        dockGroup.add(beacon);
        this.dockBeacon = beacon;

        // 7. Master Orchard Crop Depot Bulk Storage Crate (adjacent to dock)
        const depotCrateGroup = new THREE.Group();
        depotCrateGroup.position.set(1.45, 0.08, -0.1);
        dockGroup.add(depotCrateGroup);
        this.depotCrateGroup = depotCrateGroup;

        // Wooden Pallet Base
        const palletGeo = new THREE.BoxGeometry(1.2, 0.12, 1.2);
        const pallet = new THREE.Mesh(palletGeo, this.materials.dockSteel);
        pallet.position.y = 0.06;
        depotCrateGroup.add(pallet);

        // Large Timber Slatted Bulk Bin (1.15m x 0.85m tall)
        const binWallMat = this.materials.crateWood;
        const bw = 1.15, bd = 1.15, bh = 0.72, bt = 0.035;

        // Bottom
        const binBot = new THREE.Mesh(new THREE.BoxGeometry(bw, bt, bd), binWallMat);
        binBot.position.y = 0.12 + bt / 2;
        depotCrateGroup.add(binBot);

        // 4 Walls
        const binBack = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bt), binWallMat);
        binBack.position.set(0, 0.12 + bh / 2, -bd / 2 + bt / 2);
        depotCrateGroup.add(binBack);

        const binFront = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bt), binWallMat);
        binFront.position.set(0, 0.12 + bh / 2, bd / 2 - bt / 2);
        depotCrateGroup.add(binFront);

        const binLeft = new THREE.Mesh(new THREE.BoxGeometry(bt, bh, bd), binWallMat);
        binLeft.position.set(-bw / 2 + bt / 2, 0.12 + bh / 2, 0);
        depotCrateGroup.add(binLeft);

        const binRight = new THREE.Mesh(new THREE.BoxGeometry(bt, bh, bd), binWallMat);
        binRight.position.set(bw / 2 - bt / 2, 0.12 + bh / 2, 0);
        depotCrateGroup.add(binRight);

        // Funnel Chute from Robot Hopper to Depot Crate
        const chuteGeo = new THREE.BoxGeometry(0.35, 0.03, 0.55);
        chuteGeo.rotateZ(0.42);
        const chute = new THREE.Mesh(chuteGeo, this.materials.solarFrame);
        chute.position.set(-bw / 2 - 0.1, 0.12 + bh * 0.85, 0);
        depotCrateGroup.add(chute);

        // Storage Fruit Group inside master depot bin
        this.depotFruitHolder = new THREE.Group();
        this.depotFruitHolder.position.y = 0.16;
        depotCrateGroup.add(this.depotFruitHolder);

        // Pre-fill depot with initial harvested stockpile
        for (let i = 0; i < 18; i++) {
            this.addFruitToDepot();
        }
    }

    /**
     * Add an apple to the Master Orchard Bulk Depot Crate
     */
    addFruitToDepot() {
        if (!this.depotFruitHolder) return;
        const appleGeo = new THREE.SphereGeometry(0.046, 12, 10);
        const appleMesh = new THREE.Mesh(appleGeo, this.materials.ripeApple);
        
        const rx = (Math.random() - 0.5) * 0.85;
        const rz = (Math.random() - 0.5) * 0.85;
        const layer = Math.floor(this.depotFruits.length / 15);
        const ry = 0.05 + layer * 0.075 + Math.random() * 0.02;

        appleMesh.position.set(rx, ry, rz);
        appleMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        appleMesh.castShadow = true;
        this.depotFruitHolder.add(appleMesh);
        this.depotFruits.push(appleMesh);
    }

    /**
     * Set active charging visual effect on dock
     */
    setChargingActive(active) {
        this.isChargingActive = active;
        if (active) {
            this.chargingGlowLight.color.set(0x10b981);
            this.chargingGlowLight.intensity = 1.6;
            this.dockBeacon.material = this.materials.chargingNeonCyan;
        } else {
            this.chargingGlowLight.color.set(0x06b6d4);
            this.chargingGlowLight.intensity = 0.3;
            this.dockBeacon.material = this.materials.chargingNeonGreen;
        }
    }

    /**
     * Build Orchard Rows with DETERMINISTIC PICKING STATIONS
     */
    _buildOrchardRows() {
        const rowOffsets = [-1.35, 1.35];
        const treeSpacingZ = 2.4;
        const numTreesPerRow = 11;
        const startZ = -11.0;

        // 1. Build Trellis rows and tree structures
        rowOffsets.forEach((rowX, rowIdx) => {
            this._buildTrellisRow(rowX, startZ, numTreesPerRow * treeSpacingZ);

            for (let i = 0; i < numTreesPerRow; i++) {
                const zPos = startZ + i * treeSpacingZ;
                const ox = rowX;
                const oz = zPos;
                const faceDir = rowIdx === 0 ? 1 : -1;

                const tree = this._createFruitTree(ox, oz, faceDir);
                this.trees.push(tree);
            }
        });

        // 2. Deploy DETERMINISTIC Harvestable Fruits at Particular Picking Locations
        this._deployDeterministicHarvestableFruits();
    }

    /**
     * Deploy fruits at particular, deterministic coordinates along the aisle
     * Every target fruit has guaranteed optimal reachability (radius 0.72 - 0.88m, height 1.10 - 1.32m)
     * and is mounted to a distinct fruiting spur facing into the aisle!
     */
    _deployDeterministicHarvestableFruits() {
        const pickingStations = [
            // Station 1: Left Row at Z = -7.2m
            {
                stationId: 'STA-L1',
                rowSide: 'LEFT',
                treeZ: -7.2,
                fruits: [
                    { relX: 0.56, y: 1.18, relZ: -0.12, isRipe: true, cultivar: 'Honeycrisp', brix: '14.8' },
                    { relX: 0.52, y: 1.28, relZ:  0.15, isRipe: true, cultivar: 'Honeycrisp', brix: '14.2' }
                ]
            },
            // Station 2: Right Row at Z = -4.8m
            {
                stationId: 'STA-R1',
                rowSide: 'RIGHT',
                treeZ: -4.8,
                fruits: [
                    { relX: -0.54, y: 1.15, relZ: -0.10, isRipe: true, cultivar: 'Honeycrisp', brix: '15.1' },
                    { relX: -0.50, y: 1.26, relZ:  0.16, isRipe: true, cultivar: 'Honeycrisp', brix: '14.6' }
                ]
            },
            // Station 3: Left Row at Z = -2.4m
            {
                stationId: 'STA-L2',
                rowSide: 'LEFT',
                treeZ: -2.4,
                fruits: [
                    { relX: 0.55, y: 1.22, relZ: -0.08, isRipe: true, cultivar: 'Fuji', brix: '14.5' },
                    { relX: 0.51, y: 1.12, relZ:  0.18, isRipe: true, cultivar: 'Fuji', brix: '13.9' }
                ]
            },
            // Station 4: Right Row at Z = 0.0m
            {
                stationId: 'STA-R2',
                rowSide: 'RIGHT',
                treeZ: 0.0,
                fruits: [
                    { relX: -0.53, y: 1.20, relZ: -0.14, isRipe: true, cultivar: 'Gala', brix: '14.7' },
                    { relX: -0.55, y: 1.30, relZ:  0.12, isRipe: true, cultivar: 'Gala', brix: '14.3' }
                ]
            },
            // Station 5: Left Row at Z = +2.4m
            {
                stationId: 'STA-L3',
                rowSide: 'LEFT',
                treeZ: 2.4,
                fruits: [
                    { relX: 0.54, y: 1.16, relZ: -0.12, isRipe: true, cultivar: 'Honeycrisp', brix: '15.3' },
                    { relX: 0.50, y: 1.27, relZ:  0.14, isRipe: true, cultivar: 'Honeycrisp', brix: '14.9' }
                ]
            },
            // Station 6: Right Row at Z = +4.8m
            {
                stationId: 'STA-R3',
                rowSide: 'RIGHT',
                treeZ: 4.8,
                fruits: [
                    { relX: -0.52, y: 1.24, relZ: -0.10, isRipe: true, cultivar: 'Fuji', brix: '14.6' },
                    { relX: -0.56, y: 1.14, relZ:  0.15, isRipe: true, cultivar: 'Fuji', brix: '14.1' }
                ]
            },
            // Station 7: Left Row at Z = +7.2m
            {
                stationId: 'STA-L4',
                rowSide: 'LEFT',
                treeZ: 7.2,
                fruits: [
                    { relX: 0.53, y: 1.19, relZ: -0.11, isRipe: true, cultivar: 'Gala', brix: '14.8' },
                    { relX: 0.51, y: 1.29, relZ:  0.12, isRipe: true, cultivar: 'Gala', brix: '14.4' }
                ]
            },
            // Station 8: Right Row at Z = +9.6m
            {
                stationId: 'STA-R4',
                rowSide: 'RIGHT',
                treeZ: 9.6,
                fruits: [
                    { relX: -0.54, y: 1.21, relZ: -0.12, isRipe: true, cultivar: 'Honeycrisp', brix: '15.0' },
                    { relX: -0.50, y: 1.13, relZ:  0.16, isRipe: true, cultivar: 'Honeycrisp', brix: '14.2' }
                ]
            }
        ];

        let targetId = 1;

        pickingStations.forEach(sta => {
            // Find corresponding tree
            const tree = this.trees.find(t => 
                Math.abs(t.z - sta.treeZ) < 0.25 && 
                ((sta.rowSide === 'LEFT' && t.x < 0) || (sta.rowSide === 'RIGHT' && t.x > 0))
            );

            if (!tree) return;

            sta.fruits.forEach(fd => {
                const fruitId = targetId++;
                const fruitData = this._createFruit(fruitId, fd.isRipe, fd.cultivar, fd.brix);
                fruitData.isHarvestTarget = true;
                fruitData.stationId = sta.stationId;

                // Dedicated Fruiting Spur Twig connecting branch to target fruit
                const spurGeo = new THREE.CylinderGeometry(0.009, 0.014, 0.16, 8);
                const spurMat = this.materials.woodBark;
                const spurMesh = new THREE.Mesh(spurGeo, spurMat);
                spurMesh.rotation.z = (tree.faceDir > 0) ? -Math.PI / 4 : Math.PI / 4;
                spurMesh.position.set(fd.relX * 0.88, fd.y + 0.05, fd.relZ);
                spurMesh.castShadow = true;
                tree.group.add(spurMesh);

                // Attach fruit to tree
                fruitData.mesh.position.set(fd.relX, fd.y, fd.relZ);
                tree.group.add(fruitData.mesh);

                fruitData.treeGroup = tree.group;
                fruitData.localPos = new THREE.Vector3(fd.relX, fd.y, fd.relZ);
                this.fruits.push(fruitData);
            });
        });
    }

    _buildTrellisRow(x, startZ, length) {
        const postGeo = new THREE.CylinderGeometry(0.045, 0.055, 2.7, 8);
        const postMat = this.materials.woodBark;

        for (let z = startZ - 1; z <= startZ + length + 1; z += 4.8) {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(x * 1.18, 1.35, z);
            post.castShadow = true;
            this.root.add(post);
        }

        [0.8, 1.35, 1.95].forEach(wy => {
            const wireGeo = new THREE.CylinderGeometry(0.003, 0.003, length + 4, 6);
            wireGeo.rotateX(Math.PI / 2);
            const wire = new THREE.Mesh(wireGeo, this.materials.trellisWire);
            wire.position.set(x * 1.18, wy, startZ + length / 2);
            this.root.add(wire);
        });
    }

    _createFruitTree(x, z, faceDir) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);
        this.root.add(treeGroup);

        // 1. Organic Tapered Trunk
        const trunkHeight = 2.0;
        const trunkGeo = new THREE.CylinderGeometry(0.055, 0.11, trunkHeight, 12, 4);
        trunkGeo.translate(0, trunkHeight / 2, 0);

        const tPos = trunkGeo.attributes.position;
        for (let k = 0; k < tPos.count; k++) {
            const py = tPos.getY(k);
            if (py > 0.5) {
                tPos.setX(k, tPos.getX(k) + Math.sin(py * 2.0) * 0.025 * faceDir);
            }
        }
        trunkGeo.computeVertexNormals();

        const trunk = new THREE.Mesh(trunkGeo, this.materials.woodBark);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Root flare
        const rootGeo = new THREE.CylinderGeometry(0.11, 0.19, 0.16, 8);
        rootGeo.translate(0, 0.08, 0);
        const rootFlare = new THREE.Mesh(rootGeo, this.materials.woodBark);
        rootFlare.receiveShadow = true;
        treeGroup.add(rootFlare);

        // 2. Botanical Boughs
        const boughs = [
            { y: 0.95, len: 0.75, pitch: 0.45, yaw: 0.15 * faceDir },
            { y: 1.20, len: 0.85, pitch: 0.50, yaw: -0.2 * faceDir },
            { y: 1.45, len: 0.78, pitch: 0.55, yaw: 0.3 * faceDir },
            { y: 1.70, len: 0.65, pitch: 0.60, yaw: -0.15 * faceDir },
            { y: 1.95, len: 0.50, pitch: 0.70, yaw: 0 }
        ];

        boughs.forEach((b) => {
            const boughGroup = new THREE.Group();
            boughGroup.position.set(0, b.y, 0);
            boughGroup.rotation.y = b.yaw;
            treeGroup.add(boughGroup);

            const bGeo = new THREE.CylinderGeometry(0.02, 0.035, b.len, 8);
            bGeo.rotateZ(Math.PI / 2.8 * faceDir);
            bGeo.translate(faceDir * (b.len * 0.4), 0, 0);
            const bMesh = new THREE.Mesh(bGeo, this.materials.woodBark);
            bMesh.castShadow = true;
            boughGroup.add(bMesh);

            const foliageGroup = this._createFoliageCrossQuads();
            foliageGroup.position.set(faceDir * b.len * 0.7, 0.1, 0);
            boughGroup.add(foliageGroup);
            this.foliageClusters.push(foliageGroup);
        });

        // 3. Central Crown Foliage Cluster
        const crownFoliage = this._createFoliageCrossQuads(1.2);
        crownFoliage.position.set(0, 2.2, 0);
        treeGroup.add(crownFoliage);
        this.foliageClusters.push(crownFoliage);

        // Dense Canopy Core
        [
            { x: 0, y: 1.9, z: 0, r: 0.65 },
            { x: faceDir * 0.35, y: 1.5, z: 0.15, r: 0.52 },
            { x: -faceDir * 0.25, y: 1.6, z: -0.15, r: 0.50 }
        ].forEach(v => {
            const volGeo = new THREE.DodecahedronGeometry(v.r, 1);
            const volMesh = new THREE.Mesh(volGeo, this.materials.leafVolume);
            volMesh.position.set(v.x, v.y, v.z);
            volMesh.castShadow = true;
            volMesh.receiveShadow = true;
            treeGroup.add(volMesh);
        });

        // 4. Secondary Background Apples (unripe / upper canopy)
        for (let bg = 0; bg < 3; bg++) {
            const bgId = 9000 + Math.floor(Math.random() * 9000);
            const isRipe = Math.random() < 0.4;
            const bgFruit = this._createFruit(bgId, isRipe);
            bgFruit.isHarvestTarget = false;

            const bgX = (Math.random() - 0.5) * 0.45;
            const bgY = 1.65 + Math.random() * 0.45;
            const bgZ = (Math.random() - 0.5) * 0.5;

            bgFruit.mesh.position.set(bgX, bgY, bgZ);
            treeGroup.add(bgFruit.mesh);
            bgFruit.treeGroup = treeGroup;
            bgFruit.localPos = new THREE.Vector3(bgX, bgY, bgZ);
            this.fruits.push(bgFruit);
        }

        return {
            group: treeGroup,
            x: x,
            z: z,
            faceDir: faceDir
        };
    }

    _createFoliageCrossQuads(scale = 1.0) {
        const group = new THREE.Group();
        const quadSize = 0.65 * scale;
        const quadGeo = new THREE.PlaneGeometry(quadSize, quadSize);

        const q1 = new THREE.Mesh(quadGeo, this.materials.leafCard);
        q1.castShadow = true;
        q1.receiveShadow = true;
        group.add(q1);

        const q2 = new THREE.Mesh(quadGeo, this.materials.leafCard);
        q2.rotation.y = Math.PI / 2;
        q2.castShadow = true;
        q2.receiveShadow = true;
        group.add(q2);

        const q3 = new THREE.Mesh(quadGeo, this.materials.leafCard);
        q3.rotation.y = Math.PI / 4;
        q3.rotation.x = 0.15;
        q3.castShadow = true;
        group.add(q3);

        return group;
    }

    _createFruit(id, isRipe = true, cultivar = 'Honeycrisp', sugarBrix = '14.5') {
        const fruitGroup = new THREE.Group();
        fruitGroup.name = `Fruit_${id}`;

        const appleRadius = 0.046 + (Math.random() - 0.5) * 0.004;
        const appleGeo = new THREE.SphereGeometry(appleRadius, 24, 18);

        const aPos = appleGeo.attributes.position;
        for (let i = 0; i < aPos.count; i++) {
            const py = aPos.getY(i);
            if (py > appleRadius * 0.62) {
                aPos.setY(i, py * 0.83);
            } else if (py < -appleRadius * 0.62) {
                aPos.setY(i, py * 0.86);
            }
        }
        appleGeo.computeVertexNormals();

        const fruitMat = isRipe ? this.materials.ripeApple : this.materials.unripeApple;
        const fruitMesh = new THREE.Mesh(appleGeo, fruitMat);
        fruitMesh.castShadow = true;
        fruitMesh.receiveShadow = true;
        fruitGroup.add(fruitMesh);

        // Calyx Sepals
        for (let s = 0; s < 5; s++) {
            const sepalAngle = (s / 5) * Math.PI * 2;
            const sepalGeo = new THREE.ConeGeometry(0.003, 0.008, 4);
            sepalGeo.rotateX(Math.PI);
            const sepal = new THREE.Mesh(sepalGeo, this.materials.calyxSepal);
            sepal.position.set(
                Math.cos(sepalAngle) * 0.007,
                -appleRadius * 0.85,
                Math.sin(sepalAngle) * 0.007
            );
            fruitGroup.add(sepal);
        }

        // Curved Woody Fruit Stem (Pedicel)
        const stemHeight = 0.038;
        const stemGeo = new THREE.CylinderGeometry(0.0025, 0.004, stemHeight, 8);
        stemGeo.translate(0, appleRadius + stemHeight / 2 - 0.006, 0);
        stemGeo.rotateZ(0.14);
        const stemMesh = new THREE.Mesh(stemGeo, this.materials.fruitStem);
        stemMesh.castShadow = true;
        fruitGroup.add(stemMesh);

        // Attached green leaf on stem
        const leafShape = new THREE.ConeGeometry(0.015, 0.035, 6);
        leafShape.rotateZ(Math.PI / 2.3);
        leafShape.translate(0.018, appleRadius + stemHeight * 0.68, 0);
        const fruitLeaf = new THREE.Mesh(leafShape, this.materials.fruitLeaf);
        fruitLeaf.castShadow = true;
        fruitGroup.add(fruitLeaf);

        return {
            id: id,
            mesh: fruitGroup,
            appleMesh: fruitMesh,
            stemMesh: stemMesh,
            fruitLeaf: fruitLeaf,
            radius: appleRadius,
            isRipe: isRipe,
            ripeness: isRipe ? 'RIPE' : 'UNRIPE',
            ripenessScore: isRipe ? (94 + Math.floor(Math.random() * 5)) : 68,
            sugarBrix: sugarBrix,
            cultivar: cultivar,
            diameterMm: Math.round(appleRadius * 2000),
            harvested: false,
            initialRotZ: fruitGroup.rotation.z,
            getWorldPosition: () => {
                const wp = new THREE.Vector3();
                fruitGroup.getWorldPosition(wp);
                return wp;
            }
        };
    }

    _buildDistantScenery() {
        const hillMat = new THREE.MeshBasicMaterial({ color: 0x365314 });
        const hill1 = new THREE.Mesh(new THREE.SphereGeometry(35, 16, 12), hillMat);
        hill1.scale.set(1.5, 0.35, 0.8);
        hill1.position.set(-30, 2, 40);
        this.root.add(hill1);

        const hill2 = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 12), hillMat);
        hill2.scale.set(1.6, 0.4, 0.8);
        hill2.position.set(28, 3, 42);
        this.root.add(hill2);
    }

    _buildDecorativeProps() {
        const crateGeo = new THREE.BoxGeometry(0.85, 0.55, 0.85);
        [-2.3, 2.3].forEach((cx, idx) => {
            const crate = new THREE.Mesh(crateGeo, this.materials.crateWood);
            crate.position.set(cx, 0.275, -7.5 + idx * 2.0);
            crate.rotation.y = (Math.random() - 0.5) * 0.4;
            crate.castShadow = true;
            crate.receiveShadow = true;
            this.root.add(crate);
            this.harvestCrates.push(crate);
        });
    }

    /**
     * Animate wind breeze and charging station effects
     */
    update(time) {
        // Sway foliage clusters
        for (let i = 0; i < this.foliageClusters.length; i++) {
            const fc = this.foliageClusters[i];
            fc.rotation.z = Math.sin(time * 1.5 + i * 0.4) * 0.025;
            fc.rotation.x = Math.cos(time * 1.2 + i * 0.3) * 0.018;
        }

        // Sway unharvested hanging apples
        for (let i = 0; i < this.fruits.length; i++) {
            const f = this.fruits[i];
            if (!f.harvested && f.mesh.parent === f.treeGroup) {
                f.mesh.rotation.z = Math.sin(time * 2.0 + i) * 0.04;
            }
        }

        // Animate Charging Station Rings
        if (this.chargingRings && this.chargingRings.length > 0) {
            const pulseRate = this.isChargingActive ? 8.0 : 2.5;
            const pulseVal = (Math.sin(time * pulseRate) + 1) * 0.5;
            this.chargingRings.forEach((r, idx) => {
                r.material.opacity = 0.35 + pulseVal * 0.6;
                r.rotation.z = time * (0.2 + idx * 0.15);
            });
            if (this.chargingGlowLight) {
                this.chargingGlowLight.intensity = this.isChargingActive ? (1.2 + pulseVal * 0.8) : 0.35;
            }
        }
    }

    getNearbyHarvestableFruits(robotPos, maxDist = 2.4) {
        return this.fruits.filter(f => {
            if (f.harvested || !f.isRipe || !f.isHarvestTarget) return false;
            const wp = f.getWorldPosition();
            const d = wp.distanceTo(robotPos);
            return d <= maxDist && Math.abs(wp.z - robotPos.z) < 1.35;
        });
    }

    markHarvested(fruitId) {
        const f = this.fruits.find(item => item.id === fruitId);
        if (f) {
            f.harvested = true;
            if (f.stemMesh) f.stemMesh.visible = false;
            if (f.fruitLeaf) f.fruitLeaf.visible = false;
        }
        return f;
    }

    resetAllFruits() {
        this.fruits.forEach(f => {
            f.harvested = false;
            if (f.stemMesh) f.stemMesh.visible = true;
            if (f.fruitLeaf) f.fruitLeaf.visible = true;
            if (f.treeGroup && f.mesh.parent !== f.treeGroup) {
                f.mesh.parent.remove(f.mesh);
                f.treeGroup.add(f.mesh);
                f.mesh.position.copy(f.localPos);
                f.mesh.rotation.set(0, 0, 0);
            }
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = OrchardEnvironment;
}
