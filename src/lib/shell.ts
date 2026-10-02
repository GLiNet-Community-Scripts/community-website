/*
 * Renders an install one-liner as terminal lines without soft wrapping.
 * Commands are split at top-level "&&" and ";", long lines at "|", and
 * arguments after the longest token (usually the URL) move to a "\"
 * continuation. Every displayed line stays valid shell; the copy button
 * still copies the original one-liner.
 */
const MAX = 72;

type Part = [text: string, sep: string];

function splitTop(cmd: string, seps: string[]): Part[] {
  const parts: Part[] = [];
  let cur = '';
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === '(') depth++;
    if (c === ')') depth = Math.max(0, depth - 1);
    const sep = depth
      ? undefined
      : seps.find(
          (s) => cmd.startsWith(s, i) && !(s === '|' && (cmd[i + 1] === '|' || cmd[i - 1] === '|')),
        );
    if (sep) {
      parts.push([cur.trim(), sep]);
      cur = '';
      i += sep.length - 1;
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push([cur.trim(), '']);
  return parts;
}

function foldTail([text, op]: Part): Part[] {
  if (text.length <= MAX) return [[text, op]];
  const tokens = splitTop(text, [' ']).map(([t]) => t);
  let longest = 0;
  tokens.forEach((t, i) => {
    if (t.length > tokens[longest].length) longest = i;
  });
  if (longest === tokens.length - 1) return [[text, op]];
  return [
    [tokens.slice(0, longest + 1).join(' '), '\\'],
    [tokens.slice(longest + 1).join(' '), op],
  ];
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** HTML for the <code> element of a terminal block. */
export function shellLines(cmd: string, prompt: string): string {
  const out: string[] = [];
  let cont = false;
  for (const [text, op] of splitTop(cmd, ['&&', ';'])) {
    const pieces = (text.length > MAX ? splitTop(text, ['|']) : [[text, ''] as Part]).flatMap(foldTail);
    pieces.forEach(([piece, sep], j) => {
      const last = j === pieces.length - 1;
      const tail = sep === '|' || sep === '\\' ? ` ${sep}` : last && op === '&&' ? ' &&' : '';
      const lead = !cont && j === 0 ? `${prompt} ` : '  ';
      // Placeholders such as <YOURNUMBER> get highlighted.
      const body = escapeHtml(piece).replace(/&lt;[A-Za-z_-]+&gt;/g, (m) => `<mark>${m}</mark>`);
      out.push(`<span class="ps">${lead}</span>${body}${tail}`);
    });
    cont = op === '&&';
  }
  return out.join('\n');
}

export const hasPlaceholder = (cmd: string) => /<[A-Za-z_-]+>/.test(cmd);
