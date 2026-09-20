import type { AnsiSegment } from './ansi';
import { lineText, type RawBlock, type StyledLine } from './blocks';
import { tableRuns } from './table-run';
import { displayWidth } from './text-width';

// Render-only recovery of Codex's hard-wrapped prose. A grid has no paragraph
// metadata, so ambiguous rows stay verbatim: require its two-column prose gutter,
// prose text, and a preceding row close enough to the terminal edge that the next
// word could not fit. Never feed these lines to a detector or a send guard.
const GUTTER = /^(?:• |  )(\S.*)$/u;
const STRUCTURE = /[│┃┌┐└┘├┤┬┴┼─━═|\t{}]| {2}|^[#>*+\-`~\d]|(?:=>|:=| = )/u;
// Character width is not a word-spacing policy: Hangul is wide but Korean uses
// spaces. Only Han/kana boundaries can be joined without one. Other scripts must
// be opted in with evidence; e.g. Thai needs word segmentation and RTL needs its
// own browser checks, so preserving their physical lines is the safe fallback.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー，。；：！？、]/u;
const SUPPORTED_LETTER = /[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;

function prose(line: StyledLine): string | null {
  const text = GUTTER.exec(lineText(line).trimEnd())?.[1];
  if (!text || line.noWrap || STRUCTURE.test(text)) return null;
  if (line.segments.some((s) => s.bg !== undefined || (s.dim && s.text.trim() !== '•' && s.text.trim() !== ''))) return null;
  // Default/bold prose stays styled. Coloured syntax is ambiguous and stays verbatim.
  if (line.segments.some((segment) => segment.fg !== undefined && segment.text.trim() !== "" && segment.text.trim() !== "•")) return null;
  if (/^[\w$.]+\s*\(/u.test(text)) return null;
  if ([...text].some((character) => /\p{L}/u.test(character) && !SUPPORTED_LETTER.test(character))) return null;
  if (!UNSPACED.test(text) && !/^[\p{L}][\p{L}\p{M}\p{N} ,.'’!?():/–—%-]*$/u.test(text)) return null;
  return text;
}

function sliceSegments(line: StyledLine, start: number, end: number): AnsiSegment[] {
  const out: AnsiSegment[] = [];
  let offset = 0;
  for (const segment of line.segments) {
    const from = Math.max(0, start - offset);
    const to = Math.min(segment.text.length, end - offset);
    if (to > from) out.push({ ...segment, text: segment.text.slice(from, to) });
    offset += segment.text.length;
  }
  return out;
}

function joiner(left: string, right: string, gap: number): string | null {
  const end = [...left].at(-1) ?? '';
  const start = [...right][0] ?? '';
  const leftUnspaced = UNSPACED.test(end);
  const rightUnspaced = UNSPACED.test(start);
  if (leftUnspaced && rightUnspaced) return '';
  // A mixed-script boundary may carry an intentional space. The grid cannot
  // recover it, nor tell a split word from two words when the next character could not fit.
  if (leftUnspaced || rightUnspaced || /[-\u00ad]$/u.test(left)) return null;
  if (gap < displayWidth(start) && /[\p{L}\p{M}\p{N}]/u.test(end) && /[\p{L}\p{M}\p{N}]/u.test(start)) return null;
  return ' ';
}

/** Width is measured before chrome removal: full-width rules/padding are useful evidence. */
export function terminalColumns(lines: StyledLine[]): number {
  return lines.reduce((width, line) => Math.max(width, displayWidth(lineText(line))), 0);
}

export function reflowProse(blocks: RawBlock[], columns: number): RawBlock[] {
  if (columns < 40) return blocks;
  return blocks.map((block) => {
    const protectedRows = new Set<number>();
    for (const run of tableRuns(block.lines)) {
      for (let i = run.start; i <= run.end; i++) protectedRows.add(i);
    }
    let fence: string | undefined;
    for (let i = 0; i < block.lines.length; i++) {
      const marker = /^\s*(`{3,}|~{3,})/.exec(lineText(block.lines[i]!))?.[1];
      if (fence !== undefined || marker !== undefined) protectedRows.add(i);
      if (marker !== undefined) {
        if (fence === undefined) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      }
    }
    const output: StyledLine[] = [];
    let changed = false;
    let joined: StyledLine | undefined;
    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i]!;
      const previous = block.lines[i - 1];
      const body = prose(line);
      const before = previous === undefined ? null : prose(previous);
      const firstWord = body?.match(/^[\p{L}\p{M}\p{N}'’]+/u)?.[0] ?? '';
      const nextWidth = UNSPACED.test(firstWord[0] ?? '') ? 2 : displayWidth(firstWord) + 1;
      const width = previous === undefined ? 0 : displayWidth(lineText(previous).trimEnd());
      const separator = before !== null && body !== null ? joiner(before, body, columns - width) : null;
      const canJoin = separator !== null && i > 0 && body !== null && before !== null &&
        lineText(line).startsWith('  ') && !protectedRows.has(i) && !protectedRows.has(i - 1) &&
        width >= columns * 0.75 && columns - width < Math.max(3, nextWidth);
      if (!canJoin) {
        joined = undefined;
        output.push(line);
        continue;
      }
      const last = output[output.length - 1]!;
      const head = joined?.segments ?? sliceSegments(last, 0, lineText(last).trimEnd().length);
      const tail = sliceSegments(line, 2, lineText(line).trimEnd().length);
      if (separator !== '') head.push({ text: separator, style: {}, muted: false });
      head.push(...tail);
      joined = { ...last, segments: head };
      output[output.length - 1] = joined;
      changed = true;
    }
    return changed ? { ...block, lines: output } : block;
  });
}
