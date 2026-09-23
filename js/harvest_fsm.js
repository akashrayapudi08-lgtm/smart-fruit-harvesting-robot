/**
 * HARVESTING FINITE STATE MACHINE (FSM) & WORKING MODULE ORCHESTRATOR
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Orchestrates autonomous navigation, perception, target locking,
 * two-stage precision arm approach (standoff -> glide), compliant grasping,
 * stem severance with spark emission, gravity drop hopper deposit,
 * and automated Solar Docking & Battery Charging at the Depot Bin.
 */

class HarvestFSM {
    constructor(robot, kinematics, orchard, visionHUD) {
        this.robot = robot;
        this.kinematics = kinematics;
        this.orchard = orchard;
        this.visionHUD = visionHUD;

        // FSM States
        this.STATES = {
            IDLE: 'IDLE',
            NAVIGATING: 'NAVIGATING',
            SCANNING: 'SCANNING',
            TARGET_LOCK: 'TARGET_LOCK',
            PRE_APPROACH: 'PRE_APPROACH',
            APPROACH_ARM: 'APPROACH_ARM',
            GRASP_FRUIT: 'GRASP_FRUIT',
            CUT_STEM: 'CUT_STEM',
            RETRACT_ARM: 'RETRACT_ARM',
            HOPPER_TRANSFER: 'HOPPER_TRANSFER',
            DEPOSIT: 'DEPOSIT',
            RETURN_HOME: 'RETURN_HOME',
            NAV_TO_CHARGER: 'NAV_TO_CHARGER',
            DOCKING: 'DOCKING',
            CHARGING: 'CHARGING'
        };

        this.currentState = this.STATES.NAVIGATING;
        this.stateTimer = 0;
        this.currentTarget = null;
        this.harvestedCount = 0;
        this.totalWeightKg = 0;
        this.depotMasterWeightKg = 18 * 0.18; // Initial depot yield
        this.startTime = Date.now();
        this.isPaused = false;
        this.simSpeedMultiplier = 1.0;

        // Showcase active flag
        this.showcaseMode = null;

        // Navigation parameters
        this.patrolSpeed = 0.48; // m/s
        this.patrolMaxZ = 10.5;
        this.patrolMinZ = -8.0;
        this.dockStationZ = -10.5;

        // Telemetry callback
        this.onTelemetryUpdate = null;
    }

    startAutoHarvest() {
        this.isPaused = false;
        this.showcaseMode = null;
        this.transitionTo(this.STATES.NAVIGATING);
    }

    pauseHarvest() {
        this.isPaused = true;
    }

    resumeHarvest() {
        this.isPaused = false;
    }

    resetHarvest() {
        this.isPaused = false;
        this.showcaseMode = null;
        this.currentTarget = null;
        this.harvestedCount = 0;
        this.totalWeightKg = 0;
        this.robot.batteryPercent = 100.0;
        this.startTime = Date.now();
        this.orchard.resetAllFruits();
        this.orchard.setChargingActive(false);
        this.robot.setChargingState(false);
        this.robot.detachFruitToHopper();
        this.robot.clearHopperFruits();

        // Reposition at start of row
        this.robot.chassisPosition.set(0, 0, -8.0);
        this.robot.root.position.copy(this.robot.chassisPosition);
        this.robot.chassisRotation = 0;
        this.robot.root.rotation.y = 0;
        this.kinematics.setTargetAngles(this.kinematics.homeAngles);
        this.transitionTo(this.STATES.NAVIGATING);
    }

