/**
 * KINEMATICS ENGINE - 5-DOF Articulated Robotic Manipulator
 * For "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Supports Forward Kinematics (FK), Analytical Inverse Kinematics (IK),
 * DH (Denavit-Hartenberg) parameter evaluation, and smooth trajectory generation.
 */

class ArmKinematics {
    constructor() {
        // Link lengths (in meters / simulation units)
        this.links = {
            baseHeight: 0.45,  // d1: Ground to shoulder axis
            upperArm: 0.60,    // a2: Shoulder to elbow
            forearm: 0.50,     // a3: Elbow to wrist
            wristTool: 0.28    // d5: Wrist to gripper center / cutting point
        };

        // Joint angle limits in radians
        this.limits = {
            j1_base:     { min: -Math.PI * 0.85, max: Math.PI * 0.85 }, // Yaw: Base rotation
            j2_shoulder: { min: -0.35, max: Math.PI * 0.75 },           // Pitch: Upper arm
            j3_elbow:    { min: -Math.PI * 0.85, max: 0.3 },            // Pitch: Forearm
            j4_wrist:    { min: -Math.PI * 0.85, max: Math.PI * 0.85 }, // Pitch: Wrist tilt
            j5_roll:     { min: -Math.PI, max: Math.PI }                // Roll: End-effector spin
        };

        // Current joint angles (radians)
        this.angles = {
            theta1: 0,
            theta2: 0.35,
            theta3: -0.85,
            theta4: 0.5,
            theta5: 0
        };

        // Target and interpolated angles
        this.targetAngles = { ...this.angles };
        this.homeAngles = {
            theta1: 0,
            theta2: 0.6,
            theta3: -1.2,
            theta4: 0.6,
            theta5: 0
        };

        // Rest / Transport Stowed Angles
        this.stowAngles = {
            theta1: 0,
            theta2: 1.1,
            theta3: -1.8,
            theta4: 0.7,
            theta5: 0
        };

        // Drop / Hopper Discharge Angles
        this.hopperAngles = {
            theta1: Math.PI,    // Pointed directly backwards into collection bin
            theta2: 0.8,
            theta3: -0.9,
            theta4: 0.1,
            theta5: 0
        };
    }

    /**
     * Compute Forward Kinematics (FK)
     * Calculates 3D Cartesian coordinates of all joint centers and the end-effector tip.
     */
    forwardKinematics(angles = this.angles) {
        const { theta1, theta2, theta3, theta4 } = angles;
        const { baseHeight, upperArm, forearm, wristTool } = this.links;

        // Base center
        const p0 = { x: 0, y: 0, z: 0 };
        // Shoulder joint
        const p1 = { x: 0, y: baseHeight, z: 0 };

        // Planar reach in arm plane
        // Shoulder angle theta2 measured from horizontal or vertical
        const r_elbow = upperArm * Math.sin(theta2);
        const y_elbow = baseHeight + upperArm * Math.cos(theta2);

        const p2 = {
            x: r_elbow * Math.sin(theta1),
            y: y_elbow,
            z: r_elbow * Math.cos(theta1)
        };

        // Elbow joint angle accumulates
        const angleElbowAbs = theta2 + theta3;
        const r_wrist = r_elbow + forearm * Math.sin(angleElbowAbs);
        const y_wrist = y_elbow + forearm * Math.cos(angleElbowAbs);

        const p3 = {
            x: r_wrist * Math.sin(theta1),
            y: y_wrist,
            z: r_wrist * Math.cos(theta1)
        };

        // Wrist pitch accumulates
        const angleWristAbs = angleElbowAbs + theta4;
        const r_tool = r_wrist + wristTool * Math.sin(angleWristAbs);
        const y_tool = y_wrist + wristTool * Math.cos(angleWristAbs);

        const p4 = {
            x: r_tool * Math.sin(theta1),
            y: y_tool,
            z: r_tool * Math.cos(theta1)
        };

        return {
            base: p0,
            shoulder: p1,
            elbow: p2,
            wrist: p3,
            toolTip: p4,
            pitchAngle: angleWristAbs
        };
    }

