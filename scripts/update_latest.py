#!/usr/bin/env python3
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

CHANNEL_URL = "https://www.youtube.com/@IEABLive"
FALLBACK_URL = "https://www.youtube.com/@IEABLive/videos"
OUTPUT = Path("data/latest.json")


def baixar_url(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", errors="ignore")


def descobrir_channel_id():
    html = baixar_url(CHANNEL_URL)

    padroes = [
        r'"channelId":"(UC[0-9A-Za-z_-]+)"',
        r'<meta itemprop="channelId" content="(UC[0-9A-Za-z_-]+)"',
        r'"externalId":"(UC[0-9A-Za-z_-]+)"'
    ]

    for padrao in padroes:
        match = re.search(padrao, html)
        if match:
            return match.group(1)

    raise RuntimeError("Nao foi possivel localizar o channel_id do YouTube")


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

    title = entry.findtext(
        "atom:title",
        default="Ultima transmissao IEAB Live",
        namespaces=ns
    )

    video_id = entry.findtext(
        "yt:videoId",
        default="",
        namespaces=ns
    )

    published = entry.findtext(
        "atom:published",
        default="",
        namespaces=ns
    )

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
        "source": "youtube rss"
    }


def escrever_json(data):
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    OUTPUT.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )

    print(json.dumps(data, ensure_ascii=False, indent=2))


def main():
    try:
        channel_id = descobrir_channel_id()
        data = obter_ultimo_video_por_rss(channel_id)
        data["channel_id"] = channel_id
        escrever_json(data)

    except Exception as erro:
        data = {
            "url": FALLBACK_URL,
            "title": "Transmissoes IEAB Live",
            "video_id": "",
            "published": "",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "fallback",
            "error": str(erro)
        }
        escrever_json(data)


if __name__ == "__main__":
    main()
