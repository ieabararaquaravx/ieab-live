#!/usr/bin/env python3
import html
import json
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

CHANNEL_URL = "https://www.youtube.com/@IEABLive"
FALLBACK_URL = "https://www.youtube.com/@IEABLive/stream"
OUTPUT = Path("data/latest.json")


def baixar_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", errors="ignore")


def descobrir_channel_id():
    pagina = baixar_url(CHANNEL_URL)
    padroes = [
        r'"channelId":"(UC[0-9A-Za-z_-]+)"',
        r'<meta itemprop="channelId" content="(UC[0-9A-Za-z_-]+)"',
        r'"externalId":"(UC[0-9A-Za-z_-]+)"'
    ]
    for padrao in padroes:
        match = re.search(padrao, pagina)
        if match:
            return match.group(1)
    raise RuntimeError("Nao foi possivel localizar o channel_id do YouTube")


def remover_acentos(texto):
    return ''.join(
        c for c in unicodedata.normalize('NFD', texto or '')
        if unicodedata.category(c) != 'Mn'
    )


def normalizar_titulo(texto):
    texto = html.unescape(texto or '')
    texto = remover_acentos(texto)
    texto = texto.replace('&', ' E ')
    texto = re.sub(r'\s+', ' ', texto)
    return texto.strip().upper()


def extrair_data_do_titulo(title):
    match = re.search(r'(\d{2})-(\d{2})-(\d{4})', title or '')
    if not match:
        return None
    dd, mm, yyyy = match.groups()
    return datetime(int(yyyy), int(mm), int(dd), 12, 0, 0)


def detectar_tipo_culto(title, published):
    titulo = normalizar_titulo(title)

    if 'CULTO PALAVRA' in titulo and 'VIDA' in titulo:
        return 'quarta'
    if 'PALAVRA E VIDA' in titulo:
        return 'quarta'
    if 'CULTO CELEBRACOES DE VIDA' in titulo:
        return 'domingo'
    if 'CELEBRACOES DE VIDA' in titulo:
        return 'domingo'

    data_titulo = extrair_data_do_titulo(title)
    if data_titulo:
        if data_titulo.weekday() == 2:
            return 'quarta'
        if data_titulo.weekday() == 6:
            return 'domingo'

    try:
        data = datetime.fromisoformat((published or '').replace('Z', '+00:00'))
        if data.weekday() == 2:
            return 'quarta'
        if data.weekday() == 6:
            return 'domingo'
    except Exception:
        pass

    return 'domingo'


def obter_ultimo_video_por_rss(channel_id):
    feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    xml_text = baixar_url(feed_url)
    root = ET.fromstring(xml_text)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015"
    }
    entry = root.find("atom:entry", ns)
    if entry is None:
        raise RuntimeError("RSS do YouTube nao retornou videos")

    title = entry.findtext("atom:title", default="Ultima transmissao IEAB Live", namespaces=ns)
    video_id = entry.findtext("yt:videoId", default="", namespaces=ns)
    published = entry.findtext("atom:published", default="", namespaces=ns)
    link = entry.find("atom:link", ns)

    if link is not None and link.get("href"):
        url = link.get("href")
    elif video_id:
        url = f"https://www.youtube.com/watch?v={video_id}"
    else:
        url = FALLBACK_URL

    return {
        "url": url,
        "title": title,
        "video_id": video_id,
        "published": published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "youtube rss",
        "service_type": detectar_tipo_culto(title, published)
    }


def escrever_json(data):
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(data, ensure_ascii=False, indent=2))


def main():
    try:
        channel_id = descobrir_channel_id()
        data = obter_ultimo_video_por_rss(channel_id)
        data["channel_id"] = channel_id
        escrever_json(data)
    except Exception as erro:
        escrever_json({
            "url": FALLBACK_URL,
            "title": "Transmissao IEAB Live",
            "video_id": "",
            "published": "",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "fallback",
            "service_type": "domingo",
            "error": str(erro)
        })


if __name__ == "__main__":
    main()
