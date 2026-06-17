/**
 * 内嵌文件夹选择器逻辑（从 picker.js 提取并调整）
 */

/**
 * 渲染书签树
 */
function renderTree() {
  bookmarkTreeContainer.innerHTML = '';

  if (!bookmarkTree || !bookmarkTree.children) {
    bookmarkTreeContainer.innerHTML = '<p>没有书签</p>';
    return;
  }

  // 渲染顶层文件夹（书签栏、其他书签等）
  bookmarkTree.children.forEach(node => {
    if (node.children) {
      bookmarkTreeContainer.appendChild(createTreeNode(node));
    }
  });

  // 恢复折叠状态
  restoreCollapsedState();

  updateSelectionInfo();
}

/**
 * 恢复折叠状态
 */
function restoreCollapsedState() {
  collapsedIds.forEach(nodeId => {
    const toggleBtn = document.querySelector(`.toggle-btn[data-node-id="${nodeId}"]`);
    const childrenDiv = document.querySelector(`.tree-children[data-parent-id="${nodeId}"]`);

    if (toggleBtn && childrenDiv) {
      childrenDiv.classList.add('collapsed');
      toggleBtn.classList.add('collapsed');
    }
  });
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
    const isCollapsed = childrenDiv.classList.contains('collapsed');

    if (isCollapsed) {
      // 展开
      childrenDiv.classList.remove('collapsed');
      toggleBtn.classList.remove('collapsed');
      collapsedIds.delete(nodeId);
    } else {
      // 折叠
      childrenDiv.classList.add('collapsed');
      toggleBtn.classList.add('collapsed');
      collapsedIds.add(nodeId);
    }
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
    selectedIds.forEach(id => {
      const node = findNodeById(bookmarkTree, id);
      if (node) {
        totalBookmarks += countBookmarksInTree(node);
      }
    });
  }

  pickerInfo.textContent = `已选择: ${selectedCount} 个文件夹，共 ${totalBookmarks} 个书签`;
  confirmBtn.disabled = selectedCount === 0;
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
  collapsedIds.clear();
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
  // 收集所有文件夹节点
  function collectFolderIds(node) {
    const ids = [];
    if (node.children && node.children.length > 0) {
      const hasChildFolders = node.children.some(child => child.children);
      if (hasChildFolders) {
        ids.push(node.id);
      }
      node.children.forEach(child => {
        if (child.children) {
          ids.push(...collectFolderIds(child));
        }
      });
    }
    return ids;
  }

  const allFolderIds = [];
  bookmarkTree.children.forEach(node => {
    allFolderIds.push(...collectFolderIds(node));
  });

  allFolderIds.forEach(id => collapsedIds.add(id));

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
async function confirmSelection() {
  if (selectedIds.size === 0) {
    alert('请先选择文件夹');
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = '提取中...';

  try {
    console.log('Selected IDs:', Array.from(selectedIds));

    // 提取选中的文件夹
    selectedFolders = [];
    for (const id of selectedIds) {
      const folder = await extractFolder(id);
      if (folder) {
        selectedFolders.push(folder);
      }
    }

    console.log('Extracted folders:', selectedFolders.length);

    // 更新主界面显示
    const totalBookmarks = selectedFolders.reduce((sum, folder) => {
      return sum + countBookmarksInTree(folder);
    }, 0);

    selectedInfo.textContent = `✓ 已选择 ${selectedFolders.length} 个文件夹，共 ${totalBookmarks} 个书签`;
    selectedInfo.classList.add('show');

    // 隐藏选择器
    hidePickerPanel();

    confirmBtn.disabled = false;
    confirmBtn.textContent = '✓ 确认选择';

  } catch (error) {
    console.error('Confirm error:', error);
    alert('提取失败: ' + error.message);
    confirmBtn.disabled = false;
    confirmBtn.textContent = '✓ 确认选择';
  }
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
