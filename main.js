/*------------------------------------
By: Lycm
QQ: 2417003944

主站链接: https://www.pixiv.net
------------------------------------*/

// 导入外部库
const axios = require('axios');
const fs = require('fs');

// 用户id
const user_id = '1193008';

// 获取目标画师插图url
function get_artworks_url(user_id) {
  // 拼接链接 (返回目标用户所有插画id)
  const all_artworks_api = `https://www.pixiv.net/ajax/user/${user_id}/profile/all?lang=zh`;
  // 发起请求获取插画id
  axios({
    method: 'get',
    url: all_artworks_api,
  })
    .then(function (response) {
      // 插图id合集对象 {xxxxxxx: none, ...}
      // body.illusts => 插画id，body.manga => 漫画id
      const illusts = response.data.body.illusts;
      // 遍历对象提取id (illust)
      for (illust in illusts) {
        console.log(illust);
      }
    });
}

function artworks(illust){
  // 拼接插画详情页面链接
  artworks_url = `https://www.pixiv.net/artworks/${illust}`;
  illust_api = `https://www.pixiv.net/touch/ajax/illust/details?illust_id=${illust}&ref=&lang=zh`
  axios({
    method: 'get',
    url: illust_api,
  }).then(function (response) {
    // 插画标题
    const illust_name = response.data.body.illust_details.title
    // 作者名字
    const user_name = response.data.body.illust_details.author_details.user_name
    // 图片地址
    const illust_url = response.data.body.illust_details
    console.log(illust_name)
    console.log(user_name)
    console.log(illust_url)
  });
}

function save_illust(illust_url, name){
  axios({
    method: 'get',
    url: illust_url,
    responseType:'stream',
    headers: {'referer': 'https://www.pixiv.net/'},
  }).then(function (response) {
    console.log(name);
    console.log(response);
    response.data.pipe(fs.createWriteStream('ada_lovelace.png'))
    console.log("OK")
  })
}
// get_artworks_url(user_id);
// artworks('80680801')
save_illust('https://i.pximg.net/img-original/img/2020/04/12/01/14/19/80680801_p0.png', 'ダンガンロンパ')