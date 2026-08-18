// IEAB Live V3 - Layout + liturgia inteligente
// A pagina identifica se a ultima transmissao foi domingo ou quarta-feira
// usando data/latest.json, atualizado pelo GitHub Actions.

const IEAB_CONFIG = {
  canal: "https://www.youtube.com/@IEABLive",
  fallback: "https://www.youtube.com/@IEABLive/videos",
  latestJson: "data/latest.json",
  timezone: "America/Sao_Paulo",
  liturgias: {
    domingo: {
      nome: "Culto Celebrações de Vida",
      dia: "Domingo",
      base: "Transmissão iniciando às 18h30",
      tema: "celebracao",
      momentos: [
        { key: "intercessaoAntes", icon: "🙏", hora: "18h30", titulo: "Intercessão antes do culto", subtitulo: "Oração inicial pelos pedidos e pela igreja", offset: 0 },
        { key: "preparacao", icon: "⏱️", hora: "18h50", titulo: "Momento de preparação", subtitulo: "Preparação para o início do culto", offset: 20 * 60 },
        { key: "abertura", icon: "🙌", hora: "19h00", titulo: "Abertura", subtitulo: "Oração inicial e louvores", offset: 30 * 60 },
        { key: "agenda", icon: "📋", hora: "19h18", titulo: "Agenda", subtitulo: "Avisos e programação da semana", offset: 48 * 60 },
        { key: "ofertorio", icon: "🤲", hora: "19h25", titulo: "Ofertório", subtitulo: "Momento de contribuição", offset: 55 * 60 },
        { key: "intercessao", icon: "🙏", hora: "19h30", titulo: "Intercessão", subtitulo: "Momento de oração pela igreja e pedidos", offset: 60 * 60 },
        { key: "louvor", icon: "🎵", hora: "19h45", titulo: "Ministério de Louvor", subtitulo: "Louvores de celebração e adoração", offset: 75 * 60 },
        { key: "mensagem", icon: "📖", hora: "19h55", titulo: "Mensagem", subtitulo: "Ministração da Palavra", offset: 85 * 60 },
        { key: "louvorFinal", icon: "🎶", hora: "20h50", titulo: "Louvor final", subtitulo: "Encerramento do culto", offset: 140 * 60 }
      ]
    },
    quarta: {
      nome: "Culto Palavra e Vida",
      dia: "Quarta-feira",
      base: "Sequência configurável da liturgia de quarta-feira",
      tema: "palavra",
      momentos: [
        { key: "intercessaoAntes", icon: "🙏", hora: "Início", titulo: "Intercessão antes do culto", subtitulo: "Momento de oração antes da abertura", offset: 0 },
        { key: "abertura", icon: "📖", hora: "+15min", titulo: "Abertura", subtitulo: "Início do culto Palavra e Vida", offset: 15 * 60 },
        { key: "louvor1", icon: "🎵", hora: "+25min", titulo: "1 Louvor", subtitulo: "Ministério de Louvor", offset: 25 * 60 },
        { key: "agenda", icon: "📋", hora: "+35min", titulo: "Agenda", subtitulo: "Avisos e programação", offset: 35 * 60 },
        { key: "ofertorio", icon: "🤲", hora: "+45min", titulo: "Ofertório", subtitulo: "Momento de contribuição", offset: 45 * 60 },
        { key: "louvor2", icon: "🎵", hora: "+55min", titulo: "1 Louvor", subtitulo: "Ministério de Louvor", offset: 55 * 60 },
        { key: "pregacao", icon: "⛪", hora: "+65min", titulo: "Pregação", subtitulo: "Ministração da Palavra", offset: 65 * 60 },
        { key: "louvorFinal", icon: "🎶", hora: "+110min", titulo: "Louvor final", subtitulo: "Encerramento", offset: 110 * 60 }
      ]
    }
  }
};

function removerAcentos(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizarTitulo(texto) {
  return removerAcentos(texto || '')
    .replace(/&amp;/gi, '&')
    .replace(/&/g, ' E ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function extrairDataDoTitulo(titulo) {
  // Formato esperado no canal: 12-08-2026 - CULTO PALAVRA & VIDA
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
  const short = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: IEAB_CONFIG.timezone
  }).format(date);
  return short;
}

