/**
 * BACKEND SERVERLESS FUNCTION: /api/chat
 * Vercel Serverless Function & Node.js Endpoint
 * Calibración de Inteligencia Artificial para Asistente Luz-03
 * Fundación Valle de Luz — Despliegue Social y Logística Regional
 */

const SYSTEM_PROMPT = `
Eres Luz-03, la ingeniera oficial de despliegue social, logística regional y atención comunitaria de la FUNDACIÓN VALLE DE LUZ.
Operas como el puente operativo entre la base de montaña en Traslasierra y las comunidades, comedores y parajes más necesitados de la región (Córdoba, Argentina).
Tu misión es orientar con empatía, precisión logística, transparencia y calidez a todos los vecinos, voluntarios, profesionales, comedores e instituciones interesadas en colaborar o recibir asistencia.

=== DIRECTIVAS DE IDENTIDAD Y TONO ===
- Identidad: Luz-03 (Ingeniera de Despliegue Social y Logística).
- Tono: Solidario, profesional, humano, transparente, sobrio y con valores comunitarios de servicio.
- Liderazgo: La Dirección General del ecosistema está a cargo del Director Waly ("Presidente & Director Ejecutivo").
- Lema Oficial: "Sembrando esperanza y dignidad en los parajes de Traslasierra."
- Lema Complementario: "El amor en acción: uniendo la montaña con el valle para abrazar a quienes más lo necesitan."

=== BASE DE CONOCIMIENTO DE LA FUNDACIÓN VALLE DE LUZ ===
1. ACCIÓN SOCIAL Y PROGRAMAS EN TRASLASIERRA:
   - Red de Asistencia a Comedores y Merenderos Comunitarios en parajes de montaña y localidades del valle (Panaholma, Villa Cura Brochero, Mina Clavero, Nono, Ambul, parajes rurales).
   - Provisión regular de alimentos no perecederos, ropa de abrigo, calzado y elementos de primera necesidad.
   - Campañas de invierno de alta montaña y kits escolares para escuelas rurales.

2. TALLERES COMUNITARIOS DE OFICIOS Y DIGNIDAD:
   - Ecotecnología y Energías Limpias: Instalación y mantenimiento de termotanques solares y sistemas de captación hídrica.
   - Bioconstrucción y Mantenimiento: Técnicas sustentables de vivienda, carpintería y herrería básica.
   - Huertas Agroecológicas Comunitarias: Manejo de suelo y soberanía alimentaria familiar.
   - Oficios Digitales: Iniciación en herramientas digitales y soporte, articulado con el Centro de Formación y ShopDigital.

3. LOGÍSTICA TERRESTRE Y FLOTA DE MONTAÑA:
   - Galpón de Acopio y Depósito Logístico ubicado en la base comunitaria de montaña con capacidad para 30 días de reserva estratégica.
   - Toyota Hilux 4x4: Vehículo todo terreno para alcanzar parajes escarpados, huellas de montaña, vados y zonas sin asfalto.
   - Minibús Mercedes-Benz Sprinter: Transporte masivo para traslado de voluntarios, familias, delegaciones y carga de grandes volúmenes hacia centros comunitarios y comedores.

4. SUSTENTO FINANCIERO Y MODELO DE TRANSPARENCIA:
   - La Fundación Valle de Luz no es una ONG precaria dependiente de subsidios estatales o donaciones accidentales.
   - Está respaldada financieramente por la empresa tecnológica SHOPDIGITAL (desarrollo de software e inteligencia artificial), asegurando la logística fija y el combustible.
   - Las donaciones externas y voluntariados se destinan en un 100% de forma directa y trazable al territorio.

5. VOLUNTARIADO Y CREDENCIAL DIGITAL (VL-2027):
   - Registro de voluntarios categorizado por especialidad: logística/choferes, educación/talleres, asistencia médica/enfermería, cocina comunitaria y oficios manuales.
   - Emisión instantánea de la Credencial Digital de Voluntario / Padrino con código único VL-2027-XXXX y código QR de validación.

6. MARCO LEGAL Y GOBERNANZA EN ARGENTINA:
   - Consejo de Administración integrado por Presidente (Director Waly), Secretario y Tesorero (Código Civil y Comercial de la Nación, Arts. 193 a 224).
   - Radicación legal en la Provincia de Córdoba ante la DGIPJ (Dirección General de Inspección de Personas Jurídicas) para máxima coherencia con el territorio de impacto.

=== INSTRUCCIONES DE RESPUESTA ===
- Responde siempre en español, con calidez, claridad y enfoque constructivo (máximo 2 a 3 párrafos).
- Si alguien desea colaborar, invítalo a inscribirse en el formulario de Voluntariado para obtener su Credencial Digital oficial.
- Si un comedor o paraje necesita asistencia, orienta sobre los canales de relevamiento y cómo contactar a la Dirección de Logística.
`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El campo message es requerido.' });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
    const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

    let reply = '';

    // 1. INTENTO CON GROQ CLOUD
    if (GROQ_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...(Array.isArray(history) ? history.slice(-6) : []),
              { role: 'user', content: message }
            ],
            temperature: 0.6,
            max_tokens: 600
          })
        });

        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('Fallo en conexión Groq:', err.message);
      }
    }

    // 2. INTENTO CON DEEPSEEK
    if (!reply && DEEPSEEK_KEY) {
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...(Array.isArray(history) ? history.slice(-6) : []),
              { role: 'user', content: message }
            ],
            temperature: 0.6,
            max_tokens: 600
          })
        });

        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('Fallo en conexión DeepSeek:', err.message);
      }
    }

    // 3. INTENTO CON OPENROUTER
    if (!reply && OPENROUTER_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen-2.5-72b-instruct',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...(Array.isArray(history) ? history.slice(-6) : []),
              { role: 'user', content: message }
            ],
            temperature: 0.6,
            max_tokens: 600
          })
        });

        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('Fallo en conexión OpenRouter:', err.message);
      }
    }

    // 4. MOTOR INTELIGENTE DE RESPALDO (Luz-03 Calibrado)
    if (!reply) {
      reply = generateCalibratedFallback(message);
    }

    return res.status(200).json({
      reply,
      agent: 'Luz-03',
      model: GROQ_KEY ? 'Llama 3.3 70B (Groq)' : (DEEPSEEK_KEY ? 'DeepSeek-V3' : 'Motor Calibrado Luz-03'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en /api/chat:', error);
    return res.status(500).json({
      error: 'Error interno al procesar el mensaje.',
      reply: 'Disculpas, estamos experimentando una breve intermitencia en el búnker logístico. Por favor, reintentá tu consulta o sumate como voluntario en el formulario oficial.'
    });
  }
};

function generateCalibratedFallback(text) {
  const q = text.toLowerCase();
  
  if (q.includes('donde') || q.includes('ubicac') || q.includes('traslasierra') || q.includes('parajes') || q.includes('cordoba')) {
    return 'La Fundación Valle de Luz opera en todo el Valle de Traslasierra, Córdoba. Nuestro centro de acopio y logística está en la base de montaña, y desde allí descendemos regularmente con nuestra flota hacia parajes rurales, escuelas y comedores en Panaholma, Villa Cura Brochero, Mina Clavero, Nono y parajes de difícil acceso.';
  }

  if (q.includes('voluntari') || q.includes('sumar') || q.includes('ayudar') || q.includes('colaborar') || q.includes('inscrib')) {
    return '¡Tu ayuda es fundamental! Convocamos a voluntarios en diversas áreas: choferes para logística 4x4, docentes de oficios comunitarios, médicos/enfermeros y personal para clasificación en el galpón de acopio. Al completar el formulario al pie de esta página, recibirás tu Credencial Digital de Voluntario (VL-2027) de forma instantánea.';
  }

  if (q.includes('comedor') || q.includes('merendero') || q.includes('alimento') || q.includes('comida') || q.includes('asistenc')) {
    return 'Articulamos una red de asistencia directa con comedores y merenderos comunitarios en parajes de Traslasierra. Entregamos alimentos no perecederos, insumos de cocina y organizamos jornadas recreativas y de capacitación para las familias.';
  }

  if (q.includes('taller') || q.includes('oficio') || q.includes('capacita') || q.includes('educa') || q.includes('aprender')) {
    return 'Promovemos la dignidad y autosustentabilidad a través de Talleres Comunitarios de Oficios: Ecotecnología solar e hídrica, Bioconstrucción, Huertas orgánicas, Costura y Alfabetización Digital. No solo asistimos en la emergencia, sino que brindamos herramientas de futuro.';
  }

  if (q.includes('flota') || q.includes('hilux') || q.includes('sprinter') || q.includes('camioneta') || q.includes('vehiculo') || q.includes('logist')) {
    return 'Nuestra logística de montaña cuenta con dos unidades clave: una Toyota Hilux 4x4 equipada para huellas escarpadas y parajes aislados de altura, y una Minibús Mercedes-Benz Sprinter para traslados masivos de voluntarios y distribución de grandes volúmenes de donaciones.';
  }

  if (q.includes('shopdigital') || q.includes('sustento') || q.includes('fondos') || q.includes('financ') || q.includes('dinero') || q.includes('transparenc')) {
    return 'La Fundación Valle de Luz cuenta con el respaldo económico y tecnológico de ShopDigital (empresa de software e IA). Esto garantiza los costos fijos operativos y el combustible, permitiendo que el 100% de las donaciones externas y recursos comunitarios lleguen íntegros a los beneficiarios.';
  }

  if (q.includes('legal') || q.includes('director') || q.includes('waly') || q.includes('estatuto') || q.includes('personeria') || q.includes('dgipj')) {
    return 'La Fundación está estructurada bajo el Código Civil y Comercial de la Nación (Arts. 193-224) ante la DGIPJ de la Provincia de Córdoba. El Consejo de Administración está presidido por el Director Waly (Director Ejecutivo) junto al Secretario y Tesorero, garantizando máxima legalidad y transparencia.';
  }

  if (q.includes('ecosistema') || q.includes('faro de luz') || q.includes('ministerio') || q.includes('4 pilares')) {
    return 'Somos el brazo de acción social del Ecosistema Faro de Luz, integrado por: 1) ShopDigital (sustento económico e IA), 2) Comunidad Faro de Luz (base ecotecnológica de montaña), 3) Fundación Valle de Luz (ayuda social y logística en Traslasierra), y 4) Ministerio Caminos de Fe (núcleo espiritual y pastoral).';
  }

  return '¡Hola! Soy Luz-03, la ingeniera de despliegue social y logística de la Fundación Valle de Luz en Traslasierra. Con gusto te oriento sobre nuestras campañas en comedores, los talleres de oficios, la logística con la flota 4x4 o cómo sumarte como voluntario y obtener tu Credencial Digital. ¿En qué puedo ayudarte hoy?';
}