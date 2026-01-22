const APP = getApp()
const AUTH = require('../../utils/auth')
const WXAPI = require('apifm-wxapi')
Page({
  data: {
    pindanInfo: {}, // 拼单详细
    pindanId: 0,
    peisongType: '1', // 1 自取，2 配送
    showGoodsDetailPOP: false, // 是否显示商品详情
    showCouponPop: false, // 是否弹出优惠券领取提示
    shopIsOpened: false, // 是否营业
    shopInfo: {},
    refreshShopInfo: false, //是否刷新门店信息,
    menuButtonBoundingClientRect: wx.getMenuButtonBoundingClientRect(),
  },
  onLoad: function (e) {
    this.setData({
      pindanId: e.pindanId
    })
    getApp().initLanguage(this)
    // 静默式授权注册/登陆
    AUTH.checkHasLogined().then(isLogin => {
      if (isLogin) {
        AUTH.bindSeller()
      } else {
        AUTH.authorize().then(res => {
          AUTH.bindSeller()
        })
      }
    })

    // 读取最近的门店数据
    this.loadData()
    this.categories()
    this.noticeLastOne()
    this.banners()
  },
  onShow: function () {
    if (this.data.refreshShopInfo) {
      wx.getLocation({
        type: 'wgs84', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
        success: (res) => {
          this.setData({
            refreshShopInfo: false
          })
          const lat = res.latitude
          const lng = res.longitude
          WXAPI.shopInfo(this.data.pindanInfo.shopId, lat, lng).then(res => {
            if (res.code == 0) {
              res.data.info.distanceStr = Math.round(res.data.info.distance*100)/100.0
              this.setData({
                shopInfo: res.data
              })
            }
          })

        },
      });
    }
  },
  toPindan(){
    const token = wx.getStorageSync('token')
    const curGoodsMap = this.data.curGoodsMap
    const canSubmit = this.skuCanSubmit()
    const additionCanSubmit = this.additionCanSubmit()
    if (!canSubmit || !additionCanSubmit) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noSelectSku,
        icon: 'none'
      })
      return
    }
    const sku = []
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        sku.push({
          optionId: big.id,
          optionValueId: small.id
        })
      })
    }
    const goodsAddition = []
    if (this.data.goodsAddition) {
      this.data.goodsAddition.forEach(ele => {
        ele.items.forEach(item => {
          if (item.active) {
            goodsAddition.push({
              id: item.id,
              pid: item.pid
            })
          }
        })
      })
    }
    const d = {
      token,
      goodsId: curGoodsMap.basicInfo.id,
      number: curGoodsMap.number,
      sku: sku ,
      pindanId: this.data.pindanId - 0,
      addition: goodsAddition && goodsAddition.length > 0 ? JSON.stringify(goodsAddition) : '',
    }
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (a) {
        const b = a.items.find(ele => ele.active)
        if (b) {
          d.goodsTimesDay = a.day
          d.goodsTimesItem = b.name
        }
      }
    }
    WXAPI.joinPindan(d).then(res=>{
     if(res.code == 0){
      this.hideGoodsDetailPOP()
      wx.navigateTo({
        url: '/pages/pindan/pindan?id='+this.data.pindanId,
      })
     }else {
       wx.showToast({
         title: res.msg,
         icon: 'none'
       })
     }
    });
  },
  getShopInfo() {
    wx.getLocation({
      type: 'wgs84', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        this.setData({
          refreshShopInfo: false
        })
        const lat = res.latitude
        const lng = res.longitude
        WXAPI.shopInfo(this.data.pindanInfo.shopId, lat, lng).then(res => {
          if (res.code == 0) {
            res.data.info.distanceStr = Math.round(res.data.info.distance*100)/100.0
            this.setData({
              shopInfo: res.data.info
            })
          }
        })

      },
      fail: (e) => {
        console.log(e)
        if (e.errMsg.indexOf('fail auth deny') != -1) {

          // 定位权限被拒绝，提供友好提示
          wx.showModal({
            title: this.data.$t.common.tips || '提示',
            content: '为了给您展示您与门店的距离，需要获取您的位置信息',
            confirmText: this.data.$t.common.confirm || '去开启',
            cancelText: this.data.$t.common.cancel || '暂不开启',
            success: (res) => {
              if (res.confirm) {
                this.setData({
                  refreshShopInfo: true
                })
                AUTH.checkAndAuthorize('scope.userLocation')
              } else {
                this.setData({
                  refreshShopInfo: false
                })
              }
            },
            fail: () => {
              this.setData({
                refreshShopInfo: false
              })
            }
          })
        } else {
          // 其他定位错误
          wx.showToast({
            title: '无法获取您的位置',
            icon: 'none'
          })
          this.setData({
            refreshShopInfo: false
          })
        }
      }
    })
  },
  loadData() {
    WXAPI.getPinDanInfoById(this.data.pindanId).then(res => {
      if (res.code == 0) {
        this.setData({
          pindanInfo: res.data,
          shopInfo: res.data.shopInfo,
          peisongType: res.data.peisongType
        });
        this.getShopInfo();
      }
    })
  },



  async _showCouponPop() {
    const a = wx.getStorageSync('has_pop_coupons')
    if (a) {
      return
    }
    // 检测是否需要弹出优惠券的福袋
    const res = await WXAPI.coupons({
      token: wx.getStorageSync('token')
    })
    if (res.code == 0) {
      this.data.showCouponPop = true
      wx.setStorageSync('has_pop_coupons', true)
    } else {
      this.data.showCouponPop = false
    }
    this.setData({
      showCouponPop: this.data.showCouponPop
    })
  },
  // 获取分类
  async categories() {
    const res = await WXAPI.goodsCategory()
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    // 初始化分类状态，清除之前的标记
    const categories = res.data.map(category => ({
      ...category,
      hasGoods: undefined // 初始状态为undefined，表示未检查
    }))

    this.setData({
      page: 1,
      categories: categories,
      categorySelected: categories[0]
    })
  },
  async getGoodsList() {

    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.goods({
      page: this.data.page,
      categoryId: this.data.categorySelected.id,
      pageSize: 10000
    })
    wx.hideLoading()
    if (res.code == 700) {
      if (this.data.page == 1) {
        this.setData({
          goods: null
        })
      }
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    res.data.forEach(ele => {
      if (ele.miaosha) {
        // 秒杀商品，显示倒计时
        const _now = new Date().getTime()
        ele.dateStartInt = new Date(ele.dateStart.replace(/-/g, '/')).getTime() - _now
        ele.dateEndInt = new Date(ele.dateEnd.replace(/-/g, '/')).getTime() - _now
      }
    })
    if (this.data.page == 1) {
      this.setData({
        goods: res.data
      })
    } else {
      this.setData({
        goods: this.data.goods.concat(res.data)
      })
    }
    this.processBadge()
    this.updateCategoryGoodsStatus()
  },
  // 更新分类的商品状态
  updateCategoryGoodsStatus() {
    const categories = this.data.categories
    const goods = this.data.goods

    if (!categories) {
      return
    }

    // 标记当前分类有商品
    const currentCategory = this.data.categorySelected
    if (currentCategory) {
      const categoryIndex = categories.findIndex(cat => cat.id === currentCategory.id)
      if (categoryIndex !== -1) {
        // 明确标记：有商品为true，无商品为false
        categories[categoryIndex].hasGoods = goods && goods.length > 0
      }
    }

    this.setData({
      categories: categories
    })
  },

  _onReachBottom() {
    this.data.page++
    this.getGoodsList()
  },
  categoryClick(e) {
    const index = e.currentTarget.dataset.idx
    const categorySelected = this.data.categories[index]
    this.setData({
      page: 1,
      categorySelected,
      scrolltop: 0
    })
    this.getGoodsList()
  },

  async skuClick(e) {
    const index1 = e.currentTarget.dataset.idx1
    const index2 = e.currentTarget.dataset.idx2
    const curGoodsMap = this.data.curGoodsMap
    curGoodsMap.properties[index1].childsCurGoods.forEach(ele => {
      ele.selected = false
    })
    curGoodsMap.properties[index1].childsCurGoods[index2].selected = true
    this.setData({
      curGoodsMap
    })
    this.calculateGoodsPrice()
  },
  async calculateGoodsPrice() {
    const curGoodsMap = this.data.curGoodsMap
    // 计算最终的商品价格
    let price = curGoodsMap.basicInfo.minPrice
    let originalPrice = curGoodsMap.basicInfo.originalPrice
    let totalScoreToPay = curGoodsMap.basicInfo.minScore
    let buyNumMax = curGoodsMap.basicInfo.stores
    let buyNumber = curGoodsMap.basicInfo.minBuyNumber
    if (this.data.shopType == 'toPingtuan') {
      price = curGoodsMap.basicInfo.pingtuanPrice
    }
    // 计算 sku 价格
    const canSubmit = this.skuCanSubmit()
    if (canSubmit) {
      let propertyChildIds = "";
      if (curGoodsMap.properties) {
        curGoodsMap.properties.forEach(big => {
          const small = big.childsCurGoods.find(ele => {
            return ele.selected
          })
          propertyChildIds = propertyChildIds + big.id + ":" + small.id + ","
        })
      }
      const res = await WXAPI.goodsPrice(curGoodsMap.basicInfo.id, propertyChildIds)
      if (res.code == 0) {
        price = res.data.price
        if (this.data.shopType == 'toPingtuan') {
          price = res.data.pingtuanPrice
        } else if (wx.getStorageSync('isVip')) {
          console.log('isVip')
          price = res.data.vipPrice > 0 ? res.data.vipPrice : res.data.price
        }
        originalPrice = res.data.originalPrice
        totalScoreToPay = res.data.score
        buyNumMax = res.data.stores
      }
    }
    // 计算时段定价的价格
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (a) {
        const b = a.items.find(ele => ele.active)
        if (b) {
          price = b.price
          buyNumMax = b.stores
        }
      }
    }
    // 计算配件价格
    if (this.data.goodsAddition) {
      this.data.goodsAddition.forEach(big => {
        big.items.forEach(small => {
          if (small.active) {
            price = (price * 100 + small.price * 100) / 100
          }
        })
      })
    }
    curGoodsMap.price = price
    this.setData({
      curGoodsMap,
      buyNumMax
    });
  },
  async skuClick2(e) {
    const propertyindex = e.currentTarget.dataset.idx1
    const propertychildindex = e.currentTarget.dataset.idx2

    const goodsAddition = this.data.goodsAddition
    const property = goodsAddition[propertyindex]
    const child = property.items[propertychildindex]
    if (child.active) {
      // 该操作为取消选择
      child.active = false
      this.setData({
        goodsAddition
      })
      this.calculateGoodsPrice()
      return
    }
    // 单选配件取消所有子栏目选中状态
    if (property.type == 0) {
      property.items.forEach(child => {
        child.active = false
      })
    }
    // 设置当前选中状态
    child.active = true
    this.setData({
      goodsAddition
    })
    this.calculateGoodsPrice()
  },
  skuCanSubmit() {
    const curGoodsMap = this.data.curGoodsMap
    let canSubmit = true
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        if (!small) {
          canSubmit = false
        }
      })
    }
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (!a) {
        canSubmit = false
      } else {
        const b = a.items.find(ele => ele.active)
        if (!b) {
          canSubmit = false
        }
      }
    }
    return canSubmit
  },
  additionCanSubmit() {
    const curGoodsMap = this.data.curGoodsMap
    let canSubmit = true
    if (curGoodsMap.basicInfo.hasAddition) {
      this.data.goodsAddition.forEach(ele => {
        if (ele.required) {
          const a = ele.items.find(item => {
            return item.active
          })
          if (!a) {
            canSubmit = false
          }
        }
      })
    }
    return canSubmit
  },

  async addCart2() {
    const token = wx.getStorageSync('token')
    const curGoodsMap = this.data.curGoodsMap
    const canSubmit = this.skuCanSubmit()
    const additionCanSubmit = this.additionCanSubmit()
    if (!canSubmit || !additionCanSubmit) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noSelectSku,
        icon: 'none'
      })
      return
    }
    const sku = []
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        sku.push({
          optionId: big.id,
          optionValueId: small.id
        })
      })
    }
    const goodsAddition = []
    if (this.data.goodsAddition) {
      this.data.goodsAddition.forEach(ele => {
        ele.items.forEach(item => {
          if (item.active) {
            goodsAddition.push({
              id: item.id,
              pid: item.pid
            })
          }
        })
      })
    }
    wx.showLoading({
      title: '',
    })
    const d = {
      token,
      goodsId: curGoodsMap.basicInfo.id,
      number: curGoodsMap.number,
      sku: sku && sku.length > 0 ? JSON.stringify(sku) : '',
      addition: goodsAddition && goodsAddition.length > 0 ? JSON.stringify(goodsAddition) : '',
    }
    if (this.data.goodsTimesSchedule) {
      const a = this.data.goodsTimesSchedule.find(ele => ele.active)
      if (a) {
        const b = a.items.find(ele => ele.active)
        if (b) {
          d.goodsTimesDay = a.day
          d.goodsTimesItem = b.name
        }
      }
    }
    const res = await WXAPI.shippingCarInfoAddItemV2(d)
    wx.hideLoading()
    if (res.code == 2000) {
      this.hideGoodsDetailPOP()
      AUTH.login(this)
      return
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    this.hideGoodsDetailPOP()
    this.shippingCarInfo()
  },
  async cartStepChange(e) {
    const token = wx.getStorageSync('token')
    const index = e.currentTarget.dataset.idx
    const item = this.data.shippingCarInfo.items[index]
    if (e.detail < 1) {
      // 删除商品
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.shippingCarInfoRemoveItem(token, item.key)
      wx.hideLoading()
      if (res.code == 700) {
        this.setData({
          shippingCarInfo: null,
          showCartPop: false
        })
      } else if (res.code == 0) {
        this.setData({
          shippingCarInfo: res.data
        })
      } else {
        this.setData({
          shippingCarInfo: null,
          showCartPop: false
        })
      }
      this.processBadge()
    } else {
      // 修改数量
      wx.showLoading({
        title: '',
      })
      const res = await WXAPI.shippingCarInfoModifyNumber(token, item.key, e.detail)
      wx.hideLoading()
      if (res.code != 0) {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
        return
      }
      this.shippingCarInfo()
    }
  },
  goodsStepChange(e) {
    const curGoodsMap = this.data.curGoodsMap
    curGoodsMap.number = e.detail
    this.setData({
      curGoodsMap
    })
  },
  async clearCart() {
    wx.showLoading({
      title: '',
    })
    const res = await WXAPI.shippingCarInfoRemoveAll(wx.getStorageSync('token'))
    wx.hideLoading()
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    this.shippingCarInfo()
  },
  async showGoodsDetailPOP(e) {
    const index = e.currentTarget.dataset.idx
    const goodsId = this.data.goods[index].id
    this._showGoodsDetailPOP(goodsId)
    this.goodsAddition(goodsId)
    this._goodsTimesSchedule(goodsId)
  },
  async _showGoodsDetailPOP(goodsId) {
    const token = wx.getStorageSync('token')
    const res = await WXAPI.goodsDetail(goodsId)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.hideTabBar()
    res.data.price = res.data.basicInfo.minPrice
    res.data.vipPrice = res.data.basicInfo.vipPrice
    res.data.number = res.data.basicInfo.minBuyNumber
    const _data = {
      curGoodsMap: res.data,
      pingtuan_open_id: null,
      lijipingtuanbuy: false
    }
    if (res.data.basicInfo.pingtuan) {
      _data.showPingtuanPop = true
      _data.showGoodsDetailPOP = false
      // 获取拼团设置
      const resPintuanSet = await WXAPI.pingtuanSet(goodsId)
      if (resPintuanSet.code != 0) {
        _data.showPingtuanPop = false
        _data.showGoodsDetailPOP = true
        wx.showToast({
          title: this.data.$t.index.pingtuanNoOpen,
          icon: 'none'
        })
        return
      } else {
        _data.pintuanSet = resPintuanSet.data
        // 是否是别人分享的团进来的
        if (this.data.share_goods_id && this.data.share_goods_id == goodsId && this.data.share_pingtuan_open_id) {
          // 分享进来的
          _data.pingtuan_open_id = this.data.share_pingtuan_open_id
        } else {
          // 不是通过分享进来的
          const resPintuanOpen = await WXAPI.pingtuanOpen(token, goodsId)
          if (resPintuanOpen.code == 2000) {
            AUTH.login(this)
            return
          }
          if (resPintuanOpen.code != 0) {
            wx.showToast({
              title: resPintuanOpen.msg,
              icon: 'none'
            })
            return
          }
          _data.pingtuan_open_id = resPintuanOpen.data.id
        }
        // 读取拼团记录
        const helpUsers = []
        for (let i = 0; i < _data.pintuanSet.numberOrder; i++) {
          helpUsers[i] = '/images/who.png'
        }
        _data.helpNumers = 0
        const resPingtuanJoinUsers = await WXAPI.pingtuanJoinUsers(_data.pingtuan_open_id)
        if (resPingtuanJoinUsers.code == 700 && this.data.share_pingtuan_open_id) {
          this.data.share_pingtuan_open_id = null
          this._showGoodsDetailPOP(goodsId)
          return
        }
        if (resPingtuanJoinUsers.code == 0) {
          _data.helpNumers = resPingtuanJoinUsers.data.length
          resPingtuanJoinUsers.data.forEach((ele, index) => {
            if (_data.pintuanSet.numberOrder > index) {
              helpUsers.splice(index, 1, ele.apiExtUserHelp.avatarUrl)
            }
          })
        }
        _data.helpUsers = helpUsers
      }
    } else {
      _data.showPingtuanPop = false
      _data.showGoodsDetailPOP = true
    }
    this.setData(_data)
  },
  hideGoodsDetailPOP() {
    this.setData({
      showGoodsDetailPOP: false,
      showPingtuanPop: false
    })
    if (!this.data.scanDining) {
      wx.showTabBar()
    }
  },
  goPay() {
    if (this.data.scanDining) {
      // 扫码点餐，前往购物车
      wx.navigateTo({
        url: '/pages/cart/index',
      })
    } else {
      wx.navigateTo({
        url: '/pages/pay/index',
      })
    }
  },
  onShareAppMessage: function () {
    let uid = wx.getStorageSync('uid')
    if (!uid) {
      uid = ''
    }
    let path = '/pages/index/index?inviter_id=' + uid
    if (this.data.pingtuan_open_id) {
      path = path + '&share_goods_id=' + this.data.curGoodsMap.basicInfo.id + '&share_pingtuan_open_id=' + this.data.pingtuan_open_id
    }
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path
    }
  },
  couponOverlayClick() {
    this.setData({
      showCouponPop: false
    })
  },
  couponImageClick() {
    wx.navigateTo({
      url: '/pages/coupons/index',
    })
  },
  async noticeLastOne() {
    const res = await WXAPI.noticeLastOne()
    if (res.code == 0) {
      this.setData({
        noticeLastOne: res.data
      })
    }
  },
  goNotice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/notice/detail?id=' + id,
    })
  },
  async banners() {
    const res = await WXAPI.banners()
    if (res.code == 0) {
      this.setData({
        banners: res.data
      })
    }
  },
  tapBanner(e) {
    const url = e.currentTarget.dataset.url
    console.log('点击的 banner 链接:', url)

    if (!url) return

    // 如果是小程序内部路径
    if (url.startsWith('/pages/')) {
      wx.navigateTo({
        url: url
      })
    } else if (url.startsWith('http')) {
      // 外部网页
      wx.navigateTo({
        url: '/pages/webview/index?url=' + encodeURIComponent(url)
      })
    } else {
      wx.showToast({
        title: '无效链接',
        icon: 'none'
      })
    }
  },
  checkIsOpened(openingHours) {
    if (!openingHours) {
      return true
    }
    const date = new Date();
    const startTime = openingHours.split('-')[0]
    const endTime = openingHours.split('-')[1]
    const dangqian = date.toLocaleTimeString('chinese', {
      hour12: false
    })

    const dq = dangqian.split(":")
    const a = startTime.split(":")
    const b = endTime.split(":")

    const dqdq = date.setHours(dq[0], dq[1])
    const aa = date.setHours(a[0], a[1])
    const bb = date.setHours(b[0], b[1])

    if (a[0] * 1 > b[0] * 1) {
      // 说明是到第二天
      return !this.checkIsOpened(endTime + '-' + startTime)
    }
    return aa < dqdq && dqdq < bb
  },
  yuanjiagoumai() {
    this.setData({
      showPingtuanPop: false,
      showGoodsDetailPOP: true
    })
  },
  _lijipingtuanbuy() {
    const curGoodsMap = this.data.curGoodsMap
    curGoodsMap.price = curGoodsMap.basicInfo.pingtuanPrice
    this.setData({
      curGoodsMap,
      showPingtuanPop: false,
      showGoodsDetailPOP: true,
      lijipingtuanbuy: true
    })
  },
  pingtuanbuy() {
    // 加入 storage 里
    const curGoodsMap = this.data.curGoodsMap
    const canSubmit = this.skuCanSubmit()
    const additionCanSubmit = this.additionCanSubmit()
    if (!canSubmit || !additionCanSubmit) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noSelectSku,
        icon: 'none'
      })
      return
    }
    const sku = []
    if (curGoodsMap.properties) {
      curGoodsMap.properties.forEach(big => {
        const small = big.childsCurGoods.find(ele => {
          return ele.selected
        })
        sku.push({
          optionId: big.id,
          optionValueId: small.id,
          optionName: big.name,
          optionValueName: small.name
        })
      })
    }
    const additions = []
    if (curGoodsMap.basicInfo.hasAddition) {
      this.data.goodsAddition.forEach(ele => {
        ele.items.forEach(item => {
          if (item.active) {
            additions.push({
              id: item.id,
              pid: item.pid,
              pname: ele.name,
              name: item.name
            })
          }
        })
      })
    }
    const pingtuanGoodsList = []
    pingtuanGoodsList.push({
      goodsId: curGoodsMap.basicInfo.id,
      number: curGoodsMap.number,
      categoryId: curGoodsMap.basicInfo.categoryId,
      shopId: curGoodsMap.basicInfo.shopId,
      price: curGoodsMap.price,
      score: curGoodsMap.basicInfo.score,
      pic: curGoodsMap.basicInfo.pic,
      name: curGoodsMap.basicInfo.name,
      minBuyNumber: curGoodsMap.basicInfo.minBuyNumber,
      logisticsId: curGoodsMap.basicInfo.logisticsId,
      sku,
      additions
    })
    wx.setStorageSync('pingtuanGoodsList', pingtuanGoodsList)
    // 跳转
    wx.navigateTo({
      url: '/pages/pay/index?orderType=buyNow&pingtuanOpenId=' + this.data.pingtuan_open_id,
    })
  },
  _lijipingtuanbuy2() {
    this.data.share_pingtuan_open_id = null
    this._showGoodsDetailPOP(this.data.curGoodsMap.basicInfo.id)
  },
  async goodsAddition(goodsId) {
    const res = await WXAPI.goodsAddition(goodsId)
    if (res.code == 0) {
      this.setData({
        goodsAddition: res.data
      })
    } else {
      this.setData({
        goodsAddition: null
      })
    }
  },
  tabbarChange(e) {
    if (e.detail == 1) {
      wx.navigateTo({
        url: '/pages/cart/index',
      })
    }
    if (e.detail == 2) {
      wx.navigateTo({
        url: '/pages/cart/order',
      })
    }
  },
  // 显示分类和商品数量徽章
  processBadge() {
    const categories = this.data.categories
    const goods = this.data.goods
    const shippingCarInfo = this.data.shippingCarInfo
    if (!categories) {
      return
    }
    if (!goods) {
      return
    }
    categories.forEach(ele => {
      ele.badge = 0
    })
    goods.forEach(ele => {
      ele.badge = 0
    })
    if (shippingCarInfo) {
      shippingCarInfo.items.forEach(ele => {
        if (ele.categoryId) {
          const category = categories.find(a => {
            return a.id == ele.categoryId
          })
          if (category) {
            category.badge += ele.number
          }
        }
        if (ele.goodsId) {
          const _goods = goods.find(a => {
            return a.id == ele.goodsId
          })
          if (_goods) {
            _goods.badge += ele.number
          }
        }
      })
    }
    this.setData({
      categories,
      goods
    })
  },
  selectshop() {
    const {
      id
    } = this.data.shopInfo;
    wx.navigateTo({
      url: '/pages/shop/select?type=index&id=' + id,
    })
  },
  goGoodsDetail(e) {
    const index = e.currentTarget.dataset.idx
    const goodsId = this.data.goods[index].id
    wx.navigateTo({
      url: '/pages/goods-details/index?id=' + goodsId,
    })
  },
  async _goodsTimesSchedule(goodsId) {
    const res = await WXAPI.goodsTimesSchedule(goodsId, '') // todo sku
    if (res.code == 0) {
      const goodsTimesSchedule = res.data
      res.data.forEach(ele => {
        ele.active = false
      })
      goodsTimesSchedule[0].active = true
      goodsTimesSchedule[0].items[0].active = true
      this.setData({
        goodsTimesSchedule
      })
      this.calculateGoodsPrice()
    } else {
      this.setData({
        goodsTimesSchedule: null
      })
    }
  },
  async skuClick3(e) {
    const propertyindex = e.currentTarget.dataset.idx1
    const propertychildindex = e.currentTarget.dataset.idx2

    const goodsTimesSchedule = this.data.goodsTimesSchedule
    const property = goodsTimesSchedule[propertyindex]
    const child = property.items[propertychildindex]
    if (child.stores <= 0) {
      wx.showToast({
        title: this.data.$t.goodsDetail.noStores,
        icon: 'none'
      })
      return
    }
    goodsTimesSchedule.forEach(a => {
      a.active = false
      a.items.forEach(b => {
        b.active = false
      })
    })
    property.active = true
    child.active = true
    this.setData({
      goodsTimesSchedule
    })
    this.calculateGoodsPrice()
  },
  changeLang() {
    getApp().changeLang(this)
  },
})