const app = getApp()

Page({
  data: {
    item: {},
    itemId: ''
  },

  onLoad(options) {
    this.setData({ itemId: options.id })
    this.loadItem()
  },

  loadItem() {
    wx.cloud.callFunction({
      name: 'getItems',
      data: {},
      success: (res) => {
        if (res.result.success) {
          const item = res.result.data.find(i => i._id === this.data.itemId)
          if (item) {
            item.created_at = this.formatDate(item.created_at)
            this.setData({ item })
          }
        }
      }
    })
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  onEdit() {
    wx.navigateTo({
      url: `/pages/edit/edit?id=${this.data.itemId}`
    })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个物品吗？',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          this.doDelete()
        }
      }
    })
  },

  doDelete() {
    wx.cloud.callFunction({
      name: 'deleteItem',
      data: { itemId: this.data.itemId },
      success: (res) => {
        if (res.result.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.switchTab({ url: '/pages/index/index' })
              }, 1500)
            }
          })
        } else {
          wx.showToast({ title: res.result.error || '删除失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('删除失败', err)
        wx.showToast({ title: '删除失败', icon: 'none' })
      }
    })
  }
})
