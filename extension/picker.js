/**
 * 书签选择器逻辑
 */

let bookmarkTree = null;
let selectedIds = new Set();

const treeContainer = document.getElementById('bookmarkTree');
const selectionInfo = document.getElementById('selectionInfo');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const selectBarBtn = document.getElementById('selectBarBtn');

/**
 * 加载书签树
 */
async function loadBookmarkTree() {
  try {
    bookmarkTree = await getBookmarkTree();
    renderTree();
  } catch (error) {
    treeContainer.innerHTML = '<p style="color: red;">加载失败: ' + error.message + '</p>';
  }
}

/**
 * 渲染书签树
 */
function renderTree() {
  treeContainer.innerHTML = '';

  if (!bookmarkTree || !bookmarkTree.children) {
    treeContainer.innerHTML = '<p>没有书签</p>';
    return;
  }

  // 渲染顶层文件夹（书签栏、其他书签等）
  bookmarkTree.children.forEach(node => {
    if (node.children) {
      treeContainer.appendChild(createTreeNode(node));
    }
  });

  updateSelectionInfo();
}

/**
 * 创建树节点
 */
function createTreeNode(node) {
  const div = document.createElement('div');

  // 只渲染文件夹
  if (!node.children) {
    return div;
  }

  const count = countBookmarksInTree(node);

  // 节点容器
  const nodeDiv = document.createElement('div');
  nodeDiv.className = 'tree-node';
  if (selectedIds.has(node.id)) {
    nodeDiv.classList.add('selected');
  }

  // 复选框
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selectedIds.has(node.id);
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    if (e.target.checked) {
      selectedIds.add(node.id);
    } else {
      selectedIds.delete(node.id);
    }
    updateSelectionInfo();
    renderTree();
  });

  // 标签
  const label = document.createElement('span');
  label.className = 'tree-node-label';
  label.innerHTML = `
    📁 <strong>${escapeHtml(node.title)}</strong>
    <span class="tree-node-count">(${count} 个书签)</span>
  `;

  nodeDiv.appendChild(checkbox);
  nodeDiv.appendChild(label);
  div.appendChild(nodeDiv);

  // 渲染子文件夹
  if (node.children && node.children.length > 0) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'tree-children';

    node.children.forEach(child => {
      if (child.children) {
        childrenDiv.appendChild(createTreeNode(child));
      }
    });

    if (childrenDiv.children.length > 0) {
      div.appendChild(childrenDiv);
    }
  }

  return div;
}

/**
 * 更新选择信息
 */
function updateSelectionInfo() {
  const selectedCount = selectedIds.size;
  let totalBookmarks = 0;

  if (selectedCount > 0) {
    // 计算选中文件夹中的书签总数
    const selectedNodes = findNodesByIds(bookmarkTree, Array.from(selectedIds));
    totalBookmarks = selectedNodes.reduce((sum, node) => sum + countBookmarksInTree(node), 0);
  }

  selectionInfo.textContent = `已选择: ${selectedCount} 个文件夹，共 ${totalBookmarks} 个书签`;
  confirmBtn.disabled = selectedCount === 0;
}

/**
 * 根据 ID 查找节点
 */
function findNodesByIds(tree, ids) {
  const result = [];

  function walk(node) {
    if (ids.includes(node.id)) {
      result.push(node);
    }
    if (node.children) {
      node.children.forEach(walk);
    }
  }

  walk(tree);
  return result;
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 全选
 */
function selectAll() {
  function walk(node) {
    if (node.children && node.children.length > 0) {
      selectedIds.add(node.id);
      node.children.forEach(walk);
    }
  }

  bookmarkTree.children.forEach(walk);
  renderTree();
}

/**
 * 取消全选
 */
function deselectAll() {
  selectedIds.clear();
  renderTree();
}

/**
 * 仅选择书签栏
 */
function selectBookmarksBar() {
  selectedIds.clear();

  // 书签栏通常是 ID 为 "1" 的节点
  const bookmarksBar = bookmarkTree.children.find(node => node.id === '1');
  if (bookmarksBar) {
    selectedIds.add(bookmarksBar.id);
  }

  renderTree();
}

/**
 * 确认选择
 */
async function confirm() {
  if (selectedIds.size === 0) {
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = '提取中...';

  try {
    // 提取选中的文件夹
    const folders = await extractFolders(Array.from(selectedIds));

    // 发送结果到父窗口
    if (window.opener) {
      window.opener.postMessage({
        action: 'bookmarksSelected',
        folders: folders
      }, '*');
    }

    // 关闭窗口
    window.close();
  } catch (error) {
    alert('提取失败: ' + error.message);
    confirmBtn.disabled = false;
    confirmBtn.textContent = '✓ 确认选择';
  }
}

/**
 * 取消
 */
function cancel() {
  window.close();
}

// 事件监听
selectAllBtn.addEventListener('click', selectAll);
deselectAllBtn.addEventListener('click', deselectAll);
selectBarBtn.addEventListener('click', selectBookmarksBar);
confirmBtn.addEventListener('click', confirm);
cancelBtn.addEventListener('click', cancel);

// 加载书签树
loadBookmarkTree();