    /**
     * State Transition Manager
     */
    transitionTo(newState) {
        this.currentState = newState;
        this.stateTimer = 0;

        switch (newState) {
            case this.STATES.IDLE:
                this.robot.setStatus('IDLE');
                this.robot.setGripper(1.0);
                this.robot.setCutterActive(false);
                break;

            case this.STATES.NAVIGATING:
                this.robot.setStatus('NAVIGATING');
                this.kinematics.setTargetAngles(this.kinematics.homeAngles);
                this.robot.setGripper(1.0);
                this.robot.setCutterActive(false);
                this.robot.setChargingState(false);
                this.orchard.setChargingActive(false);
                break;

            case this.STATES.SCANNING:
                this.robot.setStatus('SCANNING');
                break;

            case this.STATES.TARGET_LOCK:
                this.robot.setStatus('HARVESTING');
                if (this.currentTarget) {
                    this.visionHUD.setTargetFruit(this.currentTarget);
                }
                break;

            case this.STATES.PRE_APPROACH:
                this.robot.setStatus('HARVESTING');
                this.robot.setGripper(1.0); // Full open
                if (this.currentTarget) {
                    this._solveArmPreApproach(this.currentTarget);
                }
                break;

            case this.STATES.APPROACH_ARM:
                this.robot.setStatus('HARVESTING');
                this.robot.setGripper(1.0);
                if (this.currentTarget) {
                    this._solveArmApproach(this.currentTarget);
                }
                break;

            case this.STATES.GRASP_FRUIT:
                // Compliant silicone fingers enclose fruit
                this.robot.setGripper(0.08);
                break;

            case this.STATES.CUT_STEM:
                // Spin high-speed cutter blade & emit sparks
                this.robot.setCutterActive(true);
                break;

            case this.STATES.RETRACT_ARM:
                this.robot.setCutterActive(false);
                // Detach fruit from tree branch spur
                if (this.currentTarget) {
                    this.orchard.markHarvested(this.currentTarget.id);
                    this.robot.attachFruit(this.currentTarget.mesh);
                }
                // Retract arm smoothly backwards
                this.kinematics.setTargetAngles({
                    theta1: this.kinematics.angles.theta1,
                    theta2: 0.65,
                    theta3: -1.45,
                    theta4: 0.40,
                    theta5: 0
                });
                break;

            case this.STATES.HOPPER_TRANSFER:
                // Swing arm backward toward collection hopper
                this.kinematics.setTargetAngles(this.kinematics.hopperAngles);
                break;

            case this.STATES.DEPOSIT:
                // Open gripper and trigger physical projectile drop into hopper
                this.robot.setGripper(1.0);
                this.robot.detachFruitToHopper();
                this.harvestedCount++;
                const fruitWeight = (0.16 + Math.random() * 0.05); // ~180g
                this.totalWeightKg += fruitWeight;
                this.currentTarget = null;
                this.visionHUD.setTargetFruit(null);
                break;

            case this.STATES.RETURN_HOME:
                // Return arm to forward stowed home pose
                this.kinematics.setTargetAngles(this.kinematics.homeAngles);
                break;

            case this.STATES.NAV_TO_CHARGER:
                this.robot.setStatus('NAVIGATING');
                this.kinematics.setTargetAngles(this.kinematics.stowAngles);
                break;

            case this.STATES.DOCKING:
                this.robot.setStatus('DOCKING');
                break;

            case this.STATES.CHARGING:
                this.robot.setStatus('CHARGING');
                this.robot.setChargingState(true);
                this.orchard.setChargingActive(true);
                // Unload all hopper fruits into the Master Depot Bulk Crate
                const numToUnload = this.robot.hopperFruits ? this.robot.hopperFruits.children.length : 0;
                for (let u = 0; u < numToUnload; u++) {
                    this.orchard.addFruitToDepot();
                }
                this.depotMasterWeightKg += this.totalWeightKg;
                this.robot.clearHopperFruits();
                break;
        }

        this._emitTelemetry();
    }

    _solveArmPreApproach(fruit) {
        const fruitWorldPos = fruit.getWorldPosition();
        const robotPos = this.robot.chassisPosition;
        const dx = fruitWorldPos.x - robotPos.x;
        const dy = fruitWorldPos.y - (robotPos.y + 0.31 + 0.08);
        const dz = fruitWorldPos.z - (robotPos.z + 0.28);

        const standoffAngles = this.kinematics.solvePreApproachIK(dx, dy, dz, 0.18);
        if (standoffAngles) {
            this.kinematics.setTargetAngles(standoffAngles);
        } else {
            this._solveArmApproach(fruit);
        }
    }

    _solveArmApproach(fruit) {
        const fruitWorldPos = fruit.getWorldPosition();
        const robotPos = this.robot.chassisPosition;
        const dx = fruitWorldPos.x - robotPos.x;
        const dy = fruitWorldPos.y - (robotPos.y + 0.31 + 0.08);
        const dz = fruitWorldPos.z - (robotPos.z + 0.28);

        const ikAngles = this.kinematics.solveIK(dx, dy, dz);
        if (ikAngles) {
            this.kinematics.setTargetAngles(ikAngles);
        } else {
            const theta1 = Math.atan2(dx, dz);
            this.kinematics.setTargetAngles({
                theta1: theta1,
                theta2: 0.45,
                theta3: -0.9,
                theta4: 0.3,
                theta5: 0
            });
        }
    }

