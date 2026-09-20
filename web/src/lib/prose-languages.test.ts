import { expect, it } from 'vitest';
import { parseAnsi } from './ansi';
import { lineText, splitLines } from './blocks';
import { reflowProse } from './prose-wrap';
import { displayWidth } from './text-width';
import { proseLanguageCases } from '../test/prose-languages';

it.each(proseLanguageCases)('$name preserves the intended language boundary', ({ left, right, gap, join }) => {
  const input = `${left}\n${right}`;
  const result = reflowProse([{ kind: 'raw', lines: splitLines(parseAnsi(input)) }], displayWidth(left) + gap);
  const expected = join === null ? input : left + join + right.slice(2);
  expect(result[0]?.lines.map(lineText).join('\n')).toBe(expected);
});
