// Utilidades compartidas del bot de WhatsApp (Meta Cloud API + Google Sheets vía Apps Script)
const crypto = require('crypto');

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyWaMzBlijjEp43oe6zqc630x-S-uX9aXdpNWEHZRNef8tZ4x_MSVHPOwSJaE2jMeU8lw/exec';
const GRAPH = 'https://graph.facebook.com/v21.0';

function soloDigitos(s) { return String(s || '').replace(/\D/g, ''); }
// Compara teléfonos por los últimos 10 dígitos (evita diferencias 54 / 549 / 0 / 15)
function mismoTelefono(a, b) {
  const x = soloDigitos(a).slice(-10), y = soloDigitos(b).slice(-10);
  return x.length >= 8 && x === y;
}

function firmaValida(rawBody, header) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header) return false;
  const esperado = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(esperado), b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cuerpoCrudo(event) {
  return event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
}

async function graph(path, payload) {
  const r = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload })
  });
  if (!r.ok) console.error('Meta API error', r.status, await r.text());
  return r.ok;
}

async function enviarTexto(to, texto) {
  const partes = [];
  let resto = String(texto || '').trim();
  while (resto.length > 3500) {
    let corte = resto.lastIndexOf('\n', 3500);
    if (corte < 1000) corte = 3500;
    partes.push(resto.slice(0, corte));
    resto = resto.slice(corte).trim();
  }
  if (resto) partes.push(resto);
  for (const p of partes) await graph('messages', { to, type: 'text', text: { body: p } });
}

function marcarLeido(messageId) {
  return graph('messages', { status: 'read', message_id: messageId });
}

// ── Google Sheets vía Apps Script (mismo contrato que netlify/functions/sheets.js) ──
async function leerTabla(tipo) {
  const r = await fetch(`${APPS_SCRIPT_URL}?tipo=${encodeURIComponent(tipo)}&accion=leer`);
  const txt = await r.text();
  try { const d = JSON.parse(txt); return Array.isArray(d) ? d : []; } catch (e) { return []; }
}
async function postSheet(body) {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return r.text();
}
const guardarFila = (tipo, fila) => postSheet({ tipo, accion: 'guardar', fila });
const actualizarFila = (tipo, id, fila) => postSheet({ tipo, accion: 'actualizar', id, fila });

module.exports = { soloDigitos, mismoTelefono, firmaValida, cuerpoCrudo, enviarTexto, marcarLeido,
  leerTabla, guardarFila, actualizarFila };
