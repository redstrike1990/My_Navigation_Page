// js/storageManager.js - 完整文件（含新默认数据）
const StorageManager = {
  STORAGE_KEY: 'navigation_data_v2',
  ICON_STORAGE_KEY: 'navigation_icons_v2',
  
  getDefaultData() {
    return {
      categories: [
        {
          id: 'cat1',
          name: '搜索',
          collapsed: false,
          bookmarks: [
            { id: 'bm1', name: '百度', url: 'https://www.baidu.com', icon: '🔍' },
            { id: 'bm2', name: 'Google', url: 'https://www.google.com', icon: '🌐' },
            { id: 'bm3', name: 'Bing', url: 'https://www.bing.com', icon: '📊' }
          ]
        },
        {
          id: 'cat2',
          name: 'AI',
          collapsed: false,
          bookmarks: [
            { id: 'bm4', name: 'DeepSeek', url: 'https://chat.deepseek.com', icon: '🤖' },
            { id: 'bm5', name: '豆包', url: 'https://doubao.com', icon: '🧠' }
          ]
        },
        {
          id: 'cat3',
          name: '视频',
          collapsed: false,
          bookmarks: [
            { id: 'bm6', name: 'Bilibili', url: 'https://www.bilibili.com', icon: '📺' },
            { id: 'bm7', name: 'AcFun', url: 'https://www.acfun.cn', icon: '🎬' }
          ]
        }
      ],
      nextId: 100
    };
  },

  // 保存数据到 localStorage
  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('✅ 数据已保存到 localStorage');
      return true;
    } catch (e) {
      console.error('❌ 保存数据失败:', e);
      return false;
    }
  },

  // 从 localStorage 加载数据
  loadData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        console.log('✅ 从 localStorage 加载数据成功');
        return JSON.parse(data);
      }
      return null;
    } catch (e) {
      console.error('❌ 加载数据失败:', e);
      return null;
    }
  },

  // 保存图标到 localStorage
  saveIcon(iconData) {
    try {
      const icons = this.loadIcons() || {};
      const iconId = 'icon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      icons[iconId] = iconData;
      localStorage.setItem(this.ICON_STORAGE_KEY, JSON.stringify(icons));
      console.log('✅ 图标已保存:', iconId);
      return iconId;
    } catch (e) {
      console.error('❌ 保存图标失败:', e);
      return null;
    }
  },

  // 加载所有图标
  loadIcons() {
    try {
      const data = localStorage.getItem(this.ICON_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return {};
    } catch (e) {
      console.error('❌ 加载图标失败:', e);
      return {};
    }
  },

  // 获取单个图标
  getIcon(iconId) {
    const icons = this.loadIcons();
    return icons[iconId] || null;
  },

  // 导出完整数据为 JSON 文件
  exportToFile() {
    try {
      const data = this.loadData();
      const icons = this.loadIcons();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: data,
        icons: icons,
        totalIcons: Object.keys(icons).length,
        totalCategories: data ? data.categories.length : 0,
        totalBookmarks: data ? data.categories.reduce((sum, cat) => sum + cat.bookmarks.length, 0) : 0
      };
      
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `navigation_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ 数据导出成功，包含', Object.keys(icons).length, '个图标');
      return true;
    } catch (e) {
      console.error('❌ 导出文件失败:', e);
      return false;
    }
  },

  // 从 JSON 文件导入数据
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (!importData.data || !importData.data.categories) {
            reject(new Error('无效的数据文件格式'));
            return;
          }
          
          this.saveData(importData.data);
          
          if (importData.icons) {
            localStorage.setItem(this.ICON_STORAGE_KEY, JSON.stringify(importData.icons));
            console.log('✅ 导入图标:', Object.keys(importData.icons).length, '个');
          }
          
          console.log('✅ 数据导入成功');
          resolve(importData.data);
        } catch (error) {
          reject(new Error('文件解析失败: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  },

  // 获取存储状态信息
  getStorageInfo() {
    const data = this.loadData();
    const icons = this.loadIcons();
    const totalSize = new Blob([localStorage.getItem(this.STORAGE_KEY) || '']).size;
    const iconSize = new Blob([localStorage.getItem(this.ICON_STORAGE_KEY) || '']).size;
    
    return {
      hasData: data !== null,
      categories: data ? data.categories.length : 0,
      bookmarks: data ? data.categories.reduce((sum, cat) => sum + cat.bookmarks.length, 0) : 0,
      icons: Object.keys(icons).length,
      totalSize: (totalSize + iconSize) / 1024,
      dataSize: totalSize / 1024,
      iconSize: iconSize / 1024
    };
  },

  // 重置为默认数据
  resetData() {
    const defaultData = this.getDefaultData();
    this.saveData(defaultData);
    localStorage.removeItem(this.ICON_STORAGE_KEY);
    console.log('🔄 已重置为默认数据');
    return defaultData;
  },

  // 清理所有存储
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ICON_STORAGE_KEY);
    console.log('🗑️ 已清除所有存储数据');
  }
};