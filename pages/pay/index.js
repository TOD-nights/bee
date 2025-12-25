const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const wxpay = require('../../utils/pay.js')
const CONFIG = require('../../config.js')
const APP = getApp()
var util = require('../../utils/util.js')
APP.configLoadOK = () => {

}
 
Page({
  data: {
    wxlogin: true,
    switch1 : true, //switch开关

    addressList: [],
    curAddressData: [],

    totalScoreToPay: 0,
    goodsList: [],
    allGoodsPrice: 0,
    amountReal: 0,
    yunPrice: 0,
    allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车，
    pingtuanOpenId: undefined, //拼团的话记录团号
    
    curCoupon: null, // 当前选择使用的优惠券
    curCouponShowText: '', // 当前选择使用的优惠券
    peisongType: '', // 配送方式 kd,zq 分别表示快递/到店自取【默认值到onshow修改，这里修改无效】
    submitLoding: false,
    remark: '',
    dataP: '',//打印信息保存

    currentDate: new Date().getHours() + ':' + (new Date().getMinutes() % 10 === 0 ? new Date().getMinutes() : Math.ceil(new Date().getMinutes() / 10) * 10),
    minHour: new Date().getHours(),
    minMinute: new Date().getMinutes(),
    formatter(type, value) {
      if (type === 'hour') {
        return `${value}点`;
      } else if (type === 'minute') {
        return `${value}分`;
      }
      return value;
    },
    filter(type, options) {
      if (type === 'minute') {
        return options.filter((option) => option % 10 === 0);
      }
      return options;
    },
    packaging_fee_use: '1', // 自提需要包装费
  },
  diningTimeChange(a) {
    const selectedHour = a.detail.getColumnValue(0).replace('点', '') * 1
    if (selectedHour == new Date().getHours()) {
      let minMinute = new Date().getMinutes()
      if (minMinute % 10 !== 0) {
        minMinute = minMinute / 10 + 1
      }
      this.setData({
        minMinute
      })
    } else {
      this.setData({
        minMinute: 0
      })
    }
  },
  onShow(){
    const shopInfo = wx.getStorageSync('shopInfo')
    let peisongType = wx.getStorageSync('peisongType')
    if (!peisongType) {
      peisongType = 'zq' // 此处修改默认值
    }
    if (shopInfo.openWaimai && !shopInfo.openZiqu) {
      peisongType = 'kd'
    }
    if (!shopInfo.openWaimai && shopInfo.openZiqu) {
      peisongType = 'zq'
    }
    this.setData({
      shopInfo,
      peisongType
    })
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        this.doneShow()
      }
    })
    AUTH.wxaCode().then(code => {
      this.data.code = code
    })
  },
  async doneShow() {
    let goodsList = [];
    const token = wx.getStorageSync('token')
    //立即购买下单
    if ("buyNow" == this.data.orderType) {
      goodsList = wx.getStorageSync('pingtuanGoodsList')
    } else {
      //购物车下单
      const res = await WXAPI.shippingCarInfo(token)
      if (res.code == 0) {
        goodsList = res.data.items
      }
    }
    this.setData({
      goodsList: goodsList
    })
    this.initShippingAddress()
  },

  onLoad(e) {
    getApp().initLanguage(this)
    wx.setNavigationBarTitle({
      title: this.data.$t.pay.title,
    })
    let _data = {
      kjId: e.kjId,
      create_order_select_time: wx.getStorageSync('create_order_select_time'),
      packaging_fee: wx.getStorageSync('packaging_fee'),
      curCouponShowText: this.data.$t.pay.choose
    }
    if (e.orderType) {
      _data.orderType = e.orderType
    }
    if (e.pingtuanOpenId) {
      _data.pingtuanOpenId = e.pingtuanOpenId
    }
    this.setData(_data)
    this.getUserApiInfo()
    this._peisonFeeList()
  },
  selected(e){
    const peisongType = e.currentTarget.dataset.pstype
    this.setData({
      peisongType
    })
    wx.setStorageSync('peisongType', peisongType)
    this.createOrder()
  },
  
  getDistrictId: function (obj, aaa) {
    if (!obj) {
      return "";
    }
    if (!aaa) {
      return "";
    }
    return aaa;
  },
  // 备注
  remarkChange(e){
    this.data.remark = e.detail.value
  },
  goCreateOrder(){
    if (this.data.submitLoding) return
    const mobile = this.data.mobile
    if (this.data.peisongType == 'zq' && !mobile) {
      wx.showToast({
        title: this.data.$t.pay.inputphoneNO,
        icon: 'none'
      })
      return
    }
    if (!this.data.diningTime && this.data.create_order_select_time == '1') {
      wx.showToast({
        title: this.data.$t.pay.select,
        icon: 'none'
      })
      return
    }
    this.setData({
      submitLoding: true
    })
    const subscribe_ids = wx.getStorageSync('subscribe_ids')
    if (subscribe_ids) {
      wx.requestSubscribeMessage({
        tmplIds: subscribe_ids.split(','),
        success(res) {},
        fail(e) {
          this.setData({
            submitLoding: false
          })
          console.error(e)
        },
        complete: (e) => {
          this.createOrder(true)
        },
      })
    } else {
      if (this.data.shopInfo.serviceDistance && this.data.distance && this.data.distance > this.data.shopInfo.serviceDistance * 1 && this.data.peisongType == 'kd') {
        wx.showToast({
          title: this.data.$t.pay.address,
          icon: 'none'
        })
        return
      }
      this.createOrder(true)
    }
  },
  async createOrder(e) {
    var that = this;
    var loginToken = wx.getStorageSync('token') // 用户登录 token
    var remark = this.data.remark; // 备注信息
    const postData = {
      token: loginToken,
      goodsJsonStr: that.data.goodsJsonStr,
      remark: remark,
      peisongType: that.data.peisongType,
      isCanHx: true
    }
    if (this.data.shopInfo) {
      if (!this.data.shopInfo.openWaimai && !this.data.shopInfo.openZiqu) {
        wx.showModal({
          confirmText: this.data.$t.common.confirm,
          cancelText: this.data.$t.common.cancel,
          content: this.data.$t.pay.servicesclosed,
          showCancel: false
        })
        return;
      }
      postData.shopIdZt = this.data.shopInfo.id
      postData.shopNameZt = this.data.shopInfo.name
    }
    if (that.data.kjId) {
      postData.kjid = that.data.kjId
    }
    if (that.data.pingtuanOpenId) {
      postData.pingtuanOpenId = that.data.pingtuanOpenId
    }
    const extJsonStr = {}
    if (postData.peisongType == 'zq') {
      extJsonStr['联系电话'] = this.data.mobile
      if (this.data.packaging_fee && this.data.packaging_fee_use == '1') {
        postData.trips = this.data.packaging_fee
      }
    }
    if (this.data.create_order_select_time == '1') {
      if (postData.peisongType == 'zq') {
        extJsonStr['取餐时间'] = this.data.diningTime
      } else {
        extJsonStr['送达时间'] = this.data.diningTime
      }
    }
    postData.extJsonStr = JSON.stringify(extJsonStr)
    // 有设置了配送费的情况下，计算运费
if (this.data.peisonFeeList && postData.peisongType == 'pszq') {
  let distance = await this.getDistance(this.data.curAddressData)
  const peisonFee = this.data.peisonFeeList.find(ele => {
    return ele.distance >= distance
  })
  if (peisonFee) {
    postData.peisongFeeId = peisonFee.id
    console.log('匹配到配送费区间：', peisonFee)
  }
}

// ✅ 保底逻辑：确保运费实际参与支付
if (postData.peisongType == 'kd') {
  const yun = this.data.yunPrice || this.data.peisongfee || 3
  postData.amountLogistics = yun
  console.log('实际生效的运费：', yun)
}



    // 达达配送
    if (this.data.shopInfo && this.data.shopInfo.number && (this.data.shopInfo.expressType == 'dada'|| this.data.shopInfo.expressType == 'yunlaba') && postData.peisongType == 'kd') {
      if (!that.data.curAddressData) {
        wx.hideLoading();
        wx.showToast({
          title: this.data.$t.pay.setaddress,
          icon: 'none'
        })
        return;
      }
      postData.dadaShopNo = this.data.shopInfo.number
      postData.lat = this.data.curAddressData.latitude
      postData.lng = this.data.curAddressData.longitude
    }
    if (e && postData.peisongType == 'kd') {
      if (!that.data.curAddressData) {
        wx.hideLoading();
        wx.showToast({
          title: this.data.$t.pay.Receivingaddress,
          icon: 'none'
        })
        return;
      }
      postData.provinceId = that.data.curAddressData.provinceId;
      postData.cityId = that.data.curAddressData.cityId;
      if (that.data.curAddressData.districtId) {
        postData.districtId = that.data.curAddressData.districtId;
      }
      postData.address = that.data.curAddressData.address;
      postData.linkMan = that.data.curAddressData.linkMan;
      postData.mobile = that.data.curAddressData.mobile;
      postData.code = that.data.curAddressData.code;     
    }
    if (that.data.curCoupon) {
      postData.couponId = that.data.curCoupon.id;
    }
    if (!e) {
      postData.calculate = "true";
    }
    // 🧩 如果是 pszq 类型，也要加上运费 3 元
if (that.data.peisongType === 'kd') {
  // 先判断是否已有运费字段
  const yun =  3
  postData.amountLogistics = yun           // 告诉后端运费
  postData.amountLogisticsReal = yun       // 实际要收的运费
  postData.amountRealAdd = true            // 自定义标识（防止被后端覆盖）
  console.log('kd 模式：强制加上运费', yun)
}

     console.log(e)
    console.log('即将提交的订单数据：', postData)
// ✅ 获取页面栈
const pages = getCurrentPages()
console.log('📚 当前页面栈:', pages)

    WXAPI.orderCreate(postData)
    .then(function (res) {   
      console.log('查看后端返回', res.data)  
      if (res.code != 0) {
        wx.showModal({
          confirmText: that.data.$t.common.confirm,
          cancelText: that.data.$t.common.cancel,
          content: res.msg,
          showCancel: false
        })
        return;
      }

      if (e && "buyNow" != that.data.orderType) {
        // 清空购物车数据
        WXAPI.shippingCarInfoRemoveAll(loginToken)
      }
      if (!e) {
        const coupons = res.data.couponUserList
        // 仅当 shopInfo.id == 11 且 peisongType == 'kd' 时，且价格小于5元时，多加3元配送费
 if (that.data.shopInfo.id == 11 && that.data.peisongType == 'pszq'&&
 that.data.amountReal * 1 < 5) {
  postData.peisongFeeId = '2' // 需要后端配置一个3元的配送费规则
  postData.amountReal = (that.data.amountReal * 1 + 3).toFixed(2)

  // 确保运费被正确添加到实际支付金额中
   res.data.amountReal = (res.data.amountReal * 1 + 3).toFixed(2)
   res.data.amountTotle = (res.data.amountTotle * 1 + 3).toFixed(2)
   res.data.amountLogistics = (res.data.amountLogistics * 1 + 3).toFixed(2)  }

        if (coupons) {
          coupons.forEach(ele => {
            let moneyUnit = '元'
            if (ele.moneyType == 1) {
              moneyUnit = '%'
            }
            if (ele.moneyHreshold) {
              ele.nameExt = ele.name + ' ['+ that.data.$t.pay.Fullconsumption +'' + ele.moneyHreshold + that.data.$t.pay.RMBreduced + ele.money + moneyUnit +']'
            } else {
              ele.nameExt = ele.name + ' ['+ that.data.$t.pay.Fullconsumption +'' + ele.money + moneyUnit + ']'
            }
          })
        }
        that.setData({
          totalScoreToPay: res.data.score,
          allGoodsNumber: res.data.goodsNumber,
          allGoodsPrice: res.data.amountTotle,
          allGoodsAndYunPrice: res.data.amountLogistics + res.data.amountTotle,
          yunPrice: res.data.amountLogistics|| 0,
          peisongfee: res.data.peisongfee|| 0,
          amountReal: res.data.amountReal,
          coupons
        });
        return;
      }
      return that.processAfterCreateOrder(res)
    })
    .finally(() => {
      // 再唤起微信支付的时候，有大约1s的弹窗动画过度，加上 1s 的延迟可以稳定防止重复下单
      setTimeout(() => {
        this.setData({
          submitLoding: false
        })
      }, 1000)
    })
  },
  async processAfterCreateOrder(res) {
    var that = this


   

       //保存支付相关信息，以订单号key
       let address = ''
       if(that.data.curAddressData){
         if(that.data.curAddressData.address){
          address = that.data.curAddressData.address

         }
       }
        
   that.data.dataP = {
    data: res.data, //订单信息
    goodsList:that.data.goodsList, //商品列表
    shopInfo: that.data.shopInfo, //商铺信息
    mobile: that.data.mobile || that.data.curAddressData.mobile,//用户电话,自取或配送
    address: address,//配送地址
    remark: that.data.remark, //用户备注
    peisongType: that.data.peisongType,//zq,kd

    isPrint: true //打印标志

  }
  //
  console.log("缓存前的打印数据",that.data.dataP)
  console.log('新电话',that.data.curAddressData)
  try{
     //存储打印数据
  wx.setStorage({
    key:  that.data.dataP.data.id +"O",
    data:  that.data.dataP
  })
  }
  catch(e){
    console.log("存储打印数据报错：",e)
  }
 
    const token = wx.getStorageSync('token')
    if (res.data.status != 0) {
      // 待支付状态才需要支付
      wx.redirectTo({
        url: "/pages/all-orders/index"
      })
      return
    }
    // 直接弹出支付，取消支付的话，去订单列表
    const res1 = await WXAPI.userAmount(token)
    if (res1.code != 0) {
      wx.showToast({
        title: this.data.$t.pay.information,
        icon: 'none'
      })
      wx.redirectTo({
        url: "/pages/all-orders/index"
      });
      return
    }
   
// 计算应付金额并强制加收 3 元配送费（满足 pszq + shopId=11 + 订单金额<5 的情况）
let extraFee = 0
if (that.data.peisongType === 'pszq' && that.data.shopInfo && that.data.shopInfo.id == 11 && res.data.amountReal * 1 < 5) {
  extraFee = 3
}
const baseDue = (res.data.amountReal * 1 - res1.data.balance * 1)
let money = (baseDue + extraFee).toFixed(2)
    if (money <= 0) {
      if (extraFee > 0) {
        // 余额已覆盖基础订单，但仍需收取额外运费，发起仅收取运费的微信支付
        money = extraFee.toFixed(2)
        console.log("微信支付（仅运费）：")
        wxpay.wxpay('order', money, res.data.id, "/pages/all-orders/index",that.data.dataP)
      } else {
        // 使用余额支付
        await WXAPI.balance_pay(token, res.data.id).then(r=>{
          console.log(r)
        
          if(r.code==700){
           
            //标签
            that.print(that.data.dataP)
              //小票
            that.print2(that.data.dataP)

        }  
   
      })
      // 跳到订单列表
      wx.redirectTo({
        url: "/pages/all-orders/index"
      })}
    } else {
  
      console.log("微信支付：") 
     wxpay.wxpay('order', money, res.data.id, "/pages/all-orders/index",that.data.dataP)
     

    }
  },
  async getDistance(curAddressData) {
    // 计算门店与收货地址之间的距离
    if (!this.data.shopInfo || !this.data.shopInfo.latitude || !this.data.shopInfo.longitude || !curAddressData || !curAddressData.latitude || !curAddressData.longitude) {
      return 0
    }
    let distance = 0
    const QQ_MAP_KEY = wx.getStorageSync('QQ_MAP_KEY')
    if (QQ_MAP_KEY == '1') {
      const distanceRes = await WXAPI.gpsDistance({
        key: QQ_MAP_KEY,
        mode: 'bicycling',
        from: this.data.shopInfo.latitude + ',' + this.data.shopInfo.longitude,
        to: curAddressData.latitude + ',' + curAddressData.longitude
      })
      if (distanceRes.code != 0) {
        wx.showToast({
          title: distanceRes.msg,
          icon: 'none'
        })
        return distance
      }
      distance = distanceRes.data.result.rows[0].elements[0].distance / 1000.0
      return distance
    }
    // 只能计算直线距离
    return this.getDistanceLine(this.data.shopInfo.latitude, this.data.shopInfo.longitude, curAddressData.latitude, curAddressData.longitude) / 1000
  },
  getDistanceLine(lat1, lng1, lat2, lng2) {
    var dis = 0;
    var radLat1 = toRadians(lat1);
    var radLat2 = toRadians(lat2);
    var deltaLat = radLat1 - radLat2;
    var deltaLng = toRadians(lng1) - toRadians(lng2);
    var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
    return dis * 6378137;
  
    function toRadians(d) {
      return d * Math.PI / 180;
    }
  },
  async initShippingAddress() {
    const res = await WXAPI.defaultAddress(wx.getStorageSync('token'))
    if (res.code == 0) {
      // 计算距离
      let distance = await this.getDistance(res.data.info)
      console.log('distance', distance);
      if (this.data.shopInfo.serviceDistance && distance > this.data.shopInfo.serviceDistance * 1 && this.data.peisongType == 'kd') {
        wx.showToast({
          title: this.data.$t.pay.address,
          icon: 'none'
        })
      }
      this.setData({
        curAddressData: res.data.info,
        distance
      })
    } else {
      this.setData({
        curAddressData: null
      });
    }
    this.processYunfei();
  },
  processYunfei() {
    var goodsList = this.data.goodsList
    if (goodsList.length == 0) {
      return
    }
    const goodsJsonStr = []
    var isNeedLogistics = 0;

    let inviter_id = 0;
    let inviter_id_storge = wx.getStorageSync('referrer');
    if (inviter_id_storge) {
      inviter_id = inviter_id_storge;
    }
    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      if (carShopBean.stores < carShopBean.minBuyNumber) {
        continue
      }
      if (carShopBean.logistics || carShopBean.logisticsId) {
        isNeedLogistics = 1;
      }

      const _goodsJsonStr = {
        propertyChildIds: carShopBean.propertyChildIds
      }
      if (carShopBean.sku && carShopBean.sku.length > 0) {
        let propertyChildIds = ''
        carShopBean.sku.forEach(option => {
          propertyChildIds = propertyChildIds + ',' + option.optionId + ':' + option.optionValueId
        })
        _goodsJsonStr.propertyChildIds = propertyChildIds
      }
      if (carShopBean.additions && carShopBean.additions.length > 0) {
        let goodsAdditionList = []
        carShopBean.additions.forEach(option => {
          goodsAdditionList.push({
            pid: option.pid,
            id: option.id
          })
        })
        _goodsJsonStr.goodsAdditionList = goodsAdditionList
      }
      _goodsJsonStr.goodsId = carShopBean.goodsId
      _goodsJsonStr.number = carShopBean.number
      _goodsJsonStr.logisticsType = 0
      _goodsJsonStr.inviter_id = inviter_id
      _goodsJsonStr.goodsTimesDay = carShopBean.goodsTimesDay || ''
      _goodsJsonStr.goodsTimesItem = carShopBean.goodsTimesItem || ''
      goodsJsonStr.push(_goodsJsonStr)
    }
    this.setData({
      isNeedLogistics: isNeedLogistics,
      goodsJsonStr: JSON.stringify(goodsJsonStr)
    });
    this.createOrder()
  },
  addAddress: function () {
    wx.navigateTo({
      url: "/pages/ad/index"
    })
  },
  selectAddress: function () {
    wx.navigateTo({
      url: "/pages/ad/index"
    })
  },
  bindChangeCoupon: function (e) {
    const selIndex = e.detail.value;
    this.setData({
      curCoupon: this.data.coupons[selIndex],
      curCouponShowText: this.data.coupons[selIndex].nameExt
    })
    this.createOrder()
  },
  async getPhoneNumber(e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showToast({
        title: e.detail.errMsg,
        icon: 'none'
      })
      return;
    }
    const res = await WXAPI.bindMobileWxapp(wx.getStorageSync('token'), this.data.code, e.detail.encryptedData, e.detail.iv)
    AUTH.wxaCode().then(code => {
      this.data.code = code
    })
    if (res.code === 10002) {
      wx.showToast({
        title: this.data.$t.pay.login,
        icon: 'none'
      })
      return
    }
    if (res.code == 0) {
      wx.showToast({
        title: this.data.$t.pay.fetchsuccessful,
        icon: 'success'
      })
      this.setData({
        mobile: res.data
      })
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        nick: res.data.base.nick,
        avatarUrl: res.data.base.avatarUrl,
        mobile: res.data.base.mobile
      })
    }
  },
  diningTimeShow() {
    this.setData({
      diningTimeShow: true
    })
  },
  diningTimeHide() {
    this.setData({
      diningTimeShow: false
    })
  },
  diningTimeConfirm(e) {
    this.setData({
      diningTime: e.detail
    })
    this.diningTimeHide()
  },
  updateUserInfo(e) {
    wx.getUserProfile({
      lang: 'zh_CN',
      desc: this.data.$t.pay.memberinformation,
      success: res => {
        console.log(res);
        this._updateUserInfo(res.userInfo)
      },
      fail: err => {
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      }
    })
  },
  async _updateUserInfo(userInfo) {
    const postData = {
      token: wx.getStorageSync('token'),
      nick: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      city: userInfo.city,
      province: userInfo.province,
      gender: userInfo.gender,
    }
    const res = await WXAPI.modifyUserInfo(postData)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: this.data.$t.pay.Loginsuccessful,
    })
    this.getUserApiInfo()
  },
  async _peisonFeeList() {
    // https://www.yuque.com/apifm/nu0f75/nx465k
    const res = await WXAPI.peisonFeeList()
    if (res.code == 0) {
      this.data.peisonFeeList = res.data
    }
  },
  packaging_fee_Change(event) {
    this.setData({
      packaging_fee_use: event.detail,
    })
    this.createOrder()
  },
  packaging_fee_Click(event) {
    const { name } = event.currentTarget.dataset;
    this.setData({
      packaging_fee_use: name,
    })
    this.createOrder()
  },
      //打印标签，参数为支付返回的data数据
      print(data){
        var that = this
        //芯烨云打印接口
         let url = 'https://open.xpyun.net/api/openapi/xprinter/printLabel'      
         //开发者密钥
         let userKey = 'b2e9014204774a058bc7e8640e36e8ed'
         //开发者id xu1271669848@gmail.com
         let userId = 'xu1271669848@gmail.com'
         let timstamp = Math.trunc(new Date().getTime()/1000) + ""
         let sign = userId + userKey + timstamp
          //打印机序列号，店铺id对应打印机序列号
          let sn = ''
          //紫金店
          if(data.shopInfo.id==2){
            sn = '32817SCU1VAF54B'
          }//未来店
          else if (data.shopInfo.id==1){
            sn = '32EL21088705948'
          }
           //塘下店
        else if (data.shopInfo.id==4){
          sn = '325Z1VC2ANA044B'
      }
    

      //银泰新
      else if (data.shopInfo.id==10){
        sn = '32NGYDZZWN9D349'
      }

      //天津
      else if (data.shopInfo.id==11){
        sn = '32838SJRD48F849'
      }

      //金田
      else if (data.shopInfo.id==12){
        sn = '32C5PT83TYA9449'
      }

      //未来里
      else if (data.shopInfo.id==13){
        sn = '32JA8NVQDC1074B'
      }

      //汽车
      else if (data.shopInfo.id==14){
        sn = '32EVUCUVY0B4848'
      }
      


          //如果没有打印机，则返回
          if(!sn){
            return
          }
              //当前日期 时分秒
        let timeStr = that.getDate()
        let content = ''
         
      for(let i=0;i<data.goodsList.length;i++){
        for(let k=0;k<data.goodsList[i].number;k++){
        content+= '<PAGE><SIZE>40,30</SIZE>' + 
        '<TEXT x="8" y="0" w="1" h="1" r="0"># '+(i+1) +'/' + data.goodsList.length + ' 总金额:'+data.data.amountReal + '</TEXT>'+
        '<TEXT x="8" y="24" w="1" h="1" r="0">'+ data.goodsList[i].name +'</TEXT>'
        for(let j=0;j<data.goodsList[i].sku.length;j++){
          content+='<TEXT x="8" y="' + (j+2)*24 +'" w="1" h="1" r="0">'+ data.goodsList[i].sku[j].optionValueName +'</TEXT>'
        }
        content+= '<TEXT x="8" y="'+(data.goodsList[i].sku.length+2)*24 +'" w="1" h="1" r="0">'+'单价: ￥'+data.goodsList[i].price + '</TEXT>'+
        '<TEXT x="8" y="166" w="1" h="1" r="0">'+ data.data.orderNumber+ '</TEXT>'+ 
        '<TEXT x="8" y="190" w="1" h="1" r="0">'+ timeStr + '</TEXT>'+ 
        '<TEXT x="8" y="214" w="1" h="1" r="0">'+ data.shopInfo.name + '</TEXT>' +   '</PAGE>'
  
      }
    }
        
  
         //请求参数
         let param = {
           user: userId,
           timestamp: timstamp,
           sign: util.sha1(sign),
           sn: sn,
           content: content
           }
            
       let header = {
         "Content-Type": "application/json;charset=UTF-8"
       }
     
         wx.request({
           url: url,
           data: param,
           method: "post",
           header:header,
           success: res=>{
             console.log("标签打印返回：",res)
           }
          
           
         })
      },
        //打印小票，参数为支付返回的data数据
        async print2(data){
          var that = this

       // >>>>>>>>> 新增代码开始：获取会员卡状态 <<<<<<<<<
    let hasCardStr = '否' // 默认显示否
    try {
      const cardRes = await WXAPI.myMemberCardListAll()
      if (cardRes.code == 0 && cardRes.data && cardRes.data.length > 0) {
        hasCardStr = '是' // 如果接口返回有数据，则显示是
      }
    } catch (e) {
      console.error('获取会员卡状态失败', e)
    }
    // >>>>>>>>> 新增代码结束 <<<<<<<<<


          //芯烨云打印接口
           let url = 'https://open.xpyun.net/api/openapi/xprinter/print'      
           //开发者密钥
           let userKey = 'b2e9014204774a058bc7e8640e36e8ed'
           //开发者id xu1271669848@gmail.com
           let userId = 'xu1271669848@gmail.com'
           let timstamp = Math.trunc(new Date().getTime()/1000) + ""
           let sign = userId + userKey + timstamp
            //打印机序列号，店铺id对应打印机序列号
            let sn = ''
            //紫金店
            if(data.shopInfo.id==2){
              sn = '74Y4LWMD9R9AF4B'
            }
            //未来店
          else if (data.shopInfo.id==1){
            sn = '742N30GDRND8E4A'
          }
          //塘下店
          else if (data.shopInfo.id==4){
            sn = '74S8LPEQ3584048'
          }
          

          //丽阳门 钟楼
        else if (data.shopInfo.id==5){
          sn = '742TDCUUEG52448'
        }

        //银泰
        else if (data.shopInfo.id==6){
          sn = '746YPYC2M938048'
        }
        //金汇店
        else if (data.shopInfo.id==7){
          sn = '746M3WQ7371EB4B'
        }
        //小转盘店
        else if (data.shopInfo.id==8){
          sn = ''
        }
        //义乌
        else if (data.shopInfo.id==9){
          sn = '74Q47U9U2NE334A'
        }

        //银泰
        else if (data.shopInfo.id==10){
          sn = '74M60R5MB165A4B'
        }

        //天津
        else if (data.shopInfo.id==11){
          sn = '44PNT1XFVHD8549'
        }
        //金田
        else if (data.shopInfo.id==12){
          sn = '74UCT9NHQ03F048'
        }

        //未来里
        else if (data.shopInfo.id==13){
          sn = '746YPYC2M938048'
        }

         //汽车
         else if (data.shopInfo.id==14){
          sn = '744905VQE26ED4A'
        }
      
            //如果没有打印机，则返回
            if(!sn){
              return
            }
                //当前日期 时分秒
          let timeStr = that.getDate()
          let content = '<CB>9.8 COFFEE<BR><BR><BR></CB>' +'<TABLE col="22,3,7" w=1 h=1 b=0 lh=68> '
           
        for(let i=0;i<data.goodsList.length;i++){
          content+=  '<tr>'+ data.goodsList[i].name +'<td>' + data.goodsList[i].number +'<td>' + data.goodsList[i].price + '元</tr>'
          content+='<tr>|'
          for(let j=0;j<data.goodsList[i].sku.length;j++){
            content+=data.goodsList[i].sku[j].optionValueName + '|' 
          }
          content+='<td> <td> </tr>'
        }
        content+='</TABLE>'
        content+='<R>合计：'+ data.data.amountReal+'元<BR></R><BR>'
  
        content+= '<L>下单时间: '+ timeStr + '<BR>'+ 
        '订单编号: '+ data.data.orderNumber + '<BR>' +
        '周年卡用户: ' + hasCardStr + '<BR>' +  
        '用户电话: '+ data.mobile + '<BR>' 
        if(data.peisongType =='pszq'){
          content+= '用户地址: '+ data.address + '<BR>' + '电话:' +data.mobile + '<BR>' 
        }
        // if(that.data.peisongType=='zq'){
        //   content+= ' 取单号: '+that.data.curAddressData.address + '<BR>' 
        // }
        content+=  '门店名称: ' + data.shopInfo.name +'<BR>'+
        '备注: ' + data.remark +'<BR>'
        content+= '</L>' 

        console.log('======== 小票打印内容预览 ========');
        console.log(content);
    
           //请求参数
           let param = {
             user: userId,
             timestamp: timstamp,
             sign: util.sha1(sign),
             sn: sn,
             content: content
             }

              
         let header = {
           "Content-Type": "application/json;charset=UTF-8"
         }
       
           wx.request({
             url: url,
             data: param,
             method: "post",
             header:header,
             success: res=>{
               console.log("小票打印返回：",res)
             }
            
             
           })
        },
         //获取当前年月日时分秒，打印时间
  getDate(){
    var now = new Date();
var year = now.getFullYear(); // 年
var month = now.getMonth() + 1; // 月
var day = now.getDate(); // 日
var hour = now.getHours(); // 时
var minute = now.getMinutes(); // 分
var second = now.getSeconds(); // 秒

// 格式化输出
var timeString = year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day) + " " + (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second);
 return timeString

  }
})