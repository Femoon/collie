import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AnsiOutput } from './ansi-output';
import { codexProseRows, codexProseScreen } from '../test/codex-prose';

it('keeps search highlights in the reflowed coordinate space, including across a former row boundary', () => {
  const { container, rerender } = render(<AnsiOutput text={codexProseScreen} agent="codex" query="提前买错" currentMatch={0} />);
  const current = [...container.querySelectorAll('[data-find-match="current"]')].map((el) => el.textContent).join('');
  expect(current).toBe('提前买错');
  expect(container.querySelector('pre')?.textContent).not.toContain('\n  旧配件');
  rerender(<AnsiOutput text={codexProseScreen} agent="codex" wrap={false} />);
  expect(container.querySelector('pre')?.textContent).toContain(codexProseRows.join('\n'));
});
it('keeps unknown/raw terminals verbatim', () => {
  const { container } = render(<AnsiOutput text={codexProseScreen} />);
  expect(container.querySelector('pre')?.textContent).toContain(codexProseRows.join('\n'));
});

it('keeps the explicit raw-terminal mode verbatim even with a Codex identity', () => {
  const { container } = render(<AnsiOutput text={codexProseScreen} agent="codex" grammars={false} />);
  expect(container.querySelector('pre')?.textContent).toContain(codexProseRows.join('\n'));
});
