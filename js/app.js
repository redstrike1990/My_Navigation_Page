// js/app.js - 完整修复版
(function() {
  'use strict';

  // ===== 第一步：确保 EventHandlers 在全局可用 =====
  // 注意：必须在任何调用之前暴露
  window.EventHandlers = EventHandlers;

  // ===== 第二步：强制重置编辑状态为关闭 =====
  // 删除 localStorage 中的旧状态，确保每次刷新都从关闭开始
  localStorage.removeItem('editModeState');
  // 或者设置为 'false'
  localStorage.setItem('editModeState', 'false');

  // 初始化数据
  DataManager.init();

  // ===== 第三步：确保编辑模式默认为关闭 =====
  const editToggleBtn = document.getElementById('editToggleBtn');
  const toggleIcon = document.getElementById('toggleIcon');
  const toggleTooltip = document.querySelector('#editToggleBtn .float-btn-tooltip');
  let isEditMode = false;

  // 强制设置为关闭状态
  editToggleBtn.classList.remove('active');
  toggleIcon.textContent = '✏️';
  toggleTooltip.textContent = '锁定';
  document.body.classList.remove('edit-mode');
  localStorage.setItem('editModeState', 'false');

  // 通知 Renderer 更新
  if (typeof Renderer !== 'undefined' && Renderer.updateEditMode) {
    Renderer.updateEditMode();
  }

  // 初始渲染
  Renderer.render();

  // ===== 编辑开关点击事件 =====
  editToggleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    isEditMode = !isEditMode;
    
    if (isEditMode) {
      this.classList.add('active');
      toggleIcon.textContent = '✏️';
      toggleTooltip.textContent = '可编辑';
      document.body.classList.add('edit-mode');
      localStorage.setItem('editModeState', 'true');
      Renderer.updateEditMode();
      initSortable();
    } else {
      this.classList.remove('active');
      toggleIcon.textContent = '✏️';
      toggleTooltip.textContent = '锁定';
      document.body.classList.remove('edit-mode');
      localStorage.setItem('editModeState', 'false');
      Renderer.updateEditMode();
      destroySortable();
      document.querySelectorAll('.bookmark-item.show-actions').forEach(el => el.classList.remove('show-actions'));
    }
  });

  // ===== 返回顶部功能 =====
  const backToTopBtn = document.getElementById('backToTopBtn');
  backToTopBtn.classList.add('show');

  backToTopBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.style.transform = 'scale(0.9)';
    setTimeout(() => {
      this.style.transform = '';
    }, 200);
  });

  // ===== 搜索功能 =====
  function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    const engine = document.getElementById('engineSelect').value;
    window.open(engine + encodeURIComponent(query), '_blank');
  }

  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') performSearch();
  });

  // ===== 浮动按钮事件 =====
  document.getElementById('addCategoryBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    EventHandlers.openCategoryModal(null);
  });

  document.getElementById('addBookmarkBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    EventHandlers.openBookmarkModal(null);
  });

  document.getElementById('exportBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    EventHandlers.handleExportData();
  });

  document.getElementById('importBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    EventHandlers.handleImportData();
  });

  document.getElementById('resetBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    if (confirm('确定要重置为默认状态吗？所有当前数据将被清除！')) {
      DataManager.reset();
      Renderer.render();
      if (isEditMode) {
        setTimeout(initSortable, 100);
      }
      alert('已重置为默认状态');
    }
  });

  // ===== 模态框关闭 =====
  document.getElementById('closeModal').addEventListener('click', () => {
    EventHandlers.closeBookmarkModal();
  });

  document.getElementById('closeCategoryModal').addEventListener('click', () => {
    EventHandlers.closeCategoryModal();
  });

  document.getElementById('closeCropModal').addEventListener('click', () => {
    EventHandlers.closeCropModal();
  });

  window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('bookmarkModal')) {
      EventHandlers.closeBookmarkModal();
    }
    if (e.target === document.getElementById('categoryModal')) {
      EventHandlers.closeCategoryModal();
    }
    if (e.target === document.getElementById('cropModal')) {
      EventHandlers.closeCropModal();
    }
  });

  // ===== 表单提交 - 使用 bind 确保 this 正确 =====
  document.getElementById('bookmarkForm').addEventListener('submit', EventHandlers.handleBookmarkSubmit.bind(EventHandlers));
  document.getElementById('categoryForm').addEventListener('submit', EventHandlers.handleCategorySubmit.bind(EventHandlers));

  // ===== 图片上传 =====
  document.getElementById('uploadIconBtn').addEventListener('click', () => {
    EventHandlers.handleIconUpload();
  });

  // ===== 裁剪确认/取消 =====
  document.getElementById('confirmCropBtn').addEventListener('click', () => {
    EventHandlers.handleConfirmCrop();
  });

  document.getElementById('cancelCropBtn').addEventListener('click', () => {
    EventHandlers.closeCropModal();
  });

  // ===== 拖拽排序 =====
  let sortableInstances = [];

  function initSortable() {
    destroySortable();
    const mainEl = document.getElementById('mainContent');

    if (document.querySelectorAll('.category').length > 1) {
      const sortable = Sortable.create(mainEl, {
        handle: '.category-header',
        animation: 150,
        onEnd: function(evt) {
          const items = Array.from(document.querySelectorAll('.category'));
          const newOrder = items.map(el => el.dataset.categoryId);
          const categories = DataManager.getCategories();
          categories.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
          DataManager.save();
          Renderer.render();
          if (isEditMode) {
            setTimeout(initSortable, 50);
          }
        }
      });
      sortableInstances.push(sortable);
    }

    document.querySelectorAll('.bookmark-grid').forEach(grid => {
      const sortable = Sortable.create(grid, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: function(evt) {
          const catId = grid.dataset.categoryId;
          const cat = DataManager.findCategory(catId);
          if (!cat) return;
          const items = Array.from(grid.querySelectorAll('.bookmark-item'));
          const newOrder = items.map(el => el.dataset.bookmarkId);
          cat.bookmarks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
          DataManager.save();
          Renderer.render();
          if (isEditMode) {
            setTimeout(initSortable, 50);
          }
        }
      });
      sortableInstances.push(sortable);
    });
  }

  function destroySortable() {
    sortableInstances.forEach(s => s.destroy());
    sortableInstances = [];
  }

  // ===== 页面关闭前保存 =====
  window.addEventListener('beforeunload', function() {
    destroySortable();
    DataManager.save();
  });

  // ===== 定期自动保存 =====
  setInterval(() => {
    DataManager.save();
  }, 30000);

  // ===== 导出全局 =====
  window.DataManager = DataManager;
  window.Renderer = Renderer;
  window.EventHandlers = EventHandlers;
  window.IconManager = IconManager;
  window.CropManager = CropManager;
  window.StorageManager = StorageManager;
})();