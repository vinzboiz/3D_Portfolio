# 💾 Retro 1997 Procedural 3D PC Portfolio

> An interactive, fully procedural 1997 retro PC hardware assembly and project showcase built with **Three.js**, **React Three Fiber (R3F)**, **TypeScript**, and **GSAP**.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features & Highlights

- **100% Procedural 3D Hardware (No External `.glb` / `.gltf`):** Every capacitor, Socket 7 pin, ISA/PCI slot, ribbon cable, and AT mid-tower chassis is procedurally modeled using Three.js geometries and procedural HTML5 CanvasTextures.
- **10-Step Hardware Assembly Scrubber:** Scrub forwards and backwards through the 1997 PC build process (Motherboard, CPU Pentium MMX 233MHz, Cooler Master Heatsink, SIMM RAM, AT PSU, Storage Drives, Cables, ISA Sound Blaster 16 & 3dfx Voodoo Graphics, and Sony Trinitron CRT Monitor).
- **Interactive Storage Media with Flight Physics:**
  - **3.5" Floppy Disk (`VINZBOIZ_CV.DOC`):** 2-stage insertion physics from cutting mat into the floppy drive slot. Automatically launches WordPad CV on the CRT desktop.
  - **Creative 24X CD-ROM (`PROJECTS_98.EXE`):** Sliding disc tray motor animation with 650MB iridescent CD-R disc. Ejects flat onto the workbench mat beside the floppy disk.
- **Dynamic CRT OS Simulation (Sony Trinitron Multiscan 100ES):**
  - Award Modular BIOS v4.51PG POST sequence (RAM count, IDE auto-detection, PCI IRQ listing).
  - Windows 98 Boot Logo with animated phosphor gradient bar.
  - Full Desktop Windowing System with Autorun CD launcher.
- **3D Retro Fly-Through Project Showcase:**
  - Plunge into the CRT screen via camera dive.
  - 60 FPS inertia tunnel navigation showcasing featured engineering projects with zero CSS blur drops.
  - Outro portal with auto-exit back to the desktop.
- **Authentic Mechanical Audio (Howler.js):** Latching AT power switch clicks, floppy drive head seek pulses, POST beep, high-speed CD spin-up, and CRT degauss coil thud.
- **Zero Border-Radius Retro UI:** Authentic Windows 95 3D bevels, 7-segment LED displays, cutting mat blueprint rulers, and dual-mode Wheel control (Scroll Timeline vs. 360° Free Cam Inspect).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **3D Engine** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei) |
| **Animation & Motion** | [GSAP](https://greensock.com/gsap/) + ScrollTrigger + Custom Lerp Physics |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Sound Engine** | [Howler.js](https://howlerjs.com/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS 3D Bevel Custom Properties |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing) |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/retro-1997-pc-portfolio.git

# Navigate to the project directory
cd retro-1997-pc-portfolio

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to experience the 3D portfolio.

### Building for Production

```bash
# Type check and build optimized static assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── canvas/
│   │   ├── hardware/           # Procedural 3D hardware components
│   │   │   ├── BenchAssemblyGroup.tsx # Mobo & CPU/RAM assembly
│   │   │   ├── PcCaseEnlight.tsx      # AT Mid-tower case & panels
│   │   │   ├── PeripheralsCRT.tsx     # Sony Trinitron CRT & OS screen
│   │   │   ├── StorageDrives.tsx      # CD-ROM, Floppy & Quantum HDD
│   │   │   ├── crtOsRenderer.ts       # CanvasTexture OS renderer
│   │   │   └── ...
│   │   ├── interaction/        # 3D clickable controls & raycasting
│   │   ├── materials/          # Procedural PBR shaders & textures
│   │   ├── CameraRig.tsx       # Dynamic cinematic camera controller
│   │   ├── Experience.tsx      # Scene lighting & environment
│   │   └── Workbench.tsx       # Desk slab, cutting mat & transitions
│   └── ui/
│       ├── ProjectTunnelShowcase.tsx # 3D fly-through projects showcase
│       └── RetroHUD.tsx              # Windows 95 styled navigation overlay
├── data/
│   ├── assemblySteps.ts        # 10 hardware assembly stages metadata
│   └── mockProjects.ts         # Portfolio featured projects data
├── store/
│   └── useBuildStore.ts        # Global Zustand state & timelines
└── utils/
    └── retroSound.ts           # Mechanical audio generator & sounds
```

---

## 🎮 Controls & Shortcuts

- **Mouse Wheel / Trackpad:** Scrub through hardware assembly timeline (Steps 01 - 10) or navigate the 3D Project Tunnel.
- **`[ ABOUT ]` / `[ PROJECT ]`:** Quick-toggle between component teardown and fully-assembled system.
- **`[ F ]` or Free Cam Button:** Toggle between Timeline Scroll and 360° Orbit / Zoom to inspect hardware details.
- **Physical Buttons:** Click the Power Switch, Turbo Button, Floppy Disk, CD Drive Eject, or CRT OSD controls directly in the 3D scene.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

