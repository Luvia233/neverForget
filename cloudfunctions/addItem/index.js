const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, space, container, position, category, photoUrl } = event

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: '请输入物品名称' }
  }
  if (name.trim().length > 100) {
    return { success: false, error: '物品名称不能超过100个字符' }
  }
  if (!space || typeof space !== 'string' || space.trim().length === 0) {
    return { success: false, error: '请选择放置空间' }
  }
  if (container && container.length > 100) {
    return { success: false, error: '容器描述不能超过100个字符' }
  }
  if (position && position.length > 100) {
    return { success: false, error: '位置描述不能超过100个字符' }
  }

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

    const user = users.data[0]
    const familyId = user.family_id

    const itemRes = await db.collection('items').add({
      data: {
        family_id: familyId,
        name: name,
        space: space,
        container: container || '',
        position: position || '',
        category: category || '',
        photoUrl: photoUrl || '',
        added_by: user.nickname,
        added_by_id: user._id,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
    })

    return {
      success: true,
      data: { itemId: itemRes._id }
    }

  } catch (err) {
    console.error('添加物品云函数错误', err)
    return { success: false, error: err.message || '添加失败' }
  }
}
