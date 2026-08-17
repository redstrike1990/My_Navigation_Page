// js/iconManager.js - 图标管理
const IconManager = {
  // 保存图标
  saveIcon(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const base64Data = e.target.result;
          const iconId = StorageManager.saveIcon(base64Data);
          if (iconId) {
            resolve({
              id: iconId,
              url: base64Data
            });
          } else {
            reject(new Error('保存图标失败'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = function() {
        reject(new Error('读取图片数据失败'));
      };
      reader.readAsDataURL(blob);
    });
  },

  // 获取图标
  getIcon(iconId) {
    return StorageManager.getIcon(iconId);
  },

  // 删除图标
  deleteIcon(iconId) {
    return StorageManager.deleteIcon(iconId);
  }
};