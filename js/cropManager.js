// js/cropManager.js - 图片裁剪管理
const CropManager = {
  currentImage: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  cropSize: 128,
  minCropSize: 32,
  maxCropSize: 400,

  isDragging: false,
  isResizing: false,
  resizeHandle: null,
  dragStartX: 0,
  dragStartY: 0,
  dragStartOffsetX: 0,
  dragStartOffsetY: 0,
  dragStartCropSize: 0,

  cropImage: null,
  cropBox: null,
  cropWrapper: null,

  init(imageSrc) {
    this.currentImage = imageSrc;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.cropSize = 128;

    this.cropImage = document.getElementById('cropImage');
    this.cropBox = document.getElementById('cropBox');
    this.cropWrapper = document.getElementById('cropWrapper');

    this.cropImage.src = imageSrc;
    this.cropImage.onload = () => {
      this.reset();
      this.setupEvents();
      this.updateCropInfo();
    };
  },

  reset() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.cropSize = 128;
    this.updateTransform();
    this.updateCropBox();
    this.updateCropInfo();
  },

  updateTransform() {
    if (this.cropImage) {
      this.cropImage.style.transform = `scale(${this.scale}) translate(${this.offsetX}px, ${this.offsetY}px)`;
    }
  },

  updateCropBox() {
    if (!this.cropBox || !this.cropWrapper) return;
    const wrapperRect = this.cropWrapper.getBoundingClientRect();
    const imgRect = this.cropImage.getBoundingClientRect();

    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;

    const cropDisplaySize = this.cropSize * this.scale;

    const imgOffsetX = (wrapperRect.width - displayWidth) / 2;
    const imgOffsetY = (wrapperRect.height - displayHeight) / 2;

    const cropX = imgOffsetX + (displayWidth / 2) - (cropDisplaySize / 2);
    const cropY = imgOffsetY + (displayHeight / 2) - (cropDisplaySize / 2);

    this.cropBox.style.width = cropDisplaySize + 'px';
    this.cropBox.style.height = cropDisplaySize + 'px';
    this.cropBox.style.left = cropX + 'px';
    this.cropBox.style.top = cropY + 'px';
    this.cropBox.style.transform = 'none';
  },

  updateCropInfo() {
    const info = document.getElementById('cropSizeInfo');
    if (info) {
      const size = Math.round(this.cropSize);
      info.textContent = `${size} × ${size}`;
    }
  },

  setupEvents() {
    this.cropBox.addEventListener('mousedown', this.startDrag.bind(this));
    this.cropBox.addEventListener('touchstart', this.startDragTouch.bind(this), { passive: false });

    document.querySelectorAll('.crop-handle').forEach(handle => {
      handle.addEventListener('mousedown', this.startResize.bind(this));
      handle.addEventListener('touchstart', this.startResizeTouch.bind(this), { passive: false });
    });

    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('touchmove', this.onDragMoveTouch.bind(this), { passive: false });
    document.addEventListener('mouseup', this.endDrag.bind(this));
    document.addEventListener('touchend', this.endDrag.bind(this));

    document.getElementById('resetCropBtn').addEventListener('click', () => this.reset());
  },

  handleWheel(e) {
    e.preventDefault();
  },

  startDrag(e) {
    if (this.isResizing) return;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartOffsetX = this.offsetX;
    this.dragStartOffsetY = this.offsetY;
    e.preventDefault();
  },

  startDragTouch(e) {
    if (this.isResizing) return;
    const touch = e.touches[0];
    this.isDragging = true;
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.dragStartOffsetX = this.offsetX;
    this.dragStartOffsetY = this.offsetY;
    e.preventDefault();
  },

  startResize(e) {
    this.isResizing = true;
    this.resizeHandle = e.target.className.split(' ')[1].replace('crop-handle-', '');
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartCropSize = this.cropSize;
    e.preventDefault();
    e.stopPropagation();
  },

  startResizeTouch(e) {
    const touch = e.touches[0];
    this.isResizing = true;
    this.resizeHandle = touch.target.className.split(' ')[1].replace('crop-handle-', '');
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.dragStartCropSize = this.cropSize;
    e.preventDefault();
    e.stopPropagation();
  },

  onDragMove(e) {
    if (this.isDragging) {
      const dx = (e.clientX - this.dragStartX) / this.scale;
      const dy = (e.clientY - this.dragStartY) / this.scale;
      this.offsetX = this.dragStartOffsetX + dx;
      this.offsetY = this.dragStartOffsetY + dy;
      this.updateTransform();
      this.updateCropBox();
    }

    if (this.isResizing) {
      const dx = (e.clientX - this.dragStartX) / this.scale;
      const dy = (e.clientY - this.dragStartY) / this.scale;
      let delta = 0;

      switch(this.resizeHandle) {
        case 'se': delta = (dx + dy) / 2; break;
        case 'nw': delta = -(dx + dy) / 2; break;
        case 'ne': delta = (-dx + dy) / 2; break;
        case 'sw': delta = (dx - dy) / 2; break;
        default: delta = (dx + dy) / 2;
      }

      let newSize = this.dragStartCropSize + delta;
      newSize = Math.max(this.minCropSize, Math.min(this.maxCropSize, newSize));
      this.cropSize = newSize;
      this.updateCropBox();
      this.updateCropInfo();
    }
  },

  onDragMoveTouch(e) {
    const touch = e.touches[0];
    if (this.isDragging) {
      const dx = (touch.clientX - this.dragStartX) / this.scale;
      const dy = (touch.clientY - this.dragStartY) / this.scale;
      this.offsetX = this.dragStartOffsetX + dx;
      this.offsetY = this.dragStartOffsetY + dy;
      this.updateTransform();
      this.updateCropBox();
    }

    if (this.isResizing) {
      const dx = (touch.clientX - this.dragStartX) / this.scale;
      const dy = (touch.clientY - this.dragStartY) / this.scale;
      let delta = 0;

      switch(this.resizeHandle) {
        case 'se': delta = (dx + dy) / 2; break;
        case 'nw': delta = -(dx + dy) / 2; break;
        case 'ne': delta = (-dx + dy) / 2; break;
        case 'sw': delta = (dx - dy) / 2; break;
        default: delta = (dx + dy) / 2;
      }

      let newSize = this.dragStartCropSize + delta;
      newSize = Math.max(this.minCropSize, Math.min(this.maxCropSize, newSize));
      this.cropSize = newSize;
      this.updateCropBox();
      this.updateCropInfo();
    }
  },

  endDrag() {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
  },

  getCropData() {
    if (!this.cropImage) return null;

    const img = this.cropImage;
    const wrapperRect = this.cropWrapper.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const boxRect = this.cropBox.getBoundingClientRect();

    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const imgLeft = imgRect.left - wrapperRect.left;
    const imgTop = imgRect.top - wrapperRect.top;

    const boxLeft = boxRect.left - wrapperRect.left;
    const boxTop = boxRect.top - wrapperRect.top;

    const cropRelX = boxLeft - imgLeft;
    const cropRelY = boxTop - imgTop;

    const finalScaleX = naturalWidth / displayWidth;
    const finalScaleY = naturalHeight / displayHeight;

    const finalX = (cropRelX / this.scale) * finalScaleX;
    const finalY = (cropRelY / this.scale) * finalScaleY;
    const finalW = (boxRect.width / this.scale) * finalScaleX;
    const finalH = (boxRect.height / this.scale) * finalScaleY;

    const maxX = naturalWidth - finalW;
    const maxY = naturalHeight - finalH;

    return {
      x: Math.max(0, Math.min(maxX, finalX)),
      y: Math.max(0, Math.min(maxY, finalY)),
      width: Math.min(finalW, naturalWidth),
      height: Math.min(finalH, naturalHeight),
      naturalWidth: naturalWidth,
      naturalHeight: naturalHeight
    };
  },

  async generateCroppedImage() {
    const cropData = this.getCropData();
    if (!cropData) {
      console.error('无法获取裁剪数据');
      return null;
    }

    const img = this.cropImage;
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      cropData.x, cropData.y, cropData.width, cropData.height,
      0, 0, size, size
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  },

  cleanup() {
    this.currentImage = null;
    this.cropImage = null;
    this.cropBox = null;
    this.cropWrapper = null;
    this.isDragging = false;
    this.isResizing = false;
  }
};