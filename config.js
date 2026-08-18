// IEAB Live V3.2 - Ultima transmissao + liturgia por tipo de culto
// Regras principais:
// - Sempre usa a ultima transmissao encontrada no YouTube via data/latest.json.
// - Se o titulo tiver "CULTO CELEBRACOES DE VIDA", usa liturgia de domingo.
// - Se o titulo tiver "CULTO PALAVRA & VIDA" ou "CULTO PALAVRA E VIDA", usa liturgia de quarta-feira.
// - Fallback de navegacao do canal: https://www.youtube.com/@IEABLive/streams

const IEAB_CONFIG = {
  canal: "https://www.youtube.com/@IEABLive",
  transmissaoCanal: "https://www.youtube.com/@IEABLive/streams",
  fallback: "https://www.youtube.com/@IEABLive/streams",
  latestJson: "data/latest.json",
  timezone: "America/Sao_Paulo",
  liturgias: {
    domingo: {
      nome: "Culto Celebrações de Vida",
      dia: "Domingo",
      inicio: "19h00",
      descricao: "",
      badge: "Celebrações de Vida",
      momentos: [
        { key: "abertura", icon: "🙌", hora: "19h00", titulo: "Abertura", subtitulo: "Oração inicial e louvores", offset: 0 },
        { key: "agenda", icon: "📋", hora: "19h18", titulo: "Agenda", subtitulo: "Avisos e programação da semana", offset: 18 * 60 },
        { key: "ofertorio", icon: "🤲", hora: "19h25", titulo: "Ofertório", subtitulo: "Momento de contribuição", offset: 25 * 60 },
        { key: "intercessao", icon: "🙏", hora: "19h30", titulo: "Intercessão", subtitulo: "Momento de oração pela igreja e pedidos", offset: 30 * 60 },
        { key: "louvor", icon: "🎵", hora: "19h45", titulo: "Ministério de Louvor", subtitulo: "Louvores de celebração e adoração", offset: 45 * 60 },
        { key: "mensagem", icon: "📖", hora: "19h55", titulo: "Mensagem", subtitulo: "Ministração da Palavra", offset: 55 * 60 },
        { key: "louvorFinal", icon: "🎶", hora: "20h50", titulo: "Louvor Final", subtitulo: "Encerramento do culto", offset: 110 * 60 }
      ]
    },
    quarta: {
      nome: "Culto Palavra & Vida",
      dia: "Quarta-feira",
      inicio: "19h30",
      descricao: "",
      badge: "Palavra & Vida",
      momentos: [
        { key: "abertura", icon: "📖", hora: "19h30", titulo: "Abertura", subtitulo: "Início do culto Palavra & Vida", offset: 0 },
        { key: "louvor1", icon: "🎵", hora: "19h40", titulo: "1 Louvor", subtitulo: "Ministério de Louvor", offset: 10 * 60 },
        { key: "agenda", icon: "📋", hora: "19h50", titulo: "Agenda", subtitulo: "Avisos e programação", offset: 20 * 60 },
        { key: "ofertorio", icon: "🤲", hora: "20h00", titulo: "Ofertório", subtitulo: "Momento de contribuição", offset: 30 * 60 },
        { key: "louvor2", icon: "🎵", hora: "20h10", titulo: "1 Louvor", subtitulo: "Ministério de Louvor", offset: 40 * 60 },
        { key: "pregacao", icon: "⛪", hora: "20h20", titulo: "Pregação", subtitulo: "Ministração da Palavra", offset: 50 * 60 },
        { key: "louvorFinal", icon: "🎶", hora: "21h10", titulo: "Louvor Final", subtitulo: "Encerramento", offset: 100 * 60 }
      ]
    }
  }
};

