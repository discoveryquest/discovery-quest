// Cheap WebGL capability probe — used to show a graceful fallback instead of a
// blank Canvas on devices/browsers without WebGL (spec R3). Creates a throwaway
// canvas and asks for a context.
export function hasWebGL() {
  if (typeof document === 'undefined') return true; // SSR: assume yes, re-check on client
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
