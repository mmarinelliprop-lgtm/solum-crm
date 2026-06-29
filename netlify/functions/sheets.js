const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAZeUnGl2i99wChU04g1W5a8s1Vwe330ZWY3WNDlKFtY_Yu_1CUbvlyad-mp3agcdQig/exec';

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    let url = APPS_SCRIPT_URL;

    if (body.accion === 'calendar') {
      url += '?accion=calendar';
    } else if (body.accion === 'planilla' || body.accion === 'guardar_lote' || body.accion === 'guardar' || body.accion === 'actualizar') {
      // Escrituras van por POST directo
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
      const text = await response.text();
      return { statusCode: 200, headers, body: text };
    } else if (body.accion === 'leer') {
      url += `?tipo=${encodeURIComponent(body.tipo)}&accion=leer`;
    } else {
      url += `?tipo=${encodeURIComponent(body.tipo)}&accion=${encodeURIComponent(body.accion)}&data=${encodeURIComponent(JSON.stringify(body))}`;
    }

    const response = await fetch(url);
    const text = await response.text();

    return { statusCode: 200, headers, body: text };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
