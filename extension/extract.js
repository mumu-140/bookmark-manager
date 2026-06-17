/**
 * 浏览器书签提取器
 * 支持提取全部书签或选择特定文件夹
 */

/**
 * 转换 Chrome 书签树为标准格式
 */
function convertChromeTreeToStandard(node) {
  if (node.url) {
    // 书签节点
    return {
      title: node.title || node.url,
      url: node.url,
      dateAdded: node.dateAdded
    };
  } else if (node.children) {
    // 文件夹节点
    return {
      title: node.title || '未命名文件夹',
      children: node.children.map(child => convertChromeTreeToStandard(child)).filter(Boolean),
      dateAdded: node.dateAdded,
      dateGroupModified: node.dateGroupModified
    };
  }
  return null;
}

/**
 * 提取所有书签
 */
async function extractAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();

  // 跳过根节点，提取所有顶层文件夹（书签栏、其他书签等）
  const root = tree[0];
  const allFolders = root.children.map(folder => convertChromeTreeToStandard(folder));

  return allFolders;
}

/**
 * 提取指定文件夹
 * @param {string} folderId - 文件夹 ID
 */
async function extractFolder(folderId) {
  const subtree = await chrome.bookmarks.getSubTree(folderId);
  return convertChromeTreeToStandard(subtree[0]);
}

/**
 * 提取多个文件夹
 * @param {Array<string>} folderIds - 文件夹 ID 数组
 */
async function extractFolders(folderIds) {
  const folders = await Promise.all(
    folderIds.map(id => extractFolder(id))
  );
  return folders.filter(Boolean);
}

/**
 * 获取书签树（用于 UI 显示）
 */
async function getBookmarkTree() {
  const tree = await chrome.bookmarks.getTree();
  return tree[0];
}

/**
 * 搜索书签
 * @param {string} query - 搜索关键词
 */
async function searchBookmarks(query) {
  const results = await chrome.bookmarks.search(query);
  return results;
}

/**
 * 统计书签数量
 */
function countBookmarksInTree(node) {
  let count = 0;

  function walk(n) {
    if (n.url) {
      count++;
    } else if (n.children) {
      n.children.forEach(walk);
    }
  }

  walk(node);
  return count;
}

/**
 * 导出为 BookmarkHub 格式
 */
function exportToBookmarkHub(folders) {
  return {
    browser: navigator.userAgent,
    version: "0.0.6",
    createDate: Date.now(),
    bookmarks: [
      {
        children: folders
      }
    ]
  };
}

/**
 * 导出为 Chromium HTML 格式
 */
function exportToChromiumHtml(folders) {
  const timestamp = Math.floor(Date.now() / 1000);

  function nodeToHtml(node, indent = 1) {
    const spaces = '    '.repeat(indent);

    if (node.url) {
      // 书签
      const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : timestamp;
      return `${spaces}<DT><A HREF="${node.url}" ADD_DATE="${addDate}">${escapeHtml(node.title)}</A>`;
    } else if (node.children) {
      // 文件夹
      const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : timestamp;
      const lastModified = node.dateGroupModified ? Math.floor(node.dateGroupModified / 1000) : timestamp;

      let html = `${spaces}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${lastModified}">${escapeHtml(node.title)}</H3>\n`;
      html += `${spaces}<DL><p>\n`;

      for (const child of node.children) {
        html += nodeToHtml(child, indent + 1) + '\n';
      }

      html += `${spaces}</DL><p>`;
      return html;
    }
    return '';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
  html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
  html += '<TITLE>Bookmarks</TITLE>\n';
  html += '<H1>Bookmarks</H1>\n';
  html += '<DL><p>\n';

  for (const folder of folders) {
    html += nodeToHtml(folder, 1) + '\n';
  }

  html += '</DL><p>\n';

  return html;
}

// 导出函数供其他模块使用
if (typeof self !== 'undefined') {
  self.extractAllBookmarks = extractAllBookmarks;
  self.extractFolder = extractFolder;
  self.extractFolders = extractFolders;
  self.getBookmarkTree = getBookmarkTree;
  self.searchBookmarks = searchBookmarks;
  self.countBookmarksInTree = countBookmarksInTree;
  self.exportToBookmarkHub = exportToBookmarkHub;
  self.exportToChromiumHtml = exportToChromiumHtml;
}
