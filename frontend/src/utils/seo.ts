import { useEffect } from "react";

/** 站点地址：部署域名（可用 VITE_SITE_BASE 覆盖） */
export const SITE_BASE = (import.meta.env.VITE_SITE_BASE as string | undefined) || "https://www.xiaogangai.site";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertJsonLd(id: string, obj: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

/**
 * 按页面动态设置 SEO 标签（title / description / OG / JSON-LD）。
 * 在 AppLayout 中随路由调用，让每个工具页都有独立的可收录信息。
 */
export function useSeo(title: string, description: string, path: string) {
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index,follow");

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", `${SITE_BASE}${path}`);
    upsertMeta("property", "og:site_name", "Toolbox");
    upsertMeta("name", "twitter:card", "summary");

    upsertJsonLd("seo-webapp", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: title,
      url: `${SITE_BASE}${path}`,
      description,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      inLanguage: "zh-CN",
    });
  }, [title, description, path]);
}
