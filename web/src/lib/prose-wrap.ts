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
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}，。；：！？、]/u;

function prose(line: StyledLine): string | null {
  const text = GUTTER.exec(lineText(line).trimEnd())?.[1];
  if (!text || line.noWrap || STRUCTURE.test(text)) return null;
  if (line.segments.some((s) => s.bg !== undefined || (s.dim && s.text.trim() !== '•' && s.text.trim() !== ''))) return null;
  // Default/bold prose stays styled. Coloured syntax is ambiguous and stays verbatim.
  if (line.segments.some((segment) => segment.fg !== undefined && segment.text.trim() !== "" && segment.text.trim() !== "•")) return null;
  if (/^[\w$.]+\s*\(/u.test(text)) return null;
  if (!CJK.test(text) && !/^[\p{L}][\p{L}\p{N} ,.'’!?():/–—%-]*$/u.test(text)) return null;
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

function joiner(left: string, right: string): string {
  return CJK.test([...left].at(-1) ?? '') || CJK.test([...right][0] ?? '') ? '' : ' ';
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
      const firstWord = body?.match(/^[\p{L}\p{N}'’]+/u)?.[0] ?? '';
      const nextWidth = CJK.test(firstWord[0] ?? '') ? 2 : displayWidth(firstWord) + 1;
      const width = previous === undefined ? 0 : displayWidth(lineText(previous).trimEnd());
      const canJoin = i > 0 && body !== null && before !== null &&
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
      const separator = joiner(before, body);
      if (separator !== '') head.push({ text: separator, style: {}, muted: false });
      head.push(...tail);
      joined = { ...last, segments: head };
      output[output.length - 1] = joined;
      changed = true;
    }
    return changed ? { ...block, lines: output } : block;
  });
}
