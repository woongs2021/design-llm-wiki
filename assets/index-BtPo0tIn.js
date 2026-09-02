(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();function U(e){return[...e].sort((t,s)=>t.capturedAt!==s.capturedAt?t.capturedAt<s.capturedAt?1:-1:t.slug.localeCompare(s.slug))}function N(e,t){return t.every(s=>e.includes(s))}function Y(e,t){const s=t.trim().toLowerCase();return s?[e.slug,e.title,e.service,e.insight,e.platform,e.screenType,e.tone,e.copyTone,e.body,...e.tags,...e.uiPatterns].join(`
`).toLowerCase().includes(s):!0}function O(e,t){return U(e).filter(s=>!(!Y(s,t.query)||t.platforms.length>0&&!t.platforms.includes(s.platform)||t.screenTypes.length>0&&!t.screenTypes.includes(s.screenType)||t.uiPatterns.length>0&&!N(s.uiPatterns,t.uiPatterns)||t.tags.length>0&&!N(s.tags,t.tags)||t.tones.length>0&&!t.tones.includes(s.tone)))}function w(e,t){e[t]=(e[t]??0)+1}function Q(e,t){const s=O(e,t),a={platform:{},screenType:{},uiPattern:{},tag:{},tone:{}};for(const n of s){w(a.platform,n.platform),w(a.screenType,n.screenType),w(a.tone,n.tone);for(const i of n.uiPatterns)w(a.uiPattern,i);for(const i of n.tags)w(a.tag,i)}return a}const Z=[["layout","레이아웃"],["hierarchy","시각 위계"],["clarity","정보 명확성"],["interaction","인터랙션 단서"],["reuse","재사용성"]];function ee(e){return Math.max(35,Math.min(98,Math.round(e)))}function te(e){let t=0;for(const s of e)t=(t*31+s.charCodeAt(0))%997;return t}function H(e){var l;if((l=e.analysisScores)!=null&&l.length)return e.analysisScores;const t=te(`${e.slug}:${e.title}:${e.insight}`),s=e.tags.includes("density")?7:0,a=e.asset.kind==="motion"?8:0,n=Math.min(12,e.uiPatterns.length*3),i=e.asset.width/Math.max(1,e.asset.height),o=i>1.2?6:0,d=i<.75?5:0,r=[68+n+o+t%9,66+s+(t>>1)%10,64+(e.insight.length>45?8:3)+(t>>2)%9,58+a+(e.uiPatterns.includes("filter-chips")?7:0),62+d+n+(t>>3)%8].map(ee);return Z.map(([u,p],g)=>({key:u,label:p,score:r[g]??60,description:se(p,r[g]??60,e)}))}function G(e){return e.length===0?0:Math.round(e.reduce((t,s)=>t+s.score,0)/e.length)}function se(e,t,s){return e==="레이아웃"?`${s.screenType} 화면 구조와 ${s.uiPatterns.join(", ")} 패턴의 배치 안정성.`:e==="시각 위계"?"대표 정보, 보조 설명, 메타 정보가 얼마나 빠르게 구분되는지의 점수.":e==="정보 명확성"?"카드에 들어갈 타이틀과 간단 내용이 즉시 이해되는 정도.":e==="인터랙션 단서"?s.asset.kind==="motion"?"모션 파일이라 상태 변화 단서를 더 강하게 반영.":"정지 이미지라 실제 hover나 전환은 확인 필요.":t>=75?"다른 캡처나 프롬프트에 재사용하기 좋은 관찰값이 있음.":"재사용하려면 추가 캡처나 비교가 더 있으면 좋음."}function ae(e){return e.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,42)||"local-capture"}function ne(e){return e.replace(/\.[^.]+$/,"").replace(/[-_]+/g," ").replace(/\s+/g," ").trim()||"로컬 캡처"}function ie(e){var s;const t=(s=e.name.split(".").pop())==null?void 0:s.toLowerCase();return t?t==="jpeg"?"jpg":t:e.type.split("/").pop()||"file"}function re(e){const t=e.width/Math.max(1,e.height);return t<.65?"onboarding":t>1.5?"dashboard":"detail"}function oe(e){const t=e.width/Math.max(1,e.height);return t<.75?["onboarding","typography","forms"]:t>1.5?["dashboard","density","navigation"]:["cards","color","typography"]}function ce(e){const t=e.width/Math.max(1,e.height);return t<.75?["hero-band","progress-bar"]:t>1.5?["data-table","tab-row"]:["card-grid","split-view"]}function le(e){return new Promise((t,s)=>{const a=new Image;a.onload=()=>{t({width:a.naturalWidth||1,height:a.naturalHeight||1})},a.onerror=()=>s(new Error("이미지를 읽을 수 없습니다.")),a.src=e})}async function de(e){if(!e.type.startsWith("image/"))throw new Error(`${e.name}: 현재 Intake 데모는 이미지 파일만 분석합니다.`);const t=URL.createObjectURL(e),s=await le(t),a=ie(e),n=`local-${Date.now()}-${ae(e.name)}`,i=ne(e.name),o=re(s),d=oe(s),r=ce(s),l=s.width/Math.max(1,s.height),u=l<.75?"모바일 세로형":l>1.5?"와이드 업무형":"균형형",p={slug:n,title:i,visibility:"internal",capturedAt:new Date().toISOString().slice(0,10),sourceUrl:null,service:"Local Intake",platform:l<.75?"web-mobile":"web",screenType:o,uiPatterns:r,tone:l>1.5?"data-dense":"informational",copyTone:"neutral",tags:d,insight:`${u} 캡처로, 대표 이미지와 기본 메타를 바탕으로 빠른 리뷰용 카드가 생성됨.`,appVersion:null,body:`## Layout

로컬 업로드 파일의 비율과 크기를 기준으로 ${u} 화면으로 분류했다. 실제 컴포넌트 의미는 사용자가 상세 분석에서 보정해야 한다.

## Color

브라우저에서는 이미지 픽셀을 LLM으로 해석하지 않는다. 현재 색상 판단은 데모용이며, 실제 컬러 역할은 사람이 확인해야 한다.

## Typography

텍스트 영역은 파일만으로 확정하지 않는다. 제목·본문·캡션의 위계는 상세 화면에서 육안으로 확인한다.

## Interaction

정지 이미지 기준 분석이다. hover, 전환, 상태 변화는 추가 모션 캡처가 있을 때만 확정한다.`,asset:{path:t,originalName:e.name,format:a,kind:"still",width:s.width,height:s.height,bytes:e.size,hash:`local-${e.name}-${e.size}-${e.lastModified}`,frameCount:null,durationSec:null,posterPath:null},localOnly:!0},g=H(p);return p.analysisScores=g,p.analysisTotal=G(g),p}const J="design-llm-wiki-pins";function T(){try{const e=localStorage.getItem(J);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(s=>typeof s=="string"):[]}catch{return[]}}function ue(e){const t=[...new Set(e)];localStorage.setItem(J,JSON.stringify(t))}function W(e){const t=T(),s=t.includes(e)?t.filter(a=>a!==e):[...t,e];return ue(s),T()}const pe="[a-z0-9]+(?:-[a-z0-9]+)*";function q(e=window.location.hash){const t=e.replace(/^#/,""),s=t.startsWith("/")?t:`/${t}`,a=s==="/"||s===""?"/":s.replace(/\/+$/,"");if(a==="/"||a==="/gallery")return{name:"archive"};if(a==="/stats")return{name:"stats"};if(a==="/design-system")return{name:"designSystem"};if(a==="/intake")return{name:"intake"};if(a==="/history")return{name:"history"};const n=a.match(new RegExp(`^/capture/(${pe})$`));return n?{name:"capture",slug:n[1]}:{name:"notfound",path:a}}function m(e){switch(e.name){case"archive":return"#/";case"capture":return`#/capture/${e.slug}`;case"stats":return"#/stats";case"designSystem":return"#/design-system";case"intake":return"#/intake";case"history":return"#/history";case"notfound":return`#${e.path}`}}function he(e){const t=()=>e(q());return window.addEventListener("hashchange",t),e(q()),()=>window.removeEventListener("hashchange",t)}function c(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function M(e){return e.startsWith("./")||e.startsWith("/")||e.startsWith("blob:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")?e:`./${e}`}const K=[{dim:"platform",field:"platforms",label:"Platform"},{dim:"screenType",field:"screenTypes",label:"Screen type"},{dim:"uiPattern",field:"uiPatterns",label:"UI pattern"},{dim:"tone",field:"tones",label:"Tone"},{dim:"tag",field:"tags",label:"Tags"}];function ge(e){return Object.entries(e).sort((t,s)=>t[1]!==s[1]?s[1]-t[1]:t[0].localeCompare(s[0]))}function fe(e){return K.reduce((t,{field:s})=>t+e[s].length,0)}function me(e,t,s){const a=e[t],n=a.includes(s)?a.filter(i=>i!==s):[...a,s];return{...e,[t]:n}}function ve(e,t){const s=K.map(({dim:i,field:o,label:d})=>{const r=ge(e.facets[i]);if(r.length===0)return"";const l=r.map(([u,p])=>{const g=t[o].includes(u);return`
          <button type="button" class="chip" data-facet-field="${o}" data-facet-value="${c(u)}" aria-pressed="${g?"true":"false"}">
            ${c(u)} <span class="chip__count">${p}</span>
          </button>`}).join("");return`
      <div class="facet-group">
        <h2 class="facet-group__title">${d}</h2>
        <div class="facet-group__chips">${l}</div>
      </div>
    `}).join(""),a=fe(t),n=a>0?`<button type="button" class="button button--secondary" id="archive-clear-facets">Clear filters (${a})</button>`:"";return`
    <details class="archive-filter-panel" ${a>0?"open":""}>
      <summary class="archive-filter-panel__summary">
        Filters${a>0?` (${a} active)`:""}
      </summary>
      <div class="archive-filter-panel__body">
        ${n}${s}
      </div>
    </details>
  `}let A=null;function ye(e){const t=e.querySelector(".archive-tabs__indicator"),s=e.querySelector('.archive-tab[aria-selected="true"]');if(!t||!s)return;const a=s.offsetLeft,n=s.offsetWidth;A&&(t.style.transition="none",t.style.transform=`translateX(${A.left}px)`,t.style.width=`${A.width}px`,t.offsetWidth,t.style.transition=""),requestAnimationFrame(()=>{t.style.transform=`translateX(${a}px)`,t.style.width=`${n}px`,A={left:a,width:n}})}function C(e){const t=e.querySelector(".capture-grid");if(!t)return;const s=window.getComputedStyle(t),a=Number.parseFloat(s.gridAutoRows)||1,n=Number.parseFloat(s.rowGap)||0;t.querySelectorAll(".capture-card").forEach(i=>{i.style.gridRowEnd="";const o=i.getBoundingClientRect().height,d=Number.parseFloat(window.getComputedStyle(i).marginBottom)||0,r=Math.ceil((o+d+n)/(a+n));i.style.gridRowEnd=`span ${Math.max(1,r)}`})}function _e(e){const t=e.asset.kind==="motion"&&e.asset.posterPath?e.asset.posterPath:e.asset.path;return`<img class="capture-card__media" src="${c(M(t))}" alt="" loading="lazy" width="${e.asset.width}" height="${e.asset.height}" />`}function $e(e,t){return`
    <article class="capture-card${t?" capture-card--pinned":""}">
      <a class="capture-card__link" href="${m({name:"capture",slug:e.slug})}">
        <div class="capture-card__frame">
          ${_e(e)}
          <span class="capture-card__kind">${c(e.asset.kind)}</span>
          ${t?'<span class="capture-card__pin-badge">Pinned</span>':""}
        </div>
        <div class="capture-card__body">
          <h2 class="capture-card__title">${c(e.title)}</h2>
          <p class="capture-card__insight">${c(e.insight)}</p>
        </div>
      </a>
    </article>
  `}function be(e,t){const s=new Set(t),a=U(e),n=a.filter(l=>s.has(l.slug)),i=a.filter(l=>!s.has(l.slug)),o=new Map(a.map(l=>[l.slug,l])),d=t.map(l=>o.get(l)).filter(l=>!!l),r=n.filter(l=>!t.includes(l.slug));return[...d,...r,...i]}function we(e,t,s,a){const n=O(e.captures,t),i=new Set(s),o=a==="pin"?n.filter(r=>i.has(r.slug)):n,d=be(o,s);return e.captures.length===0?`
      <section class="state-panel state-panel--soft" aria-live="polite">
        <h1 class="state-panel__title">Archive is empty</h1>
        <p class="state-panel__text">이 번들에 캡처가 없습니다. <a href="#/intake">Intake</a>에서 넣는 방법을 확인하세요.</p>
      </section>
    `:`
    <section class="gallery archive">
      <header class="gallery__header archive__header">
        <div>
          <h1 class="gallery__title">Archive</h1>
          <p class="gallery__meta">Target ${c(e.target)} · ${d.length} of ${e.captures.length} · ${s.length} pinned</p>
        </div>
      </header>

      <div class="archive-search-panel">
        <label class="search-field archive-search">
          <span class="search-field__label">Search archive</span>
          <input id="archive-search" class="search-field__input archive-search__input" type="search" value="${c(t.query)}" placeholder="타이틀, 서비스, 태그, 패턴, 인사이트 검색…" />
          ${t.query?'<button type="button" class="archive-search__clear" id="archive-search-clear" aria-label="검색어 지우기">×</button>':""}
        </label>
      </div>

      <div class="archive-filter-wrap">
        <div class="gallery__filters" aria-label="Facet filters">
          ${ve(e,t)}
        </div>
      </div>

      <div class="archive-tabs" role="tablist" aria-label="Archive lists">
        <span class="archive-tabs__indicator" aria-hidden="true"></span>
        <button type="button" class="archive-tab" role="tab" id="archive-tab-all" data-archive-tab="all" aria-selected="${a==="all"?"true":"false"}">
          All <span class="archive-tab__count">${n.length}</span>
        </button>
        <button type="button" class="archive-tab" role="tab" id="archive-tab-pin" data-archive-tab="pin" aria-selected="${a==="pin"?"true":"false"}">
          Pin <span class="archive-tab__count">${s.length}</span>
        </button>
      </div>

      <div class="gallery__results archive__results" aria-live="polite">
        ${d.length===0?`<section class="state-panel state-panel--tint">
                <h2 class="state-panel__title">${a==="pin"?"No pinned captures":"No matches"}</h2>
                <p class="state-panel__text">${a==="pin"?"상세 화면에서 Pin을 누르면 이 탭에 모입니다.":"검색어나 필터를 지우거나 더 넓은 조건으로 다시 시도하세요."}</p>
              </section>`:`<div class="capture-grid">${d.map(r=>$e(r,s.includes(r.slug))).join("")}</div>`}
      </div>
    </section>
  `}function Se(e,t,s){var o,d;const a=e.querySelector("#archive-search");a==null||a.addEventListener("input",()=>{s.onFilterChange({...t,query:a.value})}),a==null||a.addEventListener("keydown",r=>{r.key==="Escape"&&(r.preventDefault(),s.onClearFilters())}),(o=e.querySelector("#archive-search-clear"))==null||o.addEventListener("click",()=>{s.onClearFilters()}),(d=e.querySelector("#archive-clear-facets"))==null||d.addEventListener("click",()=>s.onClearFilters()),e.querySelectorAll("[data-facet-field]").forEach(r=>{r.addEventListener("click",()=>{const l=r.dataset.facetField,u=r.dataset.facetValue;!l||u===void 0||s.onFilterChange(me(t,l,u))})}),e.querySelectorAll("[data-archive-tab]").forEach(r=>{r.addEventListener("click",()=>{const l=r.dataset.archiveTab;(l==="all"||l==="pin")&&s.onTabChange(l)})}),ye(e),requestAnimationFrame(()=>C(e)),e.querySelectorAll(".capture-card__media").forEach(r=>{r.addEventListener("load",()=>C(e),{once:!0})});const n=new ResizeObserver(()=>C(e)),i=e.querySelector(".capture-grid");i&&n.observe(i)}function ke(e){const t=e.replace(/\r\n/g,`
`).split(`
`),s=[];let a=!1;const n=()=>{a&&(s.push("</ul>"),a=!1)};for(const i of t){const o=i.trim();if(!o){n();continue}if(o.startsWith("### ")){n(),s.push(`<h3>${S(o.slice(4))}</h3>`);continue}if(o.startsWith("## ")){n(),s.push(`<h2>${S(o.slice(3))}</h2>`);continue}if(o.startsWith("# ")){n(),s.push(`<h1>${S(o.slice(2))}</h1>`);continue}if(o.startsWith("- ")){a||(s.push("<ul>"),a=!0),s.push(`<li>${S(o.slice(2))}</li>`);continue}n(),s.push(`<p>${S(o)}</p>`)}return n(),s.join(`
`)}function S(e){let t=c(e);return t=t.replace(/\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/g,(s,a)=>`<a href="${m({name:"capture",slug:a})}">${a}</a>`),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(s,a,n)=>n.endsWith(".md")&&!n.includes("://")?`<span>${a}</span>`:`<a href="${c(n)}">${a}</a>`),t}function xe(e,t){const s=new Set(e.tags),a=new Set(e.uiPatterns);return t.filter(n=>n.slug!==e.slug).map(n=>{const i=n.tags.filter(r=>s.has(r)).sort(),o=n.uiPatterns.filter(r=>a.has(r)).sort(),d=i.length*2+o.length;return{slug:n.slug,score:d,sharedTags:i,sharedPatterns:o}}).filter(n=>n.score>0).sort((n,i)=>n.score!==i.score?i.score-n.score:n.slug.localeCompare(i.slug))}function Pe(e,t,s=6){return xe(e,t).slice(0,s).map(a=>a.slug)}function Ae(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(2)} MB`}function Me(e){return e.asset.kind==="motion"?`
      <video class="detail-media" controls preload="metadata"${e.asset.posterPath?` poster="${c(M(e.asset.posterPath))}"`:""}>
        <source src="${c(M(e.asset.path))}" />
      </video>
    `:`
    <img
      class="detail-media"
      src="${c(M(e.asset.path))}"
      alt=""
      width="${e.asset.width}"
      height="${e.asset.height}"
    />
  `}function Le(e){const t=H(e),s=e.analysisTotal??G(t),a=160,n=110,i=[.25,.5,.75,1].map(r=>t.map((l,u)=>{const p=-Math.PI/2+u*Math.PI*2/t.length,g=a+Math.cos(p)*n*r,b=a+Math.sin(p)*n*r;return`${g.toFixed(1)},${b.toFixed(1)}`}).join(" ")).map(r=>`<polygon class="spider-grid" points="${r}" />`).join(""),o=t.map((r,l)=>{const u=-Math.PI/2+l*Math.PI*2/t.length,p=n*(r.score/100),g=a+Math.cos(u)*p,b=a+Math.sin(u)*p;return`${g.toFixed(1)},${b.toFixed(1)}`}).join(" "),d=t.map((r,l)=>{const u=-Math.PI/2+l*Math.PI*2/t.length,p=a+Math.cos(u)*n,g=a+Math.sin(u)*n,b=a+Math.cos(u)*n*(r.score/100),X=a+Math.sin(u)*n*(r.score/100),z=a+Math.cos(u)*(n+26),B=a+Math.sin(u)*(n+26);return`
        <g class="spider-axis" tabindex="0">
          <line class="spider-axis__line" x1="${a}" y1="${a}" x2="${p.toFixed(1)}" y2="${g.toFixed(1)}" />
          <circle class="spider-point" cx="${b.toFixed(1)}" cy="${X.toFixed(1)}" r="6" />
          <text class="spider-label" x="${z.toFixed(1)}" y="${B.toFixed(1)}">${c(r.label)}</text>
          <text class="spider-callout" x="${z.toFixed(1)}" y="${(B+18).toFixed(1)}">${r.score}</text>
        </g>
      `}).join("");return`
    <section class="detail__section analysis-score">
      <div class="analysis-score__summary">
        <p class="detail__eyebrow">Image analysis score</p>
        <h2>총합 점수 ${s}</h2>
        <p class="detail__empty">항목 위에 마우스를 올리거나 키보드 포커스를 주면 해당 점수가 강조됩니다.</p>
      </div>
      <div class="spider-layout">
        <svg class="spider-chart" viewBox="0 0 320 320" role="img" aria-label="이미지 분석 스파이더 다이어그램">
          ${i}
          <polygon class="spider-area" points="${o}" />
          ${d}
        </svg>
        <dl class="score-list">
          ${t.map(r=>`
            <div class="score-list__item">
              <dt>${c(r.label)} <strong>${r.score}</strong></dt>
              <dd>${c(r.description)}</dd>
            </div>
          `).join("")}
        </dl>
      </div>
    </section>
  `}function Te(e){const t=[...e.tags,...e.uiPatterns,e.screenType,e.platform,e.tone,e.copyTone];return[...new Set(t)].map(s=>`<span class="chip detail-hashtag" aria-pressed="true">#${c(s)}</span>`).join("")}function Fe(e,t,s){const a=e.captures.find(o=>o.slug===t);if(!a)return`
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">Capture not found</h1>
        <p class="state-panel__text">${c(t)} is not in this bundle.</p>
        <p><a class="button button--secondary" href="#/">Back to Archive</a></p>
      </section>
    `;const n=Pe(a,e.captures).map(o=>e.captures.find(d=>d.slug===o)).filter(o=>!!o),i=s.includes(t);return`
    <article class="detail">
      <header class="detail__header">
        <div>
          <p class="detail__eyebrow">${c(a.service)} · ${c(a.platform)}</p>
          <h1 class="detail__title">${c(a.title)}</h1>
          <p class="detail__insight">${c(a.insight)}</p>
        </div>
        <div class="detail__actions">
          <button type="button" class="button button--secondary" data-pin-slug="${c(t)}" aria-pressed="${i?"true":"false"}">
            ${i?"Unpin":"Pin"}
          </button>
          <a class="button button--secondary" href="#/">Archive</a>
        </div>
      </header>

      <div class="detail__media-wrap detail__hero">${Me(a)}</div>

      ${Le(a)}

      <section class="detail__section">
        <h2>Derived asset meta</h2>
        <dl class="meta-grid">
          <div><dt>Format</dt><dd>${c(a.asset.format)}</dd></div>
          <div><dt>Kind</dt><dd>${c(a.asset.kind)}</dd></div>
          <div><dt>Dimensions</dt><dd>${a.asset.width} × ${a.asset.height}</dd></div>
          <div><dt>Bytes</dt><dd>${Ae(a.asset.bytes)}</dd></div>
          <div><dt>Frame count</dt><dd>${a.asset.frameCount??"—"}</dd></div>
          <div><dt>Duration</dt><dd>${a.asset.durationSec??"—"}</dd></div>
          <div class="meta-grid__wide"><dt>Hash</dt><dd><code>${c(a.asset.hash)}</code></dd></div>
        </dl>
      </section>

      <section class="detail__section">
        <h2>Hashtags</h2>
        <p class="detail__chips">
          ${Te(a)}
        </p>
        <p class="detail__meta-line">
          ${c(a.screenType)} · ${c(a.tone)} · ${c(a.copyTone)} · ${c(a.capturedAt)}
          ${a.sourceUrl?` · <a href="${c(a.sourceUrl)}">${c(a.sourceUrl)}</a>`:""}
        </p>
      </section>

      <section class="detail__section prose">
        <h2>Analysis</h2>
        ${ke(a.body)}
      </section>

      <section class="detail__section">
        <h2>Related captures</h2>
        ${n.length===0?'<p class="detail__empty">No related captures with shared tags or UI patterns.</p>':`<div class="link-list">${n.map(o=>`
              <a class="link-card" href="${m({name:"capture",slug:o.slug})}">
                <strong>${c(o.title)}</strong>
                <span>${c(o.insight)}</span>
              </a>`).join("")}</div>`}
      </section>
    </article>
  `}function Ce(e,t){var s;(s=e.querySelector("[data-pin-slug]"))==null||s.addEventListener("click",a=>{const n=a.currentTarget.dataset.pinSlug;n&&t(n)})}function Ee(e,t,s,a){const n=O(e.captures,t);return s!=="pin"?n:n.filter(i=>a.includes(i.slug))}function qe(e,t){const s=[`tab=${t}`];return e.query.trim()&&s.push(`query=${e.query.trim()}`),e.platforms.length&&s.push(`platform=${e.platforms.join(",")}`),e.screenTypes.length&&s.push(`screenType=${e.screenTypes.join(",")}`),e.uiPatterns.length&&s.push(`uiPattern=${e.uiPatterns.join(",")}`),e.tags.length&&s.push(`tag=${e.tags.join(",")}`),e.tones.length&&s.push(`tone=${e.tones.join(",")}`),s}function Ie(e,t){var n;const s=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),a=e.match(new RegExp(`## ${s}\\n\\n([\\s\\S]*?)(?=\\n## |$)`,"i"));return((n=a==null?void 0:a[1])==null?void 0:n.trim())??null}function E(e,t){const s=e.map(a=>{const n=Ie(a.body,t);if(!n)return null;const i=n.length>110?`${n.slice(0,110).trim()}…`:n;return`<li><strong>${c(a.slug)}</strong><span>${c(i)}</span></li>`}).filter(a=>a!==null).slice(0,3);return s.length===0?"<p>대상 없음</p>":`<ul class="ds-builder__evidence-list">${s.join("")}</ul>`}function je(e){const t=e.flatMap(s=>s.uiPatterns).filter((s,a,n)=>n.indexOf(s)===a).slice(0,5);return t.length===0?"<p>대상 없음</p>":`<div class="ds-builder__chips">${t.map(s=>`<span class="chip">${c(s)}</span>`).join("")}</div>`}function Oe(e){return e.map(t=>t.slug).join(" ")}function ze(e,t,s,a){const n=Ee(e,t,s,a),i=Oe(n),o=t.tags[0]??t.uiPatterns[0]??"archive-selection",d=n.length>0?`npm run design-system -- --name ${o} --slugs ${i}`:"Archive에서 대상 캡처를 먼저 선택하세요.";return`
    <section class="ds-builder">
      <header class="ds-builder__hero">
        <span class="coming-soon__badge">준비중</span>
        <h1 class="coming-soon__title">Design System</h1>
        <p class="coming-soon__text">아직 준비중입니다.</p>
        <p class="coming-soon__sub">현재 Archive 조건의 분석 결과를 근거로 <code>design-system.md</code>와 토큰 초안을 만드는 페이지입니다.</p>
      </header>

      <section class="ds-builder__panel" aria-labelledby="ds-selection-title">
        <div>
          <h2 id="ds-selection-title">대상 캡처</h2>
          <p>${n.length}개 캡처가 현재 Archive 조건에 포함됩니다.</p>
        </div>
        <div class="ds-builder__chips" aria-label="현재 조건">
          ${qe(t,s).map(r=>`<span class="chip">${c(r)}</span>`).join("")}
        </div>
      </section>

      <section class="ds-builder__grid" aria-label="대상 요약">
        <div class="ds-builder__card">
          <h2>컬러</h2>
          <div class="ds-builder__metric-list">${E(n,"Color")}</div>
        </div>
        <div class="ds-builder__card">
          <h2>폰트 / 타이포</h2>
          <div class="ds-builder__metric-list">${E(n,"Typography")}</div>
        </div>
        <div class="ds-builder__card">
          <h2>마진 / 간격</h2>
          <div class="ds-builder__metric-list">${E(n,"Layout")}</div>
        </div>
        <div class="ds-builder__card">
          <h2>컴포넌트 형태</h2>
          <div class="ds-builder__metric-list">${je(n)}</div>
        </div>
      </section>

      <section class="ds-builder__panel ds-builder__panel--command" aria-labelledby="ds-command-title">
        <div>
          <h2 id="ds-command-title">로컬 생성 명령</h2>
          <p>LLM 키는 브라우저에 두지 않습니다. 아래 명령을 터미널에서 실행하면 <code>obsidian/design-systems/&lt;name&gt;/</code>에 초안이 생성됩니다.</p>
        </div>
        <pre class="ds-builder__command"><code>${c(d)}</code></pre>
      </section>
    </section>
  `}function Be(e){const t=e.wiki.logEntries;return t.length===0?`
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">History</h1>
        <p class="state-panel__text">아직 로그가 없습니다. ingest / query / lint 후 <code>obsidian/wiki/log.md</code>에 쌓이면 여기에 표시됩니다.</p>
      </section>
    `:`
    <section class="page history">
      <header class="page__header">
        <div>
          <h1 class="page__title">History</h1>
          <p class="page__meta">Obsidian wiki 로그의 작업 이력 · ${t.length} entries · target ${c(e.target)}</p>
        </div>
      </header>

      <ol class="history-timeline">
        ${t.map(s=>`
          <li class="history-item">
            <time class="history-item__date" datetime="${c(s.date)}">${c(s.date)}</time>
            <span class="history-item__op">${c(s.operation)}</span>
            <strong class="history-item__title">${c(s.title)}</strong>
          </li>`).join("")}
      </ol>
    </section>
  `}function Ne(e=""){return`
    <section class="page intake">
      <header class="page__header">
        <div>
          <h1 class="page__title">Intake</h1>
          <p class="page__meta">로컬호스트에서 캡처 이미지를 드래그앤드롭하고 분석하면 Archive에 카드가 추가됩니다. 이 데모 분석은 브라우저 메모리에만 남습니다.</p>
        </div>
      </header>

      <div class="intake-dropzone" id="intake-dropzone">
        <input id="intake-file" class="intake-dropzone__input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
        <div class="intake-dropzone__content">
          <h2 class="intake-dropzone__title">이미지를 여기에 드롭</h2>
          <p class="intake-dropzone__text">PNG, JPG, WebP, GIF를 지원합니다. 파일은 서버로 업로드되지 않고 현재 브라우저 세션에서만 분석됩니다.</p>
          <label class="button" for="intake-file">Choose files</label>
        </div>
      </div>

      <div class="intake-actions">
        <button type="button" class="button" id="analyze-files" disabled>Analyze</button>
        <p class="intake-status" id="intake-status" aria-live="polite">${c(e||"파일을 선택하면 Analyze 버튼이 활성화됩니다.")}</p>
      </div>

      <section class="detail__section">
        <h2>동작 방식</h2>
        <ul class="plain-list">
          <li>브라우저에 LLM API 키를 두지 않습니다.</li>
          <li>분석은 파일명, 이미지 크기, 비율, 형식에서 만든 로컬 데모 분석입니다.</li>
          <li>Analyze 후 Archive에 카드가 추가되고, 카드를 클릭하면 hero 이미지와 스파이더 다이어그램이 보입니다.</li>
          <li>영구 보존하려면 기존처럼 Obsidian vault에 캡처를 넣고 ingest/build를 실행합니다.</li>
        </ul>
      </section>
    </section>
  `}function We(e,t){const s=e.querySelector("#intake-file"),a=e.querySelector("#intake-dropzone"),n=e.querySelector("#analyze-files"),i=e.querySelector("#intake-status");let o=[];const d=r=>{o=r.filter(l=>l.type.startsWith("image/")),n&&(n.disabled=o.length===0),i&&(i.textContent=o.length===0?"분석 가능한 이미지 파일이 없습니다.":`${o.length}개 파일 준비됨. Analyze를 누르면 Archive에 카드가 추가됩니다.`)};s==null||s.addEventListener("change",()=>{d(Array.from(s.files??[]))}),a==null||a.addEventListener("dragover",r=>{r.preventDefault(),a.classList.add("intake-dropzone--active")}),a==null||a.addEventListener("dragleave",()=>{a.classList.remove("intake-dropzone--active")}),a==null||a.addEventListener("drop",r=>{var l;r.preventDefault(),a.classList.remove("intake-dropzone--active"),d(Array.from(((l=r.dataTransfer)==null?void 0:l.files)??[]))}),n==null||n.addEventListener("click",()=>{o.length!==0&&t.onAnalyzeFiles(o)})}function De(e){return`
    <section class="state-panel state-panel--tint">
      <h1 class="state-panel__title">Route not found</h1>
      <p class="state-panel__text">No page for <code>${c(e)}</code>.</p>
      <p><a class="button button--secondary" href="#/">Back to gallery</a></p>
    </section>
  `}function k(e){return Object.entries(e).map(([t,s])=>({key:t,count:s})).sort((t,s)=>t.count!==s.count?s.count-t.count:t.key.localeCompare(s.key))}function _(e,t){e[t]=(e[t]??0)+1}function Re(e){const t={},s={},a={},n={},i={},o={};for(const d of e){_(t,d.visibility),_(s,d.platform),_(a,d.screenType),_(o,d.capturedAt);for(const r of d.uiPatterns)_(n,r);for(const r of d.tags)_(i,r)}return{total:e.length,visibility:k(t),platform:k(s),screenType:k(a),uiPattern:k(n),tag:k(i),timeline:Object.entries(o).map(([d,r])=>({key:d,count:r})).sort((d,r)=>d.key.localeCompare(r.key))}}function Ue(e){const t=e.reduce((s,a)=>Math.max(s,a.count),0)||1;return`
    <div class="stat-rows">
      ${e.map(s=>`
        <div class="stat-row">
          <span class="stat-row__label">${c(s.key)}</span>
          <span class="stat-row__track"><span class="stat-row__fill" style="width: ${(s.count/t*100).toFixed(1)}%"></span></span>
          <span class="stat-row__count">${s.count}</span>
        </div>`).join("")}
    </div>
  `}function $(e,t){return t.length===0?"":`
    <section class="detail__section">
      <h2>${c(e)}</h2>
      ${Ue(t)}
    </section>
  `}function He(e){const t=Re(e.captures);if(t.total===0)return`
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">No stats yet</h1>
        <p class="state-panel__text">이 번들에 캡처가 없어 통계를 계산할 수 없습니다.</p>
      </section>
    `;const s=t.platform.length,a=t.uiPattern.length;return`
    <section class="page stats">
      <header class="page__header">
        <div>
          <h1 class="page__title">Stats</h1>
          <p class="page__meta">현재 번들 JSON에서 파생 · target ${c(e.target)}</p>
        </div>
      </header>

      <div class="stat-tiles">
        <div class="stat-tile stat-tile--deep">
          <div class="stat-tile__value">${t.total}</div>
          <div class="stat-tile__label">Captures</div>
        </div>
        <div class="stat-tile stat-tile--soft">
          <div class="stat-tile__value">${s}</div>
          <div class="stat-tile__label">Platforms</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__value">${a}</div>
          <div class="stat-tile__label">UI patterns</div>
        </div>
      </div>

      ${$("Visibility",t.visibility)}
      ${$("Platform",t.platform)}
      ${$("Screen type",t.screenType)}
      ${$("UI pattern",t.uiPattern)}
      ${$("Tags",t.tag)}
      ${$("Timeline (capturedAt)",t.timeline)}
    </section>
  `}const V="design-llm-wiki-mode",D="./data/index.json";let v={status:"loading"},P={query:"",platforms:[],screenTypes:[],uiPatterns:[],tags:[],tones:[]},y=T(),I="all",F=[],L="",h=q();function j(){return localStorage.getItem(V)==="dark"?"dark":"light"}function R(e){document.documentElement.dataset.theme="cool",document.documentElement.dataset.mode=e,localStorage.setItem(V,e)}function x(e,t,s){return`<a class="nav-link${s?" nav-link--current":""}" href="${t}" ${s?'aria-current="page"':""}>${e}</a>`}function Ge(e){return e==="dark"?`
      <svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v3M12 18.5v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2.5 12h3M18.5 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    `:`
    <svg class="mode-icon mode-icon--moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z" />
    </svg>
  `}function Je(e){const t=j(),s=t==="dark"?"라이트 모드로 전환":"다크 모드로 전환";return`
    <header class="top-nav">
      <a class="wordmark" href="#/">Design LLM Wiki</a>
      <nav class="nav-menu" aria-label="Primary">
        ${x("Archive",m({name:"archive"}),h.name==="archive"||h.name==="capture")}
        ${x("Intake",m({name:"intake"}),h.name==="intake")}
        ${x("Design System",m({name:"designSystem"}),h.name==="designSystem")}
        ${x("Stats",m({name:"stats"}),h.name==="stats")}
        ${x("History",m({name:"history"}),h.name==="history")}
      </nav>
      <div class="nav-actions">
        <button type="button" class="button button--secondary" id="mode-toggle" aria-label="${s}" title="${s}">
          ${Ge(t)}
        </button>
      </div>
    </header>
    <main class="shell" id="main">${e}</main>
  `}function Ke(e){const t=[...F,...e.captures];return{...e,target:F.length>0?`${e.target}+local`:e.target,captures:t,facets:Q(t,{query:"",platforms:[],screenTypes:[],uiPatterns:[],tags:[],tones:[]})}}function Ve(){if(v.status==="loading")return`
      <section class="state-panel state-panel--canvas" aria-busy="true">
        <h1 class="state-panel__title">Loading index</h1>
        <p class="state-panel__text">Reading build JSON. Markdown is never fetched by the browser.</p>
      </section>
    `;if(v.status==="error")return`
      <section class="state-panel state-panel--soft" role="alert">
        <h1 class="state-panel__title">Index failed to load</h1>
        <p class="state-panel__text">${v.message}</p>
        <p class="state-panel__text">Run <code>npm run build -- --target=internal</code> before <code>npm run dev</code>.</p>
      </section>
    `;const e=Ke(v.index);switch(h.name){case"archive":return we(e,P,y,I);case"capture":return Fe(e,h.slug,y);case"stats":return He(e);case"designSystem":return ze(e,P,I,y);case"intake":return Ne(L);case"history":return Be(e);case"notfound":return De(h.path)}}function f(){var t;const e=document.querySelector("#app");if(!e)throw new Error("#app not found");R(j()),y=T(),e.innerHTML=Je(Ve()),(t=e.querySelector("#mode-toggle"))==null||t.addEventListener("click",()=>{R(j()==="dark"?"light":"dark"),f()}),v.status==="ready"&&(h.name==="archive"&&Se(e,P,{onFilterChange:s=>{const a=document.activeElement,n=(a==null?void 0:a.id)==="archive-search"?"search":null;if(P=s,f(),n==="search"){const i=document.querySelector("#archive-search");i==null||i.focus();const o=(i==null?void 0:i.value.length)??0;i==null||i.setSelectionRange(o,o)}},onClearFilters:()=>{var s;P={query:"",platforms:[],screenTypes:[],uiPatterns:[],tags:[],tones:[]},f(),(s=document.querySelector("#archive-search"))==null||s.focus()},onTabChange:s=>{var a;I=s,f(),(a=document.querySelector(`[data-archive-tab="${s}"]`))==null||a.focus()}}),h.name==="capture"&&Ce(e,s=>{y=W(s),f()}),h.name==="intake"&&We(e,{onAnalyzeFiles:s=>{(async()=>{L=`${s.length}개 파일 분석 중...`,f();try{const a=await Promise.all(s.map(de));F=[...a,...F],y=a.reduce((n,i)=>n.includes(i.slug)?n:W(i.slug),y),L=`${a.length}개 카드가 Archive에 추가되었습니다.`,window.location.hash=m({name:"archive"}).replace(/^#/,""),h={name:"archive"},f()}catch(a){L=a instanceof Error?a.message:String(a),f()}})()}}))}async function Xe(){v={status:"loading"},f();try{const e=await fetch(D,{cache:"no-store"});if(!e.ok)throw new Error(`${D} → HTTP ${e.status}`);const t=await e.json();if(!t||!Array.isArray(t.captures)||!t.facets)throw new Error("Index JSON is missing captures or facets");v={status:"ready",index:t}}catch(e){v={status:"error",message:e instanceof Error?e.message:String(e)}}f()}he(e=>{h=e,f()});Xe();
