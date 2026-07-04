# Space Quest — preview shell

A tiny local dev harness to run `@discoveryquest/space` (Space Quest) in a real
browser. The library declares `three` / `@react-three/fiber` / `@react-three/drei`
as **peer deps**; this app supplies them so the 3D scene actually renders. It is a
dev tool, not a shipped product.

## Run it

From the **repo root**:

```bash
npm install              # links workspaces + installs three / R3F / vite
npm run preview:space    # (or:  npm --workspace space-preview run dev)
```

Vite prints a **Local** URL and a **Network** URL. Open the Local URL on your
machine, or the **Network** URL on a phone on the same Wi-Fi to test touch/mobile.

## What you should see

The Star Chart (4 sectors) → tap a sector → guided flight to a beacon → tap a
beacon → a Cosmic Gate (Phase Lock / Orbit Sort / Connect the Stars / Dock) →
earn stars → the next station unlocks. The 🗺 button reopens the Star Chart.

> Heads-up: planets are stylized spheres (no art assets yet), gates are 2D
> overlays (not full 3D yet), and there's no audio or "Learn it" content yet.
> This previews the **structure + loop**, not the finished experience.
