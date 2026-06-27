const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzv9Q2ctoJMPvOVePV3d9RGzLDZFaGlslJIOugV23VxKkRcX6tOwWpIwj2YqMIaXXXiw/exec';

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

    if (body.accion === 'leer') {
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
