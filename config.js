module.exports = {
  version: "24.11.20",
  note: '支付宝生成付款二维码的接口更换',
  apiHOST: 'https://9kuai8coffee.asia', 
  //new
  //subDomain: "9kuai8coffee.asia", 
  //merchantId: 27, // 商户ID，可在后台工厂设置-->商户信息查看

  
  subDomain: "9kuai8coffee", // 根据教程 https://www.it120.cc/help/qr6l4m.html 查看并设置你自己的 subDomain
 merchantId: 68021, //old  商户ID，可在后台工厂设置-->商户信息查看

  customerServiceType: 'QW', // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，否则为小程序的默认客服

}

