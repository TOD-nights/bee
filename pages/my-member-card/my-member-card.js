// pages/member-card.js
const WXAPI = require('apifm-wxapi')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    loading: false,
      finished: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadData()
    console.log("数据加载")
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
  // 数据加载
  async loadData() {
    this.setData({
      loading: true
    })
    const result = await WXAPI.myMemberCardListAll()
    console.log(result)
    if(result.code == 0){
      this.setData({
        list: result.data,
        loading: false,
        finished: true
      })
    }
  },
  /**
   * 购买
   */
  async hexiao(e){
    const index = e.currentTarget.dataset.index
    const id = this.data.list[index].id
    wx.navigateTo({
      url: '/pages/member-card-hx/member-card-hx?id='+id,
    })
  }
})