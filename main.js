/*导入库 */
const axios = require('axios');
const { count } = require('console');
const fs = require('fs');
const logger = require('log4js').getLogger();

/* 参数设定 */
logger.level = 'debug';  // 日志显示等级
let user_id = '31051351';  // 目标用户ID
let PATH = 'C:\\Users\\Lycm\\Pictures\\Pixiv';  // 文件存放目录

/* 获取画师信息 */
function get_user_info(user_id) {
  logger.info(`==========获取画师信息==========`)
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `https://www.pixiv.net/ajax/user/${user_id}/profile/top?lang=zh`
    }).then(response => {
      // 获取ID对应的用户名
      user_name = response.data.body.extraData.meta.title.replace(/ - pixiv[\w\W]*/, "");
      logger.info(`ID:${user_id}  用户名:${user_name}`);
      resolve(user_name);
    });
  });
}

/* 获取目标画师所有插画ID */
function get_illusts_id(user_id) {
  return new Promise((resolve, reject) => {
    logger.info('==========获取图片列表==========');
    axios({
      method: 'get',
      url: `https://www.pixiv.net/ajax/user/${user_id}/profile/all?lang=zh`,
    }).then(response => {
      // body.illusts => 插画id，body.manga => 漫画ID
      // 插图ID合集对象 {xxxxxxx: none, ...} key为ID，value为none
      const illusts = response.data.body.illusts;
      logger.info(`成功获取${Object.keys(illusts).length}组图片`);
      resolve(Object.keys(illusts));  // 返回 illusts 对象中的所有key组成的数组
    }).catch(error => {
      logger.error('获取图片列表失败');
      reject(error);
    });
  });
}

/* 获取插画信息 名字，链接 */
function get_illusts_info(illusts) {
  return new Promise((resolve, reject) => {
    logger.info('==========获取图片信息==========');
    const task_list = [];  // 任务队列
    // 循环产生任务并加入队列
    for (illust of illusts) { task_list.push(get_illust_info(illust)) }
    // 队列中所有Promise状态为resolve继续执行
    Promise.all(task_list).then(values => {
      let img_info = [];  // 用于存放图片信息 {name: xxx, url: xxx}
      for (value of values) { img_info = img_info.concat(value) };
      logger.info(`获取图片信息完成，共获取(${img_info.length})张图片的链接`);
      resolve(img_info);
    });
  });
}

/* 获取图片信息方法封装 */
function get_illust_info(id) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `https://www.pixiv.net/touch/ajax/illust/details?illust_id=${id}&ref=&lang=zh`,
    }).then(response => {
      const illust_name = `${response.data.body.illust_details.title}(${id})`;  // 文件名 格式 标题(id)
      const manga_a = response.data.body.illust_details.manga_a;  // 如果有多张图，则链接在 manga_a 中，单张图片则没有此项
      const img_info = [];  // 用于存放图片信息 {name: xxx, url: xxx}
      if (manga_a) { for (page of manga_a) { img_info.push({ 'name': `${illust_name}_${page.page + 1}`, 'url': page.url_big }) } }
      else { img_info.push({ 'name': illust_name, 'url': response.data.body.illust_details.url_big }); };
      resolve(img_info);
    }).catch(function (error) {
      logger.warn(`图片信息获取失败 ===> ${id}`);
      resolve([]);  // 失败返回空数组，否则 Promise 状态不为 resolve 无法触发 Promise.all
    });
  });
}

/* 建立存放图片的目录 */
function make_folder(user_name, user_id) {
  return new Promise((resolve, reject) => {
    logger.info(`==========图片存放目录==========`);
    // 在指定目录下创建该画师的文件夹用于存放图片
    folder_name = `${user_name}(${user_id})`;
    download_path = `${PATH}\\${folder_name}`;
    // 检查文件是否存在于当前目录中、以及是否可写。
    fs.access(download_path, fs.constants.F_OK | fs.constants.W_OK | fs.constants.R_OK, (err) => {
      if (err) {  // 出现错误
        if (err.code === 'ENOENT') {  // 路径不存在
          dir_path = '';
          for (i of download_path.split('\\')) {
            dir_path += `${i}\\`;
            fs.existsSync(dir_path) ? null : fs.mkdirSync(dir_path)
          };
          logger.info(`文件夹(${folder_name})创建成功`);
        } else { reject('目录读/写失败') };  // 无法读/写
      } else { logger.info(`文件夹(${folder_name})已存在`) };
      resolve(fs.readdirSync(download_path)); // resolve 目录下已存在的文件
    });
  })
}

/* 保存图片 */
function save_illusts(illusts_info, image_list) {
  return new Promise((resolve, reject) => {
    logger.info('==========开始下载图片==========')
    task_list = [];  // 下载任务队列
    for (illust_info of illusts_info) {
      illust_type = illust_info.url.split('.').slice(-1)[0];  // 获取文件后缀
      const image_name = `${illust_info.name}.${illust_type}`;
      image_list.indexOf(image_name) != -1 ? logger.info(`已经存在 ===> ${image_name}`) : task_list.push(save_illust(image_name, illust_info.url))
    }
    Promise.all(task_list).then(values => {
      // 用于统计下载状况，Promise.all 这部分是为了后续打印信息
      // 去掉这部分和后续打印信息部分不会影响下载
      let flag = [0, 0];
      for (i of values) { i ? flag[1]++ : flag[0]++ }
      logger.info(`下载完成  成功(${flag[1]})  失败(${flag[0]})`);
      logger.info(`存放路径  ${download_path}`);
      resolve(flag);
    });
  });
}

/* 封装下载方法 */
function save_illust(name, url) {
  return new Promise((resolve, reject) => {
    logger.info(`开始下载 ===> ${name}`)
    axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',  // 响应类型为二进制
      headers: { 'referer': 'https://www.pixiv.net/' },
    }).then(response => {
      // 向磁盘中写入文件
      fs.writeFile(`${download_path}/${name}`, response.data, (error) => {
        if (error) { logger.error(`存储失败 ===> ${name}`); resolve(0) }
        else { logger.info(`下载完成 ===> ${name}`); resolve(1) }
      });
    }).catch(function (error) {
      logger.warn(`下载失败 ===> ${name}`);
      resolve(0);  // resolve 0/1 代表下载 失败/成功
    });
  });
}

/* 入口函数 */
async function main(user_id) {
  try {
    logger.info('==========开始执行程序==========');
    const user_name = await get_user_info(user_id);
    const illusts_id = await get_illusts_id(user_id);
    const illusts_info = await get_illusts_info(illusts_id);
    const image_list = await make_folder(user_name, user_id);
    await save_illusts(illusts_info, image_list);
    logger.info('==========程序执行完毕==========');
  } catch (error) {
    logger.error(error);
  }
}

main(user_id);