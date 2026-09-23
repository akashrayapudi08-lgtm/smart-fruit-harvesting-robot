# Smart Fruit Harvesting Robot for Automated Fruit Picking
### 3D Live Web Simulation & Mechatronics Digital Twin

A comprehensive engineering design and interactive 3D WebGL simulation of an autonomous smart fruit harvesting robot for precision orchard harvesting.

---

## 🌟 Quick Start Guide

### Option 1: Double-Click Batch File (Recommended on Windows)
Simply double-click:
```
start_simulation.bat
```
This automatically starts the local HTTP server and opens the 3D simulation in your default browser.

### Option 2: Python Command Line
Run the launcher script:
```bash
python run_simulation.py
```
Then open your browser at: [http://localhost:8080/index.html](http://localhost:8080/index.html)

### Option 3: Direct Browser Launch
You can also open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).

---

## 🚀 Key Features

1. **Realistic 3D Orchard Environment:**
   - Dual rows of high-density dwarf fruit trees with procedural leafy canopies and branches.
   - Trees populated with ripe (crimson red) and unripe (green) fruits.
   - Orchard terrain with AGV wheel tracks, support trellises, and harvest collection crates.
   - Dynamic lighting: Sunlit Day, Golden Sunset, and Night Shift with robot headlights and arm spotlights.

2. **Smart Harvesting Robot Mechatronics Model:**
   - **Mobile Base:** Rugged 4WD all-terrain AGV chassis with independent wheels and LiDAR scanner.
   - **Robotic Manipulator:** 5-DOF articulated arm (Turntable Base, Shoulder Lift, Elbow Flexion, Wrist Pitch, Wrist Roll).
   - **Smart End-Effector:** Dual curved soft-silicone gripper fingers and high-speed rotating stem cutter shear blade.
   - **Vision Mount:** Eye-in-Hand RGB-D stereo camera with high-intensity LED illuminator ring.
   - **Collection Hopper:** Rear-mounted fruit container with cushioned liner and real-time fruit counter.

3. **Autonomous Harvesting Cycle (FSM):**
   - Autonomous row navigation $\to$ Fruit detection & ripeness analysis $\to$ Target locking $\to$ Inverse Kinematics arm reaching $\to$ Gentle soft grasp $\to$ Stem cutting $\to$ Arm retraction $\to$ Hopper transfer and deposit $\to$ Yield tally.

4. **Digital Twin Telemetry & AI Vision HUD:**
   - Picture-in-Picture camera feed simulating YOLOv8 object detection with bounding boxes, ripeness confidence, and millimeter depth readout.
   - Live metrics: Total fruits harvested, yield weight (kg), picking rate (/hr), hopper capacity bar, coordinates $(X, Z)$.
   - Multiple camera perspectives: Free Orbit, Third-Person Chase, End-Effector POV, and Top-Down Aerial View.

5. **Manual Teleoperation Mode:**
   - Full keyboard chassis navigation with keys <kbd>W</kbd>, <kbd>A</kbd>, <kbd>S</kbd>, <kbd>D</kbd>.
   - Interactive sliders for all 5 arm joints ($J_1$ to $J_5$) with real-time degree telemetry.
   - Direct button controls to open/close the soft gripper and spin the oscillating stem cutter.

---

## 📂 Project Structure

```
├── index.html                       # Main 3D WebGL application & digital twin HUD
├── css/
│   └── style.css                    # Glassmorphism dark-mode robotics dashboard styling
├── js/
│   ├── kinematics.js                # Forward & Inverse Kinematics (FK/IK) analytical solver
│   ├── robot.js                     # 3D robot model, 4WD chassis, 5-DOF arm & end-effector rig
│   ├── orchard.js                   # 3D orchard environment, procedural trees & fruits
│   ├── vision_hud.js                # Simulated YOLOv8 vision feed & depth overlay
│   ├── harvest_fsm.js               # Autonomous harvesting finite state machine (FSM)
│   └── simulation.js                # Three.js render loop, camera rigs & UI bindings
├── run_simulation.py                # Local web server launcher script
├── start_simulation.bat             # One-click Windows batch launcher
├── DESIGN_AND_DEVELOPMENT_REPORT.md # Comprehensive engineering & academic documentation
└── README.md                        # Project documentation and user guide
```

---

## 📖 Technical Documentation

For the complete technical report, Denavit-Hartenberg (DH) parameters, forward and inverse kinematic derivations, computer vision equations, electrical Bill of Materials (BOM), and performance benchmarks, refer to:
👉 [DESIGN_AND_DEVELOPMENT_REPORT.md](file:///c:/Users/akash/OneDrive/Desktop/A%20SMART%20FRUIT%20HARVESTING%20ROBOT%20FOR%20AUTOMATED%20FRUIT%20PICKING/DESIGN_AND_DEVELOPMENT_REPORT.md)

