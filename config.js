// Configuracao central dos links da IEAB
// Canal: https://www.youtube.com/@IEABLive

const IEAB_CONFIG = {
  canal: "https://www.youtube.com/@IEABLive",
  live: "https://www.youtube.com/@IEABLive/live",
  whatsapp: "", // Opcional: coloque aqui o link do WhatsApp da igreja
  horarios: {
    abertura: 0,          // 19:00 - 0:00
    agenda: 18 * 60,     // 19:18 - 0:18:00
    ofertorio: 25 * 60,  // 19:25 - 0:25:00
    ebd: 30 * 60,        // 19:30 - 0:30:00
    intercessao: 40 * 60,// 19:40 - 0:40:00
    louvor: 55 * 60,     // 19:55 - 0:55:00
    mensagem: 65 * 60,   // 20:05 - 1:05:00
    louvorFinal: 110 * 60// 20:50 - 1:50:00
  }
};

function abrirLive(offsetSegundos = null) {
  let url = IEAB_CONFIG.live;
  if (offsetSegundos !== null && offsetSegundos > 0) {
    url = `${url}?t=${offsetSegundos}`;
  }
  window.location.href = url;
}

function abrirMomento(nomeMomento) {
  const offset = IEAB_CONFIG.horarios[nomeMomento] ?? 0;
  abrirLive(offset);
}
