// 导入外部库
const axios = require('axios');
const { count } = require('console');
const fs = require('fs');

// 用户id
const user_id = '34154040';  //59张

/* 获取目标画师所有插画ID */
function get_illusts_id(user_id) {
  const artworks_api = `https://www.pixiv.net/ajax/user/${user_id}/profile/all?lang=zh`;
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: artworks_api,
    }).then(response => {  // 返回数据并处理
      // body.illusts => 插画id，body.manga => 漫画ID
      // 插图ID合集对象 {xxxxxxx: none, ...} key为ID，value为none
      const illusts = response.data.body.illusts;
      resolve(Object.keys(illusts));
    }).catch(reject);  // 将错误传入 reject
  })
}

/* 获取插画信息 名字，链接 */
function get_illusts_info(illusts) {
  return new Promise((resolve, reject) => {
    const img_info = [];
    const flag = [];
    for (illust of illusts) {
      axios({
        method: 'get',
        url: `https://www.pixiv.net/touch/ajax/illust/details?illust_id=${illust}&ref=&lang=zh`,
      }).then(response => {
        const illust_name = response.data.body.illust_details.title;  // 插画标题
        const manga_a = response.data.body.illust_details.manga_a;  // 如果有多张图，则链接在 manga_a 中，单张则没有此项
        if (manga_a) {
          for (page of manga_a) { img_info.push({ 'name': `${illust_name}_${page.page + 1}`, 'url': page.url_big }) };
        } else {
          img_info.push({ 'name': illust_name, 'url': response.data.body.illust_details.url_big });
        };
        flag.push(0)
        if (flag.length == illusts.length) resolve(img_info)
      });
    }
  })
}

function save_illusts(illusts_info) {
  for (illust_info of illusts_info) {
    save_illust(illust_info.name, illust_info.url);
  }
}

function save_illust(name, url) {
  illust_type = url.split('.').slice(-1)[0];  // 获取文件后缀
  console.log(`开始下载--->${name}`)
  axios({
    method: 'get',
    url: url,
    responseType: 'arraybuffer',  // 响应类型为二进制
    headers: { 'referer': 'https://www.pixiv.net/' },
  }).then(response => {
    fs.writeFile(`./34154040/${name}.${illust_type}`, response.data, (error) => { console.log(`下载完成--->${name}`) });
  })
}

async function main(user_id) {
  try {
    const illusts_id = await get_illusts_id(user_id);
    const illusts_info = await get_illusts_info(illusts_id);
    save_illusts(illusts_info);
  } catch (error) {
    console.log(error);
    return;
  }
}

main(user_id);