function detectarLiturgia(dados) {
  if (dados && dados.service_type && IEAB_CONFIG.liturgias[dados.service_type]) {
    return dados.service_type;
  }

  const tituloOriginal = (dados && dados.title) || '';
  const titulo = normalizarTitulo(tituloOriginal);

  // Padrões reais usados no canal:
  // 12-08-2026 - CULTO PALAVRA & VIDA
  // 16-08-2026 - CULTO CELEBRAÇÕES DE VIDA
  if (titulo.includes('CULTO PALAVRA') && titulo.includes('VIDA')) return 'quarta';
  if (titulo.includes('PALAVRA E VIDA')) return 'quarta';
  if (titulo.includes('CULTO CELEBRACOES DE VIDA')) return 'domingo';
  if (titulo.includes('CELEBRACOES DE VIDA')) return 'domingo';

  // Se o título tiver data, usa a data do próprio nome do vídeo.
  const dataTitulo = extrairDataDoTitulo(tituloOriginal);
  const diaTitulo = weekdaySaoPaulo(dataTitulo);
  if (diaTitulo === 'Wed') return 'quarta';
  if (diaTitulo === 'Sun') return 'domingo';

  // Fallback por data de publicação do RSS.
  const data = normalizarDataPublicacao(dados && dados.published);
  const dia = weekdaySaoPaulo(data);
  if (dia === 'Wed') return 'quarta';
  if (dia === 'Sun') return 'domingo';

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
  return { url: IEAB_CONFIG.fallback, title: 'Transmissões IEAB Live', source: 'fallback' };
}

function montarUrlComTempo(url, segundos) {
  if (!url || !segundos || segundos <= 0) return url;
  const separador = url.includes('?') ? '&' : '?';
  return `${url}${separador}t=${segundos}`;
}

async function abrirUltimaTransmissao(offsetSegundos = 0) {
  const dados = await obterUltimaTransmissao();
  window.location.href = montarUrlComTempo(dados.url || IEAB_CONFIG.fallback, offsetSegundos);
}


async function abrirPalavra() {
  const dados = await obterUltimaTransmissao();
  const tipo = detectarLiturgia(dados);
  const liturgia = IEAB_CONFIG.liturgias[tipo];
  const key = tipo === 'quarta' ? 'pregacao' : 'mensagem';
  const momento = liturgia.momentos.find(m => m.key === key);
  await abrirUltimaTransmissao(momento ? momento.offset : 0);
}

async function abrirMomento(key) {
  const dados = await obterUltimaTransmissao();
  const tipo = detectarLiturgia(dados);
  const liturgia = IEAB_CONFIG.liturgias[tipo];
  const momento = liturgia.momentos.find(m => m.key === key) || liturgia.momentos.find(m => m.titulo.toLowerCase().includes(key.toLowerCase()));
  await abrirUltimaTransmissao(momento ? momento.offset : 0);
}

function formatarDataPublicacao(valor) {
  const data = normalizarDataPublicacao(valor);
  if (!data) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: IEAB_CONFIG.timezone,
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(data);
}

async function carregarPagina() {
  const dados = await obterUltimaTransmissao();
  const tipo = detectarLiturgia(dados);
  const liturgia = IEAB_CONFIG.liturgias[tipo];
  document.body.classList.add(`tema-${liturgia.tema}`);

  const serviceName = document.getElementById('service-name');
  const serviceDay = document.getElementById('service-day');
  const latestTitle = document.getElementById('latest-title');
  const latestDate = document.getElementById('latest-date');
  const latestLink = document.getElementById('latest-link');
  const timeline = document.getElementById('timeline');

  if (serviceName) serviceName.textContent = liturgia.nome;
  if (serviceDay) serviceDay.textContent = `${liturgia.dia} • ${liturgia.base}`;
  if (latestTitle) latestTitle.textContent = dados.title || 'Última transmissão IEAB Live';
  if (latestDate) latestDate.textContent = formatarDataPublicacao(dados.published) || 'Data não informada';
  if (latestLink) latestLink.href = dados.url || IEAB_CONFIG.fallback;

  if (timeline) {
    timeline.innerHTML = '';
    liturgia.momentos.forEach((m, idx) => {
      const item = document.createElement('button');
      item.className = 'timeline-item';
      item.type = 'button';
      item.onclick = () => abrirUltimaTransmissao(m.offset);
      item.innerHTML = `
        <span class="timeline-icon">${m.icon}</span>
        <span class="timeline-time">${m.hora}</span>
        <span class="timeline-copy">
          <strong>${m.titulo}</strong>
          <small>${m.subtitulo}</small>
        </span>
        <span class="timeline-arrow">Abrir</span>
      `;
      timeline.appendChild(item);
    });
  }
}
