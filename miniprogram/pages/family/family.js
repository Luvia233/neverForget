const app = getApp()

Page({
  data: {
    familyInfo: { name: '我的家', memberCount: 0 },
    members: [],
    isOwner: false,
    inviteCode: '',
    inviteExpire: '',
    stats: { totalItems: 0, totalSpaces: 0, totalCategories: 0 }
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    this.loadFamilyInfo()
    this.loadMembers()
    this.loadStats()
  },

  loadFamilyInfo() {
    wx.cloud.callFunction({
      name: 'getItems',
      data: {},
      success: (res) => {
        if (res.result.success) {
          const items = res.result.data
          const spaces = new Set(items.map(i => i.space).filter(Boolean))
          const categories = new Set(items.map(i => i.category).filter(Boolean))
          
          this.setData({
            stats: {
              totalItems: items.length,
              totalSpaces: spaces.size,
              totalCategories: categories.size
            }
          })
        }
      }
    })
  },

  loadMembers() {
    const db = wx.cloud.database()
    const familyId = app.globalData.familyId

    db.collection('families')
      .doc(familyId)
      .get()
      .then(res => {
        this.setData({
          familyInfo: {
            name: res.data.name,
            memberCount: 0
          }
        })
      })
      .catch(err => console.error(err))

    db.collection('users')
      .where({ family_id: familyId })
      .get()
      .then(res => {
        const members = res.data
        const currentUserId = app.globalData.userId
        const currentUser = members.find(m => m._id === currentUserId)
        
        this.setData({
          members: members,
          'familyInfo.memberCount': members.length,
          isOwner: currentUser && currentUser.role === 'owner'
        })

        if (this.data.isOwner) {
          this.loadInviteCode()
        }
      })
      .catch(err => console.error(err))
  },

  loadInviteCode() {
    const db = wx.cloud.database()
    const familyId = app.globalData.familyId

    db.collection('invite_codes')
      .where({
        family_id: familyId,
        used_count: db.command.lt(5)
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const code = res.data[0]
          const expiresAt = code.expires_at
          if (expiresAt) {
            const expireDate = new Date(expiresAt)
            this.setData({
              inviteCode: code.code,
              inviteExpire: this.formatDate(expireDate)
            })
          }
        }
      })
      .catch(err => console.error(err))
  },

  loadStats() {
  },

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  onCopyCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  onRegenerateCode() {
    wx.showModal({
      title: '确认生成',
      content: '生成新邀请码后，旧邀请码将失效',
      success: (res) => {
        if (res.confirm) {
          this.doRegenerateCode()
        }
      }
    })
  },

  doRegenerateCode() {
    wx.cloud.callFunction({
      name: 'generateInviteCode',
      data: {},
      success: (res) => {
        if (res.result.success) {
          const { inviteCode, expiresAt } = res.result.data
          this.setData({
            inviteCode: inviteCode,
            inviteExpire: this.formatDate(new Date(expiresAt))
          })
          wx.showToast({ title: '生成成功', icon: 'success' })
        } else {
          wx.showToast({ title: res.result.error || '生成失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('生成邀请码失败', err)
        wx.showToast({ title: '生成失败', icon: 'none' })
      }
    })
  }
})