    /**
     * Main FSM Frame Update Loop
     */
    update(dt = 0.016) {
        if (this.isPaused) return;

        const effectiveDt = dt * this.simSpeedMultiplier;
        this.stateTimer += effectiveDt;

        // Kinematics spring-damper update
        this.kinematics.update(effectiveDt, 1.0);

        switch (this.currentState) {
            case this.STATES.IDLE:
                break;

            case this.STATES.NAVIGATING:
                // Check if need to dock for charging or full hopper
                const hopperCount = this.robot.hopperFruits ? this.robot.hopperFruits.children.length : 0;
                if (hopperCount >= 6 || this.robot.batteryPercent < 22.0) {
                    this.transitionTo(this.STATES.NAV_TO_CHARGER);
                    break;
                }

                // Autonomous patrol along orchard row
                const moveDist = this.patrolSpeed * effectiveDt;
                this.robot.drive(moveDist, 0);

                // Perception scan for ripe apples at deterministic picking stations
                if (this.stateTimer > 0.35) {
                    const candidates = this.orchard.getNearbyHarvestableFruits(this.robot.chassisPosition, 2.4);
                    if (candidates.length > 0) {
                        this.currentTarget = candidates[0];
                        this.transitionTo(this.STATES.TARGET_LOCK);
                    } else if (this.robot.chassisPosition.z > this.patrolMaxZ) {
                        // Reached row end -> return to charging dock
                        this.transitionTo(this.STATES.NAV_TO_CHARGER);
                    }
                }
                break;

            case this.STATES.TARGET_LOCK:
                // Stop rover and lock AI vision crosshairs
                if (this.stateTimer > 0.75) {
                    this.transitionTo(this.STATES.PRE_APPROACH);
                }
                break;

            case this.STATES.PRE_APPROACH:
                // Arm moves to standoff position 18cm away
                if (this.kinematics.hasReachedTarget(0.065) || this.stateTimer > 1.4) {
                    this.transitionTo(this.STATES.APPROACH_ARM);
                }
                break;

            case this.STATES.APPROACH_ARM:
                // Smooth axial glide directly onto apple pedicel stem
                if (this.kinematics.hasReachedTarget(0.045) || this.stateTimer > 1.3) {
                    this.transitionTo(this.STATES.GRASP_FRUIT);
                }
                break;

            case this.STATES.GRASP_FRUIT:
                // Soft silicone fingers enclose fruit
                if (this.stateTimer > 0.85) {
                    this.transitionTo(this.STATES.CUT_STEM);
                }
                break;

            case this.STATES.CUT_STEM:
                // High-speed blade cuts stem with spark emission
                if (this.stateTimer > 1.0) {
                    this.transitionTo(this.STATES.RETRACT_ARM);
                }
                break;

            case this.STATES.RETRACT_ARM:
                // Pull arm back safely from tree branches
                if (this.kinematics.hasReachedTarget(0.065) || this.stateTimer > 1.2) {
                    this.transitionTo(this.STATES.HOPPER_TRANSFER);
                }
                break;

            case this.STATES.HOPPER_TRANSFER:
                // Swing arm back over collection hopper
                if (this.kinematics.hasReachedTarget(0.065) || this.stateTimer > 1.5) {
                    this.transitionTo(this.STATES.DEPOSIT);
                }
                break;

            case this.STATES.DEPOSIT:
                // Fruit drops with gravity & bounce into hopper
                if (this.stateTimer > 0.9) {
                    this.transitionTo(this.STATES.RETURN_HOME);
                }
                break;

            case this.STATES.RETURN_HOME:
                // Arm returns to forward stowed pose; check if another fruit is within reach at current stop
                if (this.kinematics.hasReachedTarget(0.06) || this.stateTimer > 1.2) {
                    const remaining = this.orchard.getNearbyHarvestableFruits(this.robot.chassisPosition, 2.4);
                    if (remaining.length > 0) {
                        this.currentTarget = remaining[0];
                        this.transitionTo(this.STATES.TARGET_LOCK);
                    } else {
                        this.transitionTo(this.STATES.NAVIGATING);
                    }
                }
                break;

            case this.STATES.NAV_TO_CHARGER:
                // Reverse / drive towards Solar Docking Station at Z = -10.5m
                const distToDock = this.robot.chassisPosition.z - this.dockStationZ;
                if (distToDock > 1.2) {
                    // Reverse drive back to depot
                    this.robot.drive(-this.patrolSpeed * 1.3 * effectiveDt, 0);
                    // Center X coordinate smoothly
                    this.robot.chassisPosition.x *= 0.96;
                } else {
                    this.transitionTo(this.STATES.DOCKING);
                }
                break;

            case this.STATES.DOCKING:
                // Precision slow alignment into guide rails
                const deltaDockZ = this.robot.chassisPosition.z - this.dockStationZ;
                if (Math.abs(deltaDockZ) > 0.08) {
                    const dockMove = -Math.sign(deltaDockZ) * 0.25 * effectiveDt;
                    this.robot.drive(dockMove, 0);
                    this.robot.chassisPosition.x *= 0.90; // perfect alignment
                } else {
                    this.robot.chassisPosition.set(0, 0, this.dockStationZ);
                    this.robot.root.position.copy(this.robot.chassisPosition);
                    this.transitionTo(this.STATES.CHARGING);
                }
                break;

            case this.STATES.CHARGING:
                // Docked on inductive pads; battery recharges and fruits are deposited into master crate
                if (this.stateTimer > 3.8 && this.robot.batteryPercent >= 99.5) {
                    // Fully charged and unloaded! Resume autonomous harvesting
                    this.robot.setChargingState(false);
                    this.orchard.setChargingActive(false);
                    this.transitionTo(this.STATES.NAVIGATING);
                }
                break;
        }

        this._emitTelemetry();
    }

