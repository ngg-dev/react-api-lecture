(() => {
  'use strict';

  const lecture = window.LECTURE;
  const article = document.getElementById('slide');
  const stage = document.getElementById('stage');
  const overview = document.getElementById('overview');
  const notesPanel = document.getElementById('notes-panel');
  const notesToggle = document.getElementById('notes-toggle');
  const fullscreenToggle = document.getElementById('fullscreen-toggle');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  let current = 0;
  let cleanupDemo = null;
  let lastNotesFocus = null;
  let lastOverviewFocus = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  if (!lecture || !Array.isArray(lecture.slides) || lecture.slides.length === 0) {
    article.append(el('h1', 'slide-title', 'Не удалось загрузить лекцию'), el('p', 'slide-lead', 'Обновите страницу или проверьте, что content.js находится рядом с index.html.'));
    previous.disabled = true;
    next.disabled = true;
    return;
  }

  const slides = lecture.slides;
  const chapters = lecture.chapters || [];
  const pad = (n) => String(n).padStart(2, '0');
  document.title = `${lecture.title || 'React и API'} — интерактивная лекция`;
  document.getElementById('slide-total').textContent = pad(slides.length);
  document.getElementById('lecture-progress').setAttribute('aria-valuemax', slides.length);

  function textItems(items, className = 'text-items') {
    const group = el('div', className);
    items.forEach((item) => {
      const block = el('section', 'text-item');
      if (item.title) block.append(el('h3', '', item.title));
      if (item.text) block.append(el('p', '', item.text));
      if (item.code) block.append(el('code', '', item.code));
      group.append(block);
    });
    return group;
  }

  function bullets(items) {
    const list = el('ul', 'bullet-list');
    items.forEach((item) => list.append(el('li', '', item)));
    return list;
  }

  // The lexer creates text nodes: lecture content never becomes executable markup.
  function syntaxLines(source) {
    const lines = [document.createDocumentFragment()];
    const expression = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|switch|throw|true|try|typeof|undefined|var|void|while|yield)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\s*\())/g;
    const append = (text, kind) => {
      const parts = text.split('\n');
      parts.forEach((part, index) => {
        if (index) lines.push(document.createDocumentFragment());
        if (part) lines[lines.length - 1].append(kind ? el('span', `token-${kind}`, part) : document.createTextNode(part));
      });
    };
    let cursor = 0;
    for (const match of source.matchAll(expression)) {
      append(source.slice(cursor, match.index));
      const value = match[0];
      const kind = value.startsWith('//') || value.startsWith('/*') ? 'comment' : /^['"`]/.test(value) ? 'string' : /^\d/.test(value) ? 'number' : /^(async|await|break|case|catch|class|const|continue|default|delete|do|else|export|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|switch|throw|true|try|typeof|undefined|var|void|while|yield)$/.test(value) ? 'keyword' : 'function';
      append(value, kind);
      cursor = match.index + value.length;
    }
    append(source.slice(cursor));
    return lines;
  }

  function codeBlock(code) {
    const wrapper = el('div', 'code-window');
    const header = el('div', 'code-heading');
    header.append(el('span', 'code-filename', code.file || 'JavaScript'));
    const copy = el('button', 'copy-code', 'Копировать');
    copy.type = 'button';
    copy.setAttribute('aria-label', `Копировать код ${code.file || ''}`.trim());
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.text || '');
        copy.textContent = 'Скопировано';
        document.getElementById('announcement').textContent = 'Код скопирован';
      } catch {
        copy.textContent = 'Выделите код';
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(pre);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
    header.append(copy);
    const pre = el('pre');
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', `Код ${code.file || 'JavaScript'}`);
    const content = el('code');
    const highlights = new Set(code.highlight || []);
    syntaxLines(String(code.text || '').replace(/\r\n/g, '\n').replace(/\n$/, '')).forEach((line, index) => {
      const span = el('span', `code-line${highlights.has(index + 1) ? ' highlighted' : ''}`);
      span.dataset.line = index + 1;
      span.append(line);
      content.append(span);
    });
    pre.append(content);
    wrapper.append(header, pre);
    return wrapper;
  }

  function flow(steps) {
    const group = el('ol', 'flow');
    steps.forEach((step, index) => {
      const item = el('li', 'flow-step');
      item.append(el('span', 'step-number', pad(index + 1)), el('h3', '', step.label));
      if (step.text) item.append(el('p', '', step.text));
      group.append(item);
    });
    return group;
  }

  function coverArtwork() {
    const art = el('div', 'cover-art');
    // Fixed, authored SVG depicts the lesson's concrete UI → HTTP → JSON cycle.
    art.innerHTML = `<svg viewBox="0 0 600 510" role="img" aria-label="Интерфейс отправляет HTTP-запрос к API и получает JSON с данными">
      <defs><pattern id="cover-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".85" fill="#cfd2c5" /></pattern><marker id="cover-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="#2348ff" stroke-width="1.4" /></marker></defs>
      <rect x="15" y="18" width="580" height="462" rx="24" fill="url(#cover-grid)" />
      <path d="M246 193h120q24 0 24 24v18" fill="none" stroke="#2348ff" stroke-width="2" marker-end="url(#cover-arrow)" />
      <path d="M467 326v66q0 21-21 21H326" fill="none" stroke="#2348ff" stroke-width="2" marker-end="url(#cover-arrow)" />
      <path d="M133 353v-85" fill="none" stroke="#2348ff" stroke-width="2" marker-end="url(#cover-arrow)" />
      <g transform="translate(38 67)"><rect x="5" y="7" width="232" height="213" rx="12" fill="#dee1d5" /><rect width="232" height="213" rx="12" fill="#fffef9" stroke="#c8ccbf" /><path d="M0 35h232" stroke="#d9dbd1" /><circle cx="18" cy="18" r="3" fill="#b9bdaf" /><circle cx="29" cy="18" r="3" fill="#b9bdaf" /><circle cx="40" cy="18" r="3" fill="#b9bdaf" /><text x="21" y="66" font-size="10" fill="#74766e" letter-spacing="1.8">REACT INTERFACE</text><text x="21" y="102" font-size="26" fill="#20221f" letter-spacing="-1">Каталог книг</text><rect x="21" y="121" width="190" height="33" rx="5" fill="#eef0e7" /><rect x="31" y="130" width="14" height="14" rx="3" fill="#2348ff" /><path d="M56 135h119M56 142h76" stroke="#aeb6a0" stroke-width="3" stroke-linecap="round" /><rect x="21" y="164" width="190" height="28" rx="5" fill="#eef0e7" /><rect x="31" y="171" width="14" height="14" rx="3" fill="#c8d0b9" /><path d="M56 178h94" stroke="#aeb6a0" stroke-width="3" stroke-linecap="round" /></g>
      <text x="288" y="178" font-size="10" fill="#2348ff" letter-spacing="1">HTTP · GET</text>
      <g transform="translate(363 228)"><rect x="6" y="6" width="167" height="104" rx="13" fill="#c6cef9" /><rect width="167" height="104" rx="13" fill="#2348ff" /><text x="22" y="34" fill="#bcc9ff" font-size="10" letter-spacing="1.6">SERVER</text><text x="21" y="80" fill="#ffffff" font-size="45" letter-spacing="-1">API</text><path d="M125 58h23m-8-8 8 8-8 8" stroke="#fff" stroke-width="2" fill="none" /></g>
      <text x="380" y="438" fill="#2348ff" font-size="10" letter-spacing="1">200 OK</text>
      <g transform="translate(62 351)"><rect x="4" y="6" width="251" height="100" rx="12" fill="#dee1d5" /><rect width="251" height="100" rx="12" fill="#fffef9" stroke="#c8ccbf" /><text x="19" y="25" fill="#74766e" font-size="10" letter-spacing="1.6">JSON RESPONSE</text><text x="18" y="65" fill="#2348ff" font-size="26" font-family="monospace">{</text><text x="42" y="61" fill="#20221f" font-size="12" font-family="monospace">"books": […]</text><text x="216" y="65" fill="#2348ff" font-size="26" font-family="monospace">}</text></g>
      <circle cx="555" cy="90" r="17" fill="#e8ecff" /><path d="m549 92 4 4 8-9" stroke="#2348ff" stroke-width="1.6" fill="none" /><text x="15" y="494" font-size="10" fill="#92978a" letter-spacing="1.3">REQUEST → RESPONSE → RENDER</text>
    </svg>`;
    return art;
  }

  function cover(slide) {
    const layout = el('div', 'cover-layout');
    const copy = el('div', 'cover-copy');
    copy.append(el('p', 'kicker', slide.kicker || 'От интерфейса к данным'));
    const title = el('h1', 'slide-title');
    title.id = 'slide-title';
    if ((slide.title || lecture.title) === 'React и API') {
      title.append(document.createTextNode('React и'), el('br'), el('span', 'cover-title-emphasis', 'API'));
    } else title.textContent = slide.title || lecture.title;
    copy.append(title);
    if (slide.lead || lecture.subtitle) copy.append(el('p', 'slide-lead', slide.lead || lecture.subtitle));
    const meta = el('div', 'cover-meta');
    meta.append(el('span', '', `${lecture.duration || 70} минут`), el('span', '', `${chapters.length} разделов`), el('span', '', 'Практика + теория'));
    copy.append(meta);
    const start = el('button', 'cover-start', 'Начать лекцию');
    start.type = 'button';
    const arrow = el('span', '', '→');
    arrow.setAttribute('aria-hidden', 'true');
    start.append(arrow);
    start.addEventListener('click', () => goTo(current + 1, true));
    copy.append(start);
    layout.append(copy, coverArtwork());
    article.append(layout);
  }

  function standard(slide) {
    const header = el('header', 'slide-header');
    if (slide.kicker) header.append(el('p', 'kicker', slide.kicker));
    const title = el('h1', 'slide-title', slide.title);
    title.id = 'slide-title';
    header.append(title);
    if (slide.lead) header.append(el('p', 'slide-lead', slide.lead));
    article.append(header);
    const body = el('div', 'slide-body');
    const hasBullets = slide.bullets && slide.bullets.length;
    const hasCards = slide.cards && slide.cards.length;
    const hasSteps = slide.steps && slide.steps.length;
    let calloutPlaced = false;

    if (slide.layout === 'demo') {
      const slot = el('div', 'demo-slot');
      slot.dataset.demo = slide.demo || '';
      body.append(slot);
      article.append(body);
      if (window.LectureDemos && typeof window.LectureDemos.mount === 'function') {
        try {
          const cleanup = window.LectureDemos.mount(slide.demo, slot);
          if (typeof cleanup === 'function') cleanupDemo = cleanup;
        } catch (error) {
          console.error('Не удалось запустить демонстрацию:', error);
          slot.replaceChildren(el('p', 'demo-unavailable', 'Демонстрация не загрузилась. Перейдите к следующему слайду или обновите страницу.'));
        }
      } else slot.append(el('p', 'demo-unavailable', 'Интерактивная демонстрация загружается из demos.js.'));
      if (hasBullets || hasCards || slide.callout || slide.code) {
        const details = el('details', 'demo-explanation');
        details.append(el('summary', '', 'Разбор демонстрации'));
        const explanation = el('div', 'demo-explanation-content');
        if (hasBullets) explanation.append(bullets(slide.bullets));
        if (hasCards) explanation.append(textItems(slide.cards));
        if (slide.code) explanation.append(codeBlock(slide.code));
        if (slide.callout) explanation.append(el('p', 'callout', slide.callout));
        details.append(explanation);
        body.append(details);
        calloutPlaced = true;
      }
    } else if (slide.layout === 'code' && slide.code) {
      const columns = el('div', 'code-layout');
      columns.append(codeBlock(slide.code));
      if (hasBullets || hasCards || hasSteps || slide.callout) {
        const aside = el('aside', 'code-aside');
        aside.setAttribute('aria-label', 'Пояснение к коду');
        if (hasBullets) aside.append(bullets(slide.bullets));
        if (hasCards) aside.append(textItems(slide.cards));
        if (hasSteps) aside.append(flow(slide.steps));
        if (slide.callout) aside.append(el('p', 'callout', slide.callout));
        columns.append(aside);
        columns.classList.add('has-aside');
        calloutPlaced = true;
      }
      body.append(columns);
      article.append(body);
    } else if (slide.layout === 'split') {
      const columns = el('div', 'body-columns');
      const left = el('div', 'body-text');
      if (hasBullets) left.append(bullets(slide.bullets));
      if (hasCards) left.append(textItems(slide.cards));
      if (hasSteps) left.append(flow(slide.steps));
      columns.append(left);
      if (slide.code) columns.append(codeBlock(slide.code));
      else if (hasCards && hasBullets) {
        // Split explanatory lists and cards into two balanced columns.
        left.replaceChildren(bullets(slide.bullets));
        columns.append(textItems(slide.cards));
      }
      body.append(columns);
      article.append(body);
    } else {
      if (slide.layout === 'compare' && hasCards) body.append(textItems(slide.cards, 'compare-grid'));
      else if (hasCards) body.append(textItems(slide.cards));
      if (hasSteps) body.append(flow(slide.steps));
      if (slide.code) body.append(codeBlock(slide.code));
      if (hasBullets) body.append(bullets(slide.bullets));
      article.append(body);
    }
    if (slide.callout && !calloutPlaced) article.append(el('p', 'callout', slide.callout));
  }

  function renderNotes(slide) {
    const container = document.getElementById('notes-content');
    container.replaceChildren(el('p', 'notes-slide-title', `${pad(current + 1)} / ${pad(slides.length)} · ${slide.title}`), el('p', 'notes-text', slide.notes || 'Для этого слайда дополнительных заметок нет.'));
    if (slide.sources && slide.sources.length) {
      const sources = el('div', 'notes-sources');
      sources.append(el('h3', '', 'Источники и документация'));
      slide.sources.forEach((source) => {
        try {
          const url = new URL(source.url);
          if (!['http:', 'https:'].includes(url.protocol)) return;
          const link = el('a', '', source.label || url.hostname);
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          sources.append(link);
        } catch { /* Ignore malformed source URLs. */ }
      });
      container.append(sources);
    }
    notesPanel.scrollTop = 0;
  }

  function fitCodeToStage() {
    if (slides[current].layout !== 'code' || window.innerWidth <= 760) {
      article.style.removeProperty('--code-available-height');
      return;
    }
    const style = getComputedStyle(article);
    const body = article.querySelector('.slide-body');
    const heading = article.querySelector('.code-heading');
    if (!body || !heading) return;
    const freeHeight = stage.clientHeight
      - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      - (article.querySelector('.slide-header')?.offsetHeight || 0)
      - parseFloat(getComputedStyle(body).marginTop)
      - heading.offsetHeight;
    article.style.setProperty('--code-available-height', `${Math.max(150, Math.floor(freeHeight))}px`);
  }

  function render(updateHash = true, focusSlide = false) {
    if (cleanupDemo) {
      try { cleanupDemo(); } catch (error) { console.error('Ошибка завершения демонстрации:', error); }
      cleanupDemo = null;
    }
    const slide = slides[current];
    article.replaceChildren();
    article.className = `slide layout-${['cover', 'split', 'code', 'flow', 'compare', 'demo', 'closing'].includes(slide.layout) ? slide.layout : 'split'}`;
    if (slide.layout === 'cover') cover(slide);
    else standard(slide);
    fitCodeToStage();
    stage.scrollTop = 0;
    article.classList.add('entering');
    const chapterIndex = chapters.findIndex((chapter) => chapter.id === slide.chapter);
    document.getElementById('chapter-label').textContent = chapters[chapterIndex]?.title || slide.kicker || 'React и API';
    document.getElementById('section-index').textContent = pad(Math.max(0, chapterIndex) + 1);
    document.getElementById('slide-number').textContent = pad(current + 1);
    const progress = document.getElementById('lecture-progress');
    progress.setAttribute('aria-valuenow', current + 1);
    progress.setAttribute('aria-valuetext', `Слайд ${current + 1} из ${slides.length}: ${slide.title}`);
    document.getElementById('progress-fill').style.width = `${((current + 1) / slides.length) * 100}%`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.querySelectorAll('[data-slide-index]').forEach((button) => {
      if (Number(button.dataset.slideIndex) === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    renderNotes(slide);
    if (updateHash) history.replaceState(null, '', `#${encodeURIComponent(slide.id || `slide-${current + 1}`)}`);
    document.getElementById('announcement').textContent = `Слайд ${current + 1} из ${slides.length}. ${slide.title}`;
    if (focusSlide) article.focus({ preventScroll: true });
  }

  function goTo(index, focusSlide = false) {
    const bounded = Math.min(Math.max(index, 0), slides.length - 1);
    if (bounded === current) return;
    current = bounded;
    render(true, focusSlide);
  }

  function indexFromHash() {
    try {
      const id = decodeURIComponent(location.hash.slice(1));
      const index = slides.findIndex((slide, i) => (slide.id || `slide-${i + 1}`) === id);
      return index >= 0 ? index : 0;
    } catch { return 0; }
  }

  function buildOverview() {
    const container = document.getElementById('chapter-list');
    document.getElementById('overview-meta').textContent = `${lecture.duration || 70} минут · ${chapters.length} разделов · ${slides.length} слайдов`;
    const groups = chapters.length ? chapters : [{ id: null, title: lecture.title || 'Лекция' }];
    groups.forEach((chapter, chapterIndex) => {
      const group = el('section', 'chapter-group');
      const heading = el('div', 'chapter-heading');
      heading.append(el('h3', '', `${pad(chapterIndex + 1)}  ${chapter.title}`));
      if (chapter.minutes) heading.append(el('span', '', `${chapter.minutes} мин`));
      group.append(heading);
      const items = el('div', 'chapter-slides');
      slides.forEach((slide, index) => {
        if (chapter.id !== null && slide.chapter !== chapter.id) return;
        const button = el('button');
        button.type = 'button';
        button.dataset.slideIndex = index;
        button.append(el('span', '', pad(index + 1)), document.createTextNode(slide.title));
        button.addEventListener('click', () => {
          closeOverview(false);
          goTo(index, true);
          article.focus({ preventScroll: true });
        });
        items.append(button);
      });
      group.append(items);
      container.append(group);
    });
  }

  function openOverview() {
    if (overview.open) return;
    lastOverviewFocus = document.activeElement;
    overview.showModal();
    const active = overview.querySelector('[aria-current="true"]');
    if (active) {
      active.focus({ preventScroll: true });
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  function closeOverview(restore = true) {
    overview.close();
    if (restore && lastOverviewFocus?.isConnected) lastOverviewFocus.focus({ preventScroll: true });
  }

  function toggleNotes(force) {
    const show = typeof force === 'boolean' ? force : notesPanel.hidden;
    notesPanel.hidden = !show;
    notesToggle.setAttribute('aria-pressed', String(show));
    notesToggle.setAttribute('aria-label', show ? 'Скрыть заметки докладчика' : 'Показать заметки докладчика');
    if (show) {
      lastNotesFocus = document.activeElement;
      document.getElementById('notes-close').focus({ preventScroll: true });
    } else if (lastNotesFocus?.isConnected) lastNotesFocus.focus({ preventScroll: true });
    else notesToggle.focus({ preventScroll: true });
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch {
      document.getElementById('announcement').textContent = 'Браузер не разрешил полноэкранный режим.';
    }
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  document.querySelector('.brand').addEventListener('click', (event) => { event.preventDefault(); goTo(0, true); });
  document.getElementById('overview-open').addEventListener('click', openOverview);
  document.getElementById('overview-close').addEventListener('click', () => closeOverview());
  overview.addEventListener('cancel', (event) => { event.preventDefault(); closeOverview(); });
  overview.addEventListener('click', (event) => {
    if (event.target !== overview) return;
    const box = overview.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeOverview();
  });
  notesToggle.addEventListener('click', () => toggleNotes());
  document.getElementById('notes-close').addEventListener('click', () => toggleNotes(false));
  fullscreenToggle.addEventListener('click', toggleFullscreen);
  if (!document.documentElement.requestFullscreen) fullscreenToggle.hidden = true;
  document.addEventListener('fullscreenchange', () => {
    const full = Boolean(document.fullscreenElement);
    fullscreenToggle.setAttribute('aria-pressed', String(full));
    fullscreenToggle.setAttribute('aria-label', full ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим');
  });
  window.addEventListener('hashchange', () => { current = indexFromHash(); render(false); });
  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fitCodeToStage);
  });
  window.addEventListener('pagehide', () => { if (cleanupDemo) cleanupDemo(); });
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || overview.open) return;
    if (event.key === 'Escape' && !notesPanel.hidden) { toggleNotes(false); return; }
    const target = event.target;
    if (target.closest('input, textarea, select, pre, code, [contenteditable="true"], [role="slider"], [role="tablist"]')) return;
    if (target.closest('.demo-slot') && target.closest('button, a, [tabindex]')) return;
    const actions = {
      ArrowLeft: () => goTo(current - 1),
      ArrowRight: () => goTo(current + 1),
      PageUp: () => goTo(current - 1),
      PageDown: () => goTo(current + 1),
      Home: () => goTo(0),
      End: () => goTo(slides.length - 1),
      o: openOverview,
      n: () => toggleNotes(),
      f: toggleFullscreen,
      щ: openOverview,
      т: () => toggleNotes(),
      а: toggleFullscreen,
    };
    const action = actions[event.key] || actions[event.key.toLowerCase()];
    if (action) { event.preventDefault(); action(); }
  });

  buildOverview();
  current = indexFromHash();
  render();
})();
