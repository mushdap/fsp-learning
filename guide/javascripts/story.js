/* The company story — chapter pages generated from story/*.yml.
   Drives: the scroll scenes, the case file (cumulative across chapters), the
   chapter rail, and the slide from one chapter to the next (scroll past the
   end, swipe sideways, arrow keys, or click).
   Material's instant navigation swaps pages without a reload, so everything
   re-initialises on each document$ emission and cleans up after itself. */
(function () {
  const PULL_NEEDED = 520;       // px of extra wheel/touch at the bottom to turn the page
  const VISITED_KEY = 'fsp-v1-story-visited';
  const ENTER_KEY = 'fsp-v1-story-enter';
  const MODE_KEY = 'fsp-v1-read-mode'; // Explicit preference shared by every chapter.
  // Reading stages describe learning progress, never clinical certainty.
  const FILE_STATUSES = {
    'Open': { de: 'Offen', tone: 'muted' },
    'Collecting facts': { de: 'Informationen sammeln', tone: 'info' },
    'Checking details': { de: 'Details prüfen', tone: 'info' },
    'Planning the next step': { de: 'Nächsten Schritt planen', tone: 'warn' },
    'Ready to practise': { de: 'Bereit zum Üben', tone: 'ok' },
  };
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // One-shot marker: full screen crossing a chapter hop, and nothing else.
  const HOP_FULLSCREEN = {
    arm() { try { sessionStorage.setItem('fsp-v1-story-fullscreen', '1'); } catch (e) {} },
    take() {
      try {
        const on = sessionStorage.getItem('fsp-v1-story-fullscreen') === '1';
        sessionStorage.removeItem('fsp-v1-story-fullscreen');
        return on;
      } catch (e) { return false; }
    },
  };

  function init() {
    if (window.__stoCleanup) { window.__stoCleanup(); window.__stoCleanup = null; }
    const story = document.querySelector('.story');
    if (!story) return;
    story.classList.add('st-js');

    const off = [];
    const on = (el, ev, fn, opts) => { el.addEventListener(ev, fn, opts); off.push(() => el.removeEventListener(ev, fn, opts)); };

    const chapterId = story.dataset.chapter;
    const firstStage = Number(story.dataset.firstStage);
    const target = Number(story.dataset.target);
    const defaultLabel = story.dataset.headlineLabel;
    let timeline = [];
    try { timeline = JSON.parse(story.dataset.timeline || '[]'); } catch (e) {}

    const marks = [...story.querySelectorAll('[data-stage]')].filter((m) => !m.classList.contains('st-scrolly'));
    const file = story.querySelector('.st-file[data-live]');   // The company story only
    const fillables = file ? [...file.querySelectorAll('[data-at]')] : [];
    const headline = file && file.querySelector('[data-headline]');
    const headlineLabel = file && file.querySelector('[data-headline-label]');
    const headlineBar = file && file.querySelector('[data-headline-bar]');
    const status = file && file.querySelector('[data-file-status]');
    const announcement = file && file.querySelector('[data-file-announcement]');
    const badge = file && file.querySelector('[data-file-badge]');
    const patientFacts = file ? [...file.querySelectorAll('[data-patient-fact]')] : [];
    const factSummary = file && file.querySelector('[data-fact-summary]');
    const factBreakdown = file && file.querySelector('[data-fact-breakdown]');
    const factMeter = file && file.querySelector('[data-fact-meter]');
    const factMeterFill = file && file.querySelector('[data-fact-meter-fill]');
    let patientStage = -1;
    const FACT_STATES = {
      reported: ['Patient report', 'Patientenangabe'],
      confirmed: ['Patient confirmed', 'Vom Patienten bestätigt'],
      unknown: ['Not known', 'Unbekannt'],
      not_asked: ['Not asked yet', 'Noch nicht erfragt'],
      planned: ['Planned / instructed', 'Geplant / angewiesen'],
    };
    function renderPatientFacts(stage) {
      patientStage = stage;
      let changed = 0;
      const counts = { recorded: 0, unknown: 0, notAsked: 0, planned: 0, later: 0 };
      const lang = german() ? 'de' : 'en';
      patientFacts.forEach(card => {
        let events = [];
        try { events = JSON.parse(card.dataset.patientFact); } catch (_) {}
        const reached = events.filter(event => event.stage <= stage);
        const event = reached[reached.length - 1];
        if (!event) counts.later++;
        else if (event.state === 'unknown') counts.unknown++;
        else if (event.state === 'not_asked') counts.notAsked++;
        else if (event.state === 'planned') counts.planned++;
        else counts.recorded++;
        const eventKey = event ? event.key : '';
        if (card.dataset.activeFactKey !== eventKey) changed++;
        card.dataset.activeFactKey = eventKey;
        const state = card.querySelector('[data-fact-state]');
        state.textContent = event ? (FACT_STATES[event.state] || FACT_STATES.unknown)[german() ? 1 : 0]
          : (german() ? 'Noch nicht erreicht' : 'Not reached');
        state.dataset.state = event ? event.state : 'unreached';
        card.querySelector('[data-fact-value]').textContent = event ? event.value[lang]
          : (german() ? 'Diese Angabe folgt später im Gespräch. Dies bedeutet nicht „nein“.' : 'This entry comes later in the conversation. This does not mean “no”.');
        const sourceChip = card.querySelector('[data-fact-source]');
        sourceChip.textContent = event ? (german() ? 'Quelle: ' : 'Source: ') + event.source[lang] : '';
        sourceChip.hidden = !event;
        const evidence = card.querySelector('[data-fact-evidence]');
        const quote = card.querySelector('[data-fact-quote]');
        if (evidence && quote) {
          const text = event && event.evidence && event.evidence[lang];
          evidence.hidden = !text;
          quote.textContent = text || '';
          quote.setAttribute('lang', lang);
          // A different source starts closed; rewinding never retains a later quote.
          if (!text || evidence.dataset.eventKey !== eventKey) evidence.open = false;
          evidence.dataset.eventKey = eventKey;
        }
        const history = card.querySelector('[data-fact-history]');
        history.hidden = reached.length < 2;
        card.querySelector('[data-fact-previous]').textContent = reached.slice(0,-1).map(old => old.value[lang] + ' (' + old.source[lang] + ')').join(' → ');
        if (reached.length < 2) history.open = false;
      });
      const open = counts.unknown + counts.notAsked + counts.planned;
      const summary = german()
        ? `${counts.recorded} erfasst · ${open} offen · ${counts.later} später`
        : `${counts.recorded} recorded · ${open} open · ${counts.later} later`;
      if (factSummary) factSummary.textContent = summary;
      if (factBreakdown) factBreakdown.textContent = german()
        ? `Offen: ${counts.unknown} unbekannt · ${counts.notAsked} nicht erfragt · ${counts.planned} nur geplant`
        : `Open: ${counts.unknown} unknown · ${counts.notAsked} not asked · ${counts.planned} planned only`;
      if (factMeter) factMeter.setAttribute('aria-label', summary);
      if (factMeterFill) factMeterFill.style.width = (patientFacts.length ? counts.recorded / patientFacts.length * 100 : 0) + '%';
      return changed;
    }

    let announcementsReady = false;
    let unread = 0, activeStatus = 'Open', lastLanguage = null;
    const german = () => document.documentElement.lang === 'de';
    function renderFileStatus() {
      if (!status) return;
      const entry = FILE_STATUSES[activeStatus] || { de: activeStatus, tone: 'muted' };
      status.textContent = german() ? entry.de : activeStatus;
      status.dataset.tone = entry.tone;
      if (badge) {
        badge.hidden = !unread;
        badge.textContent = '+' + unread;
        badge.setAttribute('aria-label', german() ? `${unread} Aktualisierungen` : `${unread} updates`);
      }
    }
    if (file && window.MutationObserver) {
      const languageObserver = new MutationObserver(() => {
        const lang = document.documentElement.lang;
        if (lang !== lastLanguage) { lastLanguage = lang; renderFileStatus(); renderPatientFacts(patientStage); }
      });
      languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      off.push(() => languageObserver.disconnect());
    }
    const tocLinks = [...story.querySelectorAll('.st-toc a[data-toc]')];
    const railProgress = story.querySelector('.st-rail__progress');
    const next = story.querySelector('[data-next]');
    const prev = story.querySelector('[data-prev]');
    const presentable = story.dataset.present === 'true';
    let present = false;          // Present mode: one page at a time (see the present module below)
    let pageStep = () => {};

    // ── Rail: visited chapters ──
    const visited = new Set(store.get(VISITED_KEY, []));
    visited.add(story.dataset.story + '/' + chapterId);
    store.set(VISITED_KEY, [...visited]);
    story.querySelectorAll('.st-rail__list li').forEach((li) => li.classList.toggle('is-visited', visited.has(li.dataset.chapterId)));
    const railCurrent = story.querySelector('.st-rail__list li.is-current');
    if (railCurrent && railCurrent.scrollIntoView && window.innerWidth <= 1080) {
      railCurrent.parentElement.scrollLeft = railCurrent.offsetLeft - 16;
    }

    // ── Entering animation (direction set by the page we came from) ──
    let enter = null;
    try { enter = sessionStorage.getItem(ENTER_KEY); sessionStorage.removeItem(ENTER_KEY); } catch (e) {}
    if (enter === 'next' || enter === 'prev') {
      story.classList.add('is-entering-' + enter);
      setTimeout(() => story.classList.remove('is-entering-' + enter), 900);
    }

    // ── Stage tracking ──
    let current = null;
    function stageNow() {
      const line = window.innerHeight * 0.55;
      let best = null;
      for (const m of marks) {
        if (m.getBoundingClientRect().top < line) best = m; else break;
      }
      return best;
    }

    function apply(el) {
      const stage = el ? Number(el.dataset.stage) : firstStage - 1;
      if (stage === current) return;
      const firstPaint = current === null;
      current = stage;

      marks.forEach((m) => m.classList.toggle('is-active', m === el));

      const patientRewind = stage < patientStage;
      const factChanges = renderPatientFacts(stage);

      // Case file rows — earlier chapters arrive pre-filled.
      let covered = 0, added = 0, removed = false;
      fillables.forEach((f) => {
        const isOn = Number(f.dataset.at) <= stage;
        const was = f.classList.contains('is-filled');
        f.classList.toggle('is-filled', isOn);
        f.setAttribute('aria-hidden', String(!isOn));
        if (!isOn) f.classList.remove('is-fresh');
        if (was && !isOn) removed = true;
        if (isOn && !was && f.dataset.amount) added++;
        if (isOn && !was && !firstPaint && !reduced()) { f.classList.remove('is-fresh'); void f.offsetWidth; f.classList.add('is-fresh'); }
        if (isOn && f.dataset.amount) covered += Number(f.dataset.amount);
      });

      // "In this chapter" outline follows the section being read.
      if (tocLinks.length) {
        const h = el && el.querySelector('h2[id]');
        if (h || !el) tocLinks.forEach((a) => a.classList.toggle('is-current', !!h && a.dataset.toc === h.id));
      }

      if (!file) return scrollies(stage);

      // Status stamp + headline from the YAML timeline.
      let st = 'Open', hl = null;
      const chapterScope = story.dataset.fileScope === 'chapter';   // a scenario's own case file
      for (const t of timeline) {
        if (t.stage > stage) break;
        if (chapterScope && t.stage < firstStage) continue;
        if (t.status) st = t.status;
        if (t.headline) hl = t.headline;
      }
      const changedStatus = activeStatus !== st;
      activeStatus = st;
      if (removed || patientRewind) unread = 0;
      if (announcementsReady && !firstPaint && (added || factChanges) && !patientRewind && window.innerWidth <= 1080 && !file.classList.contains('is-open')) unread += added + factChanges;
      renderFileStatus();
      status.classList.remove('is-stamping');
      if (changedStatus && !firstPaint && !reduced()) { void status.offsetWidth; status.classList.add('is-stamping'); }
      if (announcement && announcementsReady && !firstPaint) {
        // Announce reading progress, not an unsupported patient confirmation.
        announcement.textContent = german()
          ? `${covered} von ${target} Lernnotizen sichtbar. Status: ${status.textContent}.`
          : `${covered} of ${target} reading notes visible. Status: ${status.textContent}.`;
        if (factChanges) announcement.textContent += german() ? ` ${factChanges} Patientenangaben aktualisiert.` : ` ${factChanges} patient fact entries updated.`;
      }
      headlineLabel.textContent = hl ? hl.label : defaultLabel;
      headline.textContent = hl ? hl.value : story.dataset.initialValue;
      headline.classList.toggle('is-zero', covered >= target);
      headlineBar.style.width = Math.min(100, (covered / target) * 100) + '%';
      scrollies(stage);
    }

    // A slice too small to hold its own name gets a minimum width in CSS, so
    // every award is labelled the same way. Whether it is too small is judged
    // from the slice's NATURAL width — its share of the bar — never its rendered
    // width, which that minimum has already changed.
    function fitLabels(sc) {
      const bar = sc.querySelector('.st-stack');
      if (!bar) return;
      clearTimeout(bar._fitT);
      bar._fitT = setTimeout(() => {
        const full = bar.clientWidth;
        bar.querySelectorAll('i').forEach((seg) => {
          const label = seg.querySelector('em');
          if (!label || !label.textContent) return;
          if (!seg._lw) seg._lw = label.offsetWidth;   // measure once, unpadded
          const share = parseFloat(seg.style.getPropertyValue('--w')) || 0;
          seg.classList.toggle('is-tight', seg.classList.contains('is-on') && full * share / 100 < seg._lw + 20);
        });
      }, reduced() ? 0 : 640);
    }

    // Full screen, a mode switch and the rail hiding all resize the bar without
    // a window resize event, which would leave the labels pointing at the wrong
    // slice. Watch the bar itself instead of guessing what moved it.
    if (window.ResizeObserver) {
      const ro = new ResizeObserver((entries) => entries.forEach((e) => {
        const sc = e.target.closest('.st-scrolly');
        if (sc) fitLabels(sc);
      }));
      story.querySelectorAll('.st-stack').forEach((bar) => ro.observe(bar));
      off.push(() => ro.disconnect());
    }

    function scrollies(stage) {
      story.querySelectorAll('.st-scrolly').forEach((sc) => {
        const steps = [...sc.querySelectorAll('.st-step')];
        const reached = steps.filter((s) => Number(s.dataset.stage) <= stage);
        const kind = sc.dataset.scrolly;
        if (kind === 'route') {
          const node = reached.length ? Number(reached[reached.length - 1].dataset.node) : 0;
          const lis = [...sc.querySelectorAll('.st-route li')];
          lis.forEach((li, i) => { li.classList.toggle('is-now', i + 1 === node); li.classList.toggle('is-past', i + 1 < node); });
          placeToken(sc, lis, node);
        } else if (kind === 'stack') {
          const segs = new Set();
          const keys = (v) => (v || '').split(' ').filter(Boolean);
          const added = new Set();
          reached.forEach((s) => {
            keys(s.dataset.seg).forEach((k) => { segs.add(k); added.add(k); });
            keys(s.dataset.remove).forEach((k) => segs.delete(k));
          });
          sc.querySelectorAll('.st-stack i').forEach((i) => i.classList.toggle('is-removed', !segs.has(i.dataset.seg) && added.has(i.dataset.seg)));
          sc.querySelectorAll('.st-stack i').forEach((i) => i.classList.toggle('is-on', segs.has(i.dataset.seg)));
          const total = sc.querySelector('[data-stack-total]');
          if (total) total.textContent = money([...sc.querySelectorAll('.st-stack i.is-on')].reduce((s, i) => s + Number(i.dataset.amount || 0), 0));
          fitLabels(sc);
        } else if (kind === 'timeline') {
          const shown = new Set(reached.flatMap((s) => (s.dataset.show || '').split(' ').filter(Boolean)));
          sc.querySelectorAll('[data-part]').forEach((p) => p.classList.toggle('is-shown', shown.has(p.dataset.part)));
        } else if (kind === 'ledger') {
          const cards = new Set(reached.map((s) => s.dataset.card));
          sc.querySelectorAll('.st-term').forEach((t) => t.classList.toggle('is-on', cards.has(t.dataset.card)));
        }
      });
    }

    function placeToken(sc, lis, node) {
      const token = sc.querySelector('.st-token');
      if (!token || !lis.length || !token.offsetParent) return;   // hidden (e.g. another Present page)
      const circle = lis[Math.max(0, node - 1)].querySelector('.st-hopno');
      const base = token.offsetParent.getBoundingClientRect();
      const r = circle.getBoundingClientRect();
      token.style.setProperty('--tx', (r.right - base.left - 16) + 'px');
      token.style.top = (r.top - base.top - 10) + 'px';
      token.style.opacity = node === 0 ? '0' : '1';
    }

    function progress() {
      if (!railProgress) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      railProgress.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max) : 1);
    }

    let ticking = false;
    on(window, 'scroll', () => {
      if (ticking || present) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; apply(stageNow()); progress(); });
    }, { passive: true });
    on(window, 'resize', () => { if (present) return; current = -99; apply(stageNow()); });

    // ── Turning the page ──
    let leaving = false;
    function go(link, dir) {
      if (!link || leaving) return;
      leaving = true;
      try { sessionStorage.setItem(ENTER_KEY, dir); } catch (e) {}
      if (story.classList.contains('is-fullscreen')) HOP_FULLSCREEN.arm();
      // A plain page load: Material's instant navigation only reacts to real
      // clicks, so pushing into location$ would leave the page half-faded.
      const navigate = () => { window.location.assign(new URL(link.href, location.href).href); };
      if (reduced()) return navigate();
      story.classList.add('is-leaving-' + dir);
      setTimeout(navigate, 360);
    }

    story.querySelectorAll('[data-story-link]').forEach((a) => on(a, 'click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      go(a, a.dataset.dir || 'next');
    }, true));

    // Capture phase: Material binds `f` (and s, /) to "focus search" on document.
    // Catching the event on the way down lets the story claim the keys it owns
    // before Material's own listener ever sees them.
    on(document, 'keydown', (e) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
      if (/input|textarea|select/i.test(document.activeElement?.tagName || '')) return;
      if (document.querySelector('[data-md-toggle="search"]:checked')) return;
      const mine = () => { e.preventDefault(); e.stopPropagation(); };
      if (e.key === 'Escape' && story.classList.contains('is-fullscreen')) { mine(); setFullscreen(false); return; }
      if ((e.key === 'f' || e.key === 'F') && presentable) { mine(); setFullscreen(!story.classList.contains('is-fullscreen')); return; }
      if (present) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { mine(); pageStep(1); }
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { mine(); pageStep(-1); }
        return;
      }
      if (e.key === 'ArrowRight' && next) { mine(); go(next, 'next'); }
      if (e.key === 'ArrowLeft' && prev) { mine(); go(prev, 'prev'); }
    }, true);

    // Scroll past the end (or swipe sideways) to continue.
    let pull = 0, pullTimer = null;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;
    function addPull(d) {
      if (!next) return;
      pull = Math.max(0, pull + d);
      next.style.setProperty('--pull', Math.min(1, pull / PULL_NEEDED));
      clearTimeout(pullTimer);
      pullTimer = setTimeout(() => { pull = 0; next.style.setProperty('--pull', 0); }, 700);
      if (pull >= PULL_NEEDED) go(next, 'next');
    }
    on(window, 'wheel', (e) => {
      if (present) return;
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5;
      if (sideways) {
        if (e.deltaX > 0) addPull(e.deltaX * 1.2);
        else if (prev && e.deltaX < -40 && !leaving) { pull = 0; if (e.deltaX < -60) go(prev, 'prev'); }
        return;
      }
      if (e.deltaY > 0 && atBottom()) addPull(e.deltaY);
    }, { passive: true });

    let touchY = null, touchX = null, startY = 0;
    on(window, 'touchstart', (e) => { touchY = startY = e.touches[0].clientY; touchX = e.touches[0].clientX; }, { passive: true });
    on(window, 'touchmove', (e) => {
      if (touchY === null || present) return;
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      if (dy > 0 && atBottom()) addPull(dy * 2);
    }, { passive: true });
    on(window, 'touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 90 && Math.abs(dx) > 2 * Math.abs(e.changedTouches[0].clientY - startY)) {
        if (present) { pageStep(dx < 0 ? 1 : -1); touchX = touchY = null; return; }
        if (dx < 0 && next) go(next, 'next');
        if (dx > 0 && prev) go(prev, 'prev');
      }
      touchX = touchY = null;
    }, { passive: true });

    // ── Case file on phones: bottom sheet ──
    if (file) {
      const head = file.querySelector('.st-file__head');
      on(head, 'click', () => {
        const open = !file.classList.contains('is-open');
        file.classList.toggle('is-open', open);
        head.setAttribute('aria-expanded', String(open));
        if (open) { unread = 0; renderFileStatus(); }
      });
    }

    // ── Reveal-on-scroll blocks ──
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' }) : null;
    story.querySelectorAll('.st-reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
    if (io) off.push(() => io.disconnect());

    // ── Present mode: the same scenes, one page at a time ──────────────────
    // Grouping: story + need share a page; each award step is a page; the
    // turning point shares a page with the visual after it; the rest stand alone.
    const legacyModeKey = 'amber-v2-read-mode:' + (story.dataset.story || '');
    const validMode = (value) => value === 'present' || value === 'scroll';
    let preferredMode = store.get(MODE_KEY, null);
    // Carry forward a previous explicit selection without letting chapter defaults
    // overwrite it. New selections always use the guide-wide key.
    if (!validMode(preferredMode)) {
      const legacyMode = store.get(legacyModeKey, null);
      if (validMode(legacyMode)) {
        preferredMode = legacyMode;
        store.set(MODE_KEY, legacyMode);
      }
    }
    const AT_END_KEY = 'amber-v2-present-at-end';
    const main = story.querySelector('.st-main');
    const pnav = story.querySelector('.st-pnav');
    const modeBtns = [...story.querySelectorAll('[data-mode-set]')];
    const fsBtn = story.querySelector('[data-fullscreen]');
    let pages = [], pageIndex = 0, railPages = null;

    // Pages are decided at build time from story/_site.yml (presentation) and
    // stamped on each scene and step as data-page; the titles come as JSON.
    function buildPages() {
      let meta = [];
      try { meta = JSON.parse(story.dataset.pages || '[]'); } catch (e) {}
      return meta.map((m, n) => {
        const els = [...story.querySelectorAll(`.st-main > [data-page="${n}"], .st-hero[data-page="${n}"]`)];
        const step = story.querySelector(`.st-steps .st-step[data-page="${n}"]`);
        if (step) els.push(step.closest('.st-scrolly'));
        const staged = els.filter((e) => e.dataset.stage !== undefined && !e.matches('.st-scrolly'));
        if (step) staged.push(step);
        staged.sort((a, b) => Number(a.dataset.stage) - Number(b.dataset.stage));
        return { els, step, mark: staged[staged.length - 1] || null, title: m.title };
      }).filter((pg) => pg.els.length);
    }

    function showPage(n, fromEnd) {
      if (!pages.length) return;
      n = Math.max(0, Math.min(pages.length - 1, n));
      const back = n < pageIndex;
      pageIndex = n;
      story.querySelectorAll('.pm-show').forEach((el) => el.classList.remove('pm-show', 'pm-back', 'pm-first', 'pm-last'));
      story.querySelectorAll('.pm-cur').forEach((el) => el.classList.remove('pm-cur'));
      const pg = pages[n];
      pg.els.forEach((el, i) => {
        el.classList.add('pm-show');
        // Ends of the slide: full screen centres the block between them.
        if (i === 0) el.classList.add('pm-first');
        if (i === pg.els.length - 1) el.classList.add('pm-last');
        if (back) el.classList.add('pm-back');
        el.querySelectorAll('.st-reveal').forEach((r) => r.classList.add('is-in'));
        if (el.matches('.st-reveal')) el.classList.add('is-in');
      });
      if (pg.step) pg.step.classList.add('pm-cur');
      story.classList.toggle('pm-on-hero', pg.els.some((el) => el.matches('.st-hero')));
      current = -99;
      apply(pg.mark);
      window.scrollTo({ top: 0, behavior: 'auto' });
      // page nav + rail list
      pnav.querySelector('[data-pnav-title]').textContent = pg.title;
      pnav.querySelector('[data-pnav-count]').textContent = (n + 1) + ' / ' + pages.length;
      pnav.querySelector('.st-pnav__bar i').style.width = ((n + 1) / pages.length * 100) + '%';
      const nextBtn = pnav.querySelector('[data-pnav="next"]');
      const prevBtn = pnav.querySelector('[data-pnav="prev"]');
      const last = n === pages.length - 1;
      // On the last slide the button leaves the chapter, so it says where to
      // (presentation.next_label in _site.yml); "Done" when there is nowhere.
      nextBtn.querySelector('span').textContent = last ? (nextBtn.dataset.nextLabel || 'Next chapter') : 'Next';
      nextBtn.disabled = last && !next;
      prevBtn.disabled = n === 0 && !prev;
      if (railPages) [...railPages.children].forEach((b, k) => (k === n ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
      try { history.replaceState(null, '', '#p' + (n + 1)); } catch (e) {}
    }

    pageStep = (d) => {
      const n = pageIndex + d;
      if (n >= pages.length) { if (next) go(next, 'next'); return; }
      if (n < 0) { if (prev) { try { sessionStorage.setItem(AT_END_KEY, '1'); } catch (e) {} go(prev, 'prev'); } return; }
      showPage(n);
    };

    function setMode(mode, opts = {}) {
      present = mode === 'present' && presentable;
      story.classList.toggle('is-present', present);
      document.body.classList.toggle('amber-present', present);
      modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modeSet === (present ? 'present' : 'scroll'))));
      if (pnav) pnav.hidden = !present;
      if (!opts.silent) {
        preferredMode = present ? 'present' : 'scroll';
        store.set(MODE_KEY, preferredMode);
        // A previously shared ?mode=present link must not undo a later click.
        const url = new URL(location.href);
        if (url.searchParams.has('mode')) {
          url.searchParams.delete('mode');
          try { history.replaceState(null, '', url.pathname + url.search + url.hash); } catch (e) {}
        }
      }
      if (present) {
        if (!pages.length) pages = buildPages();
        if (!railPages && railCurrent) {
          railPages = document.createElement('ol');
          railPages.className = 'st-rail__pages';
          pages.forEach((pg, k) => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = (k + 1) + ' · ' + pg.title;
            b.addEventListener('click', () => showPage(k));
            li.appendChild(b);
            railPages.appendChild(li);
          });
          railCurrent.appendChild(railPages);
        }
        showPage(opts.page ?? pageIndex);
      } else {
        story.querySelectorAll('.pm-show, .pm-cur').forEach((el) => el.classList.remove('pm-show', 'pm-cur', 'pm-back'));
        story.classList.remove('pm-on-hero');
        // #pN is a reading destination, not an instruction to change mode.
        // Keep deep links meaningful in Scroll and retain the current slide
        // when the reader changes from Present to Scroll.
        const hashPage = location.hash.match(/^#p(\d+)$/);
        const destination = opts.page ?? (hashPage ? Number(hashPage[1]) - 1 : null);
        if (destination !== null) scrollToPage(destination);
        current = -99;
        apply(stageNow());
        progress();
      }
    }

    let scrollFrame = null;
    function scrollToPage(n) {
      if (!pages.length) pages = buildPages();
      const pg = pages[Math.max(0, Math.min(pages.length - 1, n))];
      if (!pg) return;
      pageIndex = Math.max(0, Math.min(pages.length - 1, n));
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        (pg.step || pg.els[0]).scrollIntoView({ block: 'start', behavior: 'auto' });
        current = -99;
        apply(stageNow());
        progress();
      });
    }
    off.push(() => { if (scrollFrame !== null) cancelAnimationFrame(scrollFrame); });

    modeBtns.forEach((b) => on(b, 'click', () => setMode(b.dataset.modeSet)));

    // ── Full screen: the story fills the browser window, deliberately NOT the
    // OS-level Fullscreen API. After a chapter hop there is no user gesture to
    // spend on requestFullscreen, so using it would make the first slide behave
    // differently from every slide after it. One overlay, every time.
    function setFullscreen(on) {
      story.classList.toggle('is-fullscreen', on);
      if (fsBtn) {
        fsBtn.setAttribute('aria-pressed', String(on));
        fsBtn.querySelector('.lbl').textContent = on ? 'Exit full screen' : 'Full screen';
      }
      document.body.style.overflow = on ? 'hidden' : '';
      if (on && !present) setMode('present');
      if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    }
    if (fsBtn) on(fsBtn, 'click', () => setFullscreen(!story.classList.contains('is-fullscreen')));
    on(document, 'fullscreenchange', () => {
      if (!document.fullscreenElement && story.classList.contains('is-fullscreen')) setFullscreen(false);
    });

    // A chapter hop is a real page load, so full screen would drop out mid-talk.
    // go() leaves a one-shot marker; the next chapter picks it up and carries on.
    if (HOP_FULLSCREEN.take() && presentable) setFullscreen(true, true);
    off.push(() => { document.body.style.overflow = ''; });
    // #p3 typed into the address bar (or a link to another page of this chapter)
    on(window, 'hashchange', () => {
      const m = location.hash.match(/^#p(\d+)$/);
      if (!m || !presentable) return;
      if (!present) scrollToPage(Number(m[1]) - 1);
      else showPage(Number(m[1]) - 1);
    });
    if (pnav) {
      on(pnav.querySelector('[data-pnav="next"]'), 'click', () => pageStep(1));
      on(pnav.querySelector('[data-pnav="prev"]'), 'click', () => pageStep(-1));
    }

    let startMode = 'scroll';
    if (presentable) {
      const q = new URLSearchParams(location.search).get('mode');
      // An explicit query can choose a mode; a page fragment only chooses a
      // scene. Defaults and fragments never override a saved reader choice.
      startMode = validMode(q) ? q : validMode(preferredMode) ? preferredMode
        : /^#p\d+$/.test(location.hash) ? 'present' : story.dataset.defaultMode || 'scroll';
    }
    if (startMode === 'present') {
      pages = buildPages();
      let start = 0;
      const m = location.hash.match(/^#p(\d+)$/);
      if (m) start = Number(m[1]) - 1;
      try { if (sessionStorage.getItem(AT_END_KEY)) { start = pages.length - 1; sessionStorage.removeItem(AT_END_KEY); } } catch (e) {}
      setMode('present', { silent: true, page: start });
    } else {
      if (presentable) setMode('scroll', { silent: true });
      apply(stageNow());
      progress();
    }

    if (railCurrent && window.innerWidth > 1080) {
      const railList = railCurrent.parentElement;
      railList.scrollTop += railCurrent.getBoundingClientRect().top - railList.getBoundingClientRect().top - 8;
    }
    requestAnimationFrame(() => { announcementsReady = true; });
    window.__stoCleanup = () => { off.forEach((f) => f()); clearTimeout(pullTimer); document.body.classList.remove('amber-present'); };
  }

  if (window.document$ && typeof window.document$.subscribe === 'function') {
    window.document$.subscribe(init);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

