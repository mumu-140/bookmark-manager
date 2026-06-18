# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Browser bookmark management tool with two modes:
1. **Gist Cloud Backup** — Import bookmarks, convert formats, upload/download from GitHub Gist
2. **Dual-Comparison Review** — Compare two bookmark files, review differences, export decisions

**Architecture**: Pure frontend single-page application (one HTML file) + Python CLI scripts. No build process, no dependencies, no backend.

## Key Files

- `index.html` — Main entry point, complete standalone SPA with embedded CSS/JS
- `scripts/bookmark_writers.py` — Core library: Node class + three canonical writers + HTML parser
- `scripts/convert_bookmarkhub_to_bookmarks_html.py` — BookmarkHub JSON → three formats
- `scripts/apply_bookmark_review_decisions.py` — Apply review decisions → merged output

## Development Commands

### Running the Application

```bash
# Open in browser (no server needed, works with file:// protocol)
open index.html

# Or serve locally if testing features that require HTTP
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Python Scripts

```bash
# Convert BookmarkHub JSON to all formats
python3 scripts/convert_bookmarkhub_to_bookmarks_html.py \
  --source bookmarkhub.json \
  --output bookmarks

# Apply review decisions to base file
python3 scripts/apply_bookmark_review_decisions.py \
  --base safari_bookmarks.html \
  --decisions bookmark-review-decisions.json \
  --output bookmarks_merged
```

Both scripts output three files with different suffixes:
- `.edge-chrome.html` (Chromium/Edge/Chrome/Firefox)
- `.safari.html` (Safari, also works in Chromium browsers)
- `.tree.json` (universal JSON format)

### Testing

No automated test suite. Manual testing workflow:
1. Open `index.html` in browser
2. Import sample bookmark files from browser exports or test data
3. Verify parsing, comparison, and export functionality
4. Check browser console for errors

## Core Architecture Patterns

### Canonical Bookmark Tree

All bookmark processing flows through a unified in-memory tree structure (`Node` class in `bookmark_writers.py`):

```python
class Node:
    kind: str           # "folder" | "bookmark" | "__root__"
    title: str
    url: str            # Only for bookmarks
    add_date: int       # Unix timestamp
    last_modified: int  # Unix timestamp
    children: list      # Only for folders
    parent: Node | None
```

**Critical**: Always use the Node class for bookmark operations. Never manipulate HTML/JSON directly without going through this canonical representation.

### URL Normalization

URLs must be normalized before comparison (implemented in both Python and JavaScript):

1. Repeated URL decode (up to 3 times)
2. Scheme and host lowercased
3. Trailing slash removed (except for bare domains)
4. Skip normalization for `javascript:` and `data:` URIs

**Example**: `HTTPS://Example.COM/Path/` → `https://example.com/Path`

### Three-Format Export Pattern

Every export operation produces three files simultaneously:
- **Chromium HTML**: `PERSONAL_TOOLBAR_FOLDER="true"` on first favorites folder
- **Safari HTML**: Wrapped in `<HTML>` tags, no toolbar attribute
- **Tree JSON**: `schema: "bookmark-tree/v1"` with typed nodes

The `write_all()` function in `bookmark_writers.py` handles this. Always use it instead of writing formats individually.

### Favorites Bar Detection

Folders with these exact titles automatically become favorites bar (case-sensitive):
```python
FAVORITES_FOLDER_NAMES = (
    "个人收藏",
    "收藏夹栏", 
    "Bookmarks Bar",
    "Favorites",
    "Favourites",
)
```

Only the **first** top-level folder matching these names gets marked as toolbar.

## Frontend Architecture

`index.html` is a self-contained SPA:
- **No framework**: Vanilla JavaScript, direct DOM manipulation
- **No build step**: All CSS and JS embedded in one HTML file
- **Storage**: LocalStorage for GitHub token persistence
- **Processing**: All bookmark parsing/comparison happens client-side

### Key Frontend Modules (within index.html)

1. **Parser**: Handles Netscape HTML and BookmarkHub JSON inputs
2. **Normalizer**: URL normalization matching Python implementation
3. **Comparator**: Dual-side diff engine with four symmetric actions (keep/delete/→A/→B)
4. **Exporter**: Generates four formats (HTML×2, JSON, BookmarkHub.txt)
5. **Gist Integration**: Upload/download via GitHub API using personal access token

## Data Formats

### Input Formats
- Netscape Bookmark HTML (Safari/Chrome/Edge/Firefox exports)
- BookmarkHub JSON (`{ "nodes": [...] }` structure)

### Output Formats
- **Chromium HTML**: UTF-8, LF, 4-space indent, `PERSONAL_TOOLBAR_FOLDER` attribute
- **Safari HTML**: Same as Chromium but wrapped in `<HTML>`, no toolbar attribute  
- **Tree JSON**: `{ "schema": "bookmark-tree/v1", "tree": [...] }`
- **BookmarkHub.txt**: Nested JSON structure (despite `.txt` extension)

### Review Decision JSON
```json
{
  "items": [
    {
      "id": "unique-id",
      "type": "a_only" | "b_only" | "differ",
      "action": "keep" | "delete" | "to_a" | "to_b",
      "a": { "title": "...", "url": "...", "path": "..." },
      "b": { "title": "...", "url": "...", "path": "..." },
      "note": "optional user note"
    }
  ]
}
```

## Deployment

This is a static site requiring zero server-side processing:

- **Cloudflare Pages**: Recommended for faster access in China. Build settings: framework=none, build_command=(empty), build_output_dir=/
- **GitHub Pages**: Uses `.github/workflows/deploy.yml` to deploy entire repo root
- **Local**: Can be opened directly with `file://` protocol

No environment variables, no secrets, no build process. Just serve the files.

## Code Style

### Python
- Python 3.7+ (uses type hints, f-strings)
- Standard library only (no external dependencies)
- 4-space indentation
- Type annotations on function signatures
- Docstrings on modules and complex functions

### JavaScript (in index.html)
- ES6+ features (arrow functions, const/let, template literals)
- No transpilation needed (targets modern browsers only)
- Minified CSS in production
- Comments only for non-obvious logic

## Common Pitfalls

1. **Don't bypass Node class**: All bookmark tree operations must go through the canonical Node representation. Manipulating HTML/JSON directly breaks consistency.

2. **URL normalization must match**: Python and JavaScript implementations must produce identical results. Test with edge cases (encoded characters, mixed case, trailing slashes).

3. **Timestamp units**: BookmarkHub uses milliseconds, Netscape HTML uses seconds. Always convert at parse time.

4. **Favorites bar logic**: Only the first matching folder becomes toolbar. Don't mark multiple folders.

5. **Character encoding**: All outputs must be UTF-8 without BOM, LF line endings (not CRLF).

6. **No external requests after page load**: The app must work completely offline after initial HTML load. Verify in browser DevTools Network panel.

## Adding Features

When adding new functionality:

1. **For format support**: Extend the parser in both Python and JavaScript to maintain feature parity
2. **For export formats**: Add writer to `bookmark_writers.py`, update `write_all()` to include it
3. **For UI changes**: Modify `index.html` directly (no separate CSS/JS files)
4. **For comparator logic**: Ensure symmetric behavior (A and B must have identical capabilities)

Always test with real-world bookmark exports from multiple browsers to catch encoding issues and structural variations.
