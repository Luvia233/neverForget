const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { itemId } = event

  try {
    const db = cloud.database()

    await db.collection('items')
      .doc(itemId)
      .remove()

    return { success: true }

  } catch (err) {
    console.error('删除物品云函数错误', err)
    return { success: false, error: err.message || '删除失败' }
  }
}
