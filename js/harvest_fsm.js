/**
 * HARVESTING FINITE STATE MACHINE (FSM)
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Orchestrates autonomous navigation, perception, target locking,
 * IK reaching, gentle grasping, stem severance, and hopper deposition.
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
            APPROACH_ARM: 'APPROACH_ARM',
            GRASP_FRUIT: 'GRASP_FRUIT',
            CUT_STEM: 'CUT_STEM',
            RETRACT_ARM: 'RETRACT_ARM',
            HOPPER_TRANSFER: 'HOPPER_TRANSFER',
            DEPOSIT: 'DEPOSIT',
            RETURN_HOME: 'RETURN_HOME'
        };

        this.currentState = this.STATES.NAVIGATING;
        this.stateTimer = 0;
        this.currentTarget = null;
        this.harvestedCount = 0;
        this.totalWeightKg = 0;
        this.pickingSpeedKgh = 0;
        this.startTime = Date.now();
        this.isPaused = false;
        this.simSpeedMultiplier = 1.0;

        // Navigation parameters
        this.patrolSpeed = 0.45; // m/s
        this.patrolMaxZ = 12.0;

        // Telemetry callback
        this.onTelemetryUpdate = null;
    }

    startAutoHarvest() {
        this.isPaused = false;
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
        this.currentTarget = null;
        this.harvestedCount = 0;
        this.totalWeightKg = 0;
        this.startTime = Date.now();
        this.orchard.resetAllFruits();
        this.robot.detachFruitToHopper(); // clear any held fruit
        if (this.robot.hopperFruits) {
            while (this.robot.hopperFruits.children.length > 0) {
                this.robot.hopperFruits.remove(this.robot.hopperFruits.children[0]);
            }
        }
        this.robot.chassisPosition.set(0, 0, -8.0);
        this.robot.root.position.copy(this.robot.chassisPosition);
        this.robot.chassisRotation = 0;
        this.robot.root.rotation.y = 0;
        this.kinematics.setTargetAngles(this.kinematics.homeAngles);
        this.transitionTo(this.STATES.NAVIGATING);
    }

    transitionTo(newState) {
        // console.log(`FSM Transition: ${this.currentState} -> ${newState}`);
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

            case this.STATES.APPROACH_ARM:
                this.robot.setStatus('HARVESTING');
                this.robot.setGripper(1.0); // Open gripper
                if (this.currentTarget) {
                    this._solveArmApproach(this.currentTarget);
                }
                break;

            case this.STATES.GRASP_FRUIT:
                // Close soft gripper fingers around fruit
                this.robot.setGripper(0.08);
                break;

            case this.STATES.CUT_STEM:
                // Spin high-speed cutter blade
                this.robot.setCutterActive(true);
                break;

            case this.STATES.RETRACT_ARM:
                this.robot.setCutterActive(false);
                // Pluck fruit from tree
                if (this.currentTarget) {
                    this.orchard.markHarvested(this.currentTarget.id);
                    this.robot.attachFruit(this.currentTarget.mesh);
                }
                // Lift arm slightly and retract towards center
                this.kinematics.setTargetAngles({
                    theta1: this.kinematics.angles.theta1,
                    theta2: 0.6,
                    theta3: -1.4,
                    theta4: 0.4,
                    theta5: 0
                });
                break;

            case this.STATES.HOPPER_TRANSFER:
                // Swing arm backwards towards collection hopper
                this.kinematics.setTargetAngles(this.kinematics.hopperAngles);
                break;

            case this.STATES.DEPOSIT:
                // Release fruit into hopper
                this.robot.setGripper(1.0);
                this.robot.detachFruitToHopper();
                this.harvestedCount++;
                const fruitWeight = (0.16 + Math.random() * 0.05); // ~180 grams
                this.totalWeightKg += fruitWeight;
                this.currentTarget = null;
                this.visionHUD.setTargetFruit(null);
                break;

            case this.STATES.RETURN_HOME:
                // Return arm to forward home pose
                this.kinematics.setTargetAngles(this.kinematics.homeAngles);
                break;
        }

        this._emitTelemetry();
    }

    _solveArmApproach(fruit) {
        // Convert fruit world position to robot local frame
        const fruitWorldPos = fruit.getWorldPosition();
        const robotPos = this.robot.chassisPosition;

        // Vector from robot base turntable to fruit
        const dx = fruitWorldPos.x - robotPos.x;
        const dy = fruitWorldPos.y - (robotPos.y + 0.31 + 0.08); // relative to shoulder plinth
        const dz = fruitWorldPos.z - (robotPos.z + 0.28);

        // Target angle calculation using analytical IK with line-of-sight pitch
        const ikAngles = this.kinematics.solveIK(dx, dy, dz);
        if (ikAngles) {
            this.kinematics.setTargetAngles(ikAngles);
        } else {
            // Fallback: direct proportional aim if outside strict reach envelope
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

    update(dt = 0.016) {
        if (this.isPaused) return;

        const effectiveDt = dt * this.simSpeedMultiplier;
        this.stateTimer += effectiveDt;

        // Kinematics smoothing
        this.kinematics.update(effectiveDt, 3.8);

        switch (this.currentState) {
            case this.STATES.IDLE:
                // Standby mode
                break;

            case this.STATES.NAVIGATING:
                // Autonomous patrol along the orchard row
                const moveDist = this.patrolSpeed * effectiveDt;
                this.robot.drive(moveDist, 0);

                // Check for harvestable ripe fruits nearby
                if (this.stateTimer > 0.4) {
                    const candidates = this.orchard.getNearbyHarvestableFruits(this.robot.chassisPosition, 2.3);
                    if (candidates.length > 0) {
                        // Pick closest candidate
                        this.currentTarget = candidates[0];
                        this.transitionTo(this.STATES.TARGET_LOCK);
                    } else if (this.robot.chassisPosition.z > this.patrolMaxZ) {
                        // Reached end of row - loop back for continuous demo
                        this.robot.chassisPosition.z = -9.0;
                    }
                }
                break;

            case this.STATES.TARGET_LOCK:
                // Pause vehicle and lock vision crosshair
                if (this.stateTimer > 0.8) {
                    this.transitionTo(this.STATES.APPROACH_ARM);
                }
                break;

            case this.STATES.APPROACH_ARM:
                // Wait for arm to extend towards target fruit
                if (this.kinematics.hasReachedTarget(0.06) || this.stateTimer > 2.0) {
                    this.transitionTo(this.STATES.GRASP_FRUIT);
                }
                break;

            case this.STATES.GRASP_FRUIT:
                // Soft gripper closes gently
                if (this.stateTimer > 0.9) {
                    this.transitionTo(this.STATES.CUT_STEM);
                }
                break;

            case this.STATES.CUT_STEM:
                // Blade cuts stem for 1.1s
                if (this.stateTimer > 1.1) {
                    this.transitionTo(this.STATES.RETRACT_ARM);
                }
                break;

            case this.STATES.RETRACT_ARM:
                // Pull arm back safely from tree branches
                if (this.kinematics.hasReachedTarget(0.08) || this.stateTimer > 1.5) {
                    this.transitionTo(this.STATES.HOPPER_TRANSFER);
                }
                break;

            case this.STATES.HOPPER_TRANSFER:
                // Swing arm back over collection hopper
                if (this.kinematics.hasReachedTarget(0.08) || this.stateTimer > 1.8) {
                    this.transitionTo(this.STATES.DEPOSIT);
                }
                break;

            case this.STATES.DEPOSIT:
                // Fruit drops into hopper
                if (this.stateTimer > 0.8) {
                    this.transitionTo(this.STATES.RETURN_HOME);
                }
                break;

            case this.STATES.RETURN_HOME:
                // Arm returns to home; check if another fruit is within reach at current robot stop
                if (this.kinematics.hasReachedTarget(0.08) || this.stateTimer > 1.4) {
                    const remainingCandidates = this.orchard.getNearbyHarvestableFruits(this.robot.chassisPosition, 2.3);
                    if (remainingCandidates.length > 0) {
                        this.currentTarget = remainingCandidates[0];
                        this.transitionTo(this.STATES.TARGET_LOCK);
                    } else {
                        // Resume row traversal
                        this.transitionTo(this.STATES.NAVIGATING);
                    }
                }
                break;
        }

        this._emitTelemetry();
    }

    _emitTelemetry() {
        if (!this.onTelemetryUpdate) return;

        const elapsedSec = (Date.now() - this.startTime) / 1000;
        const pickingRatePerHour = elapsedSec > 5 ? Math.round((this.harvestedCount / elapsedSec) * 3600) : 0;

        const telemetry = {
            state: this.currentState,
            stateTimer: this.stateTimer.toFixed(1),
            harvestedCount: this.harvestedCount,
            totalWeightKg: this.totalWeightKg.toFixed(2),
            pickingRatePerHour: pickingRatePerHour,
            currentTarget: this.currentTarget,
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
            hopperCapacityPercent: Math.min(100, Math.round((this.harvestedCount / 40) * 100))
        };

        this.onTelemetryUpdate(telemetry);
    }
}

// Export for module or global use
if (typeof module !== 'undefined') {
    module.exports = HarvestFSM;
}

