// Logic Quest — the live course, loaded from its validated YAML at build time. Single
// source of truth for worlds/stations/lessons/narration; parsed (js-yaml) and joined with
// the BOARD_REGISTRY by the subject-agnostic loader. The map + Course* hosts read `course`;
// authoring a world/lesson is a YAML edit, not a code change. Mirrors english/src/course.js.
import raw from '../logic.course.yml?raw';
import yaml from 'js-yaml';
import { loadCourse } from '@discoveryquest/course-loader';
import { BOARD_REGISTRY } from './boardRegistry.js';

export const course = loadCourse(yaml.load(raw), BOARD_REGISTRY);
