const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const db = cloud.database()
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
      .where({ family_id: familyId })
      .orderBy('created_at', 'desc')
      .get()

    return { success: true, data: items.data }

  } catch (err) {
    console.error('获取物品列表云函数错误', err)
    return { success: false, error: err.message || '获取失败' }
  }
}
