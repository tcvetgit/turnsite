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
  document.querySelectorAll('[data-contact="emailText"]').forEach(el => { el.textContent = emailHref ? email : 'Задать вопрос письмом'; });

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
    const lead = { name, phone: '+7' + digits.slice(-10), job: jobInput.value, time: timeInput ? timeInput.value : '', page: location.href, consent: consent.checked, website: document.getElementById('website').value };
    const button = form.querySelector('[type="submit"]');
    button.disabled = true; button.textContent = 'Отправляем…';
    try {
      const endpoint = String(config.leadEndpoint || '').trim();
      if (endpoint) {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
        if (!response.ok) throw new Error('Lead delivery failed');
      }
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
