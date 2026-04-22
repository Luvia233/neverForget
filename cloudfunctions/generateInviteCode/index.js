const cloud = require('wx-server-sdk')
const { generateInviteCode } = require('../utils/inviteCode')

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

    const user = users.data[0]
    const familyId = user.family_id

    if (user.role !== 'owner') {
      return { success: false, error: '只有房主可以生成邀请码' }
    }

    let newCode
    let retries = 0
    const maxRetries = 5

    do {
      newCode = generateInviteCode(8)
      const existing = await db.collection('invite_codes')
        .where({ code: newCode })
        .limit(1)
        .get()

      if (existing.data.length === 0) {
        break
      }
      retries++
    } while (retries < maxRetries)

    if (!newCode) {
      return { success: false, error: '生成邀请码失败，请重试' }
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.collection('invite_codes').add({
      data: {
        family_id: familyId,
        code: newCode,
        max_uses: 5,
        used_count: 0,
        expires_at: expiresAt,
        created_at: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        inviteCode: newCode,
        expiresAt: expiresAt.toISOString()
      }
    }

  } catch (err) {
    console.error('生成邀请码云函数错误', err)
    return { success: false, error: err.message || '生成失败' }
  }
}
