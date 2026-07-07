#!/usr/bin/env python3
"""Deep-merge a translated namespace payload into messages/<locale>.json.

Usage: python3 scripts/i18n-merge-one.py <locale> <payload.json>
Incoming values win. Existing keys not present in the payload are untouched.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MESSAGES = ROOT / "messages"


def deep_merge(dst, src):
    for k, v in src.items():
        if k in dst and isinstance(dst[k], dict) and isinstance(v, dict):
            deep_merge(dst[k], v)
        else:
            dst[k] = v
    return dst


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    locale = sys.argv[1]
    payload = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    target = MESSAGES / f"{locale}.json"
    data = json.loads(target.read_text(encoding="utf-8"))
    deep_merge(data, payload)
    target.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"merged {sys.argv[2]} -> {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
