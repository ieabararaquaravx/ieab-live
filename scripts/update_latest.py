#!/usr/bin/env python3
import html
import json
import re
import subprocess
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

CHANNEL_URL = "https://www.youtube.com/@IEABLive"
STREAMS_URL = "https://www.youtube.com/@IEABLive/streams"
OUTPUT = Path("data/latest.json")


def baixar_url(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read().decode("utf-8", errors="ignore")


def remover_acentos(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto or "")
                   if unicodedata.category(c) != "Mn")


def normalizar_titulo(texto):
    texto = html.unescape(texto or "")
    texto = remover_acentos(texto).replace("&", " E ")
    return re.sub(r"\s+", " ", texto).strip().upper()


def extrair_data_do_titulo(title):
    match = re.search(r"(\d{2})[-/](\d{2})[-/](\d{4})", title or "")
    if not match:
        return None
    dd, mm, yyyy = match.groups()
    try:
        return datetime(int(yyyy), int(mm), int(dd), 12, 0, tzinfo=timezone.utc)
    except ValueError:
        return None


def data_candidato(item):
    data = extrair_data_do_titulo(item.get("title", ""))
    if data:
        return data
    valor = item.get("published", "")
    if valor:
        try:
            return datetime.fromisoformat(valor.replace("Z", "+00:00"))
        except ValueError:
            pass
    for campo in ("release_timestamp", "timestamp"):
        if item.get(campo):
            try:
                return datetime.fromtimestamp(int(item[campo]), tz=timezone.utc)
            except Exception:
                pass
    return datetime.min.replace(tzinfo=timezone.utc)


def detectar_tipo_culto(title, published=""):
    titulo = normalizar_titulo(title)
    if "CULTO PALAVRA" in titulo and "VIDA" in titulo:
        return "quarta"
    if "PALAVRA E VIDA" in titulo:
        return "quarta"
    if "CELEBRACOES DE VIDA" in titulo:
        return "domingo"
    data = extrair_data_do_titulo(title)
    if data:
        if data.weekday() == 2:
            return "quarta"
        if data.weekday() == 6:
            return "domingo"
    return "domingo"


def descobrir_channel_id():
    pagina = baixar_url(CHANNEL_URL)
    for padrao in (
        r'"channelId":"(UC[0-9A-Za-z_-]+)"',
        r'<meta itemprop="channelId" content="(UC[0-9A-Za-z_-]+)"',
        r'"externalId":"(UC[0-9A-Za-z_-]+)"',
    ):
        match = re.search(padrao, pagina)
        if match:
            return match.group(1)
    return "UChoJJJNDwXsPX4rL8keLTvQ"


def candidatos_ytdlp():
    cmd = [sys.executable, "-m", "yt_dlp", "--flat-playlist",
           "--playlist-end", "20", "--dump-single-json", "--no-warnings", STREAMS_URL]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "yt-dlp terminou com erro")
    dados = json.loads(proc.stdout)
    itens = []
    for entry in dados.get("entries") or []:
        if not entry or not entry.get("id"):
            continue
        video_id = entry["id"]
        itens.append({
            "video_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "title": entry.get("title") or "",
            "timestamp": entry.get("timestamp"),
            "release_timestamp": entry.get("release_timestamp"),
            "source": "youtube streams via yt-dlp",
        })
    return itens


def candidatos_html():
    pagina = baixar_url(STREAMS_URL)
    itens, vistos = [], set()
    padrao = re.compile(
        r'"videoId":"([0-9A-Za-z_-]{11})".{0,2500}?"title":\{"runs":\[\{"text":"(.*?)"\}', re.S)
    for video_id, titulo in padrao.findall(pagina):
        if video_id in vistos:
            continue
        vistos.add(video_id)
        try:
            titulo = json.loads(f'"{titulo}"')
        except Exception:
            titulo = titulo.replace(r'\u0026', '&').replace(r'\"', '"')
        itens.append({
            "video_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "title": html.unescape(titulo),
            "source": "youtube streams html",
        })
    return itens[:30]


def candidatos_rss(channel_id):
    root = ET.fromstring(baixar_url(
        f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"))
    ns = {"atom": "http://www.w3.org/2005/Atom",
          "yt": "http://www.youtube.com/xml/schemas/2015"}
    itens = []
    for entry in root.findall("atom:entry", ns):
        video_id = entry.findtext("yt:videoId", default="", namespaces=ns)
        if video_id:
            itens.append({
                "video_id": video_id,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "title": entry.findtext("atom:title", default="", namespaces=ns),
                "published": entry.findtext("atom:published", default="", namespaces=ns),
                "source": "youtube rss",
            })
    return itens


def ler_atual():
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8"))
    except Exception:
        return None


def main():
    channel_id = descobrir_channel_id()
    atual = ler_atual()
    candidatos, avisos = [], []
    for nome, func in (("yt-dlp", candidatos_ytdlp),
                       ("html", candidatos_html),
                       ("rss", lambda: candidatos_rss(channel_id))):
        try:
            encontrados = func()
            candidatos.extend(encontrados)
            print(f"{nome}: {len(encontrados)} candidato(s)", file=sys.stderr)
        except Exception as erro:
            avisos.append(f"{nome}: {erro}")
            print(avisos[-1], file=sys.stderr)

    # Proteção importante: o registro atual também participa da comparação.
    # Assim, um RSS atrasado nunca regride para uma transmissão mais antiga.
    if atual and atual.get("video_id") and atual.get("title"):
        candidatos.append(dict(atual))

    validos = [c for c in candidatos if c.get("video_id") and c.get("title")]
    if not validos:
        raise RuntimeError("Nenhuma transmissão válida foi encontrada")

    escolhido = max(validos, key=data_candidato)
    published = escolhido.get("published") or ""
    if not published:
        data = data_candidato(escolhido)
        if data.year > 1900:
            published = data.isoformat()

    resultado = {
        "url": escolhido.get("url") or f"https://www.youtube.com/watch?v={escolhido['video_id']}",
        "title": escolhido["title"],
        "video_id": escolhido["video_id"],
        "published": published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": escolhido.get("source") or "youtube",
        "service_type": detectar_tipo_culto(escolhido["title"], published),
        "channel_id": channel_id,
    }
    if avisos:
        resultado["warnings"] = avisos

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(resultado, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
