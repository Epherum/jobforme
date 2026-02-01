from __future__ import annotations

import argparse
import json
from pathlib import Path

from jobscraper.sources.aneti import AnetiConfig, scrape_aneti


def load_state(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cdp", required=True, help="CDP url, e.g. http://172.25.192.1:9223")
    ap.add_argument("--state", default="data/aneti_state.json")
    ap.add_argument("--max-offers", type=int, default=25)
    args = ap.parse_args()

    cfg = AnetiConfig(cdp_url=args.cdp, max_offers=args.max_offers)
    jobs, _ = scrape_aneti(cfg)

    if not jobs:
        print("aneti_watch: no jobs")
        return 2

    first_id = jobs[0].external_id

    state_path = Path(args.state)
    state = load_state(state_path)
    last = state.get("last_first_id")

    if last is None:
        state["last_first_id"] = first_id
        save_state(state_path, state)
        print(f"aneti_watch: initialized last_first_id={first_id}")
        return 0

    if str(first_id) != str(last):
        state["last_first_id"] = first_id
        save_state(state_path, state)
        print(f"aneti_watch: NEW first offer (was different)")
        print(f"url: {jobs[0].url}")
        print(f"title: {jobs[0].title}")
        return 1

    print("aneti_watch: unchanged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
