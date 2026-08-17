// IEAB Live - V2
// Esta versao usa data/latest.json, atualizado automaticamente pelo GitHub Actions.

const IEAB_CONFIG = {
  canal: "https://www.youtube.com/@IEABLive",
  streams: "https://www.youtube.com/@IEABLive/streams",
  fallback: "https://www.youtube.com/@IEABLive/streams",
  latestJson: "data/latest.json",
  horarios: {
    abertura: 0,
    agenda: 18 * 60,
    ofertorio: 25 * 60,
    ebd: 30 * 60,
    intercessao: 40 * 60,
    louvor: 55 * 60,
    mensagem: 65 * 60,
    louvorFinal: 110 * 60
  }
};

function montarUrlComTempo(url, segundos) {
  if (!url || segundos === null || segundos === undefined || segundos <= 0) {
    return url;
  }

  // Para YouTube, o formato &t=3900 funciona em watch?v=...
  const separador = url.includes("?") ? "&" : "?";
  return `${url}${separador}t=${segundos}`;
}

async function obterUltimaTransmissao() {
  try {
    const resposta = await fetch(IEAB_CONFIG.latestJson, { cache: "no-store" });
    if (!resposta.ok) throw new Error("latest.json indisponivel");
    const dados = await resposta.json();
    if (dados && dados.url) return dados;
  } catch (erro) {
    console.warn("Nao foi possivel ler data/latest.json", erro);
  }

  return {
    url: IEAB_CONFIG.fallback,
    title: "Transmissoes IEAB Live",
    source: "fallback"
  };
}

async function abrirUltimaTransmissao(offsetSegundos = 0) {
  const dados = await obterUltimaTransmissao();
  const destino = montarUrlComTempo(dados.url, offsetSegundos);
  window.location.href = destino || IEAB_CONFIG.fallback;
}

async function abrirMomento(nomeMomento) {
  const offset = IEAB_CONFIG.horarios[nomeMomento] ?? 0;
  await abrirUltimaTransmissao(offset);
}

async function preencherStatusUltimaTransmissao() {
  const status = document.getElementById("latest-status");
  const link = document.getElementById("latest-link");
  if (!status || !link) return;

  const dados = await obterUltimaTransmissao();
  status.textContent = dados.title || "Ultima transmissao encontrada";
  link.href = dados.url || IEAB_CONFIG.fallback;
  link.style.display = "inline-block";

  const publicado = document.getElementById("latest-published");
  if (publicado && dados.published) {
    publicado.textContent = `Publicado em: ${dados.published}`;
  }
}
