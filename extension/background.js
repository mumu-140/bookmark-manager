/**
 * Background Service Worker - 处理书签同步逻辑
 * 参考：index.html 第 1142-1174 行的 fetchFromGist 逻辑
 */

// 导入解析器和提取器
importScripts('parser.js');
importScripts('extract.js');

/**
 * 从 chrome.storage.sync 获取配置
 */
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['uploadGistUrl', 'downloadGistUrl', 'githubToken', 'preferredFormat', 'lastSync', 'flattenTopFolder', 'uploadMode'], (result) => {
      resolve({
        uploadGistUrl: result.uploadGistUrl || '',
        downloadGistUrl: result.downloadGistUrl || '',
        githubToken: result.githubToken || '',
        preferredFormat: result.preferredFormat || 'auto',
        lastSync: result.lastSync || 0,
        flattenTopFolder: result.flattenTopFolder !== false,  // 默认为 true
        uploadMode: result.uploadMode || 'new'  // 默认为 new
      });
    });
  });
}

/**
 * 保存配置
 */
async function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, resolve);
  });
}

/**
 * 解析 Gist URL 获取原始文件 URL
 * 参考：index.html 第 1148-1167 行
 */
async function resolveGistUrl(url, token) {
  // 如果已经是原始文件 URL，直接返回
  if (url.includes('raw.githubusercontent.com') || url.includes('gist.githubusercontent.com')) {
    return { rawUrl: url, filename: 'bookmarks' };
  }

  // 如果是 Gist 页面 URL，通过 API 获取原始 URL
  if (url.includes('gist.github.com')) {
    const gistId = url.split('/').pop().split('#')[0];
    const apiUrl = `https://api.github.com/gists/${gistId}`;

    const headers = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Gist 不存在或已被删除');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Token 无效或权限不足');
      } else {
        throw new Error(`获取 Gist 失败: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    const files = Object.values(data.files);

    if (files.length === 0) {
      throw new Error('Gist 中没有文件');
    }

    // 优先选择 .txt 或 .html 文件
    let targetFile = files.find(f => f.filename.endsWith('.txt'));
    if (!targetFile) {
      targetFile = files.find(f => f.filename.endsWith('.html'));
    }
    if (!targetFile) {
      targetFile = files[0];
    }

    return {
      rawUrl: targetFile.raw_url,
      filename: targetFile.filename
    };
  }

  throw new Error('无效的 URL 格式。请使用 Gist 页面 URL 或原始文件 URL');
}

/**
 * 下载文件内容
 */
async function downloadFile(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * 删除所有书签（保留根文件夹）
 */
async function clearAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const root = tree[0];

  // 遍历所有根文件夹（书签栏、其他书签等）
  for (const folder of root.children) {
    if (folder.children) {
      // 删除文件夹内的所有子项
      for (const child of folder.children) {
        try {
          await chrome.bookmarks.removeTree(child.id);
        } catch (error) {
          console.warn(`Failed to remove bookmark ${child.id}:`, error);
        }
      }
    }
  }
}

/**
 * 批量导入书签
 * @param {Array} nodes - 书签节点数组
 * @param {string} parentId - 父文件夹 ID
 */
async function importBookmarks(nodes, parentId) {
  for (const node of nodes) {
    try {
      if (node.children && Array.isArray(node.children)) {
        // 创建文件夹
        const folder = await chrome.bookmarks.create({
          parentId: parentId,
          title: node.title || '未命名文件夹'
        });

        // 递归导入子项
        await importBookmarks(node.children, folder.id);
      } else if (node.url) {
        // 创建书签
        await chrome.bookmarks.create({
          parentId: parentId,
          title: node.title || node.url,
          url: node.url
        });
      }
    } catch (error) {
      console.error('Failed to create bookmark:', node, error);
      // 继续处理下一个节点
    }
  }
}

/**
 * 获取书签栏 ID
 */
async function getBookmarksBarId() {
  const tree = await chrome.bookmarks.getTree();
  // Chrome 书签栏通常是第一个子节点
  const bookmarksBar = tree[0].children.find(folder => folder.id === '1');
  return bookmarksBar ? bookmarksBar.id : tree[0].children[0].id;
}

/**
 * 主同步函数
 */
async function syncBookmarks(sendProgress) {
  try {
    // 1. 获取配置
    sendProgress({ status: 'loading', message: '读取配置...' });
    const config = await getConfig();

    if (!config.downloadGistUrl) {
      throw new Error('未配置下载源 Gist URL。请先打开扩展选项页进行配置');
    }

    // 2. 解析 Gist URL
    sendProgress({ status: 'loading', message: '解析 Gist URL...' });
    const { rawUrl, filename } = await resolveGistUrl(config.downloadGistUrl, config.githubToken);

    // 3. 下载文件
    sendProgress({ status: 'loading', message: '下载书签文件...' });
    const content = await downloadFile(rawUrl);

    // 4. 解析书签
    sendProgress({ status: 'loading', message: '解析书签数据...' });
    let bookmarks = parseBookmarks(content, filename, config.preferredFormat);

    const count = countBookmarks(bookmarks);

    if (count === 0) {
      throw new Error('书签文件为空或解析失败');
    }

    // 5. 打开选择对话框，等待用户选择
    sendProgress({ status: 'loading', message: '等待选择导入方式...' });

    // 将书签数据编码后传递给选择页面
    const dataParam = encodeURIComponent(JSON.stringify(bookmarks));
    const optionsUrl = chrome.runtime.getURL(`import-options.html?data=${dataParam}`);

    // 打开选择页面
    await chrome.windows.create({
      url: optionsUrl,
      type: 'popup',
      width: 600,
      height: 700
    });

    // 此时暂停执行，等待用户在选择页面确认
    // confirmImport 消息会触发实际的导入操作

  } catch (error) {
    sendProgress({
      status: 'error',
      message: error.message || '同步失败'
    });
  }
}

/**
 * 执行实际的导入操作（用户确认后）
 */
async function updateGist(gistId, content, filename, token) {
  const apiUrl = `https://api.github.com/gists/${gistId}`;

  const response = await fetch(apiUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        [filename]: {
          content: content
        }
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `更新 Gist 失败 (${response.status})`);
  }

  return await response.json();
}

