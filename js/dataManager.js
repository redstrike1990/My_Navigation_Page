// js/dataManager.js - 数据管理
const DataManager = {
  categories: [],
  nextId: 100,

  init() {
    const data = StorageManager.loadData();
    if (data) {
      this.categories = data.categories;
      this.nextId = data.nextId || 100;
      console.log('从存储加载数据成功');
    } else {
      const defaultData = StorageManager.getDefaultData();
      this.categories = defaultData.categories;
      this.nextId = defaultData.nextId || 100;
      this.save();
      console.log('使用默认数据');
    }
    return this.categories;
  },

  save() {
    const data = {
      categories: this.categories,
      nextId: this.nextId
    };
    StorageManager.saveData(data);
  },

  reset() {
    const defaultData = StorageManager.resetData();
    this.categories = defaultData.categories;
    this.nextId = defaultData.nextId || 100;
    this.save();
    return this.categories;
  },

  exportData() {
    return StorageManager.exportToFile();
  },

  importData(file) {
    return StorageManager.importFromFile(file).then((data) => {
      this.categories = data.categories;
      this.nextId = data.nextId || 100;
      this.save();
      return this.categories;
    });
  },

  getCategories() {
    return this.categories;
  },

  findCategory(id) {
    return this.categories.find(c => c.id === id);
  },

  findBookmark(id) {
    for (let cat of this.categories) {
      const found = cat.bookmarks.find(b => b.id === id);
      if (found) return found;
    }
    return null;
  },

  findBookmarkCategory(id) {
    for (let cat of this.categories) {
      if (cat.bookmarks.some(b => b.id === id)) return cat;
    }
    return null;
  },

  addCategory(name) {
    const newCat = {
      id: 'cat' + (this.nextId++),
      name: name,
      collapsed: false,
      bookmarks: []
    };
    this.categories.push(newCat);
    this.save();
    return newCat;
  },

  updateCategory(id, name) {
    const cat = this.findCategory(id);
    if (cat) {
      cat.name = name;
      this.save();
    }
    return cat;
  },

  deleteCategory(id) {
    this.categories = this.categories.filter(c => c.id !== id);
    this.save();
  },

  addBookmark(categoryId, name, url, icon) {
    const cat = this.findCategory(categoryId);
    if (!cat) return null;
    const newBm = {
      id: 'bm' + (this.nextId++),
      name: name,
      url: url,
      icon: icon || '🌐'
    };
    cat.bookmarks.push(newBm);
    this.save();
    return newBm;
  },

  updateBookmark(id, name, url, icon, categoryId) {
    const oldCat = this.findBookmarkCategory(id);
    const bm = this.findBookmark(id);
    if (!bm) return null;

    bm.name = name;
    bm.url = url;
    bm.icon = icon || bm.icon;

    if (oldCat && oldCat.id !== categoryId) {
      const newCat = this.findCategory(categoryId);
      if (newCat) {
        oldCat.bookmarks = oldCat.bookmarks.filter(b => b.id !== id);
        newCat.bookmarks.push(bm);
      }
    }
    this.save();
    return bm;
  },

  deleteBookmark(id) {
    for (let cat of this.categories) {
      const idx = cat.bookmarks.findIndex(b => b.id === id);
      if (idx !== -1) {
        cat.bookmarks.splice(idx, 1);
        this.save();
        return true;
      }
    }
    return false;
  },

  toggleCategory(id) {
    const cat = this.findCategory(id);
    if (cat) {
      cat.collapsed = !cat.collapsed;
      this.save();
    }
    return cat;
  },

  getCategoryOptions() {
    return this.categories.map(cat => ({
      value: cat.id,
      text: cat.name
    }));
  }
};