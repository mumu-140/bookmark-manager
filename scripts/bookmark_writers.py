"""Canonical bookmark tree + three normalized export writers.

Outputs (all UTF-8, LF, no BOM):
- Chromium HTML  (Edge / Chrome / Firefox / Brave): `<prefix>.edge-chrome.html`
- Safari HTML    (Safari, also accepted by Chromium): `<prefix>.safari.html`
- Tree JSON      (universal, machine-readable):       `<prefix>.tree.json`

The HTML formats both follow Netscape-Bookmark-file-1, differ only in:
- Chromium variant carries `PERSONAL_TOOLBAR_FOLDER="true"` on the first
  top-level folder named in `FAVORITES_FOLDER_NAMES`; Safari ignores it, so
  the Safari variant omits it.
- Safari variant is wrapped in `<HTML>...</HTML>` (Safari's native quirk).
"""

from __future__ import annotations

import html
import json
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable

FAVORITES_FOLDER_NAMES: tuple[str, ...] = (
    "个人收藏",
    "收藏夹栏",
    "Bookmarks Bar",
    "Bookmarks bar",
    "Favorites",
    "Favourites",
)

SCHEMA_VERSION = "bookmark-tree/v1"


class Node:
    """In-memory bookmark tree node."""

    __slots__ = ("kind", "title", "url", "add_date", "last_modified", "children", "parent")

    def __init__(
        self,
        kind: str,
        title: str = "",
        url: str = "",
        add_date: int = 0,
        last_modified: int = 0,
    ) -> None:
        if kind not in {"folder", "bookmark", "__root__"}:
            raise ValueError(f"unknown kind: {kind}")
        self.kind = kind
        self.title = title
        self.url = url
        self.add_date = add_date
        self.last_modified = last_modified
        self.children: list[Node] = []
        self.parent: Node | None = None

    def add(self, child: "Node") -> "Node":
        child.parent = self
        self.children.append(child)
        return child


def _now() -> int:
    return int(time.time())


def _escape_text(value: str) -> str:
    return html.escape(value or "", quote=False)


def _escape_attr(value: str) -> str:
    return html.escape(value or "", quote=True)


def _is_favorites_title(title: str) -> bool:
    return title.strip() in FAVORITES_FOLDER_NAMES


def _ensure_dates(node: Node, default: int) -> None:
    if node.kind == "__root__":
        for c in node.children:
            _ensure_dates(c, default)
        return
    if not node.add_date:
        node.add_date = default
    if node.kind == "folder" and not node.last_modified:
        node.last_modified = node.add_date
    for c in node.children:
        _ensure_dates(c, default)


# ---------------------------------------------------------------------------
# HTML writers
# ---------------------------------------------------------------------------


def _write_h3(
    lines: list[str],
    node: Node,
    depth: int,
    *,
    mark_favorites_bar: bool,
) -> None:
    tab = "    " * depth
    attrs = [
        f'ADD_DATE="{node.add_date}"',
        f'LAST_MODIFIED="{node.last_modified}"',
    ]
    if mark_favorites_bar:
        attrs.append('PERSONAL_TOOLBAR_FOLDER="true"')
    lines.append(f"{tab}<DT><H3 {' '.join(attrs)}>{_escape_text(node.title)}</H3>")
    lines.append(f"{tab}<DL><p>")


def _write_a(lines: list[str], node: Node, depth: int) -> None:
    tab = "    " * depth
    parts = [f'HREF="{_escape_attr(node.url)}"']
    if node.add_date:
        parts.append(f'ADD_DATE="{node.add_date}"')
    if node.last_modified and node.last_modified != node.add_date:
        parts.append(f'LAST_MODIFIED="{node.last_modified}"')
    lines.append(f"{tab}<DT><A {' '.join(parts)}>{_escape_text(node.title)}</A>")


def _write_close_dl(lines: list[str], depth: int) -> None:
    tab = "    " * depth
    lines.append(f"{tab}</DL><p>")


def _serialize_html(root: Node, *, variant: str) -> str:
    if variant not in {"chromium", "safari"}:
        raise ValueError(f"unknown HTML variant: {variant}")

    now = _now()
    _ensure_dates(root, now)

    favorites_seen = False

    lines: list[str] = ["<!DOCTYPE NETSCAPE-Bookmark-file-1>"]
    if variant == "safari":
        lines.append("<HTML>")
    lines.extend(
        [
            '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
            "<TITLE>Bookmarks</TITLE>",
            "<H1>Bookmarks</H1>",
            "<DL><p>",
        ]
    )

    def walk(node: Node, depth: int) -> None:
        nonlocal favorites_seen
        if node.kind == "folder":
            mark = False
            if (
                variant == "chromium"
                and not favorites_seen
                and depth == 1
                and _is_favorites_title(node.title)
            ):
                mark = True
                favorites_seen = True
            _write_h3(lines, node, depth, mark_favorites_bar=mark)
            for child in node.children:
                walk(child, depth + 1)
            _write_close_dl(lines, depth)
        elif node.kind == "bookmark":
            if node.url:
                _write_a(lines, node, depth)

    for child in root.children:
        walk(child, 1)

    lines.append("</DL><p>")
    if variant == "safari":
        lines.append("</HTML>")
    return "\n".join(lines) + "\n"


def write_html_chromium(root: Node, output: Path) -> Path:
    """Write the Edge/Chrome/Firefox-compatible variant."""
    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(_serialize_html(root, variant="chromium"), encoding="utf-8")
    return output


