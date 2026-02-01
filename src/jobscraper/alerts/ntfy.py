from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import requests


DEFAULT_SERVER = "https://ntfy.sh"
DEFAULT_TOPIC_FILE = Path("data/ntfy_topic.txt")


@dataclass(frozen=True)
class NtfyConfig:
    server: str = DEFAULT_SERVER
    topic: str = ""
    token: str = ""  # optional (for private/self-hosted auth)


def load_topic(
    *,
    topic: Optional[str] = None,
    topic_file: Path = DEFAULT_TOPIC_FILE,
    env_key: str = "NTFY_TOPIC",
) -> str:
    if topic:
        return topic.strip()

    env = (os.getenv(env_key) or "").strip()
    if env:
        return env

    if topic_file.exists():
        t = topic_file.read_text(encoding="utf-8").strip()
        if t:
            return t

    return ""


def send(
    *,
    message: str,
    title: Optional[str] = None,
    topic: Optional[str] = None,
    server: str = DEFAULT_SERVER,
    tags: Optional[Iterable[str]] = None,
    priority: Optional[int] = None,
    click: Optional[str] = None,
    token: str = "",
    timeout_s: int = 15,
) -> None:
    t = load_topic(topic=topic)
    if not t:
        raise RuntimeError("ntfy topic not configured. Set NTFY_TOPIC or data/ntfy_topic.txt")

    url = server.rstrip("/") + "/" + t

    headers = {}
    if title:
        headers["Title"] = title
    if tags:
        headers["Tags"] = ",".join(tags)
    if priority is not None:
        headers["Priority"] = str(priority)
    if click:
        headers["Click"] = click
    if token:
        headers["Authorization"] = f"Bearer {token}"

    resp = requests.post(url, data=message.encode("utf-8"), headers=headers, timeout=timeout_s)
    resp.raise_for_status()


def send_many(
    *,
    title: str,
    lines: list[str],
    topic: Optional[str] = None,
    server: str = DEFAULT_SERVER,
    tags: Optional[Iterable[str]] = None,
    priority: Optional[int] = None,
    click: Optional[str] = None,
    token: str = "",
    max_chars: int = 3500,
) -> None:
    """Send multiple ntfy messages if content is too long.

    ntfy doesn’t have a hard documented limit, but some clients truncate.
    We chunk defensively.
    """

    buf: list[str] = []
    size = 0

    def flush(i: int) -> None:
        if not buf:
            return
        send(
            title=f"{title} ({i})" if i > 1 else title,
            message="\n".join(buf),
            topic=topic,
            server=server,
            tags=tags,
            priority=priority,
            click=click,
            token=token,
        )

    part = 1
    for ln in lines:
        ln = ln.rstrip()
        if not ln:
            continue
        if size + len(ln) + 1 > max_chars and buf:
            flush(part)
            part += 1
            buf = []
            size = 0
        buf.append(ln)
        size += len(ln) + 1

    flush(part)
