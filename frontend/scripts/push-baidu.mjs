/**
 * 把 sitemap.xml 里的 URL 主动推送给百度收录。
 *
 * 前置：在百度搜索资源平台（ziyuan.baidu.com）验证站点，获取推送 token。
 * 用法：
 *   BAIDU_TOKEN=你的token BAIDU_SITE=www.xiaogangai.site node scripts/push-baidu.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const token = process.env.BAIDU_TOKEN;
const site = process.env.BAIDU_SITE || "www.xiaogangai.site";

if (!token) {
  console.error("请设置 BAIDU_TOKEN：百度搜索资源平台 → 普通收录 → 接口调用地址中的 token 参数");
  process.exit(1);
}

const xml = readFileSync(fileURLToPath(new URL("../public/sitemap.xml", import.meta.url)), "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`准备推送 ${urls.length} 个 URL 到百度…`);

const resp = await fetch(`http://data.zz.baidu.com/urls?site=${site}&token=${token}`, {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body: urls.join("\n"),
});
console.log(await resp.text());
