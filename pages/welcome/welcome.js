const AUTH = require('../../utils/auth')

Page({
  data: {

    posterTip: true,                        // 是否弹层
    posters: [                              // 所有要轮播的海报
      'https://taletape-video-dev.oss-eu-central-1.aliyuncs.com/9.8/push1.png',
      'https://taletape-video-dev.oss-eu-central-1.aliyuncs.com/9.8/push2.jpg'
    ],
    currentPoster: 0,
    agreement: false,
    agreementTime: 1000 * 60 * 60 * 24 * 7,
    posterTipTime: 1000 * 60 * 60 * 24 * 3
  },
  onLoad(options) {
    AUTH.checkHasLogined().then(isLogin => {
      if (isLogin) {
        AUTH.bindSeller()
      } else {
        AUTH.authorize().then(res => {
          AUTH.bindSeller()
        })
      }
    })
  },

  onReady() {

  },
  onShow() {
    const showAgreement = wx.getStorageSync('show_agreement');
    const showTip = wx.getStorageSync('show_tip');
    const now = Date.now();
    if(!showAgreement || now > showAgreement) {
      this.setData({
        agreement: true
      })
      wx.setStorageSync('show_agreement', now + this.data.agreementTime);
    }
    if(!showTip || now > showTip) {
      this.setData({
        posterTip: true
      })
      wx.setStorageSync('show_tip', now + this.data.posterTipTime);
    }
  },
  toMemberCard(){
    wx.navigateTo({
      url: '/pages/member-card/member-card',
    })
  },
  refuseAgreement() {
    wx.exitMiniProgram({
      complete(info) {}
    });
  },
  confirmAgreement() {
    this.setData({
      agreement: false
    })
  },
  closeTip() {
    const { currentPoster, posters } = this.data
    if (currentPoster < posters.length - 1) {
      // 还有下一张 → 只换图，不关弹层
      this.setData({ currentPoster: currentPoster + 1 })
    } else {
      // 已经是最后一张 → 关闭弹层并重置
      this.setData({ posterTip: false, currentPoster: 0 })
    }
  }
,
  toIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  scanQrcode() {
  }
})