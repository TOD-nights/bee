// pages/pindan/pindan.js
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const {
  print,
  print2
} = require("../../utils/pay")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    pindanInfo: {},
    peisongType: 1,
    shopName: '',
    distance: '',
    shopId: '',
    userInfo: {},
    userId: 0,
    total: 0,
    totalVip: 0,
    showPayPop: false,
    vipLevel: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

    if (options.id > 0) {
      this.setData({
        id: options.id
      })
    }
    WXAPI.userDetail(wx.getStorageSync('token')).then(res => {
      if (res.code == 0) {
        this.setData({
          userId: res.data.base.id,
          userInfo: res.data
        })
      }
      if (res.code == 2000) {
        wx.showModal({
          title: '系统提示',
          showCancel: false,
          content: '登录信息失效,请重新登录后再次发起拼单!',
          success: () => {
            AUTH.login(this).then(res => {
              this.loadData()
            })
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
    this.loadData()
  },


  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '快来和我一起拼单吧！', // 分享标题
      path: '/pages/pindan/pindan?id=' + this.data.pindanInfo.id, // 分享路径（带参数）
      imageUrl: 'https://taletape-video-dev.oss-eu-central-1.aliyuncs.com/COFFEE/kc.png', // 自定义图片（建议 5:4）
      // success: (res) => { console.log('转发成功', res) },
      // fail: (res) => { console.log('转发失败', res) }
    };
  },


  //--------------------------业务方法---------------
  peisongTypeHandler(e) {
    // console.log(e) 
    // 更新拼单配送方式
    WXAPI.updatePindanPeisongTypeById(this.data.pindanInfo.id).then(res => {
      // console.log(res)
      if (res.data) {
        this.setData({
          peisongType: e.currentTarget.dataset.peisongtype
        })
      }
    })
  },

  /// 跳转到创建拼单项页面
  toCreatePindanItem(e) {
    const pindanId = this.data.pindanInfo.id
    wx.navigateTo({
      url: '/pages/select-prod/select-prod?pindanId=' + pindanId,
    })
  },

  toSelectShop() {
    // if (this.data.userId == this.data.pindanInfo.userId) {
    //   wx.navigateTo({
    //     url: '/pages/shop/select?type=pindan',
    //   })
    // }
  },
  // 加载拼单信息
  loadData() {
    if (this.data.id > 0) {
      // 点击了别人分享的链接后,执行
      WXAPI.getPinDanInfoById(this.data.id).then(res => {
        if (res.code == 500001) {
          wx.showToast({
            title: '拼单信息不存在',
            icon: 'none'
          })
        } else if (res.code == 0) {

          // 查询拼单发起人userLevel
          WXAPI.userVipLevelById(wx.getStorageSync('token'), res.data.userId).then(res => {
            this.setData({
              vipLevel: res.data
            })
          })
          let items = res.data.items
          let total = 0
          let totalVip = 0
          items.forEach(element => {
            total += element.amount * element.goodsNumber
            totalVip += element.amountVip * element.goodsNumber
          });
          if (items.filter(item => item.userId == this.data.userId).length == 0) {
            // 当前用户没有下单
            console.log('当前用户没有下单')
            items = [items[0], {
              goodsInfo: {},
              userInfo: this.data.userInfo.base
            }, ...items.slice(1)]
            res.data.items = items
          }
          this.setData({
            pindanInfo: res.data,
            id: res.data.id,
            shopName: res.data.shopInfo.name,
            distance: res.data.shopInfo.distance,
            shopId: res.data.shopInfo.id,
            peisongType: res.data.peisongType,
            total,
            totalVip
          });
        }
      })
    } else {

      //我发起的拼单
      var shopInfo = wx.getStorageSync('shopInfo')
      if (shopInfo.id != this.data.shopId) {
        this.setData({
          shopName: shopInfo.name,
          distance: shopInfo.distance,
          shopId: shopInfo.id
        })
        WXAPI.getPinDanInfo(shopInfo.id).then(res => {
          console.log(res)
          if (res.code == 500001) {
            wx.showToast({
              title: '拼单信息不存在',
              icon: 'none'
            })

            wx.showModal({
              title: '系统提示',
              content: '拼单信息不存在,是否创建新的拼单',
              complete: (res) => {
                console.log(res)
                if (res.cancel) {
                  wx.navigateBack()
                  console.log('页面返回')
                }

                if (res.confirm) {
                  WXAPI.createPindan({
                    shopId: shopInfo.id,
                    peisongType: this.data.peisongType
                  }).then(res => {
                    WXAPI.getPinDanInfo(shopInfo.id).then(pindanInfoRes => {
                      if (pindanInfoRes.code == 0) {
                        this.setData({
                          pindanInfo: pindanInfoRes.data,
                          id: pindanInfoRes.data.id,
                          peisongType: pindanInfoRes.data.peisongType

                        });
                      } else {
                        wx.showToast({
                          title: '创建拼单失败',
                          icon: 'error'
                        })
                      }
                    });
                  })
                }
              }
            })
          }

          if (res.code == 0) {
            this.setData({
              pindanInfo: res.data,
              id: res.data.id,
              peisongType: res.data.peisongType
            });
          }
        })
      }
    }
  },

  openPayPop() {
    this.setData({
      showPayPop: true
    })
  },

  onClosePayPop() {
    this.setData({
      showPayPop: false
    })
  },

  toPay() {
    const _this = this
    const postData = {
      token: wx.getStorageSync('token'),
      pindanId: this.data.id
    }
    const goodList = [];
    for (const item of this.data.pindanInfo.items) {

      const skus = []
      for (const name of item.goodsPropertyNames.split()) {
        skus.push({
          optionValueName: name
        })
      }
      const goodsInfo = {
        number: item.goodsNumber,
        name: item.goodsInfo.name,
        price: this.data.vipLevel > 0 ? item.amountVip : item.amount,
        sku: skus
      }

      goodList.push(goodsInfo)
    }
    WXAPI.wxPayPindan(postData).then(res => {

      if (res.code == 0) {
        // 发起支付
        if (res.data.is_pay) {
          wx.showToast({
            title: '支付成功'
          })
          //打印标签
          const data = {
            data: {
              amountReal: _this.data.vipLevel == 0?_this.data.total:_this.data.totalVip,
              orderNumber: res.data.payOrderId
            },
            shopInfo: {
              id: this.data.shopId,
              name: this.data.shopName
            },
            goodsList: goodList
          };
          print(data);
          print2(data)
          // 可以跳转到会员卡页面或刷新用户信息
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
          return
        }
        wx.requestPayment({
          timeStamp: res.data.timeStamp,
          nonceStr: res.data.nonceStr,
          package: res.data.package,
          signType: res.data.signType,
          paySign: res.data.paySign,
          fail: function (aaa) {
            wx.showToast({
              title: '支付失败',
              icon: 'none'
            })
          },
          success: function () {
            // 提示支付成功
            wx.showToast({
              title: '支付成功'
            })
            const data = {
              data: {
                amountReal: _this.data.vipLevel == 0?_this.data.total:_this.data.totalVip,

                orderNumber: res.data.outTradeId
              },
              shopInfo: {
                id: _this.data.shopId,
                name: _this.data.shopName
              },
              goodsList: goodList
            };
            print(data);
            print2(data)
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        })
      } else {
        wx.showModal({
          content: res.msg || '支付失败',
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