    /**
     * Interactive Working Module Showcase Triggers
     */
    showcaseVision() {
        this.isPaused = false;
        const candidate = this.orchard.fruits.find(f => f.isHarvestTarget && !f.harvested) || this.orchard.fruits[0];
        if (candidate) {
            this.currentTarget = candidate;
            this.visionHUD.setTargetFruit(candidate);
            this.transitionTo(this.STATES.TARGET_LOCK);
        }
    }

    showcaseArmReach() {
        this.isPaused = false;
        const candidate = this.orchard.fruits.find(f => f.isHarvestTarget && !f.harvested) || this.orchard.fruits[0];
        if (candidate) {
            this.currentTarget = candidate;
            this.transitionTo(this.STATES.PRE_APPROACH);
        }
    }

    showcaseGraspAndCut() {
        this.isPaused = false;
        if (!this.currentTarget) {
            const candidate = this.orchard.fruits.find(f => f.isHarvestTarget && !f.harvested) || this.orchard.fruits[0];
            if (candidate) {
                this.currentTarget = candidate;
            }
        }
        this.transitionTo(this.STATES.GRASP_FRUIT);
    }

    showcaseHopperDeposit() {
        this.isPaused = false;
        if (!this.robot.attachedFruit) {
            const demoFruit = this.orchard._createFruit(8888, true);
            this.robot.attachFruit(demoFruit.mesh);
        }
        this.transitionTo(this.STATES.HOPPER_TRANSFER);
    }

    showcaseChargingDock() {
        this.isPaused = false;
        this.transitionTo(this.STATES.NAV_TO_CHARGER);
    }

    _emitTelemetry() {
        if (!this.onTelemetryUpdate) return;

        const elapsedSec = (Date.now() - this.startTime) / 1000;
        const pickingRatePerHour = elapsedSec > 5 ? Math.round((this.harvestedCount / elapsedSec) * 3600) : 0;
        const hopperCount = this.robot.hopperFruits ? this.robot.hopperFruits.children.length : 0;

        const telemetry = {
            state: this.currentState,
            stateTimer: this.stateTimer.toFixed(1),
            harvestedCount: this.harvestedCount,
            totalWeightKg: this.totalWeightKg.toFixed(2),
            depotMasterWeightKg: this.depotMasterWeightKg.toFixed(2),
            pickingRatePerHour: pickingRatePerHour,
            currentTarget: this.currentTarget,
            batteryPercent: Math.round(this.robot.batteryPercent),
            isCharging: this.robot.isCharging,
            robotPosition: {
                x: this.robot.chassisPosition.x.toFixed(2),
                y: this.robot.chassisPosition.y.toFixed(2),
                z: this.robot.chassisPosition.z.toFixed(2)
            },
            jointAnglesDeg: {
                j1: (this.kinematics.angles.theta1 * 180 / Math.PI).toFixed(1),
                j2: (this.kinematics.angles.theta2 * 180 / Math.PI).toFixed(1),
                j3: (this.kinematics.angles.theta3 * 180 / Math.PI).toFixed(1),
                j4: (this.kinematics.angles.theta4 * 180 / Math.PI).toFixed(1),
                j5: (this.kinematics.angles.theta5 * 180 / Math.PI).toFixed(1)
            },
            gripperOpenPercent: Math.round(this.robot.gripperState * 100),
            cutterActive: this.robot.isCutting,
            hopperCapacityPercent: Math.min(100, Math.round((hopperCount / 6) * 100)),
            hopperCount: hopperCount
        };

        this.onTelemetryUpdate(telemetry);
    }
}

if (typeof module !== 'undefined') {
    module.exports = HarvestFSM;
}
