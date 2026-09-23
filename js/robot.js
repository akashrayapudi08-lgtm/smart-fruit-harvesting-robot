/**
 * ROBOT 3D MODEL & MECHATRONICS ASSEMBLY
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Generates an industrial-grade 4WD Mobile Manipulator with 5-DOF Articulated Arm,
 * Soft Gripper + Oscillating Stem Cutter, Eye-in-Hand Vision Sensor, and Fruit Collection Hopper.
 */

class SmartHarvestingRobot {
    constructor(scene, kinematics) {
        this.scene = scene;
        this.kinematics = kinematics;

        // Root robot container
        this.root = new THREE.Group();
        this.root.name = "SmartHarvestingRobot";
        this.scene.add(this.root);

        // Sub-assemblies
        this.chassis = null;
        this.wheels = [];
        this.turntable = null;
        this.shoulderLink = null;
        this.elbowLink = null;
        this.wristLink = null;
        this.endEffector = null;
        this.gripperLeft = null;
        this.gripperRight = null;
        this.cutterBlade = null;
        this.visionSensor = null;
        this.hopper = null;
        this.statusLight = null;
        this.headlights = [];
        this.attachedFruit = null;

        // Gripper actuation state (0 = closed, 1 = open)
        this.gripperState = 1.0;
        this.targetGripperState = 1.0;
        this.cutterSpeed = 0;
        this.isCutting = false;

        // Chassis movement tracking
        this.chassisPosition = new THREE.Vector3(0, 0, 0);
        this.chassisRotation = 0; // Yaw in radians
        this.wheelRadius = 0.22;

        // Build the complete robot
        this._buildMaterials();
        this._buildChassis();
        this._buildCollectionHopper();
        this._buildManipulatorArm();
        this._buildEndEffector();

        // Apply initial kinematics
        this.updateFromKinematics();
    }

