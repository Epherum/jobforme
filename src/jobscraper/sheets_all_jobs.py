from __future__ import annotations

import csv
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import List


@dataclass
class AllJobsSheetConfig:
    sheet_id: str
    tab: str = "All jobs"
    account: str = "wassimfekih2@gmail.com"


def _run_gog(args: List[str]) -> None:
    proc = subprocess.run(args, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"gog failed: {' '.join(args)}\n{proc.stderr}\n{proc.stdout}")


def clear_tab(cfg: AllJobsSheetConfig) -> None:
    # Clear a generous range.
    _run_gog(["gog", "sheets", "clear", cfg.sheet_id, f"{cfg.tab}!A1:Z", "--account", cfg.account])


def write_all_jobs_csv_to_sheet(cfg: AllJobsSheetConfig, csv_path: Path, batch_rows: int = 400) -> int:
    """Overwrite the All jobs tab from a local CSV.

    Uses update for header then append in batches.
    Returns number of data rows uploaded.
    """

    with csv_path.open("r", encoding="utf-8") as f:
        rows = list(csv.reader(f))

    if not rows:
        return 0

    header, data = rows[0], rows[1:]

    clear_tab(cfg)

    _run_gog(
        [
            "gog",
            "sheets",
            "update",
            cfg.sheet_id,
            f"{cfg.tab}!A1:{chr(ord('A') + len(header) - 1)}1",
            "--account",
            cfg.account,
            "--values-json",
            json.dumps([header], ensure_ascii=False),
            "--input",
            "USER_ENTERED",
        ]
    )

    # Append in batches
    i = 0
    while i < len(data):
        chunk = data[i : i + batch_rows]
        _run_gog(
            [
                "gog",
                "sheets",
                "append",
                cfg.sheet_id,
                f"{cfg.tab}!A:Z",
                "--account",
                cfg.account,
                "--values-json",
                json.dumps(chunk, ensure_ascii=False),
                "--insert",
                "INSERT_ROWS",
            ]
        )
        i += batch_rows

    return len(data)
