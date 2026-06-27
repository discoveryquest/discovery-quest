// Space Quest lesson visuals. A beat's `view` is { kind, key?, ...props };
// renderLessonView dispatches kind → a node. Mirrors english/src/lessons/views.jsx.
// One kind for now: `fact` — a Discovery Deck card (big emoji + caption).
import Emoji from '@discoveryquest/engine-ui/Emoji';

export function renderLessonView(view) {
  if (!view) return null;
  if (view.kind === 'fact') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="text-7xl leading-none"><Emoji char={view.emoji} /></span>
        <p className="max-w-[440px] text-xl font-bold leading-relaxed text-slate-100">{view.text}</p>
      </div>
    );
  }
  return null;
}
