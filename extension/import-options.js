/**
 * Import Options Page - 导入选项选择页面
 */

const structurePreview = document.getElementById('structurePreview');
const totalCountEl = document.getElementById('totalCount');
const folderSelectDiv = document.getElementById('folderSelect');
const targetFolderSelect = document.getElementById('targetFolder');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let bookmarksData = null;

/**
 * 统计书签数量
 */
function countBookmarks(nodes) {
  let count = 0;
  function walk(node) {
    if (node.url) {
      count++;
    } else if (node.children) {
      node.children.forEach(walk);
    }
  }
  if (Array.isArray(nodes)) {
    nodes.forEach(walk);
  } else {
    walk(nodes);
  }
  return count;
}

/**
 * 生成结构预览
 */
function generateStructurePreview(nodes, indent = 0) {
  let html = '';
  const prefix = '  '.repeat(indent);

  for (const node of nodes) {
    if (node.children) {
      // 文件夹
      const count = countBookmarks(node.children);
      html += `<div class="structure-item folder">${prefix}└─ ${node.title} <span class="count">(${count} 个书签)</span></div>`;
      if (indent === 0) {
        // 只显示顶层和第二层
        html += generateStructurePreview(node.children, indent + 1);
      }
    }
  }

  return html;
}

/**
 * 填充文件夹选择器
 */
function populateFolderSelect(nodes) {
  targetFolderSelect.innerHTML = '';

  function addOptions(nodes, indent = 0) {
    const prefix = '  '.repeat(indent);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.children) {
        const count = countBookmarks(node.children);
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${prefix}${node.title} (${count} 个书签)`;
        targetFolderSelect.appendChild(option);

        // 递归添加子文件夹（限制层级）
        if (indent < 2) {
          addOptions(node.children, indent + 1);
        }
      }
    }
  }

  addOptions(nodes);
}

/**
 * 初始化页面
 */
function init() {
  // 从 URL 参数获取书签数据
  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get('data');

  if (!dataParam) {
    alert('缺少书签数据');
    window.close();
    return;
  }

  try {
    bookmarksData = JSON.parse(decodeURIComponent(dataParam));
  } catch (error) {
    alert('解析书签数据失败');
    window.close();
    return;
  }

  // 生成结构预览
  structurePreview.innerHTML = generateStructurePreview(bookmarksData);

  // 统计总数
  const totalCount = countBookmarks(bookmarksData);
  totalCountEl.textContent = totalCount;

  // 填充文件夹选择器
  populateFolderSelect(bookmarksData);

  // 智能默认选择
  if (bookmarksData.length === 1 && bookmarksData[0].children) {
    // 只有一个顶层文件夹 → 默认展平
    document.querySelector('input[value="flatten"]').checked = true;
  } else {
    // 多个顶层文件夹 → 默认保持原结构
    document.querySelector('input[value="keep"]').checked = true;
  }

  updateRadioStyles();
}

/**
 * 更新单选框样式
 */
function updateRadioStyles() {
  document.querySelectorAll('.radio-option').forEach(option => {
    const radio = option.querySelector('input[type="radio"]');
    if (radio.checked) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });

  // 显示/隐藏文件夹选择器
  const selectedMode = document.querySelector('input[name="importMode"]:checked').value;
  if (selectedMode === 'specific') {
    folderSelectDiv.classList.add('show');
  } else {
    folderSelectDiv.classList.remove('show');
  }
}

/**
 * 确认导入
 */
function confirmImport() {
  const importMode = document.querySelector('input[name="importMode"]:checked').value;
  const selectedFolderIndex = targetFolderSelect.value;

  let processedBookmarks = bookmarksData;

  // 根据选择处理书签
  if (importMode === 'flatten') {
    // 展平一层
    if (bookmarksData.length === 1 && bookmarksData[0].children) {
      processedBookmarks = bookmarksData[0].children;
    }
  } else if (importMode === 'specific') {
    // 只导入指定文件夹
    const selectedFolder = bookmarksData[parseInt(selectedFolderIndex)];
    if (selectedFolder && selectedFolder.children) {
      processedBookmarks = selectedFolder.children;
    }
  }
  // importMode === 'keep' 时保持原样

  // 发送结果到 background
  chrome.runtime.sendMessage({
    action: 'confirmImport',
    data: {
      bookmarks: processedBookmarks,
      mode: importMode
    }
  }, () => {
    window.close();
  });
}

/**
 * 取消导入
 */
function cancelImport() {
  chrome.runtime.sendMessage({
    action: 'cancelImport'
  }, () => {
    window.close();
  });
}

// 事件监听
document.querySelectorAll('input[name="importMode"]').forEach(radio => {
  radio.addEventListener('change', updateRadioStyles);
});

document.querySelectorAll('.radio-option').forEach(option => {
  option.addEventListener('click', () => {
    const radio = option.querySelector('input[type="radio"]');
    radio.checked = true;
    updateRadioStyles();
  });
});

confirmBtn.addEventListener('click', confirmImport);
cancelBtn.addEventListener('click', cancelImport);

// 初始化
init();
