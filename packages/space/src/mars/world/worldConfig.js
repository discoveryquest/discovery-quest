/**
 * @typedef {Object} WorldConfig
 * @property {string} id @property {string} name
 * @property {number} gravity  m/s^2 (Mars 3.72) @property {number} earthGravity  9.81
 * @property {number} temperatureC
 * @property {{top:string,horizon:string,sunColor:string}} sky
 * @property {{seed:number,baseSpeed:number,gustSpeed:number}} wind
 * @property {{panorama:string,ground:string,rover:string,lander?:string}} assets
 * @property {string} ambientTrack
 */
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const str = (v) => typeof v === 'string' && v.length > 0;
// Same-origin public asset path (leading '/'), not an off-origin URL.
const asset = (v) => str(v) && v.startsWith('/');

/** Runtime validate a WorldConfig. Returns { ok, errors[] }. This is the guard
 *  that makes "Moon is just another config" safe — types AND ranges/logic. */
export function validateWorldConfig(cfg) {
  const errors = [];
  const need = (cond, path) => { if (!cond) errors.push(`invalid or missing: ${path}`); };
  need(cfg && typeof cfg === 'object', 'config');
  if (!cfg) return { ok: false, errors };
  need(str(cfg.id), 'id'); need(str(cfg.name), 'name');
  // gravity must be a positive fraction of Earth's
  need(num(cfg.earthGravity) && cfg.earthGravity > 0, 'earthGravity');
  need(num(cfg.gravity) && cfg.gravity > 0 && cfg.gravity < cfg.earthGravity, 'gravity');
  need(num(cfg.temperatureC) && cfg.temperatureC > -200 && cfg.temperatureC < 100, 'temperatureC');
  need(cfg.sky && str(cfg.sky.top), 'sky.top');
  need(cfg.sky && str(cfg.sky.horizon), 'sky.horizon');
  need(cfg.sky && str(cfg.sky.sunColor), 'sky.sunColor');
  need(cfg.wind && num(cfg.wind.seed), 'wind.seed');
  need(cfg.wind && num(cfg.wind.baseSpeed) && cfg.wind.baseSpeed >= 0, 'wind.baseSpeed');
  need(cfg.wind && num(cfg.wind.gustSpeed) && cfg.wind.gustSpeed >= cfg.wind.baseSpeed, 'wind.gustSpeed');
  need(cfg.assets && asset(cfg.assets.panorama), 'assets.panorama');
  need(cfg.assets && asset(cfg.assets.ground), 'assets.ground');
  need(cfg.assets && asset(cfg.assets.rover), 'assets.rover');
  // optional assets, but if present must be same-origin paths
  if (cfg.assets && cfg.assets.lander !== undefined) need(asset(cfg.assets.lander), 'assets.lander');
  need(str(cfg.ambientTrack), 'ambientTrack');
  return { ok: errors.length === 0, errors };
}
