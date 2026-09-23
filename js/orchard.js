/**
 * BOTANICAL REALISTIC ORCHARD ENVIRONMENT & DYNAMIC FRUIT TREES
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Features procedural PBR grass/soil textures, natural organic tree trunks with bark bump,
 * multi-tiered branching limbs, alpha-cutout leaf card foliage, photorealistic blushed apples
 * hanging from branch spurs with calyx sepals, wind sway dynamics, and distant horizon scenery.
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

        this._buildTexturesAndMaterials();
        this._buildSkyDome();
        this._buildTerrain();
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
            })
        };
    }

    _buildSkyDome() {
        // High-altitude atmospheric Sky Dome
        const skyGeo = new THREE.SphereGeometry(75, 32, 24);
        skyGeo.scale(-1, 1, 1);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.0, '#1e3a8a'); // Zenith
        grad.addColorStop(0.35, '#38bdf8'); // Sky
        grad.addColorStop(0.70, '#bae6fd'); // Haze
        grad.addColorStop(0.92, '#fef08a'); // Golden Horizon
        grad.addColorStop(1.0, '#86efac'); // Ground Blend
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

        // Corona Flare
        const flareGeo = new THREE.CircleGeometry(7.0, 32);
        const flareMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.35
        });
        const flare = new THREE.Mesh(flareGeo, flareMat);
        flare.position.set(23.9, 37.9, 19.9);
        flare.lookAt(0, 0, 0);
        this.root.add(flare);
    }

    _buildTerrain() {
        // Grass Ground Plane (70m x 70m)
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

    _buildOrchardRows() {
        // High-density modern commercial spindle apple orchard rows
        // Left Row: X = -1.35m
        // Right Row: X = +1.35m
        const rowOffsets = [-1.35, 1.35];
        const treeSpacingZ = 2.4;
        const numTreesPerRow = 11;
        const startZ = -11.0;

        let fruitIdCounter = 1;

        rowOffsets.forEach((rowX, rowIdx) => {
            this._buildTrellisRow(rowX, startZ, numTreesPerRow * treeSpacingZ);

            for (let i = 0; i < numTreesPerRow; i++) {
                const zPos = startZ + i * treeSpacingZ;
                const ox = rowX + (Math.random() - 0.5) * 0.08;
                const oz = zPos + (Math.random() - 0.5) * 0.12;

                const tree = this._createFruitTree(ox, oz, rowIdx === 0 ? 1 : -1, fruitIdCounter);
                fruitIdCounter += tree.fruitCount;
                this.trees.push(tree);
            }
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

        // Horizontal steel support wires
        [0.8, 1.35, 1.95].forEach(wy => {
            const wireGeo = new THREE.CylinderGeometry(0.003, 0.003, length + 4, 6);
            wireGeo.rotateX(Math.PI / 2);
            const wire = new THREE.Mesh(wireGeo, this.materials.trellisWire);
            wire.position.set(x * 1.18, wy, startZ + length / 2);
            this.root.add(wire);
        });
    }

    _createFruitTree(x, z, faceDir, startFruitId) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);
        this.root.add(treeGroup);

        // 1. Organic Tapered Trunk (Tapering from 11cm base to 6cm crown)
        const trunkHeight = 2.0;
        const trunkGeo = new THREE.CylinderGeometry(0.055, 0.11, trunkHeight, 12, 4);
        trunkGeo.translate(0, trunkHeight / 2, 0);

        // Deform trunk slightly for organic curve
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

        // Root flare at ground contact
        const rootGeo = new THREE.CylinderGeometry(0.11, 0.19, 0.16, 8);
        rootGeo.translate(0, 0.08, 0);
        const rootFlare = new THREE.Mesh(rootGeo, this.materials.woodBark);
        rootFlare.receiveShadow = true;
        treeGroup.add(rootFlare);

        // 2. Primary Botanical Boughs
        const boughs = [
            { y: 0.95, len: 0.75, pitch: 0.45, yaw: 0.15 * faceDir },
            { y: 1.20, len: 0.85, pitch: 0.50, yaw: -0.2 * faceDir },
            { y: 1.45, len: 0.78, pitch: 0.55, yaw: 0.3 * faceDir },
            { y: 1.70, len: 0.65, pitch: 0.60, yaw: -0.15 * faceDir },
            { y: 1.95, len: 0.50, pitch: 0.70, yaw: 0 }
        ];

        boughs.forEach((b, bIdx) => {
            const boughGroup = new THREE.Group();
            boughGroup.position.set(0, b.y, 0);
            boughGroup.rotation.y = b.yaw;
            treeGroup.add(boughGroup);

            // Bough arm
            const bGeo = new THREE.CylinderGeometry(0.02, 0.035, b.len, 8);
            bGeo.rotateZ(Math.PI / 2.8 * faceDir);
            bGeo.translate(faceDir * (b.len * 0.4), 0, 0);
            const bMesh = new THREE.Mesh(bGeo, this.materials.woodBark);
            bMesh.castShadow = true;
            boughGroup.add(bMesh);

            // Foliage Cross-Quads at bough terminus (Realistic leafy cards)
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

        // Internal volume leaf spheres for dense sun-blocking canopy core
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

        // 4. Photorealistic Fruits Attached to Actual Branch Spurs
        const fruitCount = 5 + Math.floor(Math.random() * 3);
        let currentId = startFruitId;

        for (let f = 0; f < fruitCount; f++) {
            // Position fruits on aisle-facing side within robot reach (0.68m to 0.92m)
            const aisleReach = faceDir * (0.46 + Math.random() * 0.24);
            const fx = aisleReach;
            const fy = 0.95 + Math.random() * 0.48; // Accessible picking height
            const fz = (Math.random() - 0.5) * 0.75;

            // Small wooden fruiting spur twig connecting branch to fruit
            const spurGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.12, 6);
            spurGeo.rotateZ(Math.PI / 4 * faceDir);
            spurGeo.translate(fx * 0.95, fy + 0.05, fz);
            const spurMesh = new THREE.Mesh(spurGeo, this.materials.woodBark);
            spurMesh.castShadow = true;
            treeGroup.add(spurMesh);

            // 75% ripe red apples, 25% green unripe
            const isRipe = Math.random() < 0.75;
            const fruitData = this._createFruit(currentId++, isRipe);

            fruitData.mesh.position.set(fx, fy, fz);
            treeGroup.add(fruitData.mesh);

            fruitData.treeGroup = treeGroup;
            fruitData.localPos = new THREE.Vector3(fx, fy, fz);
            this.fruits.push(fruitData);
        }

        return {
            group: treeGroup,
            fruitCount: fruitCount,
            x: x,
            z: z
        };
    }

    _createFoliageCrossQuads(scale = 1.0) {
        const group = new THREE.Group();
        const quadSize = 0.65 * scale;
        const quadGeo = new THREE.PlaneGeometry(quadSize, quadSize);

        // Quad 1: Facing XY
        const q1 = new THREE.Mesh(quadGeo, this.materials.leafCard);
        q1.castShadow = true;
        q1.receiveShadow = true;
        group.add(q1);

        // Quad 2: Orthogonal facing YZ
        const q2 = new THREE.Mesh(quadGeo, this.materials.leafCard);
        q2.rotation.y = Math.PI / 2;
        q2.castShadow = true;
        q2.receiveShadow = true;
        group.add(q2);

        // Quad 3: Angled 45 deg
        const q3 = new THREE.Mesh(quadGeo, this.materials.leafCard);
        q3.rotation.y = Math.PI / 4;
        q3.rotation.x = 0.15;
        q3.castShadow = true;
        group.add(q3);

        return group;
    }

    _createFruit(id, isRipe) {
        const fruitGroup = new THREE.Group();
        fruitGroup.name = `Fruit_${id}`;

        // Apple Sphere Shape with organic indentations (8.6 - 10 cm diameter)
        const appleRadius = 0.045 + Math.random() * 0.006;
        const appleGeo = new THREE.SphereGeometry(appleRadius, 24, 18);

        const aPos = appleGeo.attributes.position;
        for (let i = 0; i < aPos.count; i++) {
            const py = aPos.getY(i);
            if (py > appleRadius * 0.62) {
                aPos.setY(i, py * 0.83); // Deep stem basin
            } else if (py < -appleRadius * 0.62) {
                aPos.setY(i, py * 0.86); // Bottom calyx basin
            }
        }
        appleGeo.computeVertexNormals();

        const fruitMat = isRipe ? this.materials.ripeApple : this.materials.unripeApple;
        const fruitMesh = new THREE.Mesh(appleGeo, fruitMat);
        fruitMesh.castShadow = true;
        fruitMesh.receiveShadow = true;
        fruitGroup.add(fruitMesh);

        // Bottom Calyx Sepals (authentic apple blossom end)
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

        // Small attached green leaf on stem for photorealism
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
            ripenessScore: isRipe ? (94 + Math.floor(Math.random() * 5)) : (72 + Math.floor(Math.random() * 15)),
            sugarBrix: isRipe ? (13.1 + Math.random() * 1.8).toFixed(1) : (8.2 + Math.random() * 1.4).toFixed(1),
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
        // Distant rolling orchard hills on horizon
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
        // Pine Wood Harvest Crate Bins
        const crateGeo = new THREE.BoxGeometry(0.85, 0.55, 0.85);
        [-2.3, 2.3].forEach((cx, idx) => {
            const crate = new THREE.Mesh(crateGeo, this.materials.crateWood);
            crate.position.set(cx, 0.275, -8.5 + idx * 1.5);
            crate.rotation.y = (Math.random() - 0.5) * 0.4;
            crate.castShadow = true;
            crate.receiveShadow = true;
            this.root.add(crate);
            this.harvestCrates.push(crate);
        });
    }

    /**
     * Animate gentle wind breeze sway across leaves and hanging apples
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
    }

    getNearbyHarvestableFruits(robotPos, maxDist = 2.2) {
        return this.fruits.filter(f => {
            if (f.harvested || !f.isRipe) return false;
            const wp = f.getWorldPosition();
            const d = wp.distanceTo(robotPos);
            return d <= maxDist && Math.abs(wp.z - robotPos.z) < 1.35;
        });
    }

    markHarvested(fruitId) {
        const f = this.fruits.find(item => item.id === fruitId);
        if (f) {
            f.harvested = true;
            if (f.stemMesh) {
                f.stemMesh.visible = false;
            }
            if (f.fruitLeaf) {
                f.fruitLeaf.visible = false;
            }
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

// Export for module or global use
if (typeof module !== 'undefined') {
    module.exports = OrchardEnvironment;
}
