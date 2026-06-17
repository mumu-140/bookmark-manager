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
const expandAllBtn = document.getElementById('expandAllBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');

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
function createTreeNode(node, level = 0) {
  const div = document.createElement('div');

  // 只渲染文件夹
  if (!node.children) {
    return div;
  }

  const count = countBookmarksInTree(node);
  const hasChildren = node.children.some(child => child.children);

  // 节点容器
  const nodeDiv = document.createElement('div');
  nodeDiv.className = 'tree-node';
  nodeDiv.dataset.nodeId = node.id;
  if (selectedIds.has(node.id)) {
    nodeDiv.classList.add('selected');
  }

  // 折叠按钮
  if (hasChildren) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.innerHTML = '▼';
    toggleBtn.dataset.nodeId = node.id;
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFolder(node.id);
    });
    nodeDiv.appendChild(toggleBtn);
  } else {
    const spacer = document.createElement('div');
    spacer.className = 'no-children';
    nodeDiv.appendChild(spacer);
  }

  // 复选框
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selectedIds.has(node.id);
  checkbox.dataset.nodeId = node.id;
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    handleCheckboxChange(node.id, e.target.checked);
  });

  // 标签
  const label = document.createElement('span');
  label.className = 'tree-node-label';
  label.innerHTML = `
    📁 <strong>${escapeHtml(node.title)}</strong>
    <span class="tree-node-count">(${count} 个书签)</span>
  `;
  label.addEventListener('click', (e) => {
    e.stopPropagation();
    checkbox.click();
  });

  nodeDiv.appendChild(checkbox);
  nodeDiv.appendChild(label);
  div.appendChild(nodeDiv);

  // 渲染子文件夹
  if (node.children && node.children.length > 0) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'tree-children';
    childrenDiv.dataset.parentId = node.id;

    node.children.forEach(child => {
      if (child.children) {
        childrenDiv.appendChild(createTreeNode(child, level + 1));
      }
    });

    if (childrenDiv.children.length > 0) {
      div.appendChild(childrenDiv);
    }
  }

  return div;
}

/**
 * 折叠/展开文件夹
 */
function toggleFolder(nodeId) {
  const toggleBtn = document.querySelector(`.toggle-btn[data-node-id="${nodeId}"]`);
  const childrenDiv = document.querySelector(`.tree-children[data-parent-id="${nodeId}"]`);

  if (toggleBtn && childrenDiv) {
    childrenDiv.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
  }
}

/**
 * 处理复选框变化（支持层级联动）
 */
function handleCheckboxChange(nodeId, checked) {
  if (checked) {
    // 选中：只选中当前节点
    selectedIds.add(nodeId);
  } else {
    // 取消选中：取消当前节点及所有子孙节点
    unselectNodeAndDescendants(nodeId);
  }

  updateSelectionInfo();
  renderTree();
}

/**
 * 取消选中节点及其所有子孙节点
 */
function unselectNodeAndDescendants(nodeId) {
  selectedIds.delete(nodeId);

  // 找到该节点
  const node = findNodeById(bookmarkTree, nodeId);
  if (node && node.children) {
    // 递归取消所有子孙节点
    function unselectChildren(parentNode) {
      if (parentNode.children) {
        parentNode.children.forEach(child => {
          if (child.children) {
            selectedIds.delete(child.id);
            unselectChildren(child);
          }
        });
      }
    }
    unselectChildren(node);
  }
}

/**
 * 根据 ID 查找单个节点
 */
function findNodeById(tree, id) {
  function walk(node) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = walk(child);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(tree);
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
  selectedIds.clear();

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
 * 展开所有文件夹
 */
function expandAll() {
  document.querySelectorAll('.tree-children.collapsed').forEach(el => {
    el.classList.remove('collapsed');
  });
  document.querySelectorAll('.toggle-btn.collapsed').forEach(btn => {
    btn.classList.remove('collapsed');
  });
}

/**
 * 折叠所有文件夹
 */
function collapseAll() {
  document.querySelectorAll('.tree-children').forEach(el => {
    el.classList.add('collapsed');
  });
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.add('collapsed');
  });
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
    // 优化提取逻辑：仅选中子目录时，构建"父+选中子"结构
    const folders = await extractSelectedFolders(Array.from(selectedIds));

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
 * 提取选中的文件夹（支持父+子结构）
 */
async function extractSelectedFolders(selectedIds) {
  const result = [];
  const processedIds = new Set();

  for (const id of selectedIds) {
    if (processedIds.has(id)) continue;

    const node = findNodeById(bookmarkTree, id);
    if (!node) continue;

    // 检查是否有子孙节点也被选中
    const selectedDescendants = getSelectedDescendants(node, selectedIds);

    if (selectedDescendants.length === 0) {
      // 没有选中的子孙节点，直接提取整个文件夹
      const folder = await extractFolder(id);
      result.push(folder);
      processedIds.add(id);
    } else {
      // 有选中的子孙节点，构建"父+选中子"结构
      const folder = await extractFolderWithSelectedChildren(node, selectedIds);
      result.push(folder);
      processedIds.add(id);
      selectedDescendants.forEach(d => processedIds.add(d.id));
    }
  }

  return result;
}

/**
 * 获取选中的子孙节点
 */
function getSelectedDescendants(node, selectedIds) {
  const descendants = [];

  function walk(n) {
    if (n.children) {
      n.children.forEach(child => {
        if (child.children && selectedIds.includes(child.id)) {
          descendants.push(child);
        }
        walk(child);
      });
    }
  }

  walk(node);
  return descendants;
}

/**
 * 提取文件夹及选中的子文件夹
 */
async function extractFolderWithSelectedChildren(node, selectedIds) {
  const subtree = await chrome.bookmarks.getSubTree(node.id);
  const nodeData = subtree[0];

  // 过滤：只保留选中的子文件夹
  function filterChildren(n) {
    if (!n.children) {
      // 书签节点，保留
      return {
        title: n.title || n.url,
        url: n.url,
        dateAdded: n.dateAdded
      };
    } else {
      // 文件夹节点
      if (n.id === node.id || selectedIds.includes(n.id)) {
        // 当前节点或选中的节点，保留并递归处理子节点
        const filteredChildren = n.children
          .map(child => filterChildren(child))
          .filter(Boolean);

        return {
          title: n.title || '未命名文件夹',
          children: filteredChildren,
          dateAdded: n.dateAdded,
          dateGroupModified: n.dateGroupModified
        };
      } else {
        // 未选中的文件夹，继续递归但不保留自己
        const descendantSelected = n.children.some(child =>
          child.children && hasSelectedDescendant(child, selectedIds)
        );

        if (descendantSelected) {
          // 有选中的子孙节点，保留路径
          const filteredChildren = n.children
            .map(child => filterChildren(child))
            .filter(Boolean);

          return {
            title: n.title || '未命名文件夹',
            children: filteredChildren,
            dateAdded: n.dateAdded,
            dateGroupModified: n.dateGroupModified
          };
        }
        return null;
      }
    }
  }

  // 检查是否有选中的子孙节点
  function hasSelectedDescendant(n, selectedIds) {
    if (selectedIds.includes(n.id)) return true;
    if (n.children) {
      return n.children.some(child =>
        child.children && hasSelectedDescendant(child, selectedIds)
      );
    }
    return false;
  }

  return filterChildren(nodeData);
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
expandAllBtn.addEventListener('click', expandAll);
collapseAllBtn.addEventListener('click', collapseAll);
confirmBtn.addEventListener('click', confirm);
cancelBtn.addEventListener('click', cancel);

// 加载书签树
loadBookmarkTree();
