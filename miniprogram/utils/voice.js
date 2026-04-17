const recorderManager = wx.getRecorderManager()

function startRecording(options = {}) {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope: 'scope.record',
      success() {
        recorderManager.onStart(() => {
          console.log('录音开始')
        })
        
        recorderManager.onStop((res) => {
          console.log('录音结束', res)
          resolve(res.tempFilePath)
        })
        
        recorderManager.onError((err) => {
          console.error('录音错误', err)
          reject(err)
        })
        
        recorderManager.start({
          format: options.format || 'mp3',
          duration: options.duration || 60000
        })
      },
      fail(err) {
        reject(new Error('需要授权麦克风权限'))
      }
    })
  })
}

function stopRecording() {
  recorderManager.stop()
}

function recognizeVoice(filePath) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '识别中...' })
    
    wx.cloud.callFunction({
      name: 'voiceRecognition',
      data: { filePath },
      success(res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          resolve(res.result.text)
        } else {
          reject(new Error(res.result?.error || '识别失败'))
        }
      },
      fail(err) {
        wx.hideLoading()
        reject(err)
      }
    })
  })
}

module.exports = {
  startRecording,
  stopRecording,
  recognizeVoice
}
