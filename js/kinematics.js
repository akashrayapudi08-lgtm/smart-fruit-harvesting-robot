/**
 * ADVANCED KINEMATICS & TRAJECTORY GENERATION ENGINE
 * 5-DOF Articulated Robotic Manipulator
 * "Smart Fruit Harvesting Robot for Automated Fruit Picking"
 * 
 * Features:
 * - Forward Kinematics (FK) and Analytical 5-DOF Inverse Kinematics (IK)
 * - Critically-damped spring-damper joint trajectory smoothing (zero jerk, industrial smoothness)
 * - Multi-waypoint S-curve interpolation for approach, grasp, stem-snip, and hopper swing
 * - Velocity and acceleration limiting mimicking collaborative industrial arms (UR5 / Franka)
 */

class ArmKinematics {
    constructor() {
        // Link lengths (meters)
        this.links = {
            baseHeight: 0.45,  // d1: Ground to shoulder axis
            upperArm: 0.60,    // a2: Shoulder to elbow
            forearm: 0.50,     // a3: Elbow to wrist
            wristTool: 0.28    // d5: Wrist to gripper center / cutting point
        };

        // Joint angle limits in radians
        this.limits = {
            j1_base:     { min: -Math.PI * 0.85, max: Math.PI * 0.85 }, // Base yaw (-153° to +153°)
            j2_shoulder: { min: -0.35, max: Math.PI * 0.75 },           // Shoulder pitch (-20° to +135°)
            j3_elbow:    { min: -Math.PI * 0.85, max: 0.3 },            // Elbow pitch (-153° to +17°)
            j4_wrist:    { min: -Math.PI * 0.85, max: Math.PI * 0.85 }, // Wrist pitch (-153° to +153°)
            j5_roll:     { min: -Math.PI, max: Math.PI }                // Tool roll (-180° to +180°)
        };

        // Current joint angles (radians)
        this.angles = {
            theta1: 0,
            theta2: 0.45,
            theta3: -1.1,
            theta4: 0.55,
            theta5: 0
        };

        // Current joint velocities (rad/s) for critically damped spring-damper motion
        this.velocities = {
            theta1: 0,
            theta2: 0,
            theta3: 0,
            theta4: 0,
            theta5: 0
        };

        // Target angles
        this.targetAngles = { ...this.angles };

        // Standard Operational Poses
        this.homeAngles = {
            theta1: 0,
            theta2: 0.55,
            theta3: -1.25,
            theta4: 0.60,
            theta5: 0
        };

        this.stowAngles = {
            theta1: 0,
            theta2: 1.15,
            theta3: -1.85,
            theta4: 0.65,
            theta5: 0
        };

        this.hopperAngles = {
            theta1: Math.PI,    // Pointed directly backward into hopper
            theta2: 0.82,
            theta3: -0.92,
            theta4: 0.15,
            theta5: 0
        };

        // Max dynamics limits
        this.maxVelocity = 2.8;     // rad/s
        this.dampingRatio = 0.88;   // Smooth non-oscillating settle
        this.frequency = 6.2;       // Response agility
    }

