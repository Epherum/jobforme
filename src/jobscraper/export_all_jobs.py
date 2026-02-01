from __future__ import annotations

import csv
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional


@dataclass
class ExportConfig:
    db_path: Path = Path("data/jobs.sqlite3")
    out_csv: Path = Path("data/all_jobs.csv")


COLUMNS = [
    "source",
    "external_id",
    "title",
    "company",
    "location",
    "url",
    "posted_at",
    "first_seen_at",
    "last_seen_at",
]


def export_all_jobs_csv(cfg: ExportConfig | None = None) -> Path:
    cfg = cfg or ExportConfig()
    cfg.out_csv.parent.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(str(cfg.db_path))
    cur = con.cursor()
    cur.execute(
        """
        SELECT source, external_id, title, company, location, url,
               posted_at, first_seen_at, last_seen_at
        FROM jobs
        ORDER BY first_seen_at DESC
        """
    )

    with cfg.out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(COLUMNS)
        for row in cur.fetchall():
            w.writerow(list(row))

    con.close()
    return cfg.out_csv
