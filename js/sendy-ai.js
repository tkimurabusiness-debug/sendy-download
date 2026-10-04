/* AIには製品説明だけを渡す。Sendyの会話や認証情報は読み取らない。 */
(() => {
  'use strict';
  const widget = document.getElementById('sendy-ai');
  if (!widget) return;
  const toggle = widget.querySelector('.sendy-ai-toggle');
  const panel = widget.querySelector('.sendy-ai-panel');
  const status = widget.querySelector('.sendy-ai-status');
  const manual = widget.querySelector('.sendy-ai-manual');
  const textarea = widget.querySelector('textarea');
  const providers = [...widget.querySelectorAll('[data-ai-provider]')];
  widget.dataset.ready = 'true';
  const publicRoot = 'https://tkimurabusiness-debug.github.io/sendy-download/';
  // 未公開のlocalhostのURLを外部AIへ渡さない。公開済みの機械可読ページを使う。
  const guideURL = location.origin === 'https://tkimurabusiness-debug.github.io'
    && location.pathname.startsWith('/sendy-download/')
    ? publicRoot + 'ai.html' : publicRoot + 'llms.txt';
  const prompt = `Sendyの解説を読み、私に合う使い方を日本語で教えてください。\n${guideURL}\n\n私について既に分かっていることを使い、不明なら仕事・よく使う連絡先・返信で困っていることを聞いてください。役立つ使い方を3つ、具体的な手順と一緒に提案してください。\n\nページを読めない場合の要点：SendyはMacの統合メッセージアプリ。Messenger・LINE・Instagram・LinkedIn・Chatwork・Gmail・Outlook・iCloudメールを読み書きでき、Slack・Discordは元のWeb画面を開きます。複数アカウント、フォルダ、未返信の絞り込み、定型文、予約送信、文体と相手の背景を踏まえたAI返信案、Googleカレンダーによる日程提案、Gemini・ChatGPT/Codex・Claude/Claude Codeを返信案と相談に使う接続先選択の実装、音声入力、文章の整形、会話からのAI相談、会話・添付の書き出し、履歴復元、通知設定、最近のファイル、ショートカット、自動更新、同じWi-Fiのスマホブラウザがあります。既読は読むだけでは付かず、返信送信時が初期設定です。MCP対応クライアントから会話の一覧・本文・参加者・検索を扱え、send_replyは承認待ちの下書きを積み、送信は人が承認します。MCPに接続したAIエージェントならLINEを含む連絡の要約、タスク抽出、返信案作成を秘書のように頼めます。この説明リンクだけでは会話に接続されません。LINE着信通話は実装あり・配布版の実通話は確認中です。「史上初」と断定しないでください。未確認・未対応の機能を使えると言わないでください。`;
  textarea.value = prompt;
  const urls = {
    chatgpt: 'https://chatgpt.com/?q=' + encodeURIComponent(prompt),
    claude: 'https://claude.ai/new?q=' + encodeURIComponent(prompt),
    grok: 'https://grok.com/?q=' + encodeURIComponent(prompt),
    'claude-desktop': 'claude://claude.ai/new?q=' + encodeURIComponent(prompt),
  };
  for (const link of providers) link.href = urls[link.dataset.aiProvider];
  let closeTimer;
  let opened = false;
  const focusables = () => [...panel.querySelectorAll('a,button,textarea')]
    .filter(el => !el.closest('[hidden]'));
  function setOpen(next, focus = false) {
    clearTimeout(closeTimer);
    opened = next;
    toggle.setAttribute('aria-expanded', String(next));
    if (next) {
      panel.hidden = false;
      panel.inert = false;
      // openingからEscapeまでに残ったframeが再びpanelを開かないよう状態を確認する。
      requestAnimationFrame(() => { if (opened) panel.classList.add('is-open'); });
      if (focus) focusables()[0]?.focus();
    } else {
      panel.classList.remove('is-open');
      panel.inert = true;
      closeTimer = setTimeout(() => { panel.hidden = true; },
        matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
      if (focus) toggle.focus();
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      manual.hidden = true;
      status.textContent = '説明をコピーしました　入力欄が空なら貼り付けてください';
    } catch {
      manual.hidden = false;
      status.textContent = '説明文を選択してコピーできます';
      textarea.focus();
      textarea.select();
    }
  }
  toggle.addEventListener('click', () => setOpen(!opened));
  toggle.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true, true);
    }
  });
  widget.querySelector('[data-ai-copy]').addEventListener('click', copyPrompt);
  // navigationはnative anchorのクリックで同期的に行う。clipboardを待ってpopupを開かない。
  for (const link of providers) link.addEventListener('click', () => { void copyPrompt(); });
  panel.addEventListener('keydown', event => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key) || event.target === textarea) return;
    const items = focusables();
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    event.preventDefault();
    items[next]?.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opened) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (opened && !widget.contains(event.target)) setOpen(false);
  });
  widget.addEventListener('focusout', () => {
    setTimeout(() => { if (opened && !widget.contains(document.activeElement)) setOpen(false); }, 0);
  });
})();
