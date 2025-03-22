const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


function encodeUTF8(s) {
  var i, r = [], c, x;
  for (i = 0; i < s.length; i++)
    if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
    else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
    else {
      if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
        c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
          r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
      else r.push(0xE0 + (c >> 12 & 0xF));
      r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
    };
  return r;
};

// 字符串加密成 hex 字符串,芯烨云打印加密
function sha1(s) {
  var data = new Uint8Array(encodeUTF8(s))
  var i, j, t;
  var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
  s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
  for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
  s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
  s[l - 1] = data.length << 3;
  var w = [], f = [
    function () { return m[1] & m[2] | ~m[1] & m[3]; },
    function () { return m[1] ^ m[2] ^ m[3]; },
    function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
    function () { return m[1] ^ m[2] ^ m[3]; }
  ], rol = function (n, c) { return n << c | n >>> (32 - c); },
    k = [1518500249, 1859775393, -1894007588, -899497514],
    m = [1732584193, -271733879, null, null, -1009589776];
  m[2] = ~m[0], m[3] = ~m[1];
  for (i = 0; i < s.length; i += 16) {
    var o = m.slice(0);
    for (j = 0; j < 80; j++)
      w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
        t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
        m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
    for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
  };
  t = new DataView(new Uint32Array(m).buffer);
  for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);

  var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
    return (e < 16 ? "0" : "") + e.toString(16);
  }).join("");

  return hex;
};
 //打印标签，参数为支付返回的data数据
 function   print(data){

 //  console.log("wx.getStorageSync")
 //  console.log(wx.getStorageSync(data.data.id +''))

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
     sn = '742N30GDRND8E4A'

   }
   //如果没有打印机，则返回
   if(!sn){
     return
   }
       //当前日期 时分秒
 let timeStr = getDate()
 let content = ''
  
for(let i=0;i<data.goodsList.length;i++){
 for(let k=0;k<data.goodsList[i].number;k++){
 content+= '<PAGE><SIZE>40,30</SIZE>' + 
 '<TEXT x="8" y="0" w="1" h="1" r="0"># '+(i+1) +'/' + data.goodsList.length + ' 总金额:'+data.data.amountReal + '</TEXT>'+
 '<TEXT x="8" y="24" w="1" h="1" r="0">'+ data.goodsList[i].name +'</TEXT>'
 for(let j=0;j<data.goodsList[i].sku.length;j++){
   content+='<TEXT x="8" y="' + (j+2)*24 +'" w="1" h="1" r="0">'+ data.goodsList[i].sku[j].optionValueName +'</TEXT>'
 }
 content+= '<TEXT x="8" y="'+(data.goodsList[i].sku.length+2)*24 +'" w="1" h="1" r="0">'+'单价: ￥'+ data.goodsList[i].price +'X'+ data.goodsList[i].number+ '</TEXT>'+
 '<TEXT x="8" y="166" w="1" h="1" r="0">'+ data.data.orderNumber+ '</TEXT>'+ 
 '<TEXT x="8" y="190" w="1" h="1" r="0">'+ timeStr + '</TEXT>'+ 
 '<TEXT x="8" y="214" w="1" h="1" r="0">'+ data.shopInfo.name + '</TEXT>' +   '</PAGE>'

}
}
 

  //请求参数
  let param = {
    user: userId,
    timestamp: timstamp,
    sign: sha1(sign),
    sn: sn,
    content: content
    }
    console.log(param)
     
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
}
 //打印小票，参数为支付返回的data数据
 function   print2(data){


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
     //如果没有打印机，则返回
     if(!sn){
       return
     }
         //当前日期 时分秒
   let timeStr = getDate()
   let content = '<CB>9.8 COFFEE<BR><BR><BR></CB>' +'<TABLE col="22,3,7" w=1 h=1 b=0 lh=68> '
    
 for(let i=0;i<data.goodsList.length;i++){
   content+=  '<tr>'+ data.goodsList[i].name +'<td>' + data.goodsList[i].number +'<td>' + data.goodsList[i].price + '元</tr>'
   content+='<tr>|'
   for(let j=0;j<data.goodsList[i].sku.length;j++){
     content+= data.goodsList[i].sku[j].optionValueName + '|' 
   }
   content+='<td> <td> </tr>'


 }
 content+='</TABLE>'
 content+='<R>合计：'+ data.data.amountReal+'元<BR></R><BR>'

 content+= '<L>下单时间: '+ timeStr + '<BR>'+ 
 '订单编号: '+ data.data.orderNumber + '<BR>' +
 '用户电话: '+ data.mobile + '<BR>' 
 if(data.peisongType=='kd'){
   content+= '用户地址: '+data.address + '<BR>' 
 }

 content+='门店名称: ' + data.shopInfo.name +'<BR>' +
 '  备注: ' + data.remark +'<BR>'
 content+= '</L>' 


   

    //请求参数
    let param = {
      user: userId,
      timestamp: timstamp,
      sign: sha1(sign),
      sn: sn,
      content: content
      }
      console.log(param)
       
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
 }
   //获取当前年月日时分秒，打印时间
function  getDate(){
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
module.exports = {
  formatTime: formatTime,
  sha1:sha1,
  print,
  print2
}