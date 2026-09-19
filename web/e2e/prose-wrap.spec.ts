import { expect, test } from '@playwright/test';
import { fixtureSnapshot } from '@/test/handlers';
import { codexProseRows, codexProseScreen } from '@/test/codex-prose';
import { installApiStub } from './fixtures/api';

for (const wrap of [true, false]) {
  test(`Codex prose uses ${wrap ? 'phone paragraphs' : 'terminal rows'}`, async ({ page }, testInfo) => {
    await installApiStub(page);
    await page.addInitScript((value) => {
      localStorage.setItem('collie:display-prefs:v4', JSON.stringify({ wrap: value, fontSize: 14 }));
    }, wrap);
    await page.route('**/api/snapshot', (route) => route.fulfill({ json: {
      ...fixtureSnapshot,
      agents: fixtureSnapshot.agents.map((agent) => Object.assign({}, agent, { agent: 'codex', status: 'idle' })),
    } }));
    await page.route(/\/api\/pane\/w1%3Ap1(?:\?.*)?$/, (route) => route.fulfill({ json: {
      paneId: 'w1:p1', text: codexProseScreen, truncated: false, revision: 1,
    } }));
    await page.goto('/pane/w1:p1');
    const first = page.getByText(codexProseRows[0]!, { exact: true });
    await expect(first).toBeAttached();
    const mirror = await first.evaluate((el) => {
      const pre = el.closest('pre');
      return { text: pre?.textContent, width: pre?.getBoundingClientRect().width,
        viewport: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    const paragraph = wrap ? codexProseRows.map((row, i) => i ? row.slice(2) : row).join('') : codexProseRows.join('\n');
    expect(mirror.text).toContain(paragraph);
    expect(mirror.text).toContain('\n\n  A separate paragraph must stay separate.');
    expect(mirror.text).toContain('  │ import json\n  │ print(result)');
    expect(mirror.text).toContain('  | Name | Result |\n  | --- | --- |\n  | work | done |');
    expect(mirror.pageOverflow).toBe(false);
    expect(mirror.width).toBeLessThanOrEqual(mirror.viewport);
    await page.getByRole('textbox').fill('Keep the native Collie composer usable');
    await expect(page.getByRole('textbox')).toHaveValue('Keep the native Collie composer usable');
    await first.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('prose-wrap.png') });
  });
}
