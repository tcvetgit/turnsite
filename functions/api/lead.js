const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (value, max) => String(value || '').replace(/[<>\u0000-\u001f]/g, ' ').trim().slice(0, max);

// Simple in-memory rate limit: max 5 submissions per minute per IP (per isolate; helps against basic spam).
const hits = new Map();
const RATE_LIMIT = 5, RATE_WINDOW_MS = 60000;
function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_WINDOW_MS; }
  entry.count += 1;
  hits.set(ip, entry);
  if (hits.size > 5000) { for (const [key, value] of hits) if (now > value.reset) hits.delete(key); }
  return entry.count > RATE_LIMIT;
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) return json({ error: 'Слишком много обращений. Попробуйте позже или свяжитесь с нами напрямую.' }, 429);
  let lead;
  try { lead = await request.json(); } catch { return json({ error: 'Некорректный запрос.' }, 400); }
  // Honeypot: bots often fill every field; quietly discard without sending a notification.
  if (lead.website) return json({ ok: true });
  const name = clean(lead.name, 80);
  const phone = clean(lead.phone, 24);
  const job = clean(lead.job, 80);
  const time = clean(lead.time, 40);
  if (name.length < 2 || !/^\+?\d[\d ()-]{8,22}$/.test(phone)) return json({ error: 'Проверьте имя и телефон.' }, 400);
  if (lead.consent !== true) return json({ error: 'Необходимо согласие на обработку данных.' }, 400);

  const text = `Заявка на работу вахтой\nИмя: ${name}\nТелефон: ${phone}\nВакансия: ${job || 'не указана'}\nВремя звонка: ${time || 'любое'}\nСтраница: ${clean(lead.page, 240)}`;
  const tasks = [];
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    tasks.push(fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true })
    }).then(async r => r.ok && (await r.json()).ok));
  }
  if (env.RESEND_API_KEY && env.LEADS_EMAIL && env.LEADS_FROM) {
    tasks.push(fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.LEADS_FROM, to: [env.LEADS_EMAIL], subject: 'Новая заявка с сайта — работа вахтой', text })
    }).then(r => r.ok));
  }
  if (!tasks.length) return json({ error: 'Сервис приёма заявок ещё не настроен. Напишите нам через мессенджер.' }, 503);
  const results = await Promise.allSettled(tasks);
  if (!results.some(result => result.status === 'fulfilled' && result.value === true)) return json({ error: 'Не удалось доставить заявку. Попробуйте связаться через мессенджер.' }, 502);
  return json({ ok: true });
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  return onRequestPost(context);
}