def write_html_safari(root: Node, output: Path) -> Path:
    """Write the Safari-compatible variant."""
    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(_serialize_html(root, variant="safari"), encoding="utf-8")
    return output


# ---------------------------------------------------------------------------
# JSON writer
# ---------------------------------------------------------------------------


def _node_to_dict(node: Node, *, favorites_seen: list[bool], depth: int) -> dict[str, Any]:
    if node.kind == "folder":
        obj: dict[str, Any] = {"type": "folder", "title": node.title}
        if depth == 1 and not favorites_seen[0] and _is_favorites_title(node.title):
            obj["isFavoritesBar"] = True
            favorites_seen[0] = True
        if node.add_date:
            obj["addDate"] = node.add_date
        if node.last_modified and node.last_modified != node.add_date:
            obj["lastModified"] = node.last_modified
        obj["children"] = [
            _node_to_dict(c, favorites_seen=favorites_seen, depth=depth + 1)
            for c in node.children
        ]
        return obj
    obj = {"type": "bookmark", "title": node.title, "url": node.url}
    if node.add_date:
        obj["addDate"] = node.add_date
    if node.last_modified and node.last_modified != node.add_date:
        obj["lastModified"] = node.last_modified
    return obj


def write_json(root: Node, output: Path, *, title: str = "Bookmarks") -> Path:
    output = Path(output).expanduser()
    output.parent.mkdir(parents=True, exist_ok=True)
    favorites_seen = [False]
    payload = {
        "schema": SCHEMA_VERSION,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "title": title,
        "tree": [
            _node_to_dict(c, favorites_seen=favorites_seen, depth=1)
            for c in root.children
        ],
    }
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output


# ---------------------------------------------------------------------------
# Unified entry: write all three with one prefix
# ---------------------------------------------------------------------------


def write_all(root: Node, prefix: Path | str, *, title: str = "Bookmarks") -> dict[str, Path]:
    """Write all three normalized outputs sharing a common path prefix."""
    prefix = Path(prefix).expanduser()
    return {
        "edge_chrome_html": write_html_chromium(root, prefix.with_suffix(".edge-chrome.html")),
        "safari_html": write_html_safari(root, prefix.with_suffix(".safari.html")),
        "tree_json": write_json(root, prefix.with_suffix(".tree.json"), title=title),
    }


# ---------------------------------------------------------------------------
# HTML reader (Netscape Bookmark) -> Node tree
# ---------------------------------------------------------------------------


class _NetscapeParser(HTMLParser):
    """Tolerant Netscape-Bookmark parser into a Node tree.

    Stack-based: pushes folder on `<H3>`, opens it on the next `<DL>`,
    closes on `</DL>`. Robust to missing outer `<DL>` and to malformed
    trailing orphan `<DT><A>` lines (which are attached to the current
    open folder rather than dropped).
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("__root__")
        self._stack: list[Node] = [self.root]
        self._pending_folder: Node | None = None
        self._current_link: Node | None = None
        self._capture_h3 = False
        self._capture_a = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attr_map = {k.lower(): (v or "") for k, v in attrs}
        if tag == "h3":
            folder = Node(
                "folder",
                title="",
                add_date=_safe_int(attr_map.get("add_date")),
                last_modified=_safe_int(attr_map.get("last_modified")),
            )
            self._pending_folder = self._stack[-1].add(folder)
            self._capture_h3 = True
        elif tag == "a":
            self._current_link = Node(
                "bookmark",
                title="",
                url=attr_map.get("href", ""),
                add_date=_safe_int(attr_map.get("add_date")),
                last_modified=_safe_int(attr_map.get("last_modified")),
            )
            self._stack[-1].add(self._current_link)
            self._capture_a = True
        elif tag == "dl":
            if self._pending_folder is not None:
                self._stack.append(self._pending_folder)
                self._pending_folder = None

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "h3":
            self._capture_h3 = False
        elif tag == "a":
            self._capture_a = False
            self._current_link = None
        elif tag == "dl":
            if len(self._stack) > 1:
                self._stack.pop()
            self._pending_folder = None

    def handle_data(self, data: str) -> None:
        if self._capture_h3 and self._pending_folder is not None:
            self._pending_folder.title = (self._pending_folder.title + data).strip()
        elif self._capture_a and self._current_link is not None:
            self._current_link.title = (self._current_link.title + data).strip()


def _safe_int(value: str | None) -> int:
    if not value:
        return 0
    try:
        return int(value)
    except ValueError:
        return 0


def parse_netscape_html(source: Path | str) -> Node:
    """Read a Netscape-Bookmark HTML file into a Node tree."""
    text = Path(source).read_text(encoding="utf-8", errors="replace")
    parser = _NetscapeParser()
    parser.feed(text)
    parser.close()
    return parser.root


# ---------------------------------------------------------------------------
# Tree statistics
# ---------------------------------------------------------------------------


def count(root: Node) -> tuple[int, int]:
    """Return (folder_count, bookmark_count) under root, excluding the root."""
    folders = 0
    bookmarks = 0

    def walk(node: Node) -> None:
        nonlocal folders, bookmarks
        for child in node.children:
            if child.kind == "folder":
                folders += 1
                walk(child)
            elif child.kind == "bookmark":
                bookmarks += 1

    walk(root)
    return folders, bookmarks


def iter_bookmarks(root: Node) -> Iterable[Node]:
    for child in root.children:
        if child.kind == "bookmark":
            yield child
        elif child.kind == "folder":
            yield from iter_bookmarks(child)
