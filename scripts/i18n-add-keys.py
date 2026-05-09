#!/usr/bin/env python3
"""
Append/merge top-level i18n namespaces into messages/{en,de,fr,es}.json
without disturbing admin keys.

Usage:
  python3 scripts/i18n-add-keys.py <namespace_file.json>

Namespace file shape:
  {
    "en": { "nav": { ... }, "footer": { ... } },
    "de": { "nav": { ... }, "footer": { ... } },
    "fr": { ... },
    "es": { ... }
  }

Existing top-level keys with the same name are deep-merged (incoming wins).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MESSAGES = ROOT / "messages"
LOCALES = ["en", "de", "fr", "es"]


def deep_merge(dst, src):
    for k, v in src.items():
        if k in dst and isinstance(dst[k], dict) and isinstance(v, dict):
            deep_merge(dst[k], v)
        else:
            dst[k] = v
    return dst


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    payload_path = Path(sys.argv[1])
    payload = json.loads(payload_path.read_text(encoding="utf-8"))

    for loc in LOCALES:
        target = MESSAGES / f"{loc}.json"
        data = json.loads(target.read_text(encoding="utf-8"))
        if loc not in payload:
            print(f"warn: payload missing locale {loc}, skipping")
            continue
        deep_merge(data, payload[loc])
        target.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"updated {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
