const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAS3gcGnNcUkW7Dnx86yv09tWyNmQNpMmn2QikTp3P5Tw6YNU8E73ShCuXO4F5BgX6EQ/exec';

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let url = APPS_SCRIPT_URL;
    let options = { method: 'GET' };

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      // Para escritura usamos POST via doGet con params (Apps Script acepta GET sin auth)
      if (body.accion === 'leer') {
        url += `?tipo=${encodeURIComponent(body.tipo)}&accion=leer`;
      } else {
        // Para guardar/actualizar: mandamos como GET con data encoded
        url += `?tipo=${encodeURIComponent(body.tipo)}&accion=${body.accion}&data=${encodeURIComponent(JSON.stringify(body))}`;
      }
    } else {
      // GET directo
      const params = event.queryStringParameters || {};
      const qs = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      if (qs) url += '?' + qs;
    }

    const response = await fetch(url, options);
    const text = await response.text();

    return {
      statusCode: 200,
      headers,
      body: text
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
