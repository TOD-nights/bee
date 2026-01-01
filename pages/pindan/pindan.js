// pages/pindan/pindan.js
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

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
    userId: 0
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
      // console.log(res)
      if (res.code == 0) {
        this.setData({
          userId: res.data.base.id
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
      imageUrl: 'https://gips2.baidu.com/it/u=195724436,3554684702&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960', // 自定义图片（建议 5:4）
      // success: (res) => { console.log('转发成功', res) },
      // fail: (res) => { console.log('转发失败', res) }
    };
  },


  //--------------------------业务方法---------------
  peisongTypeHandler(e) {
    // console.log(e) 
    this.setData({
      peisongType: e.currentTarget.dataset.peisongtype
    })
  },

  toSelectShop() {
    if (this.data.userId == this.data.pindanInfo.userId) {
      wx.navigateTo({
        url: '/pages/shop/select?type=pindan',
      })
    }
  },
  // 加载拼单信息
  loadData() {
    if (this.data.id > 0) {
      // 点击了别人分享的链接后,执行
      WXAPI.getPinDanInfoById(this.data.id).then(res => {
        console.log(res)
        if (res.code == 500001) {
          wx.showToast({
            title: '拼单信息不存在',
            icon: 'none'
          })
        } else if (res.code == 0) {
          this.setData({
            pindanInfo: res.data,
            id: res.data.id,
            shopName: res.data.shopInfo.name,
            distance: res.data.shopInfo.distance,
            shopId: res.data.shopInfo.id
          });
        }
      })
    } else {
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
                    WXAPI.getPinDanInfo(shopInfo.id).then(pindanInfo => {
                      this.setData({
                        pindanInfo: pindanInfo,
                        id: pindanInfo.id
                      });
                    });
                  })
                }
              }
            })
          }

          if (res.code == 0) {
            this.setData({
              pindanInfo: res.data,
              id: res.data.id
            });
          }
        })
      }
    }
  }
})