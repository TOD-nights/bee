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
    goods: [],
    selectedShopId: 0,
    selectedGoodsId: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id
    })
    
    // 先加载基础数据
    this.loadCardInfo()
    this.loadShops()
    
    // 延迟加载商品，并检查API配置
    setTimeout(() => {
      console.log('=== 开始检查商品API ===')
      console.log('当前页面ID:', this.data.id)
      this.loadGoods()
    }, 500)
  },

  // 加载会员卡信息
  loadCardInfo() {
    WXAPI.getMemberCardHxInfo(this.data.id).then(res => {
      if (res.code == 0) {
        this.setData({
          data: res.data
        })
        // 只在第一次加载时设置默认值
        if (this.data.selectedShopId === 0 && res.data.useLog.shopId) {
          this.setData({
            selectedShopId: res.data.useLog.shopId
          })
        }
        if (this.data.selectedGoodsId === 0 && res.data.useLog.goodsId) {
          this.setData({
            selectedGoodsId: res.data.useLog.goodsId
          })
        }
      }
    })
  },

  // 加载门店列表
  loadShops() {
    WXAPI.fetchShops({}).then(res => {
      console.log('门店API返回:', res)
      if (res.code == 0) {
        console.log('门店原始数据:', res.data)
        const shopsList = res.data.map(item => {
          return {
            text: item.name,
            value: item.id
          }
        })
        console.log('处理后的门店列表:', shopsList)
        this.setData({
          shops: shopsList
        })
        console.log('setData后的shops:', this.data.shops)
      } else {
        console.error('门店API返回错误:', res)
      }
    }).catch(err => {
      console.error('门店API调用失败:', err)
    })
  },

  // 加载商品列表
  loadGoods() {
    
    WXAPI.membercardprod({}).then(res => {
      console.log('WXAPI.membercardprod 返回:', res)
      console.log('返回code:', res.code)
      console.log('返回msg:', res.msg)
      console.log('返回data:', res.data)
      
      if (res.code == 0) {
        console.log('✅ 商品API成功，原始数据:', res.data)
        const goodsList = res.data.map(item => {
          return {
            text: item.name,
            value: item.id,
            price: item.vipPrice
          }
        })
        console.log('✅ 处理后的商品列表:', goodsList)
        this.setData({
          goods: goodsList
        })
      } else {
        console.error('❌ 商品API返回错误')
        console.error('错误码:', res.code)
        console.error('错误信息:', res.msg)
        
        wx.showModal({
          title: '商品加载失败',
          content: `错误码: ${res.code}\n错误信息: ${res.msg}`,
          showCancel: false
        })
      }
    }).catch(err => {
      console.error('❌ 商品API调用异常:', err)
      wx.showModal({
        title: '接口调用失败',
        content: JSON.stringify(err),
        showCancel: false
      })
    })
  },

  onClose() {},

  lingqu() {
    const shops = this.data.shops.filter(item => item.value == this.data.selectedShopId)
    const goods = this.data.goods.filter(item => item.value == this.data.selectedGoodsId)
    
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
      shopId: this.data.selectedShopId,
      goodsId: this.data.selectedGoodsId,
      goodsName: goods[0].text,
      goodsPrice: goods[0].price,
      shopName: shops[0].text,
    }).then(res => {
      if (res.code == 0) {
        wx.showToast({
          title: '领取成功',
        })
        // 刷新页面数据
        this.loadCardInfo()
      } else {
        wx.showToast({
          title: res.msg || '领取失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      wx.showToast({
        title: '领取失败',
        icon: 'error'
      })
    })
  },

  goodsChange(e) {
    this.setData({
      selectedGoodsId: e.detail
    })
  },

  shopChange(e) {
    this.setData({
      selectedShopId: e.detail
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
})