const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { keyword, page = 1, pageSize = 20 } = event

  if (!keyword || typeof keyword !== 'string') {
    return { success: false, error: '请输入搜索关键词' }
  }
  const trimmedKeyword = keyword.trim()
  if (trimmedKeyword.length === 0) {
    return { success: false, error: '搜索关键词不能为空' }
  }
  if (trimmedKeyword.length > 50) {
    return { success: false, error: '搜索关键词不能超过50个字符' }
  }

  // 转义正则特殊字符防止注入
  const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(pageSize)))

  try {
    const db = cloud.database()
    const _ = db.command
    const openid = wxContext.openid

    const users = await db.collection('users')
      .where({ openid: openid })
      .limit(1)
      .get()

    if (users.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const familyId = users.data[0].family_id

    const items = await db.collection('items')
      .where({
        family_id: familyId,
        name: db.RegExp({
          regexp: escapedKeyword,
          options: 'i'
        })
      })
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(Math.min(100, Math.max(1, parseInt(pageSize))))
      .get()

    return { success: true, data: items.data }

  } catch (err) {
    console.error('搜索物品云函数错误', err)
    return { success: false, error: err.message || '搜索失败' }
  }
}
