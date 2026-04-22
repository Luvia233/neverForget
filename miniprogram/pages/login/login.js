const app = getApp()

Page({
  data: {
    isLoading: false
  },

  onLoad(options) {
    if (app.globalData.hasLogin) {
      this.checkFamilyStatus()
    }
  },

  onLogin() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          wx.cloud.callFunction({
            name: 'login',
            data: { code: loginRes.code },
            success: (res) => {
              console.log('登录成功', res)
              
              const { userId, userInfo, familyId } = res.result.data
              
              if (familyId) {
                app.login(userId, familyId, userInfo)
                wx.switchTab({ url: '/pages/index/index' })
              } else {
                app.globalData.userId = userId
                app.globalData.userInfo = userInfo
                wx.setStorageSync('userId', userId)
                wx.setStorageSync('userInfo', userInfo)
                
                wx.showModal({
                  title: '欢迎使用',
                  content: '请先创建或加入一个家庭',
                  confirmText: '创建家庭',
                  cancelText: '加入家庭',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.navigateTo({ url: '/pages/createFamily/createFamily' })
                    } else if (modalRes.cancel) {
                      wx.navigateTo({ url: '/pages/joinFamily/joinFamily' })
                    }
                  }
                })
              }
            },
            fail: (err) => {
              console.error('登录失败', err)
              wx.showToast({ title: '登录失败，请重试', icon: 'none' })
              this.setData({ isLoading: false })
            },
            complete: () => {
              this.setData({ isLoading: false })
            }
          })
        } else {
          console.error('获取 code 失败')
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' })
          this.setData({ isLoading: false })
        }
      }
    })
  },

  checkFamilyStatus() {
    if (app.globalData.familyId) {
      wx.switchTab({ url: '/pages/index/index' })
    } else {
      wx.navigateTo({ url: '/pages/createFamily/createFamily' })
    }
  }
})
