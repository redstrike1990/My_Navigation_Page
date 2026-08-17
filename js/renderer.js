// js/renderer.js - 修复 bindEvents 中的 this 绑定
const Renderer = {
  render() {
    this.renderCategorySelect();
    this.renderMainContent();
    this.bindEvents();
    this.applyEditMode();
  },

  renderCategorySelect() {
    const select = document.getElementById('bookmarkCategory');
    const currentVal = select.value;
    select.innerHTML = '';
    DataManager.getCategories().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
    if (currentVal && DataManager.findCategory(currentVal)) {
      select.value = currentVal;
    } else if (DataManager.getCategories().length > 0) {
      select.value = DataManager.getCategories()[0].id;
    }
  },

  renderMainContent() {
    const mainEl = document.getElementById('mainContent');
    mainEl.innerHTML = '';
    const categories = DataManager.getCategories();

    categories.forEach((cat) => {
      const catDiv = document.createElement('div');
      catDiv.className = 'category';
      catDiv.dataset.categoryId = cat.id;

      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <div class="category-header-left">
          <button class="category-toggle ${cat.collapsed ? 'collapsed' : ''}" data-catid="${cat.id}">
            ${cat.collapsed ? '▶' : '▼'}
          </button>
          <h2>${cat.name}</h2>
        </div>
        <div class="category-actions">
          <button class="edit-cat" data-catid="${cat.id}" title="编辑分类">✎</button>
          <button class="delete-cat" data-catid="${cat.id}" title="删除分类">🗑</button>
        </div>
      `;
      catDiv.appendChild(header);

      const grid = document.createElement('div');
      grid.className = `bookmark-grid ${cat.collapsed ? 'collapsed' : ''}`;
      grid.dataset.categoryId = cat.id;

      cat.bookmarks.forEach((bm) => {
        const item = document.createElement('a');
        item.className = 'bookmark-item';
        item.dataset.url = bm.url;
        item.dataset.bookmarkId = bm.id;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'bookmark-icon';

        if (bm.icon && bm.icon.startsWith('icon_')) {
          const iconData = IconManager.getIcon(bm.icon);
          if (iconData) {
            const img = document.createElement('img');
            img.src = iconData;
            img.alt = bm.name;
            iconSpan.appendChild(img);
          } else {
            iconSpan.textContent = '🌐';
          }
        } else if (bm.icon && (bm.icon.startsWith('data:image') || bm.icon.startsWith('blob:'))) {
          const img = document.createElement('img');
          img.src = bm.icon;
          img.alt = bm.name;
          iconSpan.appendChild(img);
        } else {
          iconSpan.textContent = bm.icon || '🌐';
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'bookmark-name';
        nameSpan.textContent = bm.name;

        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '⠿';

        const overlay = document.createElement('div');
        overlay.className = 'bookmark-actions-overlay';
        overlay.innerHTML = `
          <button class="edit-bm" data-id="${bm.id}" title="编辑标签">✎</button>
          <button class="delete-bm" data-id="${bm.id}" title="删除标签">🗑</button>
        `;

        item.appendChild(iconSpan);
        item.appendChild(nameSpan);
        item.appendChild(dragHandle);
        item.appendChild(overlay);
        grid.appendChild(item);
      });

      catDiv.appendChild(grid);
      mainEl.appendChild(catDiv);
    });
  },

  isEditMode() {
    return document.body.classList.contains('edit-mode');
  },

  applyEditMode() {
    const editMode = this.isEditMode();
    
    document.querySelectorAll('.category-actions button').forEach(btn => {
      btn.style.display = editMode ? 'inline-flex' : 'none';
    });
    
    document.querySelectorAll('.bookmark-actions-overlay').forEach(overlay => {
      overlay.style.display = editMode ? 'flex' : 'none';
    });
    
    document.querySelectorAll('.drag-handle').forEach(handle => {
      handle.style.display = editMode ? 'block' : 'none';
    });
    
    document.querySelectorAll('.bookmark-item').forEach(item => {
      if (editMode) {
        item.style.cursor = 'grab';
        item.style.border = '1px dashed rgba(0, 120, 212, 0.2)';
      } else {
        item.style.cursor = 'default';
        item.style.border = '1px solid rgba(255, 255, 255, 0.5)';
      }
    });
  },

  updateEditMode() {
    this.applyEditMode();
  },

  updateControlsVisibility() {
    this.applyEditMode();
  },

  // ===== 修复 bindEvents：使用 .bind(this) 确保 this 指向正确 =====
  bindEvents() {
    // 分类折叠
    document.querySelectorAll('.category-toggle').forEach(btn => {
      btn.removeEventListener('click', this.handleToggleCategory);
      btn.addEventListener('click', this.handleToggleCategory.bind(this));
    });

    // 分类编辑
    document.querySelectorAll('.edit-cat').forEach(btn => {
      btn.removeEventListener('click', this.handleEditCategory);
      btn.addEventListener('click', this.handleEditCategory.bind(this));
    });

    // 分类删除
    document.querySelectorAll('.delete-cat').forEach(btn => {
      btn.removeEventListener('click', this.handleDeleteCategory);
      btn.addEventListener('click', this.handleDeleteCategory.bind(this));
    });

    // 标签编辑
    document.querySelectorAll('.edit-bm').forEach(btn => {
      btn.removeEventListener('click', this.handleEditBookmark);
      btn.addEventListener('click', this.handleEditBookmark.bind(this));
    });

    // 标签删除
    document.querySelectorAll('.delete-bm').forEach(btn => {
      btn.removeEventListener('click', this.handleDeleteBookmark);
      btn.addEventListener('click', this.handleDeleteBookmark.bind(this));
    });

    // 标签点击跳转
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.removeEventListener('click', this.handleBookmarkClick);
      item.addEventListener('click', this.handleBookmarkClick.bind(this));
    });

    // 长按事件
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.removeEventListener('mousedown', this.startLongPress);
      item.removeEventListener('mouseup', this.clearLongPress);
      item.removeEventListener('mouseleave', this.clearLongPress);
      item.removeEventListener('touchstart', this.startLongPressTouch);
      item.removeEventListener('touchend', this.clearLongPress);
      item.removeEventListener('touchmove', this.clearLongPress);
      item.addEventListener('mousedown', this.startLongPress.bind(this));
      item.addEventListener('mouseup', this.clearLongPress.bind(this));
      item.addEventListener('mouseleave', this.clearLongPress.bind(this));
      item.addEventListener('touchstart', this.startLongPressTouch.bind(this));
      item.addEventListener('touchend', this.clearLongPress.bind(this));
      item.addEventListener('touchmove', this.clearLongPress.bind(this));
    });
  },

  handleBookmarkClick(e) {
    if (e.target.closest('.bookmark-actions-overlay')) {
      e.preventDefault();
      return;
    }
    if (e.target.closest('.drag-handle')) {
      e.preventDefault();
      return;
    }

    if (this.isEditMode()) {
      e.preventDefault();
      return;
    }

    const item = e.currentTarget;
    const url = item.dataset.url;
    if (url) {
      window.open(url, '_blank');
    }
  },

  handleToggleCategory(e) {
    const catId = e.currentTarget.dataset.catid;
    DataManager.toggleCategory(catId);
    this.render();
  },

  handleEditCategory(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.isEditMode()) {
      return;
    }
    
    const catId = e.currentTarget.dataset.catid;
    const cat = DataManager.findCategory(catId);
    if (cat) {
      if (typeof EventHandlers !== 'undefined' && EventHandlers.openCategoryModal) {
        EventHandlers.openCategoryModal(cat);
      } else {
        console.error('EventHandlers 未定义');
      }
    }
  },

  handleDeleteCategory(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.isEditMode()) {
      return;
    }
    
    const catId = e.currentTarget.dataset.catid;
    if (!confirm('确定删除此分类及其所有标签吗？')) return;
    DataManager.deleteCategory(catId);
    this.render();
  },

  handleEditBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.isEditMode()) {
      return;
    }
    
    const bmId = e.currentTarget.dataset.id;
    const bm = DataManager.findBookmark(bmId);
    if (bm) {
      document.querySelectorAll('.bookmark-item.show-actions').forEach(el => el.classList.remove('show-actions'));
      if (typeof EventHandlers !== 'undefined' && EventHandlers.openBookmarkModal) {
        EventHandlers.openBookmarkModal(bm);
      } else {
        console.error('EventHandlers 未定义');
      }
    }
  },

  handleDeleteBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.isEditMode()) {
      return;
    }
    
    const bmId = e.currentTarget.dataset.id;
    if (!confirm('确定删除此标签吗？')) return;
    DataManager.deleteBookmark(bmId);
    document.querySelectorAll('.bookmark-item.show-actions').forEach(el => el.classList.remove('show-actions'));
    this.render();
  },

  longPressTimer: null,

  startLongPress(e) {
    if (!this.isEditMode()) {
      return;
    }
    
    const item = e.currentTarget;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    this.longPressTimer = setTimeout(() => {
      document.querySelectorAll('.bookmark-item.show-actions').forEach(el => el.classList.remove('show-actions'));
      item.classList.add('show-actions');
      this.longPressTimer = null;
    }, 600);
  },

  startLongPressTouch(e) {
    if (!this.isEditMode()) {
      return;
    }
    
    const item = e.currentTarget;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    this.longPressTimer = setTimeout(() => {
      document.querySelectorAll('.bookmark-item.show-actions').forEach(el => el.classList.remove('show-actions'));
      item.classList.add('show-actions');
      this.longPressTimer = null;
    }, 600);
  },

  clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
};

// 点击其他地方关闭浮层
document.addEventListener('click', function(e) {
  if (!e.target.closest('.bookmark-item')) {
    document.querySelectorAll('.bookmark-item.show-actions').forEach(el => el.classList.remove('show-actions'));
  }
});