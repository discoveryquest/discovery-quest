// English Quest — the live course, loaded from its validated YAML at build time. This is the
// single source of truth for worlds/stations/lessons/narration/reactions: the vendored
// english.course.yml is parsed (js-yaml) and joined with the english BOARD_REGISTRY by the
// subject-agnostic loader. App.jsx + the Course* hosts read `course` and nothing bespoke —
// authoring a world/lesson is a YAML edit, not a code change.
import raw from '../english.course.yml?raw';
import yaml from 'js-yaml';
import { loadCourse } from '@discoveryquest/course-loader';
import { BOARD_REGISTRY } from './boardRegistry.js';

export const course = loadCourse(yaml.load(raw), BOARD_REGISTRY);
