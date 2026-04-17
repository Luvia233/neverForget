const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId, name, space, container, position, category, photoUrl } = event

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
