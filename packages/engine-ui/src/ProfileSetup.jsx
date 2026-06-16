// Course-agnostic "make your hero" step: pick avatar + name + age. Presentational;
// the host persists via @discoveryquest/engine/profiles. Chrome (companion, bg) is
// supplied by the host so each course keeps its look.
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProfileSetup({
  avatars = ['🦊', '🐰', '🐸', '🦖', '🐱', '🐼', '🚀', '🌟'],
  nameIdeas = [], ages = [5, 6, 7, 8, 9, 10, 11, '11+'],
  initial = {}, labels = {}, onSubmit, onCancel,
}) {
  const [avatar, setAvatar] = useState(initial.avatar || avatars[0]);
  const [name, setName] = useState(initial.name || (nameIdeas[Math.floor(Math.random() * nameIdeas.length)] ?? ''));
  const [age, setAge] = useState(initial.age ?? null);
  const ready = name.trim().length > 0 && age !== null;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7">
      <Field title={labels.hero || 'Pick your hero'}>
        <div className="grid grid-cols-4 gap-3">
          {avatars.map((a) => (
            <motion.button key={a} type="button" whileTap={{ scale: 0.88 }} onClick={() => setAvatar(a)}
              className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-4xl ${avatar === a ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5'}`}>{a}</motion.button>
          ))}
        </div>
      </Field>
      <Field title={labels.name || 'Your hero name'}>
        <input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} placeholder={labels.namePlaceholder || 'Type a name…'}
          className="w-full rounded-2xl border-2 border-white/10 bg-black/30 px-5 py-4 text-2xl font-bold text-white outline-none focus:border-cyan-300/60" />
      </Field>
      <Field title={labels.age || 'How old are you?'}>
        <div className="flex flex-wrap gap-2.5">
          {ages.map((a) => (
            <motion.button key={a} type="button" whileTap={{ scale: 0.9 }} onClick={() => setAge(a)}
              className={`h-16 min-w-16 rounded-2xl border-2 px-4 font-mono text-2xl font-bold ${age === a ? 'border-yellow-300 bg-yellow-400/15 text-yellow-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>{a}</motion.button>
          ))}
        </div>
      </Field>
      <button type="button" disabled={!ready} onClick={() => ready && onSubmit({ name: name.trim().slice(0, 18), avatar, age })}
        data-testid="profile-setup-submit"
        className={`mt-2 w-full rounded-3xl py-5 text-2xl font-extrabold ${ready ? 'bg-cyan-400 text-slate-900' : 'cursor-not-allowed bg-white/10 text-slate-500'}`}>
        {labels.submit || 'Start the adventure!'}
      </button>
      {onCancel && <button type="button" onClick={onCancel} className="mx-auto text-sm font-bold text-slate-500 hover:text-slate-300">{labels.cancel || 'Back'}</button>}
    </div>
  );
}
function Field({ title, children }) {
  return (<div><h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-400">{title}</h2>{children}</div>);
}
