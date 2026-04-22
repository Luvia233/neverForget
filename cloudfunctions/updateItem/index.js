const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId, name, space, container, position, category, photoUrl } = event

  if (!itemId || typeof itemId !== 'string') {
    return { success: false, error: '物品ID无效' }
  }
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

    await db.collection('items')
      .doc(itemId)
      .update({
        data: {
          name: name,
          space: space,
          container: container || '',
          position: position || '',
          category: category || '',
          photoUrl: photoUrl || '',
          updated_at: db.serverDate()
        }
      })

    return { success: true }

  } catch (err) {
    console.error('更新物品云函数错误', err)
    return { success: false, error: err.message || '更新失败' }
  }
}
