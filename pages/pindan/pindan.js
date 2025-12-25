// pages/pindan/pindan.js
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    peisongType: 'zq',
    shopName: '',
    distance: '',
    shopId: '',
    userInfo: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    var shopInfo = wx.getStorageSync('shopInfo')
    this.setData({
      id: options.id || 0,
      shopName: shopInfo.name,
      distance: shopInfo.distance,
      shopId: shopInfo.id
    })
    WXAPI.userDetail().then(res => {
      console.log(res)
      if(res.code == 2000) {
        wx.showModal({
          title: '系统提示',
          showCancel: false,
          content: '登录信息失效,请重新登录后再次发起拼单!',
          success:()=>{
            AUTH.login(this)
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },


  //--------------------------业务方法---------------
  peisongTypeHandler(e) {
    // console.log(e) 
    this.setData({
      peisongType: e.currentTarget.dataset.peisongtype
    })
  }
})