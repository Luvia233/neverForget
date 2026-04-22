const cloud = require('wx-server-sdk')
const { generateInviteCode } = require('../utils/inviteCode')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { familyName, nickname } = event

  if (!familyName || typeof familyName !== 'string' || familyName.trim().length === 0) {
    return { success: false, error: '请输入家庭名称' }
  }
  if (familyName.trim().length > 50) {
    return { success: false, error: '家庭名称不能超过50个字符' }
  }
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return { success: false, error: '请输入昵称' }
  }
  if (nickname.trim().length > 30) {
    return { success: false, error: '昵称不能超过30个字符' }
  }

  try {
    const db = cloud.database()
    const openid = wxContext.openid

    const familyRes = await db.collection('families').add({
      data: {
        name: familyName,
        owner_openid: openid,
        created_at: db.serverDate()
      }
    })

    const familyId = familyRes._id

    let inviteCode
    let retries = 0
    const maxRetries = 5

    do {
      inviteCode = generateInviteCode(8)
      const existing = await db.collection('invite_codes')
        .where({ code: inviteCode })
        .limit(1)
        .get()

      if (existing.data.length === 0) {
        break
      }
      retries++
    } while (retries < maxRetries)

    if (!inviteCode) {
      return { success: false, error: '生成邀请码失败，请重试' }
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.collection('invite_codes').add({
      data: {
        family_id: familyId,
        code: inviteCode,
        max_uses: 5,
        used_count: 0,
        expires_at: expiresAt,
        created_at: db.serverDate()
      }
    })

    const userRes = await db.collection('users').add({
      data: {
        openid: openid,
        nickname: nickname,
        family_id: familyId,
        role: 'owner',
        created_at: db.serverDate()
      }
    })

    return {
      success: true,
      data: { familyId, userId: userRes._id, inviteCode }
    }

  } catch (err) {
    console.error('创建家庭云函数错误', err)
    return { success: false, error: err.message || '创建失败' }
  }
}
