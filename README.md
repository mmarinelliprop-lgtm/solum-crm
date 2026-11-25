# solum-crm

CRM de SOLUM (HTML estático + funciones Netlify + Google Sheets vía Apps Script).

## Bot de WhatsApp (Meta Cloud API + Claude)

Atiende mensajes de WhatsApp de forma autónoma usando los datos del CRM.

- `netlify/functions/whatsapp.js`: webhook de Meta (verificación + firma HMAC). Responde 200 y delega.
- `netlify/functions/whatsapp-process-background.js`: Claude con herramientas sobre Sheets.
- `netlify/functions/_lib/wsp.js`: utilidades (firma, envío, lectura/escritura de Sheets).

### Qué hace
- **Contactos externos:** entiende qué buscan, muestra propiedades publicadas que coinciden (`captaciones`), registra la búsqueda y el cliente en el CRM (`clientes`, `busquedas`) y avisa al dueño. Deriva a humano si piden negociar, reclamos, temas legales o de dinero.
- **Dueño** (`OWNER_WHATSAPP`): modo asistente interno: buscar clientes, ver búsquedas, cargar búsquedas, agregar notas.
- **Comandos del dueño:** `/pausar`, `/activar`, `/estado`, `/retomar <numero>`.
- Cada respuesta queda en los logs de Netlify (`"log":"wsp"`).

### Variables de entorno (Netlify)
| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | Ya usada por `claude.js` |
| `WHATSAPP_TOKEN` | Token permanente (usuario del sistema) de Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | Id del número en WhatsApp Business |
| `WHATSAPP_VERIFY_TOKEN` | Texto elegido por vos; se repite al configurar el webhook |
| `META_APP_SECRET` | Secreto de la app de Meta (valida la firma) |
| `OWNER_WHATSAPP` | Tu número con código de país, solo dígitos (ej. `5491122334455`) |
| `WSP_AGENTE_DEFAULT` | Agente asignado a clientes nuevos (default `Martina`) |
| `ANTHROPIC_MODEL` | Opcional (default `claude-sonnet-5-5`) |
| `APPS_SCRIPT_URL` | Opcional (default: el de `sheets.js`) |

### Configuración en Meta
1. developers.facebook.com → crear app tipo *Business* → agregar producto **WhatsApp**.
2. Registrar un número dedicado (no puede estar en uso en la app de WhatsApp normal).
3. Webhook: URL `https://<tu-sitio>.netlify.app/.netlify/functions/whatsapp`, token = `WHATSAPP_VERIFY_TOKEN`, suscribir el campo **messages**.
4. Crear usuario del sistema con token permanente y permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
5. Para pasar a producción: verificar el negocio en Meta Business.

### Límites conocidos
- Respuestas libres solo dentro de las 24 h posteriores al último mensaje del contacto. Los avisos al dueño exigen que él haya escrito al bot en las últimas 24 h (o usar plantillas aprobadas).
- Solo texto: audios e imágenes reciben un pedido de reenviar por escrito.
- No agenda visitas en Google Calendar (el Apps Script actual solo lee el calendario).
- La memoria de conversación (últimos 20 mensajes) y el estado del bot viven en Netlify Blobs.
