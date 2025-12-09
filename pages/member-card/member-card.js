// pages/member-card.js
const WXAPI = require('apifm-wxapi')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    loading: false,
    finished: false,
    selectedIndex:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    getApp().initLanguage(this)
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

  goBalance() {
    wx.navigateTo({
      url: '/pages/asset/index',
    })
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
  selectOne(e){
  
    this.setData({
      selectedIndex: e.currentTarget.dataset.index
    })
  },
  // 数据加载
  async loadData() {
    this.setData({
      loading: true
    })
    const result = await WXAPI.memberCardListAll()
    console.log(result)
    if (result.code == 0) {
      // 计算每杯的价格和优惠力度
      for(let i=0;i<result.data.length;i++) {
        const item = result.data[i]
        result.data[i].youhuiPercent = parseInt(((item.validMonth * 30 * 9.8 - item.amount) / (item.validMonth * 30 * 9.8)) * 100)+'%' 
        result.data[i].price = parseInt(item.amount / (30 * item.validMonth) * 100) / 100
      }
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
  async buy(e) {
    const index =this.data.selectedIndex
    console.log(index)
    const id = this.data.list[index].id
    const amount =  this.data.list[index].amount
    
        // const res = await WXAPI.buyWxPay({
        //   memberCardId: id,
        //   shopId: wx.getStorageSync('shopInfo').id
        // })
        // console.log(res)
        this._wxpay(amount,id)
      
    

  },
  _wxpay(money, memberCardId) {
    const _this = this
    const postData = {
      token: wx.getStorageSync('token'),
      memberCardId: memberCardId,
      shopId: wx.getStorageSync('shopInfo').id
    }
    
    // 使用会员卡专用的支付接口,而不是普通充值接口
    WXAPI.buyWxPay(postData).then(res => {
      if (res.code == 0) {
        // 发起支付
        wx.requestPayment({
          timeStamp: res.data.timeStamp,
          nonceStr: res.data.nonceStr,
          package: res.data.package,
          signType: res.data.signType,
          paySign: res.data.paySign,
          fail: function (aaa) {
            console.error(aaa)
            wx.showToast({
              title: '支付失败',
              icon: 'none'
            })
          },
          success: function () {
            // 提示支付成功
            wx.showToast({
              title: '购买成功'
            })
            _this.setData({
              showRechargePop: false
            })
            // 可以跳转到会员卡页面或刷新用户信息
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        })
      } else {
        wx.showModal({
          content: res.msg || '购买失败',
          showCancel: false
        })
      }
    }).catch(err => {
      console.error(err)
      wx.showToast({
        title: '请求失败',
        icon: 'none'
      })
    })
  }
})