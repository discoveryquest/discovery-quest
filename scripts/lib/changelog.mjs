// Pure transform: raw git commits -> display-ready changelog entries.
// No git, no fs — unit-testable in isolation.

const EXCLUDED = new Set(['chore', 'docs', 'refactor', 'test', 'build', 'ci', 'style']);
const KIND_BY_TYPE = { feat: 'new', fix: 'fix' };
// `type(optional scope): description`
const CONVENTIONAL = /^(\w+)(?:\([^)]*\))?:\s*(.+)$/;

/**
 * @param {{sha:string,date:string,subject:string}[]} commits  newest-first
 * @param {{repoUrl:string, limit?:number}} opts
 * @returns {{date,kind,text,sha,url}[]}
 */
export function commitsToChangelog(commits, { repoUrl, limit = 20 }) {
  const out = [];
  for (const { sha, date, subject } of commits) {
    const m = CONVENTIONAL.exec(subject.trim());
    let kind = 'update';
    let text = subject.trim();
    if (m) {
      const type = m[1].toLowerCase();
      if (EXCLUDED.has(type)) continue;
      kind = KIND_BY_TYPE[type] || 'update';
      text = m[2].trim();
    }
    out.push({ date, kind, text, sha, url: `${repoUrl}/commit/${sha}` });
    if (out.length >= limit) break;
  }
  return out;
}
