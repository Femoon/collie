import { expect, test } from '@playwright/test';
import { fixtureSnapshot } from '@/test/handlers';
import { proseLanguageCases } from '@/test/prose-languages';
import { displayWidth } from '@/lib/text-width';
import { installApiStub } from './fixtures/api';

for (const sample of proseLanguageCases) {
  for (const wrap of [true, false]) {
    test(`${sample.name}: wrap ${wrap ? 'on' : 'off'} preserves text boundaries`, async ({ page }, testInfo) => {
      const { left, right, gap, join } = sample;
      const text = [left, right, '', '─'.repeat(displayWidth(left) + gap), '',
        '› Ask Codex to do anything', '', '  gpt-6 · ~/x · Context 1% used'].join('\n');
      await installApiStub(page);
      await page.addInitScript((enabled) => {
        localStorage.setItem('collie:display-prefs:v4', JSON.stringify({ wrap: enabled, fontSize: 14 }));
      }, wrap);
      await page.route('**/api/snapshot', (route) => route.fulfill({ json: {
        ...fixtureSnapshot,
        agents: fixtureSnapshot.agents.map((agent) => Object.assign({}, agent, { agent: 'codex', status: 'idle' })),
      } }));
      await page.route(/\/api\/pane\/w1%3Ap1(?:\?.*)?$/, (route) => route.fulfill({ json: {
        paneId: 'w1:p1', text, truncated: false, revision: 1,
      } }));
      await page.goto('/pane/w1:p1');
      const first = page.getByText(left, { exact: true });
      await expect(first).toBeVisible();
      const actual = await first.evaluate((el) => ({
        text: el.closest('pre')?.textContent,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
      const expected = wrap && join !== null ? left + join + right.slice(2) : `${left}\n${right}`;
      expect(actual.text).toContain(expected);
      expect(actual.overflow).toBe(false);
      await expect(page.getByRole('textbox')).toBeVisible();
      if (wrap) await page.screenshot({ path: testInfo.outputPath('language.png') });
    });
  }
}
