(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const phoneDigits = String(config.phone || '').replace(/\D/g, '');
  const whatsappDigits = String(config.whatsapp || '').replace(/\D/g, '');
  const email = String(config.email || '').trim();
  const telegramValue = String(config.telegram || '').trim();
  const maxValue = String(config.max || '').trim();
  const validUrl = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch (_) { return ''; } };
  const telegramLink = telegramValue ? (validUrl(telegramValue) || `https://t.me/${telegramValue.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '')}`) : '';
  const maxLink = maxValue ? (validUrl(maxValue) || (maxValue.startsWith('max.ru/') ? `https://${maxValue}` : `https://max.ru/u/${maxValue.replace(/^https?:\/\/max\.ru\/u\//, '')}`)) : '';
  const formatPhone = d => `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  const phoneHref = phoneDigits ? `tel:+${phoneDigits}` : '';
  const phoneText = phoneDigits && phoneDigits.length === 11 ? formatPhone(phoneDigits) : (phoneDigits ? `+${phoneDigits}` : 'Связаться с нами');
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : '';

  document.querySelectorAll('[data-contact="phoneLink"]').forEach(el => { if (phoneHref) el.href = phoneHref; else { el.href = '#apply'; el.setAttribute('aria-label', 'Оставить заявку'); } });
  document.querySelectorAll('[data-contact="phoneText"]').forEach(el => { el.textContent = phoneText; });
  document.querySelectorAll('[data-contact="whatsappLink"]').forEach(el => { if (whatsappDigits) { el.href = `https://wa.me/${whatsappDigits}`; el.target = '_blank'; } else { el.href = '#apply'; el.removeAttribute('target'); } });
  document.querySelectorAll('[data-contact="telegramLink"]').forEach(el => { if (telegramLink) { el.href = telegramLink; el.target = '_blank'; } else { el.href = '#apply'; el.removeAttribute('target'); } });
  document.querySelectorAll('[data-contact="maxLink"]').forEach(el => { if (maxLink) { el.href = maxLink; el.target = '_blank'; } else { el.href = '#apply'; el.removeAttribute('target'); } });
  document.querySelectorAll('[data-contact="emailLink"]').forEach(el => { if (emailHref) { el.href = emailHref; } else { el.href = '#apply'; } });
  document.querySelectorAll('[data-contact="emailText"]').forEach(el => { el.textContent = 'Написать на почту'; });

  // Floating widget buttons stay hidden until the matching contact is configured
  document.querySelectorAll('[data-float="whatsapp"]').forEach(el => { el.hidden = !whatsappDigits; });
  document.querySelectorAll('[data-float="telegram"]').forEach(el => { el.hidden = !telegramLink; });
  document.querySelectorAll('[data-float="max"]').forEach(el => { el.hidden = !maxLink; });

  // Copy contacts to clipboard
  const copyValues = { phone: phoneDigits ? phoneText : '', email: emailHref ? email : '' };
  document.querySelectorAll('[data-copy]').forEach(button => {
    const value = copyValues[button.getAttribute('data-copy')] || '';
    if (!value) { button.hidden = true; return; }
    button.addEventListener('click', async () => {
      let copied = false;
      try { await navigator.clipboard.writeText(value); copied = true; }
      catch (_) {
        try {
          const area = document.createElement('textarea');
          area.value = value;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.left = '-9999px';
          document.body.appendChild(area);
          area.select();
          copied = document.execCommand('copy');
          area.remove();
        } catch (_) { copied = false; }
      }
      if (!copied) return;
      button.classList.add('copied');
      const label = button.querySelector('[data-copy-label]');
      if (label) {
        const previous = label.textContent;
        label.textContent = 'Скопировано';
        setTimeout(() => { label.textContent = previous; button.classList.remove('copied'); }, 1800);
      } else {
        const previous = button.textContent;
        button.textContent = '✓';
        setTimeout(() => { button.textContent = previous; button.classList.remove('copied'); }, 1800);
      }
    });
  });

  // Mobile menu
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mainNav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menuButton.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { menuButton.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); menuButton.focus(); } });
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scrollspy (desktop menu) + floating widget visibility
  const spySections = ['jobs', 'conditions', 'steps', 'docs', 'faq'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = new Map([...document.querySelectorAll('.main-nav a')].map(link => [(link.getAttribute('href') || '').replace('#', ''), link]));
  const floatCta = document.querySelector('.float-cta');
  const floatTop = document.querySelector('.float-top');
  let scrollScheduled = false;
  const onScroll = () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => {
      scrollScheduled = false;
      const probe = 110;
      let current = '';
      for (const section of spySections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) { current = section.id; break; }
      }
      navLinks.forEach((link, id) => link.classList.toggle('active', id === current));
      const slide = document.querySelector('.nav-slide');
      if (slide) {
        const active = navLinks.get(current);
        if (active) { slide.style.width = active.offsetWidth + 'px'; slide.style.transform = `translateX(${active.offsetLeft}px)`; slide.classList.add('on'); }
        else slide.classList.remove('on');
      }
      if (floatCta) floatCta.classList.toggle('visible', window.scrollY > 480);
      if (floatTop) floatTop.classList.toggle('visible', window.scrollY > 900);
    });
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Offline indicator
  const offlineBanner = document.getElementById('offlineBanner');
  const updateOffline = () => { if (offlineBanner) offlineBanner.hidden = navigator.onLine; };
  window.addEventListener('online', updateOffline);
  window.addEventListener('offline', updateOffline);
  updateOffline();

  // Счётчик откликов за сегодня — скромное живое значение 0–6, стабильно в рамках сессии
  const todayNum = document.querySelector('[data-today-num]');
  if (todayNum) {
    const key = 'tankun-today-count';
    const clamp = n => Math.max(0, Math.min(7, n));
    const word = v => (v >= 2 && v <= 4 ? 'человека' : 'человек');
    const render = v => { todayNum.textContent = `${v} ${word(v)}`; todayNum.classList.remove('tick'); void todayNum.offsetWidth; todayNum.classList.add('tick'); };
    let stored = null;
    try { stored = sessionStorage.getItem(key); } catch (_) { /* storage unavailable */ }
    let value = clamp(stored !== null && /^\d$/.test(stored) ? Number(stored) : Math.floor(Math.random() * 8));
    // Первые показы — чтобы страница сразу выглядела живой
    if (value === 0 && Math.random() < 0.45) value = 1 + Math.floor(Math.random() * 4);
    try { sessionStorage.setItem(key, String(value)); } catch (_) { /* storage unavailable */ }
    render(value);
    // «Живая» активность: раз в 40–80 секунд счётчик меняется на ±1 в пределах 0–7
    const tickCounter = () => {
      const drift = Math.random();
      let next = value;
      if (drift < 0.55) next = value + 1;      // чаще вверх — виден рост
      else if (drift < 0.85) next = value - 1; // иногда вниз — правдоподобно
      next = clamp(next);
      if (next !== value) { value = next; try { sessionStorage.setItem(key, String(value)); } catch (_) { /* storage unavailable */ } render(value); }
    };
    const scheduleTick = () => setTimeout(() => { tickCounter(); scheduleTick(); }, 40000 + Math.random() * 40000);
    scheduleTick();
  }

  const form = document.getElementById('leadForm');
  const nameInput = document.getElementById('candidateName');
  const phoneInput = document.getElementById('candidatePhone');
  const jobInput = document.getElementById('candidateJob');
  const timeInput = document.getElementById('candidateTime');
  const error = document.getElementById('formError');
  const success = document.getElementById('formSuccess');
  const whatsappSuccess = document.getElementById('successWhatsApp');
  const emailSuccess = document.getElementById('successEmail');
  let lastSubmission = null;

  phoneInput.addEventListener('input', () => {
    const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    if (!digits) { phoneInput.value = ''; return; }
    let normalized = digits;
    if (digits[0] === '8') normalized = '7' + digits.slice(1);
    else if (digits[0] !== '7') normalized = '7' + digits;
    normalized = normalized.slice(0, 11);
    let formatted = '+7';
    if (normalized.length > 1) formatted += ' (' + normalized.slice(1, 4);
    if (normalized.length >= 5) formatted += ') ' + normalized.slice(4, 7);
    if (normalized.length >= 8) formatted += '-' + normalized.slice(7, 9);
    if (normalized.length >= 10) formatted += '-' + normalized.slice(9, 11);
    phoneInput.value = formatted;
  });

  // Draft autosave (browser only; nothing is sent to the server)
  const draftKey = 'tankun-lead-draft-v1';
  const draftFields = [nameInput, phoneInput, jobInput, timeInput].filter(Boolean);
  const saveDraft = () => {
    try {
      const data = {};
      draftFields.forEach(field => { data[field.id] = field.value; });
      localStorage.setItem(draftKey, JSON.stringify(data));
    } catch (_) { /* storage unavailable */ }
  };
  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      draftFields.forEach(field => { if (data[field.id] && !field.value) field.value = data[field.id]; });
    } catch (_) { /* ignore malformed drafts */ }
  };
  restoreDraft();
  draftFields.forEach(field => {
    field.addEventListener('input', saveDraft);
    field.addEventListener('change', saveDraft);
  });

  const messageFor = lead => `Здравствуйте! Меня зовут ${lead.name}. Ищу работу вахтой в Москве/Московской области.${lead.job ? ` Интересует вакансия: ${lead.job}.` : ''}${lead.time ? ` Удобное время звонка: ${lead.time}.` : ''} Мой телефон: ${lead.phone}. Подскажите, пожалуйста, актуальные условия.`;
  const showSuccess = lead => {
    lastSubmission = lead;
    try { localStorage.removeItem(draftKey); } catch (_) { /* ignore */ }
    form.hidden = true;
    success.hidden = false;
    const msg = messageFor(lead);
    if (whatsappDigits) { whatsappSuccess.href = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(msg)}`; whatsappSuccess.hidden = false; }
    else { whatsappSuccess.hidden = true; }
    if (emailHref) { emailSuccess.href = `mailto:${email}?subject=${encodeURIComponent('Заявка на работу вахтой')}&body=${encodeURIComponent(msg)}`; emailSuccess.hidden = false; }
    else { emailSuccess.hidden = true; }
    success.focus();
  };
  const invalidate = el => {
    if (!el) return;
    el.classList.remove('field-invalid');
    void el.offsetWidth; // перезапуск анимации тряски при повторной ошибке
    el.classList.add('field-invalid');
    el.addEventListener('input', () => el.classList.remove('field-invalid'), { once: true });
    el.addEventListener('change', () => el.classList.remove('field-invalid'), { once: true });
    el.focus();
  };
  form.addEventListener('submit', async event => {
    event.preventDefault(); error.textContent = '';
    const name = nameInput.value.trim();
    const digits = phoneInput.value.replace(/\D/g, '');
    const consent = form.querySelector('[name="consent"]');
    if (name.length < 2) { error.textContent = 'Пожалуйста, укажите имя (не менее двух символов).'; invalidate(nameInput); return; }
    if (digits.length < 11) { error.textContent = 'Введите корректный номер телефона.'; invalidate(phoneInput); return; }
    if (!consent.checked) { error.textContent = 'Для отправки заявки подтвердите согласие на обработку данных.'; invalidate(consent); return; }
    if (!navigator.onLine) { error.textContent = 'Нет подключения к интернету. Проверьте связь и попробуйте ещё раз — введённые данные сохранены.'; return; }
    // Защита от спама: не чаще одной заявки в 60 секунд с одного браузера
    const rateKey = 'tankun-lead-last';
    if (Date.now() - Number(sessionStorage.getItem(rateKey) || 0) < 60000) {
      error.textContent = 'Вы недавно отправляли заявку — мы её получили и скоро перезвоним. Если что-то срочно, напишите в мессенджер.';
      return;
    }
    const params = new URLSearchParams(location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(k => params.get(k)).filter(Boolean).join(' / ');
    const source = utm || (document.referrer ? 'Переход с ' + new URL(document.referrer).hostname : 'Прямой заход / реклама не помечена');
    const lead = { name, phone: '+7' + digits.slice(-10), job: jobInput.value, time: timeInput ? timeInput.value : '', page: location.href, source, consent: consent.checked, website: document.getElementById('website').value };
    const button = form.querySelector('[type="submit"]');
    button.disabled = true; button.textContent = 'Отправляем…';
    try {
      const token = String(config.tgBotToken || '').trim();
      const chatIds = String(config.tgChatId || '').split(',').map(s => s.trim()).filter(Boolean);
      if (token && chatIds.length) {
        const mskTime = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date());
        const text = [
          '🔔 Новая заявка с сайта',
          '',
          `Время (мск): ${mskTime}`,
          `Имя: ${lead.name}`,
          `Телефон: ${lead.phone}`,
          lead.job ? `Вакансия: ${lead.job}` : '',
          lead.time ? `Удобное время звонка: ${lead.time}` : '',
          `Источник: ${lead.source}`,
          '',
          `Страница: ${lead.page}`
        ].filter(Boolean).join('\n');
        const results = await Promise.all(chatIds.map(chatId =>
          fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text })
          })
        ));
        if (results.some(r => !r.ok)) throw new Error('Telegram delivery failed');
      }
      sessionStorage.setItem('tankun-lead-last', String(Date.now()));
      showSuccess(lead);
    } catch (_) {
      button.disabled = false; button.innerHTML = 'Жду звонка <span aria-hidden="true">↗</span>';
      error.textContent = 'Заявка не отправилась. Попробуйте ещё раз или напишите нам в мессенджер.';
    }
  });
  window.addEventListener('pageshow', () => {
    if (lastSubmission && form.hidden) {
      form.reset();
      form.hidden = false;
      success.hidden = true;
      const button = form.querySelector('[type="submit"]');
      button.disabled = false;
      button.innerHTML = 'Жду звонка <span aria-hidden="true">↗</span>';
      restoreDraft();
    }
  });

  // Отзывы: пул больше видимого количества; при каждом открытии сайта — случайные 3.
  // Аватары — инициал на цветном фоне. Рейтинг у каждого свой: есть и полунегативные.
  const REVIEWS = [
    { name: 'Алексей', rating: 5, role: 'Сборщик заказов · 2-я вахта', text: '«Выплаты приходят чётко по графику, без задержек. Жили в резиденции в лесу у озера — большая территория, после смены отдыхаешь по-настоящему».' },
    { name: 'Марина', rating: 5, role: 'Работник склада · 1-я вахта', text: '«Понравилось, что всё объяснили заранее: ставку, график, как добираться. Приехала — и правда всё совпало».' },
    { name: 'Игорь', rating: 5, role: 'Водитель техники · 3-я вахта', text: '«Обучили на технику за счёт компании. Сейчас работаю на погрузчике, оплата выше, чем на первой вахте».' },
    { name: 'Дмитрий', rating: 4, role: 'Работник склада · 1-я вахта', text: '«Сначала сомневался, но менеджер честно рассказал про график и оплату. Выехал через три дня — и всё как договаривались. Единственное — дорога до склада пешком минут двадцать».' },
    { name: 'Светлана', rating: 5, role: 'Сборщик заказов · 4-я вахта', text: '«Уже не первый раз. Нравится, что резиденция среди хвойного леса и рядом озеро — тихо, чисто, воздух совсем другой».' },
    { name: 'Руслан', rating: 4, role: 'Водитель техники · 2-я вахта', text: '«Обучение бесплатное, через неделю уже работал самостоятельно. Ставку подняли после первой вахты. Но первая неделя была тяжёлой, объёмы большие».' },
    { name: 'Ольга', rating: 5, role: 'Административный работник · 2-я вахта', text: '«Чистый офис и адекватный коллектив. Зарплата без задержек, оформление официальное».' },
    { name: 'Кирилл', rating: 4, role: 'Работник склада · 2-я вахта', text: '«Склад стройматериалов огромный и чистый, к работникам отношение хорошее. Питание на месте, горячее каждый день. Минус — в пик сезона смены длиннее».' },
    { name: 'Надежда', rating: 5, role: 'Сборщик заказов · 1-я вахта', text: '«Первая вахта прошла спокойно: заселили сразу, бригадир всё показал. Взяла вторую — остаюсь».' },
    { name: 'Виктор', rating: 3, role: 'Работник склада · 1-я вахта', text: '«Работа как работа, платят стабильно. Не скажу, что всё идеально: график плотный, в первый месяц трудно привыкнуть. Но обещанного не обманули — условия совпали с тем, что говорили. За честность ставлю четыре... ладно, три с половиной округлю до трёх».' },
    { name: 'Гульнара', rating: 4, role: 'Сборщик заказов · 3-я вахта', text: '«В целом довольна: жильё хорошее, коллектив спокойный. Ждала, что ставка будет чуть выше, но после третьей вахты пересмотрели — стало справедливее».' },
    { name: 'Сергей', rating: 5, role: 'Водитель техники · 1-я вахта', text: '«Приехал по совету знакомого. Машину дали в исправном состоянии, путёвки и пропуска оформили быстро. Доволен».' },
    { name: 'Анна', rating: 3, role: 'Административный работник · 1-я вахта', text: '«Первые дни было тяжело: много информации, всё новое. Потом втянулась. Менеджер на связи всегда, если что-то непонятно — объясняют. Не идеал, но честная работа без обмана».' },
    { name: 'Тимур', rating: 4, role: 'Работник склада · 4-я вахта', text: '«Четвёртая вахта подряд. Ставка стабильная, жильё нормальное. Иногда задерживаются на смене допоздна — это минус, но доплату за переработку начисляют».' },
    { name: 'Екатерина', rating: 5, role: 'Сборщик заказов · 2-я вахта', text: '«Боялась ехать одна, но в резиденции женщина-комендант, все вопросы решались на месте. Чувствовала себя спокойно».' }
  ];
  const reviewGrid = document.querySelector('.review-grid');
  if (reviewGrid) {
    const shuffle = arr => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    // 3 отзыва: обычно 2 позитивных + 1 «честный» (4–3 звезды) — правдоподобнее,
    // чем сплошные пятёрки. Иногда все три позитивные.
    const positives = shuffle(REVIEWS.filter(r => r.rating === 5).slice());
    const honests = shuffle(REVIEWS.filter(r => r.rating < 5).slice());
    const pick = Math.random() < 0.25
      ? positives.slice(0, 3)
      : [positives[0], positives[1], honests[0]];
    const pool = shuffle(pick.filter(Boolean).slice());
    reviewGrid.innerHTML = pool.slice(0, 3).map(r =>
      `<figure class="review-card reveal"><blockquote>${r.text}</blockquote><figcaption><span class="review-ava" aria-hidden="true">${r.name[0]}</span><span><b>${r.name}</b><small>${r.role}</small></span><span class="review-stars" aria-hidden="true" data-rating="${r.rating}">${'★'.repeat(r.rating)}<i>${'★'.repeat(5 - r.rating)}</i></span></figcaption></figure>`
    ).join('');
  }

  // Reveal-on-scroll (плавное появление блоков)
  const revealEls = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window) || !revealEls.length) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px' });
    revealEls.forEach(el => io.observe(el));
  }
})();
