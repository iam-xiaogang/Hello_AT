import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ECharts, EChartsCoreOption } from "echarts/core";

echarts.use([MapChart, TooltipComponent, CanvasRenderer]);

export interface ProvinceStat {
  province: string;
  visitors: number;
  visits: number;
}

// ip2region 返回的是简称（内蒙古/广西/新疆/宁夏/香港/澳门/台湾），
// GeoJSON 用的是完整行政名，这里做映射。
const ALIAS_TO_FULL: Record<string, string> = {
  内蒙古: "内蒙古自治区",
  广西: "广西壮族自治区",
  西藏: "西藏自治区",
  宁夏: "宁夏回族自治区",
  新疆: "新疆维吾尔自治区",
  香港: "香港特别行政区",
  澳门: "澳门特别行政区",
  台湾: "台湾省",
};

function toGeoName(name: string): string {
  if (!name) return "";
  if (ALIAS_TO_FULL[name]) return ALIAS_TO_FULL[name];
  if (name.endsWith("省") || name.endsWith("市")) return name;
  return `${name}省`;
}

// 34 个省级行政区用黄金角步进生成互不相同的色相，保证"不同的省份不同的颜色"。
function provinceColor(index: number): string {
  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue}, 70%, 55%)`;
}

let geoPromise: Promise<unknown | null> | null = null;
function loadGeo(): Promise<unknown | null> {
  geoPromise ??= fetch("/maps/china.json")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  return geoPromise;
}

function buildOption(stats: ProvinceStat[]): EChartsCoreOption {
  // 按去重访问者数从多到少排，依次分配不同颜色
  const ranked = [...stats].sort((a, b) => b.visitors - a.visitors);
  const colorByGeo = new Map<string, string>();
  ranked.forEach((p, i) => {
    const geo = toGeoName(p.province);
    if (geo) colorByGeo.set(geo, provinceColor(i));
  });

  return {
    tooltip: {
      trigger: "item",
      formatter: (params: { name?: string }) => {
        const name = params.name ?? "";
        const stat = ranked.find((p) => toGeoName(p.province) === name);
        return stat
          ? `<b>${name}</b><br/>去重访问者 ${stat.visitors} 人 · 共访问 ${stat.visits} 次`
          : `<b>${name}</b><br/>暂无访问记录`;
      },
    },
    series: [
      {
        type: "map",
        map: "china",
        roam: true,
        zoom: 1.15,
        layoutCenter: ["50%", "52%"],
        layoutSize: "95%",
        label: { show: false },
        itemStyle: {
          areaColor: "#ffffff", // 无记录省份 = 白色
          borderColor: "#cbd5e1",
          borderWidth: 0.6,
        },
        emphasis: {
          label: { show: true, color: "#334155", fontWeight: "bold" as const },
          itemStyle: { shadowBlur: 12, shadowColor: "rgba(0, 0, 0, 0.25)" },
        },
        select: { disabled: true },
        data: ranked.map((p, i) => ({
          name: toGeoName(p.province),
          value: p.visitors,
          itemStyle: { areaColor: provinceColor(i) },
        })),
      },
    ],
  };
}

interface ChinaMapProps {
  provinces: ProvinceStat[];
}

export function ChinaMap({ provinces }: ChinaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    loadGeo()
      .then((geo) => {
        if (!geo) {
          setFailed(true);
          return;
        }
        echarts.registerMap("china", geo as Parameters<typeof echarts.registerMap>[1]);
        chart.setOption(buildOption(provinces));
        setReady(true);
      })
      .catch(() => setFailed(true));

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 数据刷新时只更新 option，不重建实例
  useEffect(() => {
    if (chartRef.current && ready) {
      chartRef.current.setOption(buildOption(provinces));
    }
  }, [provinces, ready]);

  return (
    <div className="relative">
      {failed && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">
          中国地图数据加载失败，请稍后刷新重试。
        </div>
      )}
      <div ref={containerRef} className="h-[420px] w-full sm:h-[480px]" />
    </div>
  );
}
