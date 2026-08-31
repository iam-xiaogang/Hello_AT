/**
 * 构建前自动生成 public/sitemap.xml：
 * 扫描 src/tools 下各工具目录 meta.ts 中的 path 字段，加上首页，写入 sitemap。
 * 部署域名可用环境变量 SITE_DOMAIN 覆盖（默认 https://www.xiaogangai.site）。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const toolsDir = fileURLToPath(new URL("../src/tools/", import.meta.url));
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const domain = (process.env.SITE_DOMAIN || "https://www.xiaogangai.site").replace(/\/+$/, "");

const dirs = readdirSync(toolsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
const paths = [];
for (const d of dirs) {
  try {
    const src = readFileSync(join(toolsDir, d.name, "meta.ts"), "utf8");
    const m = src.match(/path:\s*"([^"]+)"/);
    if (m) paths.push(m[1]);
  } catch {
    /* 该目录没有 meta.ts，跳过 */
  }
}
paths.sort();

const urls = ["/", ...paths];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((p) => `  <url><loc>${domain}${p}</loc></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(publicDir, "sitemap.xml"), xml);
console.log(`sitemap.xml 已生成：${urls.length} 个 URL（${domain}）`);
