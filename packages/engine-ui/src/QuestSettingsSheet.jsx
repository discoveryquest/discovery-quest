// Shared quest settings sheet: sound, hero rename + avatar, save export/import
// (emoji-safe base64), a two-tap progress reset, plus switch-player and grown-ups
// rows. Course-agnostic — the active save slot comes from engine getSaveKey(), and
// course-specific rows (e.g. math's music toggle) are injected via the `extras` slot.
// Mounted fresh on every open so it always reads the latest save.
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Copy, Check, RotateCcw } from 'lucide-react';
import { loadSave, mutateSave, persistSave, getSaveKey } from '@discoveryquest/engine/save';
import { loadRegistry, editProfile } from '@discoveryquest/engine/profiles';
import { setSoundEnabled } from '@discoveryquest/voice-kit/audio';

const AVATARS = ['🦊', '🐰', '🐸', '🦖', '🐱', '🐼', '🚀', '🌟'];
const encodeSave = (save) => btoa(unescape(encodeURIComponent(JSON.stringify(save))));
const decodeSave = (str) => JSON.parse(decodeURIComponent(escape(atob(str.trim()))));

export default function QuestSettingsSheet({ onClose, onGrownUps, onSwitchPlayer, extras = null, soundLabel = "Luna's voice & sounds" }) {
  const [save] = useState(() => loadSave());
  const [sound, setSound] = useState(save.settings.sound);
  const [name, setName] = useState(save.profile.name || '');
  const [avatar, setAvatar] = useState(save.profile.avatar);
  const [importStr, setImportStr] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importErr, setImportErr] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    mutateSave((s) => { s.settings.sound = next; });
  }

  function saveProfile() {
    const trimmed = name.trim().slice(0, 18);
    const fields = { avatar };
    if (trimmed) fields.name = trimmed;
    const reg = loadRegistry(localStorage);
    const pid = save.profile.id;
    if (pid && reg.profiles.some((p) => p.id === pid)) {
      editProfile(localStorage, { reg, saveKey: getSaveKey(), profileId: pid, fields });
    } else {
      mutateSave((s) => { if (trimmed) s.profile.name = trimmed; s.profile.avatar = avatar; });
    }
    onClose(true); // host remounts the map so brand/avatar refresh
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(encodeSave(loadSave()));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable — string still selectable */ }
  }

  function doImport() {
    try {
      const data = decodeSave(importStr);
      if (typeof data.version !== 'number') throw new Error('bad save');
      persistSave(data);
      window.location.reload();
    } catch {
      setImportErr(true);
      setTimeout(() => setImportErr(false), 2200);
    }
  }

  function doReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    localStorage.removeItem(getSaveKey());
    window.location.reload();
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="pointer-events-auto max-h-[88vh] w-full max-w-[400px] overflow-y-auto rounded-3xl border border-white/10 bg-[#14171f] p-6 shadow-2xl"
          initial={{ scale: 0.7, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.75, y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <div className="relative mb-4 flex items-center justify-center">
            <h3 className="text-xl font-extrabold text-white">⚙️ Settings</h3>
            <button type="button" onClick={() => onClose(false)} aria-label="Close settings" className="absolute right-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <button type="button" onClick={toggleSound} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 font-bold text-slate-200 transition-colors hover:bg-white/8">
            {sound ? <Volume2 size={20} className="text-cyan-300" /> : <VolumeX size={20} className="text-slate-500" />}
            {soundLabel}
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-extrabold ${sound ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/10 text-slate-500'}`}>
              {sound ? 'ON' : 'OFF'}
            </span>
          </button>

          {extras}

          <h4 className="mt-5 text-xs font-extrabold uppercase tracking-wider text-slate-400">Your hero</h4>
          <div className="mt-2 flex gap-1.5">
            {AVATARS.map((a) => (
              <button key={a} type="button" aria-label={`avatar ${a}`} onClick={() => setAvatar(a)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl transition-all ${avatar === a ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/4'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={name} maxLength={18} aria-label="Hero name" onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border-2 border-white/10 bg-black/30 px-3 py-2 font-bold text-white outline-none focus:border-cyan-300/60" />
            <button type="button" onClick={saveProfile} className="rounded-xl bg-cyan-400 px-4 font-extrabold text-slate-900 hover:bg-cyan-300">Save</button>
          </div>

          <h4 className="mt-5 text-xs font-extrabold uppercase tracking-wider text-slate-400">Backup</h4>
          <button type="button" onClick={copyExport} className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/8">
            {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy progress code'}
          </button>
          <div className="mt-2 flex gap-2">
            <input value={importStr} placeholder="Paste a progress code..." aria-label="Import progress code" onChange={(e) => setImportStr(e.target.value)}
              className={`w-full rounded-xl border-2 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none ${importErr ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300/60'}`} />
            <button type="button" onClick={doImport} disabled={!importStr.trim()} className="rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-extrabold text-slate-200 hover:bg-white/10 disabled:opacity-40">Load</button>
          </div>
          {importErr && <p className="mt-1 text-xs font-bold text-rose-300">That code doesn't look right — check it and try again.</p>}

          {onSwitchPlayer && (
            <button type="button" onClick={() => { onClose(false); onSwitchPlayer(); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-extrabold text-slate-300 hover:bg-white/8">
              🦊 Switch player
            </button>
          )}
          {onGrownUps && (
            <button type="button" onClick={onGrownUps} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-extrabold text-slate-300 hover:bg-white/8">
              👨‍👩‍👧 For grown-ups — account & progress
            </button>
          )}

          <button type="button" onClick={doReset}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition-colors ${confirmReset ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-rose-400/30 bg-rose-500/5 text-rose-300/80 hover:bg-rose-500/10'}`}>
            <RotateCcw size={15} />
            {confirmReset ? 'Tap again to erase EVERYTHING!' : 'Reset all progress'}
          </button>
        </motion.div>
      </div>
    </>
  );
}
