const app = getApp()

Page({
  data: {
    name: '',
    space: '',
    container: '',
    position: '',
    category: '',
    photoUrl: '',
    isLoading: false,
    spaceOptions: ['客厅', '卧室', '厨房', '书房', '卫生间', '阳台', '车库', '餐厅', '其他'],
    categoryOptions: ['工具', '证件', '药品', '电子产品', '衣物', '书籍', '游戏', '其他']
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onSpaceChange(e) {
    this.setData({ space: this.data.spaceOptions[e.detail.value] })
  },

  onContainerInput(e) {
    this.setData({ container: e.detail.value })
  },

  onPositionInput(e) {
    this.setData({ position: e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ category: this.data.categoryOptions[e.detail.value] })
  },

  onVoiceInput() {
    wx.showToast({ title: '语音功能开发中', icon: 'none' })
  },

  onChoosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadPhoto(tempFilePath)
      }
    })
  },

  uploadPhoto(filePath) {
    const cloudPath = `items/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        this.setData({ photoUrl: res.fileID })
      },
      fail: (err) => {
        console.error('上传失败', err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  onRemovePhoto() {
    this.setData({ photoUrl: '' })
  },

  onSubmit() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }

    if (!this.data.space) {
      wx.showToast({ title: '请选择放置空间', icon: 'none' })
      return
    }

    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    wx.cloud.callFunction({
      name: 'addItem',
      data: {
        name: this.data.name.trim(),
        space: this.data.space,
        container: this.data.container.trim(),
        position: this.data.position.trim(),
        category: this.data.category,
        photoUrl: this.data.photoUrl
      },
      success: (res) => {
        if (res.result.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.switchTab({ url: '/pages/index/index' })
              }, 1500)
            }
          })
        } else {
          wx.showToast({ title: res.result.error || '添加失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('添加物品失败', err)
        wx.showToast({ title: '添加失败，请重试', icon: 'none' })
      },
      complete: () => {
        this.setData({ isLoading: false })
      }
    })
  }
})