/**
 * 上传到 Gist（新建 ID 模式）
 */
async function createGist(content, filename, token, isPublic = false) {
  const apiUrl = 'https://api.github.com/gists';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Browser bookmarks backup',
      public: isPublic,
      files: {
        [filename]: {
          content: content
        }
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `创建 Gist 失败 (${response.status})`);
  }

  return await response.json();
}

/**
 * 从 Gist URL 提取 Gist ID
 */
function extractGistId(url) {
  // https://gist.github.com/username/abc123...
  // https://gist.githubusercontent.com/username/abc123.../raw/...
  const match = url.match(/gist\.github(?:usercontent)?\.com\/[^\/]+\/([a-f0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * 主上传函数
 */
async function uploadBookmarks(sendProgress) {
  try {
    // 1. 获取配置
    sendProgress({ status: 'loading', message: '读取配置...' });
    const config = await getConfig();

    if (!config.githubToken) {
      throw new Error('未配置 GitHub Token。请先打开扩展选项页进行配置');
    }

    // 2. 提取书签
    sendProgress({ status: 'loading', message: '提取书签数据...' });
    const bookmarks = await extractAllBookmarks();

    // 3. 转换格式（根据 preferredFormat）
    sendProgress({ status: 'loading', message: '转换格式...' });
    let content, filename;

    const timestamp = Date.now();

    if (config.preferredFormat === 'bookmarkhub' || config.preferredFormat === 'auto') {
      content = JSON.stringify(exportToBookmarkHub(bookmarks), null, 2);
      filename = `bookmarks-${timestamp}.BookmarkHub.txt`;
    } else {
      content = exportToChromiumHtml(bookmarks);
      filename = `bookmarks-${timestamp}.html`;
    }

    // 4. 上传
    let result;
    if (config.uploadMode === 'fixed') {
      if (!config.uploadGistUrl) {
        throw new Error('固定模式需要配置上传目标 Gist URL。请先打开扩展选项页进行配置');
      }

      // 从 URL 提取 Gist ID
      const gistId = extractGistId(config.uploadGistUrl);
      if (!gistId) {
        throw new Error('无法从上传目标 URL 中提取 Gist ID。请检查 URL 格式');
      }

      sendProgress({ status: 'loading', message: '更新 Gist...' });
      result = await updateGist(gistId, content, filename, config.githubToken);
    } else {
      sendProgress({ status: 'loading', message: '创建新 Gist...' });
      result = await createGist(content, filename, config.githubToken);
    }

    // 5. 计算书签数量
    const count = countBookmarks(bookmarks);

    // 6. 成功
    sendProgress({
      status: 'success',
      message: `上传成功！已保存 ${count} 个书签到 Gist`,
      count: count,
      gistUrl: result.html_url,
      timestamp: Date.now()
    });

  } catch (error) {
    sendProgress({
      status: 'error',
      message: error.message || '上传失败'
    });
  }
}

/**
 * 执行实际的导入操作（用户确认后）
 */
async function performImport(bookmarks, sendProgress) {
  try {
    const count = countBookmarks(bookmarks);

    // 1. 删除现有书签
    sendProgress({ status: 'loading', message: `删除现有书签...` });
    await clearAllBookmarks();

    // 2. 获取书签栏 ID
    const bookmarksBarId = await getBookmarksBarId();

    // 3. 导入新书签
    sendProgress({ status: 'loading', message: `导入新书签 (${count} 个)...` });
    await importBookmarks(bookmarks, bookmarksBarId);

    // 4. 保存同步时间
    const timestamp = Date.now();
    await saveConfig({ lastSync: timestamp });

    // 5. 成功
    sendProgress({
      status: 'success',
      message: `同步成功！已导入 ${count} 个书签`,
      count: count,
      timestamp: timestamp
    });

  } catch (error) {
    sendProgress({
      status: 'error',
      message: error.message || '导入失败'
    });
  }
}

/**
 * 监听来自 popup 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sync' || request.action === 'download') {
    // 执行下载同步（原 sync 逻辑）
    syncBookmarks((progress) => {
      // 发送进度更新到 popup
      chrome.runtime.sendMessage({
        action: request.action === 'download' ? 'downloadProgress' : 'syncProgress',
        data: progress
      }).catch(() => {
        // Popup 可能已关闭，忽略错误
      });
    }).then(() => {
      sendResponse({ success: true });
    });

    // 返回 true 表示异步响应
    return true;
  }

  if (request.action === 'confirmImport') {
    // 用户确认导入
    const { bookmarks, mode } = request.data;

    performImport(bookmarks, (progress) => {
      // 发送进度更新到 popup
      chrome.runtime.sendMessage({
        action: 'downloadProgress',
        data: progress
      }).catch(() => {
        // Popup 可能已关闭，忽略错误
      });
    }).then(() => {
      sendResponse({ success: true });
    });

    return true;
  }

  if (request.action === 'cancelImport') {
    // 用户取消导入
    chrome.runtime.sendMessage({
      action: 'downloadProgress',
      data: {
        status: 'error',
        message: '已取消导入'
      }
    }).catch(() => {});

    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'upload') {
    // 执行上传
    uploadBookmarks((progress) => {
      // 发送进度更新到 popup
      chrome.runtime.sendMessage({
        action: 'uploadProgress',
        data: progress
      }).catch(() => {
        // Popup 可能已关闭，忽略错误
      });
    }).then(() => {
      sendResponse({ success: true });
    });

    // 返回 true 表示异步响应
    return true;
  }

  if (request.action === 'getConfig') {
    // 获取配置
    getConfig().then(config => {
      sendResponse(config);
    });
    return true;
  }

  if (request.action === 'testConnection') {
    // 测试连接
    (async () => {
      try {
        const config = await getConfig();
        if (!config.downloadGistUrl) {
          throw new Error('未配置下载源 Gist URL');
        }

        const { rawUrl, filename } = await resolveGistUrl(config.downloadGistUrl, config.githubToken);
        const content = await downloadFile(rawUrl);
        const bookmarks = parseBookmarks(content, filename, config.preferredFormat);
        const count = countBookmarks(bookmarks);

        sendResponse({
          success: true,
          message: `连接成功！找到 ${count} 个书签`,
          count: count,
          filename: filename
        });
      } catch (error) {
        sendResponse({
          success: false,
          message: error.message
        });
      }
    })();
    return true;
  }
});

/**
 * 扩展安装或更新时
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，打开选项页
    chrome.runtime.openOptionsPage();
  }
});
