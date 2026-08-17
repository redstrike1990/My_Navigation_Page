// js/eventHandlers.js - 完整修复版
const EventHandlers = {
  openBookmarkModal(bm = null) {
    const modal = document.getElementById('bookmarkModal');
    const title = document.getElementById('modalTitle');
    const editId = document.getElementById('editBookmarkId');
    const name = document.getElementById('bookmarkName');
    const url = document.getElementById('bookmarkUrl');
    const icon = document.getElementById('bookmarkIcon');
    const preview = document.getElementById('iconPreview');
    const previewImg = document.getElementById('iconPreviewImg');

    if (bm) {
      title.textContent = '编辑网页标签';
      editId.value = bm.id;
      name.value = bm.name;
      url.value = bm.url;
      icon.value = bm.icon || '🌐';

      if (bm.icon && bm.icon.startsWith('icon_')) {
        const iconData = IconManager.getIcon(bm.icon);
        if (iconData) {
          preview.style.display = 'block';
          previewImg.style.display = 'block';
          previewImg.src = iconData;
          document.getElementById('iconPreviewText').style.display = 'none';
        }
      } else if (bm.icon && (bm.icon.startsWith('data:image') || bm.icon.startsWith('blob:'))) {
        preview.style.display = 'block';
        previewImg.style.display = 'block';
        previewImg.src = bm.icon;
        document.getElementById('iconPreviewText').style.display = 'none';
      } else {
        preview.style.display = 'none';
      }

      const cat = DataManager.findBookmarkCategory(bm.id);
      if (cat) document.getElementById('bookmarkCategory').value = cat.id;
    } else {
      title.textContent = '新建网页标签';
      editId.value = '';
      name.value = '';
      url.value = 'https://';
      icon.value = '🌐';
      preview.style.display = 'none';
      const cats = DataManager.getCategories();
      if (cats.length > 0) {
        document.getElementById('bookmarkCategory').value = cats[0].id;
      }
    }
    modal.classList.add('show');
    
    setTimeout(() => {
      url.focus();
      url.setSelectionRange(url.value.length, url.value.length);
    }, 100);
  },

  closeBookmarkModal() {
    document.getElementById('bookmarkModal').classList.remove('show');
    document.getElementById('iconPreview').style.display = 'none';
  },

  openCategoryModal(cat = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const editId = document.getElementById('editCategoryId');
    const name = document.getElementById('categoryName');

    if (cat) {
      title.textContent = '编辑分类';
      editId.value = cat.id;
      name.value = cat.name;
    } else {
      title.textContent = '新建分类';
      editId.value = '';
      name.value = '';
    }
    modal.classList.add('show');
    setTimeout(() => {
      document.getElementById('categoryName').focus();
    }, 100);
  },

  closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show');
  },

  openCropModal(imageSrc) {
    const modal = document.getElementById('cropModal');
    modal.classList.add('show');
    CropManager.init(imageSrc);
  },

  closeCropModal() {
    document.getElementById('cropModal').classList.remove('show');
    CropManager.cleanup();
  },

  autoCompleteUrl(url) {
    if (!url) return url;
    url = url.trim();
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('www.')) {
      return 'https://' + url;
    }
    
    if (url.startsWith('.')) {
      return 'https://www' + url;
    }
    
    if (url.includes('.') && !url.includes(' ')) {
      const tlds = ['.com', '.org', '.net', '.edu', '.gov', '.io', '.co', '.uk', '.de', '.fr', '.jp', '.cn', '.tv', '.me', '.cc', '.top'];
      let hasTld = false;
      for (let tld of tlds) {
        if (url.includes(tld)) {
          hasTld = true;
          break;
        }
      }
      
      if (hasTld || url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return 'https://' + url;
      }
    }
    
    if (url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]+$/)) {
      return 'https://www.' + url + '.com';
    }
    
    return 'https://' + url;
  },

  handleBookmarkSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editBookmarkId').value;
    const name = document.getElementById('bookmarkName').value.trim();
    let url = document.getElementById('bookmarkUrl').value.trim();
    let icon = document.getElementById('bookmarkIcon').value.trim() || '🌐';
    const catId = document.getElementById('bookmarkCategory').value;

    if (!name) {
      alert('请输入网页名称');
      return;
    }
    
    if (!url || url === 'https://' || url === 'http://') {
      alert('请输入有效的网址');
      return;
    }

    url = this.autoCompleteUrl(url);

    const previewImg = document.getElementById('iconPreviewImg');
    if (previewImg.style.display !== 'none' && previewImg.src) {
      icon = previewImg.src;
    }

    if (id) {
      DataManager.updateBookmark(id, name, url, icon, catId);
    } else {
      DataManager.addBookmark(catId, name, url, icon);
    }

    this.closeBookmarkModal();
    Renderer.render();
    
    // 重新应用编辑模式状态
    if (document.body.classList.contains('edit-mode')) {
      setTimeout(() => {
        Renderer.applyEditMode();
      }, 50);
    }
  },

  handleCategorySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editCategoryId').value;
    const name = document.getElementById('categoryName').value.trim();

    if (!name) {
      alert('请输入分类名称');
      return;
    }

    if (id) {
      DataManager.updateCategory(id, name);
    } else {
      DataManager.addCategory(name);
    }

    this.closeCategoryModal();
    Renderer.render();
    
    // 重新应用编辑模式状态
    if (document.body.classList.contains('edit-mode')) {
      setTimeout(() => {
        Renderer.applyEditMode();
      }, 50);
    }
  },

  handleIconUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target.result;
          this.openCropModal(imageSrc);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  },

  async handleConfirmCrop() {
    const blob = await CropManager.generateCroppedImage();
    if (!blob) {
      alert('裁剪失败，请重试');
      return;
    }

    const result = await IconManager.saveIcon(blob);
    if (result) {
      const previewImg = document.getElementById('iconPreviewImg');
      const preview = document.getElementById('iconPreview');
      preview.style.display = 'block';
      previewImg.style.display = 'block';
      previewImg.src = result.url;
      document.getElementById('iconPreviewText').style.display = 'none';
      document.getElementById('bookmarkIcon').value = result.id;
    }

    this.closeCropModal();
  },

  handleExportData() {
    const success = DataManager.exportData();
    if (success) {
      alert('数据导出成功！');
    } else {
      alert('数据导出失败，请重试。');
    }
  },

  handleImportData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        await DataManager.importData(file);
        Renderer.render();
        alert('数据导入成功！');
      } catch (error) {
        alert('数据导入失败: ' + error.message);
      }
    };
    input.click();
  }
};

