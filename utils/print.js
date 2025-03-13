// utils/print.js
/*
const WXAPI = require('apifm-wxapi')

class PrintService {
  constructor() {
    this.timer = null
    this.isRunning = false
    this.lastCheckTime = null
    this.xToken = ''
    this.tokenExpireTime = 0
  }

  // 获取新的 token
  refreshToken(callback) {
    wx.request({
      url: 'https://user.api.it120.cc/login/mobile/v2',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        mobile: '15988020219',
        pwd: 'Wishful1688!'
      },
      success: (res) => {
        if (res.data && res.data.code === 0) {
          this.xToken = res.data.data.token
          this.tokenExpireTime = Date.now() + 24 * 60 * 60 * 1000
          console.log('token 刷新成功:', this.xToken)
          callback && callback(true)
        } else {
          console.error('获取 token 失败:', res.data ? res.data.msg : '接口异常')
          callback && callback(false)
        }
      },
      fail: (error) => {
        console.error('刷新 token 出错:', error)
        callback && callback(false)
      }
    })
  }

  // 检查并确保 token 有效
  ensureValidToken(callback) {
    if (!this.xToken || Date.now() >= this.tokenExpireTime) {
      this.refreshToken(callback)
    } else {
      callback && callback(true)
    }
  }

  startPolling() {
    if (this.isRunning) return
    
    this.ensureValidToken((tokenValid) => {
      if (!tokenValid) {
        console.error('无法获取有效的 token')
        return
      }

      this.isRunning = true
      this.checkOrders()
      
      this.timer = setInterval(() => {
        this.checkOrders()
      }, 50000)
    })
  }

  checkOrders() {
    this.ensureValidToken((tokenValid) => {
      if (!tokenValid) {
        console.error('token 无效，跳过本次检查')
        return
      }

      wx.request({
        url: 'https://user.api.it120.cc/user/apiExtOrder/list',
        method: 'POST',
        header: {
          'X-Token': this.xToken,
          'content-type': 'application/x-www-form-urlencoded'
        },
        data: {
          status: '1',
          dateAddBegin: this.lastCheckTime || ''
        },
        success: (res) => {
          if (res.data && res.data.code === 0) {
            this.lastCheckTime = new Date().toISOString()
            const orders = res.data.data.result || []
            console.log('获取到订单数:', orders.length)
            orders.forEach(order => {
              if (this.needPrint(order)) {
                this.processPrintOrder(order.id)
              }
            })
          } else {
            console.error('获取订单列表失败:', res.data ? res.data.msg : '接口异常')
          }
        },
        fail: (error) => {
          console.error('请求订单列表失败:', error)
        }
      })
    })
  }

  needPrint(order) {
    return order.isPay && !order.printed
  }

  processPrintOrder(orderId) {
    wx.request({
      url: 'https://user.api.it120.cc/user/apiExtOrder/detail',
      method: 'GET',
      header: {
        'X-Token': this.xToken
      },
      data: { id: orderId },
      success: (detailRes) => {
        if (detailRes.data && detailRes.data.code === 0) {
          const orderDetail = detailRes.data.data
          this.doPrint(orderDetail)
        } else {
          console.error('获取订单详情失败:', detailRes.data ? detailRes.data.msg : '接口异常')
        }
      },
      fail: (error) => {
        console.error('获取订单详情失败:', error)
      }
    })
  }
  doPrint(orderDetail) {
    console.log('订单详情数据:', orderDetail)
    
    // 从正确的位置获取数据
    const order = orderDetail.order
    const goodsList = orderDetail.goodsList || []
    const extJson = orderDetail.extJson || {}

    const printData = {
      orderid: order.orderNumber,
      remark: order.remark || '',
      name: order.shopName,
      tel: extJson.联系电话 || '',
      z_number: order.qudanhao || '',
      goods: JSON.stringify(goodsList.map(item => ({
        title: item.goodsName,
        price: item.amount,
        num: item.number
      })))
    }

    // 如果商品列表为空，使用订单总额
    if (!goodsList.length) {
      printData.goods = JSON.stringify([{
        title: '商品',
        price: order.amountReal || 0,
        num: order.goodsNumber || 1
      }])
    }

    console.log('发送到打印机的数据:', printData)

    wx.request({
      url: 'http://47.98.186.186:8080/print/printLabelMsg.php',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: printData,
      success: (printRes) => {
        console.log('打印接口返回:', printRes.data)
        if (printRes.data && printRes.data.ret === 0) {
          console.log('订单打印成功:', order.orderNumber)
        } else {
          console.error('订单打印失败:', printRes.data ? printRes.data.msg : '打印接口异常')
          console.error('打印失败详情:', printRes)
        }
      },
      fail: (error) => {
        console.error('调用打印接口失败:', error)
      }
    })
}
  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.isRunning = false
  }
}

module.exports = new PrintService()

*/