    /**
     * Analytical Inverse Kinematics (IK) Solver
     * Computes joint angles to place toolTip at target (x, y, z) in robot-arm local frame.
     * @param {number} tx - Target X
     * @param {number} ty - Target Y
     * @param {number} tz - Target Z
     * @param {number} approachPitch - Desired pitch angle of approach (radians, default horizontal-slightly down)
     * @returns {Object|null} Computed joint angles or null if unreachable
     */
    solveIK(tx, ty, tz, desiredPitch = null) {
        const { baseHeight, upperArm, forearm, wristTool } = this.links;

        // 1. Base yaw rotation (theta1)
        const theta1 = Math.atan2(tx, tz);
        const clampedTheta1 = Math.max(this.limits.j1_base.min, Math.min(this.limits.j1_base.max, theta1));

        // 2. Projected radial distance from arm center
        const r_target = Math.sqrt(tx * tx + tz * tz);
        const y_target = ty;

        // Determine approach pitch: use line-of-sight from shoulder if not specified
        const approachPitch = (desiredPitch !== null) ? desiredPitch : Math.atan2(r_target, y_target - baseHeight);

        // 3. Wrist center calculation (offset backwards along tool approach angle)
        const rw = r_target - wristTool * Math.sin(approachPitch);
        const yw = y_target - wristTool * Math.cos(approachPitch);

        // Relative to shoulder joint (0, baseHeight)
        const dy = yw - baseHeight;
        const dr = rw;

        const distSq = dr * dr + dy * dy;
        const dist = Math.sqrt(distSq);

        // Reachability check
        const maxReach = upperArm + forearm;
        const minReach = Math.abs(upperArm - forearm);

        if (dist > maxReach * 0.99 || dist < minReach * 1.01) {
            // Target is outside reachable sphere
            return null;
        }

        // 4. Law of Cosines for Elbow angle (theta3)
        const cosTheta3 = (distSq - upperArm * upperArm - forearm * forearm) / (2 * upperArm * forearm);
        const clampedCos = Math.max(-1, Math.min(1, cosTheta3));

        // Elbow up configuration (negative theta3)
        const theta3 = -Math.acos(clampedCos);

        // 5. Shoulder angle (theta2)
        const alpha = Math.atan2(dr, dy);
        const beta = Math.atan2(forearm * Math.sin(-theta3), upperArm + forearm * Math.cos(theta3));
        const theta2 = alpha - beta;

        // 6. Wrist pitch (theta4) to point end-effector towards target fruit
        const rawTheta4 = approachPitch - (theta2 + theta3);
        const theta4 = Math.max(this.limits.j4_wrist.min, Math.min(this.limits.j4_wrist.max, rawTheta4));

        // Validate joint limits for shoulder and elbow
        if (
            theta2 < this.limits.j2_shoulder.min || theta2 > this.limits.j2_shoulder.max ||
            theta3 < this.limits.j3_elbow.min || theta3 > this.limits.j3_elbow.max
        ) {
            return null;
        }

        return {
            theta1: clampedTheta1,
            theta2,
            theta3,
            theta4,
            theta5: 0
        };
    }

    /**
     * Smoothly update joint angles towards target angles with damping
     * @param {number} dt - delta time in seconds
     * @param {number} speed - transition speed multiplier
     */
    update(dt = 0.016, speed = 4.0) {
        const lerpFactor = Math.min(1.0, dt * speed);
        for (const key of ['theta1', 'theta2', 'theta3', 'theta4', 'theta5']) {
            if (this.targetAngles[key] !== undefined) {
                this.angles[key] += (this.targetAngles[key] - this.angles[key]) * lerpFactor;
            }
        }
    }

    /**
     * Set target angles directly
     */
    setTargetAngles(newTargets) {
        for (const [k, v] of Object.entries(newTargets)) {
            if (this.targetAngles[k] !== undefined) {
                this.targetAngles[k] = v;
            }
        }
    }

    /**
     * Check if current angles have closely converged to target angles
     */
    hasReachedTarget(threshold = 0.035) {
        for (const key of ['theta1', 'theta2', 'theta3', 'theta4']) {
            if (Math.abs(this.targetAngles[key] - this.angles[key]) > threshold) {
                return false;
            }
        }
        return true;
    }
}

// Export for module or global use
if (typeof module !== 'undefined') {
    module.exports = ArmKinematics;
}

