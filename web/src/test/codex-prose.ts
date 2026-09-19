// Three physical rows from the reported Herdr/Codex capture (104 terminal columns).
export const codexProseRows = [
  '• 本轮在 249.6 秒时达到原定 60 个控制循环上限，验收通过 7/13。商品已选对：两台 Work 16、两个 Work Dock，',
  '  旧配件已移除，数量已保存，合计 1,856 美元，并进入了结账页；但还没完成结账选项和保存草稿。这次没有提前',
  '  买错商品，主要开销转成了频繁的证据检查点和重复导航。',
];
export const codexProseScreen = [
  ...codexProseRows,
  '',
  '  A separate paragraph must stay separate.',
  '',
  '  | Name | Result |',
  '  | --- | --- |',
  '  | work | done |',
  '',
  '  │ import json',
  '  │ print(result)',
  '',
  '─'.repeat(104),
  '',
  '› Ask Codex to do anything',
  '',
  '  gpt-6-astra medium · ~/Project/chat · Context 42% used',
].join('\n');
