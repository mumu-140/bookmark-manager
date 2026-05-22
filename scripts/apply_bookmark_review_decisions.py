#!/usr/bin/env python3
"""Apply bookmark review decisions and write the three canonical exports.

Outputs (sharing one path prefix):
  - <prefix>.edge-chrome.html   Edge / Chrome / Firefox compatible
  - <prefix>.safari.html        Safari compatible
  - <prefix>.tree.json          Universal JSON
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit, urlunsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bookmark_writers import (  # noqa: E402
    FAVORITES_FOLDER_NAMES,
    Node,
    count,
    iter_bookmarks,
    parse_netscape_html,
    write_all,
)


def decode_repeated(value: str, limit: int = 3) -> str:
    current = value.strip()
    for _ in range(limit):
        decoded = unquote(current)
        if decoded == current:
            break
        current = decoded
    return current


def norm_url(url: str) -> str:
    url = url.strip()
    if url.startswith(("javascript:", "data:")):
        return decode_repeated(url, 2)
    try:
        split = urlsplit(url)
        path = decode_repeated(split.path or "")
        query = decode_repeated(split.query or "")
        if path != "/" and path.endswith("/"):
            path = path.rstrip("/")
        return urlunsplit((split.scheme.lower(), split.netloc.lower(), path, query, ""))
    except Exception:
        return decode_repeated(url)


def find_bookmarks(root: Node, normalized_url: str) -> list[Node]:
    return [node for node in iter_bookmarks(root) if norm_url(node.url) == normalized_url]


def ensure_folder(root: Node, path_parts: list[str]) -> Node:
    current = root
    if (
        current.children
        and current.children[0].kind == "folder"
        and current.children[0].title in FAVORITES_FOLDER_NAMES
    ):
        current = current.children[0]
    for part in path_parts:
        found: Node | None = None
        for child in current.children:
            if child.kind == "folder" and child.title == part:
                found = child
                break
        if found is None:
            found = current.add(Node("folder", title=part))
        current = found
    return current


def move_node(node: Node, target_folder: Node) -> None:
    if node.parent is target_folder:
        return
    if node.parent is not None:
        node.parent.children.remove(node)
    target_folder.add(node)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply bookmark review decisions and write the three canonical exports.",
    )
    parser.add_argument("--base", required=True, help="Base bookmarks HTML file")
    parser.add_argument("--decisions", required=True, help="Review decisions JSON file")
    parser.add_argument(
        "--output",
        default="bookmarks_merged",
        help="Output path prefix; three files <prefix>.edge-chrome.html / .safari.html / .tree.json will be written.",
    )
    args = parser.parse_args()

    root = parse_netscape_html(Path(args.base))
    payload = json.loads(Path(args.decisions).read_text(encoding="utf-8"))
    added = 0
    skipped = 0
    updated = 0

    for decision in payload.get("decisions", []):
        action = decision.get("action")
        item = decision.get("item") or {}
        if item.get("type") == "add":
            if action != "add":
                skipped += 1
                continue
            if find_bookmarks(root, item["normUrl"]):
                skipped += 1
                continue
            target = ensure_folder(root, item.get("pathParts") or [])
            target.add(Node("bookmark", title=item.get("title", "Untitled"), url=item.get("url", "")))
            added += 1
        elif item.get("type") == "diff":
            if action != "use_bookmarkhub":
                skipped += 1
                continue
            matches = find_bookmarks(root, item["normUrl"])
            if not matches:
                skipped += 1
                continue
            preferred = item.get("bookmarkhub", {}).get("preferred", {})
            target = ensure_folder(root, preferred.get("pathParts") or [])
            for match in matches:
                match.title = preferred.get("title") or match.title
                move_node(match, target)
                updated += 1

    prefix = Path(args.output).expanduser().resolve()
    outputs = write_all(root, prefix, title="Bookmarks")

    folders, bookmarks = count(root)
    print(f"Added:   {added}")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print(f"Folders: {folders}")
    print(f"Bookmarks: {bookmarks}")
    for label, path in outputs.items():
        print(f"{label}: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
