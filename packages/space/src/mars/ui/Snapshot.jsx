import { useState } from 'react';

// One-tap "postcard from Mars": grabs the current WebGL frame to a watermarked
// PNG the visitor can save/share — the core viral loop. The Canvas is created
// with preserveDrawingBuffer:true (MarsSurface) so toDataURL isn't blank, and all
// Mars assets are same-origin under /mars/… so the canvas isn't tainted. We copy
// the gl canvas onto a 2D canvas, stamp a subtle watermark, then download.
function grabWatermarkedPng() {
  const gl = document.querySelector('canvas');
  if (!gl) return null;
  const w = gl.width;
  const h = gl.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(gl, 0, 0, w, h);

  // Watermark: bottom-right, scaled to the buffer so it reads on hi-dpi grabs.
  const pad = Math.round(w * 0.018);
  const fs = Math.max(14, Math.round(w * 0.022));
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const label = 'discoveryquest.app/mars';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.round(fs * 0.5);
  ctx.fillStyle = 'rgba(255,233,208,0.92)';
  ctx.fillText(label, w - pad, h - pad);
  return out.toDataURL('image/png');
}

export default function Snapshot() {
  const [flash, setFlash] = useState(false);

  const onClick = () => {
    const url = grabWatermarkedPng();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `mars-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Save a postcard from Mars"
        style={{
          position: 'fixed', top: 12, right: 62, zIndex: 3,
          appearance: 'none', width: 40, height: 40, borderRadius: 999, cursor: 'pointer',
          border: '1px solid rgba(255,180,120,0.35)', background: 'rgba(20,8,4,0.5)',
          color: '#ffe9d0', font: '18px system-ui', backdropFilter: 'blur(2px)',
        }}
      >
        📸
      </button>
      {/* brief white flash for shutter feedback */}
      {flash && (
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none',
            background: '#fff', opacity: 0.5, transition: 'opacity 200ms',
          }}
        />
      )}
    </>
  );
}
