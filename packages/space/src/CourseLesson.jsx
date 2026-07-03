// CourseLesson — course-driven host for a loaded YAML lesson, delegating to the shared
// engine-ui LessonScreen (walks sections→beats, speaks each line, advances). Mirrors
// english/src/CourseLesson.jsx; uses Space's fact view renderer. Caption == the spoken
// line (narration map is the source of truth).
import LessonScreen from '@discoveryquest/engine-ui/LessonScreen';
import { renderLessonView } from './lessons/views.jsx';

export default function CourseLesson({ lesson, narration = {}, onDone, onClose }) {
  if (!lesson) { onDone?.(); return null; }
  const withCaptions = {
    ...lesson,
    sections: (lesson.sections || []).map((s) => ({
      ...s,
      beats: (s.beats || []).map((b) => ({ ...b, caption: narration[b.say] ?? b.caption })),
    })),
  };
  return <LessonScreen lesson={withCaptions} renderView={(view) => renderLessonView(view)} onDone={onDone} onClose={onClose} />;
}
