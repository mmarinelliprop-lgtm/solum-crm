// Webhook de Meta (WhatsApp Cloud API).
//  GET  → verificación inicial del webhook.
//  POST → valida firma, responde 200 de inmediato y delega el trabajo a la función background
//         (Claude + herramientas pueden tardar más que el límite de una función síncrona).
const { firmaValida, cuerpoCrudo } = require('./_lib/wsp');

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters || {};
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] && q['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return { statusCode: 200, body: q['hub.challenge'] || '' };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const raw = cuerpoCrudo(event);
  const firma = event.headers['x-hub-signature-256'] || event.headers['X-Hub-Signature-256'];
  if (!firmaValida(raw, firma)) return { statusCode: 401, body: 'Invalid signature' };

  // Ignorar notificaciones de estado (entregado/leído) sin disparar el procesamiento
  try {
    const d = JSON.parse(raw);
    const hayMensajes = (d.entry || []).some(e => (e.changes || []).some(c => (c.value?.messages || []).length));
    if (!hayMensajes) return { statusCode: 200, body: 'ok' };
  } catch (e) { return { statusCode: 400, body: 'bad json' }; }

  const base = process.env.URL || `https://${event.headers.host}`;
  try {
    await fetch(`${base}/.netlify/functions/whatsapp-process-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hub-signature-256': firma },
      body: raw
    });
  } catch (e) { console.error('No se pudo disparar el procesamiento', e.message); }
  return { statusCode: 200, body: 'ok' };
};
