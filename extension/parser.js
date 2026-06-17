/**
 * Bookmark Parser - 支持 BookmarkHub JSON 和 Chromium HTML 格式
 * 复用 index.html 中的解析逻辑
 */

/**
 * 格式自动检测
 */
function detectFormat(content, filename = '') {
  // 优先根据文件名判断
  if (filename.endsWith('.txt') || filename.toLowerCase().includes('bookmarkhub')) {
    try {
      const data = JSON.parse(content);
      if (data.bookmarks || data.nodes) {
        return 'bookmarkhub';
      }
    } catch (e) {
      // 不是有效的 JSON，继续检查其他格式
    }
  }

  // 检查内容特征
  if (content.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>')) {
    return 'html';
  }

  // 尝试作为 JSON 解析
  try {
    const data = JSON.parse(content);
    if (data.bookmarks || data.nodes) {
      return 'bookmarkhub';
    }
    if (data.schema === 'bookmark-tree/v1') {
      return 'tree-json';
    }
  } catch (e) {
    // 不是有效的 JSON，继续抛出错误
  }

  throw new Error('无法识别书签格式。支持的格式：BookmarkHub JSON (.txt) 或 Chromium HTML');
}

/**
 * BookmarkHub JSON 解析
 * 参考：scripts/convert_bookmarkhub_to_bookmarks_html.py
 */
function parseBookmarkHub(jsonText) {
  const data = JSON.parse(jsonText);

  // 支持两种格式
  let rootNodes;
  if (data.bookmarks && Array.isArray(data.bookmarks)) {
    // BookmarkHub.txt 格式：{ bookmarks: [{ children: [...] }] }
    rootNodes = data.bookmarks[0]?.children || [];
  } else if (data.nodes && Array.isArray(data.nodes)) {
    // 备用格式：{ nodes: [...] }
    rootNodes = data.nodes;
  } else {
    throw new Error('Invalid BookmarkHub format: missing bookmarks or nodes array');
  }

  return convertBookmarkHubToChrome(rootNodes);
}

/**
 * 递归转换 BookmarkHub 节点为 Chrome bookmarks API 格式
 */
function convertBookmarkHubToChrome(nodes) {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.map(node => {
    if (node.children && Array.isArray(node.children)) {
      // 文件夹节点
      return {
        title: node.title || '未命名文件夹',
        children: convertBookmarkHubToChrome(node.children)
      };
    } else if (node.url) {
      // 书签节点
      return {
        title: node.title || node.url,
        url: node.url
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Chromium HTML 解析
 * 使用正则表达式解析（Service Worker 中没有 DOMParser）
 */
function parseNetscapeHtml(htmlText) {
  const result = [];
  const stack = [{ children: result }];

  // 移除换行和多余空格
  const html = htmlText.replace(/\n/g, ' ').replace(/\s+/g, ' ');

  // 匹配所有标签
  const tagRegex = /<(\/?)(\w+)([^>]*)>/g;
  let match;
  let lastIndex = 0;

  while ((match = tagRegex.exec(html)) !== null) {
    const [fullMatch, isClosing, tagName, attrs] = match;
    const upperTag = tagName.toUpperCase();

    if (isClosing) {
      // 闭合标签
      if (upperTag === 'DL' && stack.length > 1) {
        stack.pop();
      }
    } else {
      // 开启标签
      if (upperTag === 'H3') {
        // 文件夹
        const titleMatch = html.substring(match.index).match(/<H3[^>]*>([^<]*)<\/H3>/i);
        const title = titleMatch ? titleMatch[1].trim() : '未命名文件夹';

        const folder = { title, children: [] };
        stack[stack.length - 1].children.push(folder);

        // 查找后续的 <DL>，如果有则压栈
        const nextDLIndex = html.indexOf('<DL', match.index);
        const nextDTIndex = html.indexOf('<DT', match.index + fullMatch.length);

        if (nextDLIndex !== -1 && (nextDTIndex === -1 || nextDLIndex < nextDTIndex)) {
          stack.push(folder);
        }
      } else if (upperTag === 'A') {
        // 书签
        const hrefMatch = attrs.match(/HREF=["']([^"']+)["']/i);
        const url = hrefMatch ? hrefMatch[1] : '';

        if (url) {
          const titleMatch = html.substring(match.index).match(/<A[^>]*>([^<]*)<\/A>/i);
          const title = titleMatch ? titleMatch[1].trim() : url;

          stack[stack.length - 1].children.push({ title, url });
        }
      }
    }
  }

  return result;
}

/**
 * 树形 JSON 解析（bookmark-tree/v1 格式）
 */
function parseTreeJson(jsonText) {
  const data = JSON.parse(jsonText);

  if (data.schema !== 'bookmark-tree/v1') {
    throw new Error('Unsupported tree JSON schema: ' + (data.schema || 'unknown'));
  }

  return convertTreeJsonToChrome(data.tree || []);
}

/**
 * 递归转换树形 JSON 为 Chrome 格式
 */
function convertTreeJsonToChrome(nodes) {
  return nodes.map(node => {
    if (node.type === 'folder') {
      return {
        title: node.title || '未命名文件夹',
        children: convertTreeJsonToChrome(node.children || [])
      };
    } else if (node.type === 'bookmark' && node.url) {
      return {
        title: node.title || node.url,
        url: node.url
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * 统一解析入口
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名（用于格式检测）
 * @param {string} preferredFormat - 优先格式（'bookmarkhub' | 'html' | 'auto'）
 * @returns {Array} Chrome bookmarks 树结构
 */
function parseBookmarks(content, filename = '', preferredFormat = 'auto') {
  let format = preferredFormat;

  if (format === 'auto') {
    format = detectFormat(content, filename);
  }

  switch (format) {
    case 'bookmarkhub':
      return parseBookmarkHub(content);

    case 'html':
      return parseNetscapeHtml(content);

    case 'tree-json':
      return parseTreeJson(content);

    default:
      throw new Error('Unsupported format: ' + format);
  }
}

/**
 * 统计书签数量
 */
function countBookmarks(nodes) {
  let count = 0;

  function walk(items) {
    for (const item of items) {
      if (item.url) {
        count++;
      } else if (item.children) {
        walk(item.children);
      }
    }
  }

  walk(nodes);
  return count;
}

// 导出函数（用于 Service Worker）
if (typeof self !== 'undefined') {
  self.parseBookmarks = parseBookmarks;
  self.countBookmarks = countBookmarks;
  self.detectFormat = detectFormat;
}
