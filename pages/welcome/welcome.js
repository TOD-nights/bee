Page({
  data: {
    agreement: false,
    posterTip: false,
    agreementTime: 1000 * 60 * 60 * 24 * 7,
    posterTipTime: 1000 * 60 * 60 * 24 * 3
  },
  onLoad(options) {

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
    this.setData({
      posterTip: false
    })
  },
  toIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  scanQrcode() {
  }
})