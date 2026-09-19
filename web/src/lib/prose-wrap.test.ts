import { describe, expect, it } from 'vitest';
import { parseAnsi } from './ansi';
import { lineText, splitLines, type RawBlock } from './blocks';
import { reflowProse } from './prose-wrap';
import { codexProseRows } from '../test/codex-prose';

function blocks(text: string): RawBlock[] {
  return [{ kind: 'raw', lines: splitLines(parseAnsi(text)) }];
}
const text = (rows: RawBlock[]) => rows.flatMap((b) => b.lines.map(lineText)).join('\n');
describe('display-only Codex prose reflow', () => {
  it('joins the reported physical rows without spaces inside Chinese words', () => {
    const input = blocks(codexProseRows.join('\n'));
    expect(text(reflowProse(input, 104))).toBe(codexProseRows.map((row, i) => i ? row.slice(2) : row).join(''));
    expect(text(input)).toBe(codexProseRows.join('\n'));
  });
  it('keeps word separation and ANSI styles in English', () => {
    const input = blocks('• This paragraph ends with a long phrase\n  \x1b[1mcontinued\x1b[0m on the next physical row.');
    const out = reflowProse(input, 42);
    expect(text(out)).toBe('• This paragraph ends with a long phrase continued on the next physical row.');
    expect(out[0]?.lines[0]?.segments.find((s) => s.text === 'continued')?.bold).toBe(true);
  });
  it.each([
    '  | This is a long table column heading | Other |\n  | --- | --- |\n  | one | two |',
    '  │ This is a long tool output line reaching the terminal edge\n  │ More output',
    '  const response = await fetch(longResourceName);\n  return response;',
    '  This is a short deliberate line.\n  Another independent line.',
    '  Here is a whole paragraph that reaches the terminal edge\n\n  A new paragraph.',
    '• Here is a whole paragraph that reaches the terminal edge\n  - A separate list item.',
    '  ```text\n  This paragraph ends with a long phrase\n  continued on the next physical row.\n  ```',
  ])('preserves structural and ambiguous lines: %s', (screen) => {
    expect(text(reflowProse(blocks(screen), 42))).toBe(screen);
  });
  it('does not join across raw block boundaries', () => {
    const input = [...blocks(codexProseRows[0]!), ...blocks(codexProseRows[1]!)];
    expect(text(reflowProse(input, 104))).toBe(text(input));
  });
});
