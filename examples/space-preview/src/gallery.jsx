// TEMPORARY dev-only gallery to eyeball every Scene kit renderer at once (not shipped).
import React from 'react';
import { createRoot } from 'react-dom/client';
import Scene from '../../../packages/space/src/scenes/Scene.jsx';
import './styles.css';

const SAMPLES = [
  ['fact', { kind: 'fact', emoji: '🌙', text: 'The Moon shines by reflecting sunlight.' }],
  ['body · star', { kind: 'body', body: { role: 'star', glow: true }, label: 'The Sun' }],
  ['body · ringed planet', { kind: 'body', body: { role: 'planet', rings: true, tilt: 16 }, label: 'Saturn' }],
  ['body · moon phase', { kind: 'body', body: { role: 'moon', phase: 0.7 }, label: 'Waxing Moon' }],
  ['orbit', { kind: 'orbit', bodies: [{ id: 'earth', role: 'planet' }, { id: 'moon', role: 'moon', orbits: 'earth', radius: 72, period: 6, phaseLit: true }] }],
  ['field · nebula', { kind: 'field', tint: 'nebula', label: 'A Nebula' }],
  ['launch', { kind: 'launch' }],
  ['compare', { kind: 'compare', items: [{ label: 'Earth', relSize: 0.22 }, { label: 'Jupiter', relSize: 1, color: '#e0b07a' }] }],
  ['scrub (interactive)', { kind: 'scrub', base: { kind: 'orbit', bodies: [{ id: 'earth', role: 'planet' }, { id: 'moon', role: 'moon', orbits: 'earth', phaseLit: true }] }, states: [
    { id: 'new', label: 'New Moon', say: 'x', caption: 'New Moon — lit side faces away.' },
    { id: 'quarter', label: 'First Quarter', say: 'x', caption: 'Half the lit side shows.' },
    { id: 'full', label: 'Full Moon', say: 'x', caption: 'The whole lit side faces Earth.' } ] }],
  ['reveal (interactive)', { kind: 'reveal', base: { kind: 'field', tint: 'nebula' }, hotspots: [
    { id: 'a', label: 'Mercury', say: 'x', caption: 'Closest to the Sun.', x: 30, y: 55 },
    { id: 'b', label: 'Jupiter', say: 'x', caption: 'The largest planet.', x: 68, y: 40 } ] }],
  ['moonPhase · auto', { kind: 'moonPhase', interactive: false }],
  ['moonPhase · interactive', { kind: 'moonPhase', interactive: true, says: { new: 'x', first: 'x', full: 'x', last: 'x' } }],
  ['moonPhase · strip', { kind: 'moonPhase', variant: 'strip' }],
  ['moonPhase · strip active', { kind: 'moonPhase', variant: 'strip', active: 3 }],
];

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) return <pre style={{ color: '#fca5a5', font: '600 11px monospace', whiteSpace: 'pre-wrap', margin: 0 }}>{String(this.state.err && this.state.err.stack || this.state.err)}</pre>;
    return this.props.children;
  }
}

function Card({ title, descriptor }) {
  return (
    <div style={{ width: 440, background: '#14171f', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: 12 }}>
      <div style={{ color: '#67e8f9', font: '700 12px sans-serif', marginBottom: 8, letterSpacing: '.04em' }}>{title}</div>
      <Boundary><Scene descriptor={descriptor} /></Boundary>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{ minHeight: '100vh', background: '#07080d', padding: 24, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignContent: 'flex-start' }}>
      {SAMPLES.map(([title, d]) => <Card key={title} title={title} descriptor={d} />)}
    </div>
  </React.StrictMode>,
);
