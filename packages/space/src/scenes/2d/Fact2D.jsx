// Fact2D — legacy Discovery-Deck card: large emoji + descriptive text.
// Port of the `fact` view from src/lessons/views.jsx onto the cinematic SpaceStage.
import Emoji from '@discoveryquest/engine-ui/Emoji';
import { SpaceStage } from './base.jsx';

export default function Fact2D({ emoji, text }) {
  return (
    <SpaceStage>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
        {emoji && (
          <span
            className="text-7xl leading-none"
            style={{ filter: 'drop-shadow(0 0 18px rgba(103,232,249,0.55))' }}
          >
            <Emoji char={emoji} />
          </span>
        )}
        {text && (
          <p className="max-w-[400px] text-xl font-bold leading-relaxed text-slate-100">{text}</p>
        )}
      </div>
    </SpaceStage>
  );
}
