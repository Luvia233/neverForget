Component({
  properties: {
    placeholder: {
      type: String,
      value: '请说话...'
    }
  },

  data: {
    isRecording: false
  },

  methods: {
    startRecord() {
      const that = this
      
      wx.authorize({
        scope: 'scope.record',
        success() {
          that.setData({ isRecording: true })
          
          that.recorderManager = wx.getRecorderManager()
          that.recorderManager.onStart(() => {
            console.log('录音开始')
          })
          that.recorderManager.onStop((res) => {
            console.log('录音结束', res)
            that.setData({ isRecording: false })
            that.recognizeVoice(res.tempFilePath)
          })
          that.recorderManager.onError((err) => {
            console.error('录音错误', err)
            that.setData({ isRecording: false })
            wx.showToast({ title: '录音失败', icon: 'none' })
          })
          
          that.recorderManager.start({
            format: 'mp3',
            duration: 60000
          })
        },
        fail() {
          wx.showModal({
            title: '需要授权',
            content: '请授权使用麦克风功能',
            confirmText: '去设置',
            success(res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      })
    },

    stopRecord() {
      if (this.recorderManager) {
        this.recorderManager.stop()
      }
    },

    recognizeVoice(filePath) {
      const that = this
      
      wx.showLoading({ title: '识别中...' })
      
      wx.uploadFile({
        url: 'https://api.weixin.qq.com/cgi-bin/media/voice/addvoicedata',
        filePath: filePath,
        name: 'voice',
        success(res) {
          wx.hideLoading()
          try {
            const data = JSON.parse(res.data)
            if (data.result) {
              that.triggerEvent('result', { text: data.result })
            } else {
              wx.showToast({ title: '识别失败', icon: 'none' })
            }
          } catch (e) {
            wx.showToast({ title: '识别失败', icon: 'none' })
          }
        },
        fail(err) {
          wx.hideLoading()
          console.error('上传失败', err)
          wx.showToast({ title: '识别失败', icon: 'none' })
        }
      })
    }
  }
})