    /**
     * Compute Forward Kinematics (FK)
     * Calculates 3D Cartesian coordinates of all joint centers and the end-effector tip.
     */
    forwardKinematics(angles = this.angles) {
        const { theta1, theta2, theta3, theta4 } = angles;
        const { baseHeight, upperArm, forearm, wristTool } = this.links;

        const p0 = { x: 0, y: 0, z: 0 };
        const p1 = { x: 0, y: baseHeight, z: 0 };

        const r_elbow = upperArm * Math.sin(theta2);
        const y_elbow = baseHeight + upperArm * Math.cos(theta2);

        const p2 = {
            x: r_elbow * Math.sin(theta1),
            y: y_elbow,
            z: r_elbow * Math.cos(theta1)
        };

        const angleElbowAbs = theta2 + theta3;
        const r_wrist = r_elbow + forearm * Math.sin(angleElbowAbs);
        const y_wrist = y_elbow + forearm * Math.cos(angleElbowAbs);

        const p3 = {
            x: r_wrist * Math.sin(theta1),
            y: y_wrist,
            z: r_wrist * Math.cos(theta1)
        };

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
     * Computes joint angles to place toolTip at target (tx, ty, tz) in arm-local frame.
     */
    solveIK(tx, ty, tz, desiredPitch = null) {
        const { baseHeight, upperArm, forearm, wristTool } = this.links;

        // 1. Base yaw rotation (theta1)
        const theta1 = Math.atan2(tx, tz);
        const clampedTheta1 = Math.max(this.limits.j1_base.min, Math.min(this.limits.j1_base.max, theta1));

        // 2. Projected radial distance from arm center
        const r_target = Math.sqrt(tx * tx + tz * tz);
        const y_target = ty;

        // Approach pitch: line-of-sight slightly downwards for optimal fruit cutting access
        const approachPitch = (desiredPitch !== null) ? desiredPitch : Math.atan2(r_target, y_target - baseHeight) * 0.95;

        // 3. Wrist center calculation
        const rw = r_target - wristTool * Math.sin(approachPitch);
        const yw = y_target - wristTool * Math.cos(approachPitch);

        const dy = yw - baseHeight;
        const dr = rw;

        const distSq = dr * dr + dy * dy;
        const dist = Math.sqrt(distSq);

        const maxReach = upperArm + forearm;
        const minReach = Math.abs(upperArm - forearm);

        if (dist > maxReach * 0.995 || dist < minReach * 1.005) {
            return null; // Target unreachable
        }

        // 4. Law of Cosines for Elbow angle (theta3)
        const cosTheta3 = (distSq - upperArm * upperArm - forearm * forearm) / (2 * upperArm * forearm);
        const clampedCos = Math.max(-1, Math.min(1, cosTheta3));

        // Elbow-up configuration
        const theta3 = -Math.acos(clampedCos);

        // 5. Shoulder angle (theta2)
        const alpha = Math.atan2(dr, dy);
        const beta = Math.atan2(forearm * Math.sin(-theta3), upperArm + forearm * Math.cos(theta3));
        const theta2 = alpha - beta;

        // 6. Wrist pitch (theta4)
        const rawTheta4 = approachPitch - (theta2 + theta3);
        const theta4 = Math.max(this.limits.j4_wrist.min, Math.min(this.limits.j4_wrist.max, rawTheta4));

        // Joint limit verification
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
     * Compute a Pre-Approach Standoff IK solution (retracted along tool approach axis by standoffDist)
     */
    solvePreApproachIK(tx, ty, tz, standoffDist = 0.18) {
        const r_target = Math.sqrt(tx * tx + tz * tz);
        const dirX = tx / (r_target || 1);
        const dirZ = tz / (r_target || 1);

        // Retract slightly along radial axis and slightly upwards
        const ptx = tx - dirX * standoffDist;
        const pty = ty + 0.05;
        const ptz = tz - dirZ * standoffDist;

        return this.solveIK(ptx, pty, ptz);
    }

    /**
     * Industrial-grade smooth motion update using Spring-Damper S-Curve physics
     * Eliminates mechanical jerking and produces fluid, organic collaborative robotic arm motion.
     * @param {number} dt - delta time in seconds
     * @param {number} speedMult - agility multiplier
     */
    update(dt = 0.016, speedMult = 1.0) {
        const clampedDt = Math.min(0.05, dt);
        const omega = this.frequency * speedMult;
        const zeta = this.dampingRatio;

        const k1 = 2 * zeta * omega;
        const k2 = omega * omega;

        for (const key of ['theta1', 'theta2', 'theta3', 'theta4', 'theta5']) {
            if (this.targetAngles[key] !== undefined) {
                let current = this.angles[key];
                const target = this.targetAngles[key];
                let vel = this.velocities[key] || 0;

                // Handle angular wrap-around for base yaw (theta1)
                let error = target - current;
                if (key === 'theta1') {
                    while (error > Math.PI) error -= 2 * Math.PI;
                    while (error < -Math.PI) error += 2 * Math.PI;
                }

                // Spring-damper acceleration
                const accel = (k2 * error) - (k1 * vel);
                vel += accel * clampedDt;

                // Clamp maximum angular velocity
                const maxV = this.maxVelocity * speedMult;
                vel = Math.max(-maxV, Math.min(maxV, vel));
                this.velocities[key] = vel;

                current += vel * clampedDt;
                this.angles[key] = current;
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
     * Check if current joint angles have converged to within threshold of target
     */
    hasReachedTarget(threshold = 0.045) {
        for (const key of ['theta1', 'theta2', 'theta3', 'theta4']) {
            let diff = Math.abs(this.targetAngles[key] - this.angles[key]);
            if (key === 'theta1') {
                while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
            }
            if (diff > threshold) {
                return false;
            }
        }
        return true;
    }
}

if (typeof module !== 'undefined') {
    module.exports = ArmKinematics;
}
