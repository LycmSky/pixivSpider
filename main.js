/*------------------------------------
By: Lycm
QQ: 2417003944

主站链接: https://www.pixiv.net
------------------------------------*/

// 导入外部库
const axios = require('axios');

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
        // 拼接插画详情页面链接
        artworks_url = `https://www.pixiv.net/artworks/${illust}`;
        console.log(artworks_url);
      }
    });
}

get_artworks_url(user_id);
