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
    list: []
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
        page:1,
        list:[]
      })
      this.loadData()
    },
    loadData() {
      WXAPI.getMyCreatedPindanRecord(this.data.active - 1, this.data.page).then(res => {
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
    toPay(e){
      const id = e.currentTarget.dataset.id
      const index = e.currentTarget.dataset.index
      if(this.data.list[index].status == 0) {
        wx.navigateTo({
          url: '/pages/pindan/pindan?id=' + id,
        })
      }
    }
  }
})