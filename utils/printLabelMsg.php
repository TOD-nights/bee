<?php
header("Content-type: text/html; charset=utf-8");
include 'HttpClient.class.php';

// 飞鹅云配置
define('USER', 'xu1271669848@gmail.com');
define('UKEY', 'kVBTc5n7kWLp87E4');

//以下参数不需要修改
define('IP','api.feieyun.cn');
define('PORT',80);
define('PATH','/Api/Open/');

// 接收并解析数据
$orderData = $_POST;
$orderData['goods'] = json_decode($orderData['goods'], true);

// 验证必要字段
if (empty($orderData['orderid']) || empty($orderData['goods'])) {
    echo json_encode([
        'ret' => -1,
        'msg' => '订单数据不完整',
        'data' => null
    ]);
    exit;
}

// 构建打印内容
$content = '';
$num = count($orderData['goods']);
$i = 1;

// 拼接订单头部
$content .= '<CB>9.8 COFFEE</CB><BR>';
$content .= '--------------------------------<BR>';
$content .= '订单号：'.$orderData['orderid'].'<BR>';
if (!empty($orderData['z_number'])) {
    $content .= '取单号：'.$orderData['z_number'].'<BR>';
}
$content .= '日期：'.date('Y-m-d H:i:s').'<BR>';
$content .= '--------------------------------<BR>';

// 拼接商品信息
$content .= '商品名称　　　 数量  单价  金额<BR>';
$totalAmount = 0;
foreach ($orderData['goods'] as $good) {
    $amount = $good['price'] * $good['num'];
    $totalAmount += $amount;
    $content .= $good['title'].'<BR>';
    $content .= '　　　　　　  '.$good['num'].'   '.number_format($good['price'], 2).'  '.number_format($amount, 2).'<BR>';
}

// 拼接订单底部
$content .= '--------------------------------<BR>';
$content .= '合计：'.number_format($totalAmount, 2).'元<BR>';
if (!empty($orderData['remark'])) {
    $content .= '备注：'.$orderData['remark'].'<BR>';
}
if (!empty($orderData['tel'])) {
    $content .= '电话：'.$orderData['tel'].'<BR>';
}
$content .= '--------------------------------<BR>';
$content .= '<QR>9.8 COFFEE</QR>';




try {
    // 调用打印机打印
    $result = printMsg('960264115', $content, 1);  // 这里需要替换你的打印机SN码
    
    // 解析返回结果
    $response = json_decode($result, true);
    echo json_encode([
        'ret' => $response['ret'],
        'msg' => $response['msg'],
        'data' => $response['data']
    ]);
} catch (Exception $e) {
    echo json_encode([
        'ret' => -2,
        'msg' => '打印失败：'.$e->getMessage(),
        'data' => null
    ]);
}

/**
 * 打印订单接口
 * @param  string $printer_sn 打印机编号
 * @param  string $content    打印内容
 * @param  string $times      打印次数
 * @return string
 */
function printMsg($printer_sn, $content, $times){
    $time = time();
    $params = array(
        'user'=>USER,
        'stime'=>$time,
        'sig'=>signature($time),
        'apiname'=>'Open_printMsg',
        'sn'=>$printer_sn,
        'content'=>$content,
        'times'=>$times
    );

    $client = new HttpClient(IP, PORT);
    if(!$client->post(PATH, $params)){
        return json_encode([
            'ret' => -2,
            'msg' => '打印机连接失败',
            'data' => null
        ]);
    }
    return $client->getContent();
}

/**
 * 生成签名
 * @param  int $time 当前时间戳
 * @return string
 */
function signature($time){
    return sha1(USER.UKEY.$time);
}
?>