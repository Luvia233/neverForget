const app = getApp()

Page({
  data: {
    spaces: [],
    isLoading: false
  },

  onLoad() {
    console.log('首页加载')
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
  },

  loadData() {
    this.setData({ isLoading: true })

    wx.cloud.callFunction({
      name: 'getItems',
      data: {},
      success: (res) => {
        console.log('获取物品列表成功', res)

        if (res.result.success) {
          const items = res.result.data
          const spaceMap = {}

          items.forEach(item => {
            const space = item.space || '其他'
            if (!spaceMap[space]) {
              spaceMap[space] = {
                space: space,
                icon: this.getSpaceIcon(space),
                count: 0,
                items: []
              }
            }
            spaceMap[space].count++
            if (spaceMap[space].items.length < 3) {
              spaceMap[space].items.push({
                name: item.name,
                emoji: this.getCategoryEmoji(item.category)
              })
            }
          })

          const spaces = Object.values(spaceMap)
          this.setData({ spaces })
        }
      },
      fail: (err) => {
        console.error('获取物品列表失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ isLoading: false })
        wx.stopPullDownRefresh()
      }
    })
  },

  getSpaceIcon(space) {
    const iconMap = {
      '客厅': '🛋️', '卧室': '🛏️', '厨房': '🍳',
      '书房': '📚', '卫生间': '🚿', '阳台': '🌿',
      '车库': '🚗', '餐厅': '🍽️'
    }
    return iconMap[space] || '🏠'
  },

  getCategoryEmoji(category) {
    const emojiMap = {
      '工具': '🔧', '证件': '🪪', '药品': '💊',
      '电子产品': '📱', '衣物': '👕', '书籍': '📚', '游戏': '🎮'
    }
    return emojiMap[category] || '📦'
  },

  onSearchTap() {
    wx.switchTab({ url: '/pages/search/search' })
  },

  onSpaceTap(e) {
    const space = e.currentTarget.dataset.space
    wx.navigateTo({
      url: `/pages/search/search?space=${encodeURIComponent(space)}`
    })
  },

  onAddTap() {
    wx.switchTab({ url: '/pages/add/add' })
  }
})
