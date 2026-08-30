import{c as l,r as a,j as e,S as b}from"./index-DdaMdvmZ.js";import{a as g}from"./client-BU8O36AW.js";import{L as m}from"./loader-circle-ie2egj54.js";import{C as v}from"./copy-CM12ZGQl.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=l("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=l("Languages",[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=l("ListOrdered",[["path",{d:"M10 12h11",key:"6m4ad9"}],["path",{d:"M10 18h11",key:"11hvi2"}],["path",{d:"M10 6h11",key:"c7qv1k"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=l("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",key:"1ykcvy"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=l("SpellCheck2",[["path",{d:"m6 16 6-12 6 12",key:"1b4byz"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M4 21c1.1 0 1.1-1 2.3-1s1.1 1 2.3 1c1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1",key:"8mdmtu"}]]),S=[{id:"translate",label:"翻译成中文",icon:e.jsx(u,{size:16}),target:"中文"},{id:"translate",label:"翻译成英文",icon:e.jsx(u,{size:16}),target:"英文"},{id:"polish",label:"润色",icon:e.jsx(z,{size:16}),target:"中文"},{id:"summarize",label:"总结要点",icon:e.jsx(C,{size:16}),target:"中文"},{id:"proofread",label:"纠错",icon:e.jsx(M,{size:16}),target:"中文"}];async function w(s){try{return await navigator.clipboard.writeText(s),!0}catch{return!1}}function I(){const[s,y]=a.useState(""),[r,f]=a.useState(""),[i,d]=a.useState(!1),[p,c]=a.useState(""),[x,h]=a.useState(!1),k=async(t,n)=>{if(!s.trim()){c("请先输入文本。");return}d(!0),c("");try{const j=await(await g("/tools/ai-text/process",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:t,text:s,target:n})})).json();f(j.result)}catch(o){c(o instanceof Error?o.message:"处理失败。")}finally{d(!1)}};return e.jsxs("section",{className:"flex flex-1 flex-col gap-4 p-5 sm:p-8",children:[e.jsxs("div",{className:"panel flex flex-col gap-4 p-5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"label",htmlFor:"ai-text-input",children:"输入文本"}),e.jsx("textarea",{id:"ai-text-input",className:"field min-h-44 font-mono text-[13px]",value:s,onChange:t=>y(t.target.value),placeholder:"粘贴要翻译、润色、总结或纠错的文本……"})]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:S.map((t,n)=>e.jsxs("button",{className:"btn !from-purple-500 !via-indigo-500 !to-sky-400",onClick:()=>k(t.id,t.target),disabled:i,children:[i?e.jsx(m,{size:16,className:"animate-spin"}):t.icon,t.label]},`${t.label}-${n}`))}),p&&e.jsx("p",{role:"alert",className:"text-sm text-rose-600",children:p})]}),e.jsxs("div",{className:"panel flex flex-col gap-3 p-5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("p",{className:"label mb-0 flex items-center gap-1.5",children:[e.jsx(b,{size:16}),"AI 输出"]}),r&&e.jsxs("button",{className:"inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-purple-300 hover:text-purple-600",onClick:async()=>{await w(r)&&(h(!0),setTimeout(()=>h(!1),1200))},children:[x?e.jsx(N,{size:13,className:"text-emerald-600"}):e.jsx(v,{size:13}),x?"已复制":"复制"]})]}),e.jsx("div",{className:"min-h-40 whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700",children:i?e.jsxs("span",{className:"flex items-center gap-2 text-slate-400",children:[e.jsx(m,{size:16,className:"animate-spin"})," AI 思考中……"]}):r||e.jsx("span",{className:"text-slate-400",children:"输出将显示在这里"})}),e.jsx("p",{className:"text-xs text-slate-400",children:"由 DeepSeek 等大模型生成，密钥保存在服务器端；首次使用前需在 backend/.env 配置 TOOLBOX_AI_API_KEY。"})]})]})}export{I as default};
