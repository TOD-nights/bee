// pages/my/pindan/components/my-create.js
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../../../../utils/auth')
const APP = getApp()
Component({

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    active: 0,
    page: 1, // 每页显示条数
    list: [],
    selectedItem: {},
    showQuCan: false
  },

  lifetimes: {
    attached: function () {
      AUTH.checkHasLogined().then(isLogined => {
        if (!isLogined) {
          AUTH.authorize().then(res => {
            AUTH.bindSeller()
          })
        }
      })
      this.loadData();
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onchange: function (e) {
      this.setData({
        active: e.detail.index,
        page: 1,
        list: []
      })
      this.loadData()
    },
    loadData() {
      WXAPI.getMyJoinedPindanRecord(this.data.active - 1, this.data.page).then(res => {
        this.setData({
          list: [...this.data.list, ...res.data],
          page: this.data.page + 1
        });
      });
    },
    onScrollToLower(e) {
      console.log(e);
      this.loadData();
    },
    // 取单
    toShowHx(e) {
      const id = e.currentTarget.dataset.id
      const index = e.currentTarget.dataset.index
      this.setData({
        selectedItem: this.data.list[index],
        showQuCan: true
      })
    },
    onClose() {
      this.setData({
        selectedItem: {},
        showQuCan: false
      })
    },
    onConfirm() {
      WXAPI.qudan(this.data.selectedItem.id).then(res => {
        console.log(res)
        if (res.code == 0) {
          wx.showToast({
            title: '取单成功',
          })
          this.setData({
            selectedItem: {},
            showQuCan: false
          })
        } else {
          wx.showToast({
            title: res.msg,
            icon: 'error'
          })
        }
      })
    }
  }
})