// URL输入框实时提示和自动补全
document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('bookmarkUrl');
  if (urlInput) {
    urlInput.addEventListener('input', function(e) {
      const value = this.value.trim();
      const hint = document.getElementById('urlHint');
      if (value && !value.startsWith('http://') && !value.startsWith('https://') && value !== 'https://') {
        hint.style.display = 'block';
        if (value.match(/^[a-zA-Z0-9][a-zA-Z0-9-]+$/)) {
          hint.textContent = `💡 将自动补全为：https://www.${value}.com`;
        } else if (value.includes('.') && !value.includes(' ')) {
          hint.textContent = `💡 将自动补全为：https://${value}`;
        } else {
          hint.textContent = '💡 将自动添加 https://';
        }
      } else {
        hint.style.display = 'none';
      }
    });

    urlInput.addEventListener('blur', function(e) {
      let value = this.value.trim();
      if (value && value !== 'https://' && value !== 'http://') {
        if (value === 'https://' || value === 'http://') return;
        if (value.startsWith('http://') || value.startsWith('https://')) return;
        
        const completed = EventHandlers.autoCompleteUrl(value);
        if (completed !== value) {
          this.value = completed;
          const hint = document.getElementById('urlHint');
          hint.style.display = 'block';
          hint.textContent = `✅ 已自动补全为：${completed}`;
          hint.style.color = '#2e7d32';
          setTimeout(() => {
            hint.style.display = 'none';
            hint.style.color = '#0078d4';
          }, 3000);
        }
      }
    });

    urlInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        let value = this.value.trim();
        if (value && value !== 'https://' && value !== 'http://') {
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            this.value = EventHandlers.autoCompleteUrl(value);
          }
        }
        const form = this.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit'));
        }
      }
    });
  }
});