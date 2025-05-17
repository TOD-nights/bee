// pages/member-card-hx/member-card-hx.js
const WXAPI = require('apifm-wxapi')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    data: {},
    show: false,
    shops: [],
    goods: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id
    })
    WXAPI.getMemberCardHxInfo(options.id).then(res => {
      if (res.code == 0) {
        this.setData({
          data: res.data
        })
      }
    })

    WXAPI.fetchShops({}).then(res => {
      if (res.code == 0) {
        this.setData({
          shops: res.data.map(item => {
            return {
              text: item.name,
              value: item.id
            }
          })
        })
      }
    })

    WXAPI.membercardprod({}).then(res => {
      if (res.code == 0) {
        console.log(res.data)
        this.setData({
          goods: res.data.map(item => {
            return {
              text: item.name,
              value: item.id,
              price: item.vipPrice
            }
          })
        })
      }
    })
  },
  onClose() {},
  lingqu() {
    const shops = this.data.shops.filter(item => item.value == this.data.data.useLog.shopId)
    const goods = this.data.goods.filter(item => item.value == this.data.data.useLog.goodsId)
    if (shops.length == 0) {
      wx.showToast({
        title: '请选择门店',
        icon: 'error'
      })
      return
    }
    if (goods.length == 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'error'
      })
      return
    }
    console.log(goods)
    WXAPI.lingqu({
      user_card_id: this.data.id,
      shopId: this.data.data.useLog.shopId,
      goodsId: this.data.data.useLog.goodsId,
      goodsName: goods[0].text,
      goodsPrice: goods[0].price,
      shopName: shops[0].text,
    }).then(res => {
      if (res.code == 0) {
        wx.showToast({
          title: '领取成功',
        })
        WXAPI.getMemberCardHxInfo(this.data.id).then(res => {
          if (res.code == 0) {
            this.setData({
              data: res.data
            })
          }
        })
      }
    })
  },

  goodsChange(e) {
    const data = this.data.data
    data.useLog.goodsId = e.detail
    this.setData({
      data: data
    })
  },
  shopChange(e) {
    const data = this.data.data
    data.useLog.shopId = e.detail
    this.setData({
      data: data
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

  }
})