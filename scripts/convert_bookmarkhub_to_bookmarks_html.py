#!/usr/bin/env python3
"""Convert a BookmarkHub JSON export to the three canonical formats.

Outputs (sharing one path prefix):
  - <prefix>.edge-chrome.html   Edge / Chrome / Firefox compatible
  - <prefix>.safari.html        Safari compatible
  - <prefix>.tree.json          Universal JSON
"""

from __future__ import annotations

import argparse
import json
import ssl
import sys
from pathlib import Path
from typing import Any
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bookmark_writers import Node, count, write_all  # noqa: E402

BOOKMARKHUB_URL = ""  # Paste your BookmarkHub Gist raw URL here
DEFAULT_PREFIX = "BookmarkHub_Bookmarks"


def read_json(source: str) -> dict[str, Any]:
    if source.startswith(("http://", "https://")):
        try:
            with urlopen(source, timeout=30) as response:
                raw = response.read().decode("utf-8")
        except Exception as exc:
            if "CERTIFICATE_VERIFY_FAILED" not in str(exc):
                raise
            context = ssl._create_unverified_context()
            with urlopen(source, context=context, timeout=30) as response:
                raw = response.read().decode("utf-8")
    else:
        raw = Path(source).read_text(encoding="utf-8")

    data = json.loads(raw)
    if not isinstance(data, dict) or not isinstance(data.get("nodes"), list):
        raise ValueError("Input is not a BookmarkHub JSON export: missing 'nodes'.")
    return data


def _bookmark_seconds(value: Any) -> int:
    if not isinstance(value, int):
        return 0
    return value // 1000 if value > 10_000_000_000 else value


def _build_node(raw: dict[str, Any]) -> Node | None:
    title = str(raw.get("title", "")).strip() or "Untitled"
    add_date = _bookmark_seconds(raw.get("dateAdded") or raw.get("dateModified"))
    last_modified = _bookmark_seconds(raw.get("dateModified"))

    children = raw.get("children")
    if isinstance(children, list):
        folder = Node("folder", title=title, add_date=add_date, last_modified=last_modified)
        for child in children:
            if isinstance(child, dict):
                built = _build_node(child)
                if built is not None:
                    folder.add(built)
        return folder

    url = raw.get("url")
    if isinstance(url, str) and url:
        return Node("bookmark", title=title, url=url, add_date=add_date, last_modified=last_modified)
    return None


def build_tree(data: dict[str, Any]) -> Node:
    root = Node("__root__")
    for raw in data["nodes"]:
        if isinstance(raw, dict):
            node = _build_node(raw)
            if node is not None:
                root.add(node)
    return root


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert BookmarkHub JSON to canonical bookmark exports (Edge/Chrome HTML, Safari HTML, Tree JSON).",
    )
    parser.add_argument(
        "--source",
        default=BOOKMARKHUB_URL,
        help="BookmarkHub JSON URL or local JSON file path.",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_PREFIX,
        help="Output path prefix. Three files <prefix>.edge-chrome.html, <prefix>.safari.html, <prefix>.tree.json will be written.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.source:
        print("error: --source is required (URL or JSON path).", file=sys.stderr)
        return 2

    data = read_json(args.source)
    root = build_tree(data)
    prefix = Path(args.output).expanduser().resolve()
    outputs = write_all(root, prefix, title="Bookmarks")

    folders, bookmarks = count(root)
    print(f"Folders: {folders}")
    print(f"Bookmarks: {bookmarks}")
    for label, path in outputs.items():
        print(f"{label}: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