    _buildMaterials() {
        // Procedural Textures
        const tireTex = (typeof TextureGenerator !== 'undefined') ? TextureGenerator.createTireTreadTexture() : null;
        const hazardTex = (typeof TextureGenerator !== 'undefined') ? TextureGenerator.createHazardStripesTexture() : null;

        this.materials = {
            bodyYellow: new THREE.MeshStandardMaterial({
                color: 0xf59e0b, // Industrial CAT Yellow
                metalness: 0.35,
                roughness: 0.38
            }),
            hazardStripe: new THREE.MeshStandardMaterial({
                map: hazardTex,
                roughness: 0.4,
                metalness: 0.2
            }),
            bodyDark: new THREE.MeshStandardMaterial({
                color: 0x1e293b, // Dark Titanium Slate
                metalness: 0.65,
                roughness: 0.30
            }),
            metalChrome: new THREE.MeshStandardMaterial({
                color: 0xe2e8f0,
                metalness: 0.95,
                roughness: 0.15
            }),
            jointMotor: new THREE.MeshStandardMaterial({
                color: 0x334155,
                metalness: 0.75,
                roughness: 0.25
            }),
            tireRubber: new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                bumpMap: tireTex,
                bumpScale: 0.04,
                roughness: 0.85,
                metalness: 0.15
            }),
            wheelRim: new THREE.MeshStandardMaterial({
                color: 0xd97706,
                metalness: 0.6,
                roughness: 0.3
            }),
            siliconeGrip: new THREE.MeshStandardMaterial({
                color: 0x06b6d4, // Cyan Soft Food-Grade Silicone
                roughness: 0.6,
                metalness: 0.1
            }),
            cutterSteel: new THREE.MeshStandardMaterial({
                color: 0xe2e8f0,
                metalness: 0.95,
                roughness: 0.1
            }),
            sensorGlass: new THREE.MeshPhysicalMaterial({
                color: 0x111827,
                roughness: 0.1,
                transmission: 0.6,
                thickness: 0.5
            }),
            glowGreen: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
            glowBlue:  new THREE.MeshBasicMaterial({ color: 0x3b82f6 }),
            glowAmber: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
            glowRed:   new THREE.MeshBasicMaterial({ color: 0xef4444 })
        };
    }

    _buildChassis() {
        const chassisGroup = new THREE.Group();
        chassisGroup.position.y = 0.22; // Clear of ground
        this.chassis = chassisGroup;
        this.root.add(chassisGroup);

        // Main chassis enclosure (Length: 1.3m, Width: 0.8m, Height: 0.32m)
        const mainBoxGeo = new THREE.BoxGeometry(0.8, 0.28, 1.35);
        const mainBox = new THREE.Mesh(mainBoxGeo, this.materials.bodyYellow);
        mainBox.castShadow = true;
        mainBox.receiveShadow = true;
        mainBox.position.y = 0.14;
        chassisGroup.add(mainBox);

        // Lower reinforcement plate & battery housing
        const lowerPlateGeo = new THREE.BoxGeometry(0.84, 0.08, 1.4);
        const lowerPlate = new THREE.Mesh(lowerPlateGeo, this.materials.bodyDark);
        lowerPlate.position.y = 0.02;
        chassisGroup.add(lowerPlate);

        // Top deck panel
        const topDeckGeo = new THREE.BoxGeometry(0.76, 0.04, 1.25);
        const topDeck = new THREE.Mesh(topDeckGeo, this.materials.bodyDark);
        topDeck.position.y = 0.29;
        chassisGroup.add(topDeck);

        // 4 Rugged All-Terrain Wheels with Hub Motors
        const wheelGeo = new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, 0.16, 24);
        wheelGeo.rotateZ(Math.PI / 2);

        const wheelOffsets = [
            { x: -0.46, y: 0, z:  0.44 }, // Front Left
            { x:  0.46, y: 0, z:  0.44 }, // Front Right
            { x: -0.46, y: 0, z: -0.44 }, // Rear Left
            { x:  0.46, y: 0, z: -0.44 }  // Rear Right
        ];

        wheelOffsets.forEach((pos, idx) => {
            const wheelMesh = new THREE.Mesh(wheelGeo, this.materials.tireRubber);
            wheelMesh.castShadow = true;
            wheelMesh.position.set(pos.x, pos.y, pos.z);

            // Rim center
            const rimGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.165, 16);
            rimGeo.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeo, this.materials.wheelRim);
            wheelMesh.add(rim);

            // Wheel hub nut
            const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.19, 8);
            hubGeo.rotateZ(Math.PI / 2);
            const hub = new THREE.Mesh(hubGeo, this.materials.metalChrome);
            wheelMesh.add(hub);

            // Suspension arm
            const suspGeo = new THREE.BoxGeometry(0.06, 0.06, 0.12);
            const susp = new THREE.Mesh(suspGeo, this.materials.bodyDark);
            susp.position.set(pos.x * 0.85, pos.y + 0.08, pos.z);
            chassisGroup.add(susp);

            chassisGroup.add(wheelMesh);
            this.wheels.push(wheelMesh);
        });

        // Hazard Warning Stripe Skirts
        const stripeFront = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.02), this.materials.hazardStripe);
        stripeFront.position.set(0, 0.08, 0.68);
        chassisGroup.add(stripeFront);

        [-0.41, 0.41].forEach(sx => {
            const stripeSide = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 1.25), this.materials.hazardStripe);
            stripeSide.position.set(sx, 0.08, 0);
            chassisGroup.add(stripeSide);
        });

        // 3D LiDAR Turret on Front
        const lidarBaseGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.08, 16);
        const lidarBase = new THREE.Mesh(lidarBaseGeo, this.materials.bodyDark);
        lidarBase.position.set(0, 0.35, 0.62);
        chassisGroup.add(lidarBase);

        const lidarDomeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.07, 16);
        this.lidarDome = new THREE.Mesh(lidarDomeGeo, this.materials.sensorGlass);
        this.lidarDome.position.set(0, 0.42, 0.62);
        chassisGroup.add(this.lidarDome);

        // Sweeping LiDAR Laser Scan Fan
        const fanGeo = new THREE.ConeGeometry(2.4, 0.04, 16, 1, false, 0, Math.PI * 0.7);
        fanGeo.rotateX(Math.PI / 2);
        const fanMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide
        });
        this.lidarFan = new THREE.Mesh(fanGeo, fanMat);
        this.lidarFan.position.set(0, 0.44, 0.62);
        chassisGroup.add(this.lidarFan);

        // Rear Antenna Mast with Flashing Amber Safety Strobe Beacon
        const antPole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.65, 8), this.materials.metalChrome);
        antPole.position.set(-0.35, 0.60, -0.60);
        chassisGroup.add(antPole);

        const beaconGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12);
        this.beaconMesh = new THREE.Mesh(beaconGeo, this.materials.glowAmber);
        this.beaconMesh.position.set(-0.35, 0.94, -0.60);
        chassisGroup.add(this.beaconMesh);

        this.beaconLight = new THREE.PointLight(0xf59e0b, 0.9, 4.5);
        this.beaconLight.position.set(-0.35, 0.94, -0.60);
        chassisGroup.add(this.beaconLight);

        // Status LED Light Bar (front top)
        const lightBarGeo = new THREE.BoxGeometry(0.4, 0.03, 0.04);
        this.statusLight = new THREE.Mesh(lightBarGeo, this.materials.glowGreen);
        this.statusLight.position.set(0, 0.30, 0.66);
        chassisGroup.add(this.statusLight);

        // Dual Front Work Headlights
        [-0.3, 0.3].forEach(hx => {
            const hlightGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.04, 16);
            hlightGeo.rotateX(Math.PI / 2);
            const hlight = new THREE.Mesh(hlightGeo, this.materials.metalChrome);
            hlight.position.set(hx, 0.18, 0.68);
            chassisGroup.add(hlight);

            const spot = new THREE.SpotLight(0xfffaed, 1.2, 10, Math.PI / 6, 0.3);
            spot.position.set(hx, 0.18, 0.70);
            spot.target.position.set(hx, 0, 4.0);
            chassisGroup.add(spot);
            chassisGroup.add(spot.target);
            this.headlights.push(spot);
        });

        // Emergency Stop Button
        const estopBaseGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12);
        const estopBase = new THREE.Mesh(estopBaseGeo, this.materials.bodyYellow);
        estopBase.position.set(0.32, 0.31, -0.55);
        chassisGroup.add(estopBase);

        const estopBtnGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.025, 12);
        const btn = new THREE.Mesh(estopBtnGeo, this.materials.glowRed);
        btn.position.set(0.32, 0.33, -0.55);
        chassisGroup.add(btn);
    }

    _buildCollectionHopper() {
        // Rear Fruit Hopper / Basket with soft ramp
        const hopperGroup = new THREE.Group();
        hopperGroup.position.set(0, 0.31, -0.32);
        this.hopper = hopperGroup;
        this.chassis.add(hopperGroup);

        // Hopper Walls (Open top container)
        const wallMat = this.materials.bodyDark;
        const hw = 0.68, hd = 0.55, hh = 0.32, wt = 0.03;

        // Bottom
        const botGeo = new THREE.BoxGeometry(hw, wt, hd);
        const bot = new THREE.Mesh(botGeo, wallMat);
        bot.position.y = wt / 2;
        hopperGroup.add(bot);

        // Cushioned interior liner (Dark green foam)
        const linerMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 });
        const linerGeo = new THREE.BoxGeometry(hw - 0.04, 0.02, hd - 0.04);
        const liner = new THREE.Mesh(linerGeo, linerMat);
        liner.position.y = wt + 0.01;
        hopperGroup.add(liner);

        // Back Wall
        const backGeo = new THREE.BoxGeometry(hw, hh, wt);
        const back = new THREE.Mesh(backGeo, wallMat);
        back.position.set(0, hh / 2, -hd / 2 + wt / 2);
        hopperGroup.add(back);

        // Front Wall (lower for fruit drop chute)
        const frontGeo = new THREE.BoxGeometry(hw, hh * 0.65, wt);
        const front = new THREE.Mesh(frontGeo, wallMat);
        front.position.set(0, (hh * 0.65) / 2, hd / 2 - wt / 2);
        hopperGroup.add(front);

        // Left & Right Walls
        const sideGeo = new THREE.BoxGeometry(wt, hh, hd);
        const leftWall = new THREE.Mesh(sideGeo, wallMat);
        leftWall.position.set(-hw / 2 + wt / 2, hh / 2, 0);
        hopperGroup.add(leftWall);

        const rightWall = new THREE.Mesh(sideGeo, wallMat);
        rightWall.position.set(hw / 2 - wt / 2, hh / 2, 0);
        hopperGroup.add(rightWall);

        // Storage Fruit Pile inside hopper
        this.hopperFruits = new THREE.Group();
        this.hopperFruits.position.y = wt + 0.05;
        hopperGroup.add(this.hopperFruits);
    }

    _buildManipulatorArm() {
        // Arm Pedestal / Turntable (Mounts near front of chassis top deck)
        const armBaseGroup = new THREE.Group();
        armBaseGroup.position.set(0, 0.31, 0.28); // Mounted forward
        this.chassis.add(armBaseGroup);

        // Joint 1: Turntable Base (Yaw)
        const baseRingGeo = new THREE.CylinderGeometry(0.18, 0.20, 0.08, 24);
        const baseRing = new THREE.Mesh(baseRingGeo, this.materials.bodyDark);
        baseRing.position.y = 0.04;
        armBaseGroup.add(baseRing);

        this.turntable = new THREE.Group();
        this.turntable.position.y = 0.08;
        armBaseGroup.add(this.turntable);

        const rotatingPlinthGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24);
        const rotatingPlinth = new THREE.Mesh(rotatingPlinthGeo, this.materials.jointMotor);
        rotatingPlinth.position.y = 0.04;
        this.turntable.add(rotatingPlinth);

        // Shoulder Yoke (Twin upright stanchions)
        const yokeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.16), this.materials.bodyDark);
        yokeL.position.set(-0.10, 0.16, 0);
        this.turntable.add(yokeL);

        const yokeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.16), this.materials.bodyDark);
        yokeR.position.set(0.10, 0.16, 0);
        this.turntable.add(yokeR);

        // Shoulder Joint Axis: at y = 0.45 relative to arm base
        this.shoulderLink = new THREE.Group();
        this.shoulderLink.position.set(0, 0.24, 0);
        this.turntable.add(this.shoulderLink);

        // Shoulder Motor Cylinders
        const shoulderActuatorGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.28, 16);
        shoulderActuatorGeo.rotateZ(Math.PI / 2);
        const shoulderActuator = new THREE.Mesh(shoulderActuatorGeo, this.materials.jointMotor);
        this.shoulderLink.add(shoulderActuator);

        // Upper Arm Link (Length = a2 = 0.60m)
        const upperArmGroup = new THREE.Group();
        this.shoulderLink.add(upperArmGroup);

        const upperArmBeamGeo = new THREE.BoxGeometry(0.12, this.kinematics.links.upperArm, 0.10);
        upperArmBeamGeo.translate(0, this.kinematics.links.upperArm / 2, 0);
        const upperArmBeam = new THREE.Mesh(upperArmBeamGeo, this.materials.bodyYellow);
        upperArmBeam.castShadow = true;
        upperArmGroup.add(upperArmBeam);

        // Carbon fiber / styling side accents
        const accentGeo = new THREE.BoxGeometry(0.125, this.kinematics.links.upperArm * 0.7, 0.05);
        accentGeo.translate(0, this.kinematics.links.upperArm / 2, 0);
        const accent = new THREE.Mesh(accentGeo, this.materials.bodyDark);
        upperArmGroup.add(accent);

        // Elbow Joint (at top of Upper Arm)
        this.elbowLink = new THREE.Group();
        this.elbowLink.position.set(0, this.kinematics.links.upperArm, 0);
        upperArmGroup.add(this.elbowLink);

        const elbowMotorGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.22, 16);
        elbowMotorGeo.rotateZ(Math.PI / 2);
        const elbowMotor = new THREE.Mesh(elbowMotorGeo, this.materials.jointMotor);
        this.elbowLink.add(elbowMotor);

        // Forearm Link (Length = a3 = 0.50m)
        const forearmBeamGeo = new THREE.BoxGeometry(0.09, this.kinematics.links.forearm, 0.08);
        forearmBeamGeo.translate(0, this.kinematics.links.forearm / 2, 0);
        const forearmBeam = new THREE.Mesh(forearmBeamGeo, this.materials.bodyDark);
        forearmBeam.castShadow = true;
        this.elbowLink.add(forearmBeam);

        // Cable conduit track along forearm
        const conduitGeo = new THREE.CylinderGeometry(0.015, 0.015, this.kinematics.links.forearm * 0.85, 8);
        conduitGeo.translate(0.055, this.kinematics.links.forearm / 2, 0.035);
        const conduit = new THREE.Mesh(conduitGeo, this.materials.metalChrome);
        this.elbowLink.add(conduit);

        // Wrist Joint (Pitch & Roll) at end of Forearm
        this.wristLink = new THREE.Group();
        this.wristLink.position.set(0, this.kinematics.links.forearm, 0);
        this.elbowLink.add(this.wristLink);

        const wristPitchMotorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16);
        wristPitchMotorGeo.rotateZ(Math.PI / 2);
        const wristPitchMotor = new THREE.Mesh(wristPitchMotorGeo, this.materials.jointMotor);
        this.wristLink.add(wristPitchMotor);
    }

    _buildEndEffector() {
        // End-Effector Assembly (Attached to wrist)
        this.endEffector = new THREE.Group();
        this.endEffector.position.set(0, 0.08, 0);
        this.wristLink.add(this.endEffector);

        // Tool Housing / Interface Flange
        const flangeGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.08, 16);
        const flange = new THREE.Mesh(flangeGeo, this.materials.bodyDark);
        flange.position.y = 0.04;
        this.endEffector.add(flange);

        // Eye-in-Hand RGB-D Vision Sensor (Intel RealSense D435i representation)
        const sensorCam = new THREE.Group();
        sensorCam.position.set(0, 0.09, 0.07); // Pointing forward along tool axis
        this.endEffector.add(sensorCam);

        const camBodyGeo = new THREE.BoxGeometry(0.09, 0.03, 0.025);
        const camBody = new THREE.Mesh(camBodyGeo, this.materials.metalChrome);
        sensorCam.add(camBody);

        // Dual Stereo Optical Lenses + IR Projector
        [-0.03, 0, 0.03].forEach(lx => {
            const lensGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12);
            lensGeo.rotateX(Math.PI / 2);
            const lens = new THREE.Mesh(lensGeo, this.materials.sensorGlass);
            lens.position.set(lx, 0, 0.013);
            sensorCam.add(lens);
        });

        // Ring Illuminator Light for dense foliage penetration
        const ringLight = new THREE.PointLight(0xffffff, 0.8, 1.8);
        ringLight.position.set(0, 0.09, 0.09);
        this.endEffector.add(ringLight);
        this.endEffectorLight = ringLight;

        // Oscillating Stem Cutter Blade (Stainless Steel Circular Saw / Shear)
        const bladeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), this.materials.metalChrome);
        bladeShaft.position.set(0, 0.16, 0.03);
        this.endEffector.add(bladeShaft);

        const bladeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.004, 24);
        this.cutterBlade = new THREE.Mesh(bladeGeo, this.materials.cutterSteel);
        this.cutterBlade.position.set(0, 0.19, 0.03);
        this.endEffector.add(this.cutterBlade);

        // Dual Soft-Gripper Fingers (Curved for gentle fruit envelope)
        const fingerBaseY = 0.10;

        // Left Finger
        this.gripperLeft = new THREE.Group();
        this.gripperLeft.position.set(-0.045, fingerBaseY, 0);
        this.endEffector.add(this.gripperLeft);

        const fingerLMesh = this._createFingerMesh(-1);
        this.gripperLeft.add(fingerLMesh);

        // Right Finger
        this.gripperRight = new THREE.Group();
        this.gripperRight.position.set(0.045, fingerBaseY, 0);
        this.endEffector.add(this.gripperRight);

        const fingerRMesh = this._createFingerMesh(1);
        this.gripperRight.add(fingerRMesh);

        // Grasp center reference point (where fruit will rest)
        this.graspPoint = new THREE.Object3D();
        this.graspPoint.position.set(0, 0.18, 0);
        this.endEffector.add(this.graspPoint);
    }

    _createFingerMesh(dir) {
        const fingerGroup = new THREE.Group();

        // Finger bone
        const boneGeo = new THREE.BoxGeometry(0.018, 0.12, 0.024);
        boneGeo.translate(0, 0.06, 0);
        const bone = new THREE.Mesh(boneGeo, this.materials.bodyDark);
        fingerGroup.add(bone);

        // Inward soft silicone contact pad
        const padGeo = new THREE.BoxGeometry(0.008, 0.10, 0.022);
        padGeo.translate(dir * -0.012, 0.06, 0);
        const pad = new THREE.Mesh(padGeo, this.materials.siliconeGrip);
        fingerGroup.add(pad);

        // Curved fingertip claw
        const tipGeo = new THREE.CylinderGeometry(0.012, 0.004, 0.03, 8);
        tipGeo.translate(dir * -0.01, 0.13, 0);
        const tip = new THREE.Mesh(tipGeo, this.materials.siliconeGrip);
        fingerGroup.add(tip);

        return fingerGroup;
    }

    /**
     * Update 3D arm meshes to match Kinematics Joint Angles
     */
    updateFromKinematics() {
        const { theta1, theta2, theta3, theta4, theta5 } = this.kinematics.angles;

        // Base Turntable: rotates around Y
        this.turntable.rotation.y = theta1;

        // Shoulder: rotates around X
        this.shoulderLink.rotation.x = -theta2;

        // Elbow: rotates around X
        this.elbowLink.rotation.x = -theta3;

        // Wrist Pitch: rotates around X
        this.wristLink.rotation.x = -theta4;

        // Wrist Roll: rotates around Y
        this.endEffector.rotation.y = theta5;
    }

    /**
     * Set target gripper open ratio (0 = fully closed, 1 = fully open)
     */
    setGripper(openRatio) {
        this.targetGripperState = Math.max(0, Math.min(1, openRatio));
    }

    /**
     * Start/stop stem cutter blade rotation
     */
    setCutterActive(active) {
        this.isCutting = active;
    }

    /**
     * Attach a picked fruit to the gripper
     */
    attachFruit(fruitMesh) {
        if (!fruitMesh) return;
        this.attachedFruit = fruitMesh;
        // Reparent fruit to graspPoint
        this.scene.remove(fruitMesh);
        this.graspPoint.add(fruitMesh);
        fruitMesh.position.set(0, 0, 0);
        fruitMesh.rotation.set(0, 0, 0);
    }

    /**
     * Detach fruit and transfer it into the collection hopper
     */
    detachFruitToHopper() {
        if (!this.attachedFruit) return;
        const fruit = this.attachedFruit;
        this.graspPoint.remove(fruit);
        this.attachedFruit = null;

        // Add to hopper with randomized slight offset in collection basket
        this.hopperFruits.add(fruit);
        const rx = (Math.random() - 0.5) * 0.45;
        const rz = (Math.random() - 0.5) * 0.35;
        const count = this.hopperFruits.children.length;
        const ry = Math.min(0.22, Math.floor(count / 6) * 0.08);

        fruit.position.set(rx, ry, rz);
        fruit.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    }

    /**
     * Update animations, wheels, gripper motion, and cutter blade
     */
    update(dt = 0.016) {
        // Animate Gripper fingers
        const gripSpeed = 4.0;
        this.gripperState += (this.targetGripperState - this.gripperState) * Math.min(1.0, dt * gripSpeed);

        // Map gripperState (0..1) to finger angle (0.05 to 0.42 rad)
        const openAngle = 0.05 + this.gripperState * 0.38;
        this.gripperLeft.rotation.z = -openAngle;
        this.gripperRight.rotation.z = openAngle;

        // Spin cutter blade when active
        if (this.isCutting) {
            this.cutterSpeed = Math.min(45, this.cutterSpeed + dt * 100);
            this.cutterBlade.rotation.y += this.cutterSpeed * dt;
        } else {
            this.cutterSpeed = Math.max(0, this.cutterSpeed - dt * 25);
            if (this.cutterSpeed > 0) {
                this.cutterBlade.rotation.y += this.cutterSpeed * dt;
            }
        }

        // Continuous 360-degree LiDAR dome & scan fan rotation
        if (this.lidarDome) {
            this.lidarDome.rotation.y += dt * 14.0;
        }
        if (this.lidarFan) {
            this.lidarFan.rotation.y += dt * 14.0;
        }

        // Flashing amber safety strobe beacon
        if (this.beaconLight) {
            const strobe = (Math.sin(Date.now() * 0.012) + 1) * 0.5;
            this.beaconLight.intensity = 0.3 + strobe * 1.8;
            if (this.beaconMesh) {
                this.beaconMesh.material.opacity = 0.4 + strobe * 0.6;
            }
        }

        // Apply updated angles to 3D meshes
        this.updateFromKinematics();
    }

    /**
     * Move mobile base in world space with realistic suspension bounce & wheel rotation
     */
    drive(forwardDelta, turnDelta) {
        this.chassisRotation += turnDelta;
        this.root.rotation.y = this.chassisRotation;

        const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.chassisRotation);
        this.chassisPosition.addScaledVector(forwardDir, forwardDelta);
        this.root.position.copy(this.chassisPosition);

        // Realistic wheel rotation proportional to distance traveled
        const wheelRot = forwardDelta / this.wheelRadius;
        this.wheels.forEach(w => {
            w.rotation.x += wheelRot;
        });

        // Terrain suspension dynamics: subtle chassis bobbing and pitch rocking over soil ruts
        if (this.chassis) {
            this.chassis.position.y = 0.22 + Math.sin(this.chassisPosition.z * 10.0) * 0.007;
            this.chassis.rotation.x = Math.sin(this.chassisPosition.z * 10.0) * 0.010;
            this.chassis.rotation.z = -turnDelta * 2.2;
        }
    }

    /**
     * Set Status Light Color
     */
    setStatus(state) {
        switch (state) {
            case 'HARVESTING':
            case 'PICKING':
                this.statusLight.material = this.materials.glowAmber;
                break;
            case 'NAVIGATING':
            case 'SCANNING':
                this.statusLight.material = this.materials.glowBlue;
                break;
            case 'ERROR':
                this.statusLight.material = this.materials.glowRed;
                break;
            default:
                this.statusLight.material = this.materials.glowGreen;
                break;
        }
    }

    /**
     * Get world position of the end-effector grasp point
     */
    getGraspWorldPosition() {
        const pos = new THREE.Vector3();
        this.graspPoint.getWorldPosition(pos);
        return pos;
    }
}

// Export for module or global use
if (typeof module !== 'undefined') {
    module.exports = SmartHarvestingRobot;
}
