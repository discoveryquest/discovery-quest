// CourseLesson — a thin, course-driven host for a loaded YAML lesson. It plays one
// `course.lessonsById[id]` Lesson by delegating to the shared @discoveryquest/engine-ui
// LessonScreen, which already walks sections→beats, speaks each beat's line (by clip
// key) and advances when the narration finishes. We only adapt the loaded shape:
//
//   lesson = { title, sections: [ { id, label, beats: [ { say, caption?, view } ] } ] }
//   narration: { <say-key>: <display text> }   — the spoken line as readable caption
//
// A beat's `say` is the clip KEY (LessonScreen passes it to speak() → /voice/<v>/<say>.mp3),
// and `narration[say]` is the matching text we surface as the on-screen caption. We thread
// the course `lowercase` flag into renderLessonView so EFL lesson text keeps its casing —
// without it, letters/words render capitalized (a regression).
import LessonScreen from '@discoveryquest/engine-ui/LessonScreen';
import { renderLessonView } from './lessons/views.jsx';

export default function CourseLesson({ lesson, narration = {}, lowercase = false, onDone }) {
  if (!lesson) {
    onDone?.();
    return null;
  }
  // Caption == the spoken line: prefer the narration map (the source of truth for
  // text), falling back to any caption baked into the beat.
  const withCaptions = {
    ...lesson,
    sections: (lesson.sections || []).map((s) => ({
      ...s,
      beats: (s.beats || []).map((b) => ({ ...b, caption: narration[b.say] ?? b.caption })),
    })),
  };

  return (
    <LessonScreen
      lesson={withCaptions}
      renderView={(view) => renderLessonView(view, lowercase)}
      onDone={onDone}
    />
  );
}
