const CACHE_KEY_PREFIX = 'cache_'
const CACHE_EXPIRE_KEY = 'cache_expire_'
const DEFAULT_EXPIRE = 24 * 60 * 60 * 1000

function setCache(key, data, expire = DEFAULT_EXPIRE) {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key
    const expireKey = CACHE_EXPIRE_KEY + key
    const expireTime = Date.now() + expire
    
    wx.setStorageSync(cacheKey, JSON.stringify(data))
    wx.setStorageSync(expireKey, expireTime)
    
    return true
  } catch (e) {
    console.error('缓存设置失败', e)
    return false
  }
}

function getCache(key) {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key
    const expireKey = CACHE_EXPIRE_KEY + key
    
    const expireTime = wx.getStorageSync(expireKey)
    if (!expireTime || Date.now() > expireTime) {
      removeCache(key)
      return null
    }
    
    const data = wx.getStorageSync(cacheKey)
    if (!data) return null

    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('缓存数据解析失败', e)
      removeCache(key)
      return null
    }
  } catch (e) {
    console.error('缓存读取失败', e)
    return null
  }
}

function removeCache(key) {
  try {
    const cacheKey = CACHE_KEY_PREFIX + key
    const expireKey = CACHE_EXPIRE_KEY + key
    
    wx.removeStorageSync(cacheKey)
    wx.removeStorageSync(expireKey)
    
    return true
  } catch (e) {
    console.error('缓存删除失败', e)
    return false
  }
}

function clearAllCache() {
  try {
    const res = wx.getStorageInfoSync()
    const keys = res.keys || []
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_EXPIRE_KEY)) {
        wx.removeStorageSync(key)
      }
    })
    
    return true
  } catch (e) {
    console.error('清空缓存失败', e)
    return false
  }
}

function isOnline() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success(res) {
        resolve(res.networkType !== 'none')
      },
      fail() {
        resolve(false)
      }
    })
  })
}

async function fetchWithCache(key, fetchFn, expire = DEFAULT_EXPIRE) {
  const online = await isOnline()
  
  if (online) {
    try {
      const data = await fetchFn()
      setCache(key, data, expire)
      return { data, fromCache: false }
    } catch (e) {
      console.error('网络请求失败，尝试读取缓存', e)
      const cachedData = getCache(key)
      if (cachedData) {
        return { data: cachedData, fromCache: true }
      }
      throw e
    }
  } else {
    const cachedData = getCache(key)
    if (cachedData) {
      return { data: cachedData, fromCache: true }
    }
    throw new Error('网络不可用且无缓存数据')
  }
}

module.exports = {
  setCache,
  getCache,
  removeCache,
  clearAllCache,
  isOnline,
  fetchWithCache
}
