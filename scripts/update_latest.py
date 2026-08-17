#!/usr/bin/env python3
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

CHANNEL_STREAMS_URL = "https://www.youtube.com/@IEABLive/streams"
OUTPUT = Path("data/latest.json")


def run_ytdlp(url):
    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--dump-json",
        "--playlist-end",
        "1",
        "--no-warnings",
        url,
    ]
    completed = subprocess.run(cmd, capture_output=True, text=True, check=True)
    lines = [line.strip() for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise RuntimeError("yt-dlp nao retornou videos")
    return json.loads(lines[0])


def main():
    video = run_ytdlp(CHANNEL_STREAMS_URL)
    video_id = video.get("id", "")
    webpage_url = video.get("webpage_url") or (f"https://www.youtube.com/watch?v={video_id}" if video_id else CHANNEL_STREAMS_URL)

    data = {
        "url": webpage_url,
        "title": video.get("title") or "Ultima transmissao IEAB Live",
        "video_id": video_id,
        "published": video.get("upload_date") or video.get("release_date") or "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "yt-dlp @IEABLive/streams"
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "
", encoding="utf-8")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