function removerAcentos(texto) {
  return (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizarTitulo(texto) {
  const div = document.createElement('textarea');
  div.innerHTML = texto || '';
  return removerAcentos(div.value)
    .replace(/&/g, ' E ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function extrairDataDoTitulo(titulo) {
  const match = (titulo || '').match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return new Date(`${yyyy}-${mm}-${dd}T12:00:00-03:00`);
}

function normalizarDataPublicacao(valor) {
  if (!valor) return null;
  if (/^\d{8}$/.test(valor)) {
    const y = valor.slice(0,4), m = valor.slice(4,6), d = valor.slice(6,8);
    return new Date(`${y}-${m}-${d}T12:00:00-03:00`);
  }
  const data = new Date(valor);
  return isNaN(data.getTime()) ? null : data;
}

function weekdaySaoPaulo(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: IEAB_CONFIG.timezone
  }).format(date);
}

function detectarLiturgia(dados) {
  if (dados && dados.service_type && IEAB_CONFIG.liturgias[dados.service_type]) {
    return dados.service_type;
  }

  const tituloOriginal = (dados && dados.title) || '';
  const titulo = normalizarTitulo(tituloOriginal);

  if (titulo.includes('CULTO PALAVRA') && titulo.includes('VIDA')) return 'quarta';
  if (titulo.includes('PALAVRA E VIDA')) return 'quarta';
  if (titulo.includes('CULTO CELEBRACOES DE VIDA')) return 'domingo';
  if (titulo.includes('CELEBRACOES DE VIDA')) return 'domingo';

  const dataTitulo = extrairDataDoTitulo(tituloOriginal);
  const diaTitulo = weekdaySaoPaulo(dataTitulo);
  if (diaTitulo === 'Wed') return 'quarta';
  if (diaTitulo === 'Sun') return 'domingo';

  const dataPublicacao = normalizarDataPublicacao(dados && dados.published);
  const diaPublicacao = weekdaySaoPaulo(dataPublicacao);
  if (diaPublicacao === 'Wed') return 'quarta';
  if (diaPublicacao === 'Sun') return 'domingo';

  return 'domingo';
}

async function obterUltimaTransmissao() {
  try {
    const resposta = await fetch(IEAB_CONFIG.latestJson, { cache: 'no-store' });
    if (!resposta.ok) throw new Error('latest.json indisponivel');
    const dados = await resposta.json();
    if (dados && dados.url) return dados;
  } catch (erro) {
    console.warn('Nao foi possivel ler data/latest.json', erro);
  }
  return { url: IEAB_CONFIG.fallback, title: 'Transmissão IEAB Live', source: 'fallback', service_type: 'domingo' };
}

function montarUrlComTempo(url, segundos) {
  if (!url || !segundos || segundos <= 0) return url || IEAB_CONFIG.fallback;
  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}t=${segundos}`;
}

async function abrirUltimaTransmissao(offsetSegundos = 0) {
  const dados = await obterUltimaTransmissao();
  const urlBase = dados.url || IEAB_CONFIG.fallback;
  window.location.href = montarUrlComTempo(urlBase, offsetSegundos);
}

async function abrirMomento(key) {
  const dados = await obterUltimaTransmissao();
  const tipo = detectarLiturgia(dados);
  const liturgia = IEAB_CONFIG.liturgias[tipo];
  const momento = liturgia.momentos.find(m => m.key === key);
  await abrirUltimaTransmissao(momento ? momento.offset : 0);
}

async function abrirPalavra() {
  const dados = await obterUltimaTransmissao();
  const tipo = detectarLiturgia(dados);
  await abrirMomento(tipo === 'quarta' ? 'pregacao' : 'mensagem');
}

function formatarDataPublicacao(valor) {
  const data = normalizarDataPublicacao(valor);
  if (!data) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: IEAB_CONFIG.timezone,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(data);
}

function gerarLinhaLiturgia(momento) {
  const item = document.createElement('button');
  item.className = 'timeline-item';
  item.type = 'button';
  item.onclick = () => abrirUltimaTransmissao(momento.offset);
  item.innerHTML = `
    <span class="timeline-icon">${momento.icon}</span>
    <span class="timeline-time">${momento.hora}</span>
    <span class="timeline-copy">
      <strong>${momento.titulo}</strong>
      <small>${momento.subtitulo}</small>
    </span>
    <span class="timeline-action">Abrir</span>
  `;
  return item;
}

async function carregarPagina() {
  const dados = await obterUltimaTransmissao();
  const tipo = detectarLiturgia(dados);
  const liturgia = IEAB_CONFIG.liturgias[tipo];

  document.body.classList.toggle('quarta', tipo === 'quarta');
  document.body.classList.toggle('domingo', tipo === 'domingo');

  document.getElementById('service-badge').textContent = 'Última transmissão encontrada';
  document.getElementById('service-name').textContent = dados.title || 'Última transmissão IEAB Live';
  const serviceDayEl = document.getElementById('service-day');
  if (serviceDayEl) serviceDayEl.remove();
  document.getElementById('channel-stream').href = IEAB_CONFIG.transmissaoCanal;

  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  liturgia.momentos.forEach(momento => timeline.appendChild(gerarLinhaLiturgia(momento)));
}
