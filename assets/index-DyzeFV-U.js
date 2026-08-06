(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();function B(e){return[...e].sort((t,a)=>t.capturedAt!==a.capturedAt?t.capturedAt<a.capturedAt?1:-1:t.slug.localeCompare(a.slug))}function q(e,t){return t.every(a=>e.includes(a))}function G(e,t){const a=t.trim().toLowerCase();return a?[e.slug,e.title,e.service,e.insight,e.platform,e.screenType,e.tone,e.copyTone,e.body,...e.tags,...e.uiPatterns].join(`
`).toLowerCase().includes(a):!0}function j(e,t){return B(e).filter(a=>!(!G(a,t.query)||t.platforms.length>0&&!t.platforms.includes(a.platform)||t.screenTypes.length>0&&!t.screenTypes.includes(a.screenType)||t.uiPatterns.length>0&&!q(a.uiPatterns,t.uiPatterns)||t.tags.length>0&&!q(a.tags,t.tags)||t.tones.length>0&&!t.tones.includes(a.tone)))}function _(e,t){e[t]=(e[t]??0)+1}function J(e,t){const a=j(e,t),s={platform:{},screenType:{},uiPattern:{},tag:{},tone:{}};for(const n of a){_(s.platform,n.platform),_(s.screenType,n.screenType),_(s.tone,n.tone);for(const r of n.uiPatterns)_(s.uiPattern,r);for(const r of n.tags)_(s.tag,r)}return s}const K=[["layout","레이아웃"],["hierarchy","시각 위계"],["clarity","정보 명확성"],["interaction","인터랙션 단서"],["reuse","재사용성"]];function X(e){return Math.max(35,Math.min(98,Math.round(e)))}function Y(e){let t=0;for(const a of e)t=(t*31+a.charCodeAt(0))%997;return t}function N(e){var l;if((l=e.analysisScores)!=null&&l.length)return e.analysisScores;const t=Y(`${e.slug}:${e.title}:${e.insight}`),a=e.tags.includes("density")?7:0,s=e.asset.kind==="motion"?8:0,n=Math.min(12,e.uiPatterns.length*3),r=e.asset.width/Math.max(1,e.asset.height),i=r>1.2?6:0,d=r<.75?5:0,o=[68+n+i+t%9,66+a+(t>>1)%10,64+(e.insight.length>45?8:3)+(t>>2)%9,58+s+(e.uiPatterns.includes("filter-chips")?7:0),62+d+n+(t>>3)%8].map(X);return K.map(([u,h],p)=>({key:u,label:h,score:o[p]??60,description:Q(h,o[p]??60,e)}))}function O(e){return e.length===0?0:Math.round(e.reduce((t,a)=>t+a.score,0)/e.length)}function Q(e,t,a){return e==="레이아웃"?`${a.screenType} 화면 구조와 ${a.uiPatterns.join(", ")} 패턴의 배치 안정성.`:e==="시각 위계"?"대표 정보, 보조 설명, 메타 정보가 얼마나 빠르게 구분되는지의 점수.":e==="정보 명확성"?"카드에 들어갈 타이틀과 간단 내용이 즉시 이해되는 정도.":e==="인터랙션 단서"?a.asset.kind==="motion"?"모션 파일이라 상태 변화 단서를 더 강하게 반영.":"정지 이미지라 실제 hover나 전환은 확인 필요.":t>=75?"다른 캡처나 프롬프트에 재사용하기 좋은 관찰값이 있음.":"재사용하려면 추가 캡처나 비교가 더 있으면 좋음."}function V(e){return e.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,42)||"local-capture"}function Z(e){return e.replace(/\.[^.]+$/,"").replace(/[-_]+/g," ").replace(/\s+/g," ").trim()||"로컬 캡처"}function ee(e){var a;const t=(a=e.name.split(".").pop())==null?void 0:a.toLowerCase();return t?t==="jpeg"?"jpg":t:e.type.split("/").pop()||"file"}function te(e){const t=e.width/Math.max(1,e.height);return t<.65?"onboarding":t>1.5?"dashboard":"detail"}function se(e){const t=e.width/Math.max(1,e.height);return t<.75?["onboarding","typography","forms"]:t>1.5?["dashboard","density","navigation"]:["cards","color","typography"]}function ae(e){const t=e.width/Math.max(1,e.height);return t<.75?["hero-band","progress-bar"]:t>1.5?["data-table","tab-row"]:["card-grid","split-view"]}function ne(e){return new Promise((t,a)=>{const s=new Image;s.onload=()=>{t({width:s.naturalWidth||1,height:s.naturalHeight||1})},s.onerror=()=>a(new Error("이미지를 읽을 수 없습니다.")),s.src=e})}async function re(e){if(!e.type.startsWith("image/"))throw new Error(`${e.name}: 현재 Intake 데모는 이미지 파일만 분석합니다.`);const t=URL.createObjectURL(e),a=await ne(t),s=ee(e),n=`local-${Date.now()}-${V(e.name)}`,r=Z(e.name),i=te(a),d=se(a),o=ae(a),l=a.width/Math.max(1,a.height),u=l<.75?"모바일 세로형":l>1.5?"와이드 업무형":"균형형",h={slug:n,title:r,visibility:"internal",capturedAt:new Date().toISOString().slice(0,10),sourceUrl:null,service:"Local Intake",platform:l<.75?"web-mobile":"web",screenType:i,uiPatterns:o,tone:l>1.5?"data-dense":"informational",copyTone:"neutral",tags:d,insight:`${u} 캡처로, 대표 이미지와 기본 메타를 바탕으로 빠른 리뷰용 카드가 생성됨.`,appVersion:null,body:`## Layout

로컬 업로드 파일의 비율과 크기를 기준으로 ${u} 화면으로 분류했다. 실제 컴포넌트 의미는 사용자가 상세 분석에서 보정해야 한다.

## Color

브라우저에서는 이미지 픽셀을 LLM으로 해석하지 않는다. 현재 색상 판단은 데모용이며, 실제 컬러 역할은 사람이 확인해야 한다.

## Typography

텍스트 영역은 파일만으로 확정하지 않는다. 제목·본문·캡션의 위계는 상세 화면에서 육안으로 확인한다.

## Interaction

정지 이미지 기준 분석이다. hover, 전환, 상태 변화는 추가 모션 캡처가 있을 때만 확정한다.`,asset:{path:t,originalName:e.name,format:s,kind:"still",width:a.width,height:a.height,bytes:e.size,hash:`local-${e.name}-${e.size}-${e.lastModified}`,frameCount:null,durationSec:null,posterPath:null},localOnly:!0},p=N(h);return h.analysisScores=p,h.analysisTotal=O(p),h}const D="design-llm-wiki-pins";function A(){try{const e=localStorage.getItem(D);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(a=>typeof a=="string"):[]}catch{return[]}}function ie(e){const t=[...new Set(e)];localStorage.setItem(D,JSON.stringify(t))}function I(e){const t=A(),a=t.includes(e)?t.filter(s=>s!==e):[...t,e];return ie(a),A()}function F(e=window.location.hash){const t=e.replace(/^#/,""),a=t.startsWith("/")?t:`/${t}`,s=a==="/"||a===""?"/":a.replace(/\/+$/,"");if(s==="/"||s==="/gallery"||s==="/collections"||s==="/wiki"||s==="/stats"||s.startsWith("/collections/")||s.startsWith("/wiki/"))return{name:"archive"};if(s==="/intake")return{name:"intake"};if(s==="/history")return{name:"history"};if(s==="/export")return{name:"archive"};const n=s.match(/^\/capture\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);return n?{name:"capture",slug:n[1]}:{name:"notfound",path:s}}function y(e){switch(e.name){case"archive":return"#/";case"capture":return`#/capture/${e.slug}`;case"intake":return"#/intake";case"history":return"#/history";case"notfound":return`#${e.path}`}}function oe(e){const t=()=>e(F());return window.addEventListener("hashchange",t),e(F()),()=>window.removeEventListener("hashchange",t)}function c(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function k(e){return e.startsWith("./")||e.startsWith("/")||e.startsWith("blob:")||e.startsWith("data:")||e.startsWith("http://")||e.startsWith("https://")?e:`./${e}`}let w=null;function ce(e){const t=e.querySelector(".archive-tabs__indicator"),a=e.querySelector('.archive-tab[aria-selected="true"]');if(!t||!a)return;const s=a.offsetLeft,n=a.offsetWidth;w&&(t.style.transition="none",t.style.transform=`translateX(${w.left}px)`,t.style.width=`${w.width}px`,t.offsetWidth,t.style.transition=""),requestAnimationFrame(()=>{t.style.transform=`translateX(${s}px)`,t.style.width=`${n}px`,w={left:s,width:n}})}function L(e){const t=e.querySelector(".capture-grid");if(!t)return;const a=window.getComputedStyle(t),s=Number.parseFloat(a.gridAutoRows)||1,n=Number.parseFloat(a.rowGap)||0;t.querySelectorAll(".capture-card").forEach(r=>{r.style.gridRowEnd="";const i=r.getBoundingClientRect().height,d=Number.parseFloat(window.getComputedStyle(r).marginBottom)||0,o=Math.ceil((i+d+n)/(s+n));r.style.gridRowEnd=`span ${Math.max(1,o)}`})}function le(e){const t=e.asset.kind==="motion"&&e.asset.posterPath?e.asset.posterPath:e.asset.path;return`<img class="capture-card__media" src="${c(k(t))}" alt="" loading="lazy" width="${e.asset.width}" height="${e.asset.height}" />`}function de(e,t){return`
    <article class="capture-card${t?" capture-card--pinned":""}">
      <a class="capture-card__link" href="${y({name:"capture",slug:e.slug})}">
        <div class="capture-card__frame">
          ${le(e)}
          <span class="capture-card__kind">${c(e.asset.kind)}</span>
          ${t?'<span class="capture-card__pin-badge">Pinned</span>':""}
        </div>
        <div class="capture-card__body">
          <h2 class="capture-card__title">${c(e.title)}</h2>
          <p class="capture-card__insight">${c(e.insight)}</p>
        </div>
      </a>
    </article>
  `}function ue(e,t){const a=new Set(t),s=B(e),n=s.filter(l=>a.has(l.slug)),r=s.filter(l=>!a.has(l.slug)),i=new Map(s.map(l=>[l.slug,l])),d=t.map(l=>i.get(l)).filter(l=>!!l),o=n.filter(l=>!t.includes(l.slug));return[...d,...o,...r]}function he(e,t,a,s){const n=j(e.captures,t),r=new Set(a),i=s==="pin"?n.filter(o=>r.has(o.slug)):n,d=ue(i,a);return e.captures.length===0?`
      <section class="state-panel state-panel--soft" aria-live="polite">
        <h1 class="state-panel__title">Archive is empty</h1>
        <p class="state-panel__text">이 번들에 캡처가 없습니다. <a href="#/intake">Intake</a>에서 넣는 방법을 확인하세요.</p>
      </section>
    `:`
    <section class="gallery archive">
      <header class="gallery__header archive__header">
        <div>
          <h1 class="gallery__title">Archive</h1>
          <p class="gallery__meta">Target ${c(e.target)} · ${d.length} of ${e.captures.length} · ${a.length} pinned</p>
        </div>
      </header>

      <div class="archive-search-panel">
        <label class="search-field archive-search">
          <span class="search-field__label">Search archive</span>
          <input id="archive-search" class="search-field__input archive-search__input" type="search" value="${c(t.query)}" placeholder="타이틀, 서비스, 태그, 패턴, 인사이트 검색…" />
          ${t.query?'<button type="button" class="archive-search__clear" id="archive-search-clear" aria-label="검색어 지우기">×</button>':""}
        </label>
      </div>

      <div class="archive-tabs" role="tablist" aria-label="Archive lists">
        <span class="archive-tabs__indicator" aria-hidden="true"></span>
        <button type="button" class="archive-tab" role="tab" id="archive-tab-all" data-archive-tab="all" aria-selected="${s==="all"?"true":"false"}">
          All <span class="archive-tab__count">${n.length}</span>
        </button>
        <button type="button" class="archive-tab" role="tab" id="archive-tab-pin" data-archive-tab="pin" aria-selected="${s==="pin"?"true":"false"}">
          Pin <span class="archive-tab__count">${a.length}</span>
        </button>
      </div>

      <div class="gallery__results archive__results" aria-live="polite">
        ${d.length===0?`<section class="state-panel state-panel--tint">
                <h2 class="state-panel__title">${s==="pin"?"No pinned captures":"No matches"}</h2>
                <p class="state-panel__text">${s==="pin"?"상세 화면에서 Pin을 누르면 이 탭에 모입니다.":"검색어를 지우거나 더 넓은 키워드로 다시 검색하세요."}</p>
              </section>`:`<div class="capture-grid">${d.map(o=>de(o,a.includes(o.slug))).join("")}</div>`}
      </div>
    </section>
  `}function pe(e,t,a){var i;const s=e.querySelector("#archive-search");s==null||s.addEventListener("input",()=>{a.onFilterChange({...t,query:s.value})}),s==null||s.addEventListener("keydown",d=>{d.key==="Escape"&&(d.preventDefault(),a.onClearFilters())}),(i=e.querySelector("#archive-search-clear"))==null||i.addEventListener("click",()=>{a.onClearFilters()}),e.querySelectorAll("[data-archive-tab]").forEach(d=>{d.addEventListener("click",()=>{const o=d.dataset.archiveTab;(o==="all"||o==="pin")&&a.onTabChange(o)})}),ce(e),requestAnimationFrame(()=>L(e)),e.querySelectorAll(".capture-card__media").forEach(d=>{d.addEventListener("load",()=>L(e),{once:!0})});const n=new ResizeObserver(()=>L(e)),r=e.querySelector(".capture-grid");r&&n.observe(r)}function ge(e){const t=e.replace(/\r\n/g,`
`).split(`
`),a=[];let s=!1;const n=()=>{s&&(a.push("</ul>"),s=!1)};for(const r of t){const i=r.trim();if(!i){n();continue}if(i.startsWith("### ")){n(),a.push(`<h3>${b(i.slice(4))}</h3>`);continue}if(i.startsWith("## ")){n(),a.push(`<h2>${b(i.slice(3))}</h2>`);continue}if(i.startsWith("# ")){n(),a.push(`<h1>${b(i.slice(2))}</h1>`);continue}if(i.startsWith("- ")){s||(a.push("<ul>"),s=!0),a.push(`<li>${b(i.slice(2))}</li>`);continue}n(),a.push(`<p>${b(i)}</p>`)}return n(),a.join(`
`)}function b(e){let t=c(e);return t=t.replace(/\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/g,(a,s)=>`<a href="${y({name:"capture",slug:s})}">${s}</a>`),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(a,s,n)=>n.endsWith(".md")&&!n.includes("://")?`<span>${s}</span>`:`<a href="${c(n)}">${s}</a>`),t}function fe(e,t){const a=new Set(e.tags),s=new Set(e.uiPatterns);return t.filter(n=>n.slug!==e.slug).map(n=>{const r=n.tags.filter(o=>a.has(o)).sort(),i=n.uiPatterns.filter(o=>s.has(o)).sort(),d=r.length*2+i.length;return{slug:n.slug,score:d,sharedTags:r,sharedPatterns:i}}).filter(n=>n.score>0).sort((n,r)=>n.score!==r.score?r.score-n.score:n.slug.localeCompare(r.slug))}function me(e,t,a=6){return fe(e,t).slice(0,a).map(s=>s.slug)}function ye(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(2)} MB`}function ve(e){return e.asset.kind==="motion"?`
      <video class="detail-media" controls preload="metadata"${e.asset.posterPath?` poster="${c(k(e.asset.posterPath))}"`:""}>
        <source src="${c(k(e.asset.path))}" />
      </video>
    `:`
    <img
      class="detail-media"
      src="${c(k(e.asset.path))}"
      alt=""
      width="${e.asset.width}"
      height="${e.asset.height}"
    />
  `}function $e(e){const t=N(e),a=e.analysisTotal??O(t),s=160,n=110,r=[.25,.5,.75,1].map(o=>t.map((l,u)=>{const h=-Math.PI/2+u*Math.PI*2/t.length,p=s+Math.cos(h)*n*o,$=s+Math.sin(h)*n*o;return`${p.toFixed(1)},${$.toFixed(1)}`}).join(" ")).map(o=>`<polygon class="spider-grid" points="${o}" />`).join(""),i=t.map((o,l)=>{const u=-Math.PI/2+l*Math.PI*2/t.length,h=n*(o.score/100),p=s+Math.cos(u)*h,$=s+Math.sin(u)*h;return`${p.toFixed(1)},${$.toFixed(1)}`}).join(" "),d=t.map((o,l)=>{const u=-Math.PI/2+l*Math.PI*2/t.length,h=s+Math.cos(u)*n,p=s+Math.sin(u)*n,$=s+Math.cos(u)*n*(o.score/100),U=s+Math.sin(u)*n*(o.score/100),T=s+Math.cos(u)*(n+26),C=s+Math.sin(u)*(n+26);return`
        <g class="spider-axis" tabindex="0">
          <line class="spider-axis__line" x1="${s}" y1="${s}" x2="${h.toFixed(1)}" y2="${p.toFixed(1)}" />
          <circle class="spider-point" cx="${$.toFixed(1)}" cy="${U.toFixed(1)}" r="6" />
          <text class="spider-label" x="${T.toFixed(1)}" y="${C.toFixed(1)}">${c(o.label)}</text>
          <text class="spider-callout" x="${T.toFixed(1)}" y="${(C+18).toFixed(1)}">${o.score}</text>
        </g>
      `}).join("");return`
    <section class="detail__section analysis-score">
      <div class="analysis-score__summary">
        <p class="detail__eyebrow">Image analysis score</p>
        <h2>총합 점수 ${a}</h2>
        <p class="detail__empty">항목 위에 마우스를 올리거나 키보드 포커스를 주면 해당 점수가 강조됩니다.</p>
      </div>
      <div class="spider-layout">
        <svg class="spider-chart" viewBox="0 0 320 320" role="img" aria-label="이미지 분석 스파이더 다이어그램">
          ${r}
          <polygon class="spider-area" points="${i}" />
          ${d}
        </svg>
        <dl class="score-list">
          ${t.map(o=>`
            <div class="score-list__item">
              <dt>${c(o.label)} <strong>${o.score}</strong></dt>
              <dd>${c(o.description)}</dd>
            </div>
          `).join("")}
        </dl>
      </div>
    </section>
  `}function _e(e){const t=[...e.tags,...e.uiPatterns,e.screenType,e.platform,e.tone,e.copyTone];return[...new Set(t)].map(a=>`<span class="chip detail-hashtag" aria-pressed="true">#${c(a)}</span>`).join("")}function be(e,t,a){const s=e.captures.find(i=>i.slug===t);if(!s)return`
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">Capture not found</h1>
        <p class="state-panel__text">${c(t)} is not in this bundle.</p>
        <p><a class="button button--secondary" href="#/">Back to Archive</a></p>
      </section>
    `;const n=me(s,e.captures).map(i=>e.captures.find(d=>d.slug===i)).filter(i=>!!i),r=a.includes(t);return`
    <article class="detail">
      <header class="detail__header">
        <div>
          <p class="detail__eyebrow">${c(s.service)} · ${c(s.platform)}</p>
          <h1 class="detail__title">${c(s.title)}</h1>
          <p class="detail__insight">${c(s.insight)}</p>
        </div>
        <div class="detail__actions">
          <button type="button" class="button button--secondary" data-pin-slug="${c(t)}" aria-pressed="${r?"true":"false"}">
            ${r?"Unpin":"Pin"}
          </button>
          <a class="button button--secondary" href="#/">Archive</a>
        </div>
      </header>

      <div class="detail__media-wrap detail__hero">${ve(s)}</div>

      ${$e(s)}

      <section class="detail__section">
        <h2>Derived asset meta</h2>
        <dl class="meta-grid">
          <div><dt>Format</dt><dd>${c(s.asset.format)}</dd></div>
          <div><dt>Kind</dt><dd>${c(s.asset.kind)}</dd></div>
          <div><dt>Dimensions</dt><dd>${s.asset.width} × ${s.asset.height}</dd></div>
          <div><dt>Bytes</dt><dd>${ye(s.asset.bytes)}</dd></div>
          <div><dt>Frame count</dt><dd>${s.asset.frameCount??"—"}</dd></div>
          <div><dt>Duration</dt><dd>${s.asset.durationSec??"—"}</dd></div>
          <div class="meta-grid__wide"><dt>Hash</dt><dd><code>${c(s.asset.hash)}</code></dd></div>
        </dl>
      </section>

      <section class="detail__section">
        <h2>Hashtags</h2>
        <p class="detail__chips">
          ${_e(s)}
        </p>
        <p class="detail__meta-line">
          ${c(s.screenType)} · ${c(s.tone)} · ${c(s.copyTone)} · ${c(s.capturedAt)}
          ${s.sourceUrl?` · <a href="${c(s.sourceUrl)}">${c(s.sourceUrl)}</a>`:""}
        </p>
      </section>

      <section class="detail__section prose">
        <h2>Analysis</h2>
        ${ge(s.body)}
      </section>

      <section class="detail__section">
        <h2>Related captures</h2>
        ${n.length===0?'<p class="detail__empty">No related captures with shared tags or UI patterns.</p>':`<div class="link-list">${n.map(i=>`
              <a class="link-card" href="${y({name:"capture",slug:i.slug})}">
                <strong>${c(i.title)}</strong>
                <span>${c(i.insight)}</span>
              </a>`).join("")}</div>`}
      </section>
    </article>
  `}function we(e,t){var a;(a=e.querySelector("[data-pin-slug]"))==null||a.addEventListener("click",s=>{const n=s.currentTarget.dataset.pinSlug;n&&t(n)})}function ke(e){const t=e.wiki.logEntries;return t.length===0?`
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
        ${t.map(a=>`
          <li class="history-item">
            <time class="history-item__date" datetime="${c(a.date)}">${c(a.date)}</time>
            <span class="history-item__op">${c(a.operation)}</span>
            <strong class="history-item__title">${c(a.title)}</strong>
          </li>`).join("")}
      </ol>
    </section>
  `}function Se(e=""){return`
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
  `}function xe(e,t){const a=e.querySelector("#intake-file"),s=e.querySelector("#intake-dropzone"),n=e.querySelector("#analyze-files"),r=e.querySelector("#intake-status");let i=[];const d=o=>{i=o.filter(l=>l.type.startsWith("image/")),n&&(n.disabled=i.length===0),r&&(r.textContent=i.length===0?"분석 가능한 이미지 파일이 없습니다.":`${i.length}개 파일 준비됨. Analyze를 누르면 Archive에 카드가 추가됩니다.`)};a==null||a.addEventListener("change",()=>{d(Array.from(a.files??[]))}),s==null||s.addEventListener("dragover",o=>{o.preventDefault(),s.classList.add("intake-dropzone--active")}),s==null||s.addEventListener("dragleave",()=>{s.classList.remove("intake-dropzone--active")}),s==null||s.addEventListener("drop",o=>{var l;o.preventDefault(),s.classList.remove("intake-dropzone--active"),d(Array.from(((l=o.dataTransfer)==null?void 0:l.files)??[]))}),n==null||n.addEventListener("click",()=>{i.length!==0&&t.onAnalyzeFiles(i)})}function Ae(e){return`
    <section class="state-panel state-panel--tint">
      <h1 class="state-panel__title">Route not found</h1>
      <p class="state-panel__text">No page for <code>${c(e)}</code>.</p>
      <p><a class="button button--secondary" href="#/">Back to gallery</a></p>
    </section>
  `}const R="design-llm-wiki-mode",z="./data/index.json";let m={status:"loading"},S={query:"",platforms:[],screenTypes:[],uiPatterns:[],tags:[],tones:[]},v=A(),H="all",P=[],x="",f=F();function E(){return localStorage.getItem(R)==="dark"?"dark":"light"}function W(e){document.documentElement.dataset.theme="cool",document.documentElement.dataset.mode=e,localStorage.setItem(R,e)}function M(e,t,a){return`<a class="nav-link${a?" nav-link--current":""}" href="${t}" ${a?'aria-current="page"':""}>${e}</a>`}function Pe(e){const t=E();return`
    <header class="top-nav">
      <a class="wordmark" href="#/">Design LLM Wiki</a>
      <nav class="nav-menu" aria-label="Primary">
        ${M("Archive",y({name:"archive"}),f.name==="archive")}
        ${M("Intake",y({name:"intake"}),f.name==="intake")}
        ${M("History",y({name:"history"}),f.name==="history")}
      </nav>
      <div class="nav-actions">
        <button type="button" class="button button--secondary" id="mode-toggle">${t==="dark"?"Dark":"Light"}</button>
      </div>
    </header>
    <main class="shell" id="main">${e}</main>
  `}function Le(e){const t=[...P,...e.captures];return{...e,target:P.length>0?`${e.target}+local`:e.target,captures:t,facets:J(t,{query:"",platforms:[],screenTypes:[],uiPatterns:[],tags:[],tones:[]})}}function Me(){if(m.status==="loading")return`
      <section class="state-panel state-panel--canvas" aria-busy="true">
        <h1 class="state-panel__title">Loading index</h1>
        <p class="state-panel__text">Reading build JSON. Markdown is never fetched by the browser.</p>
      </section>
    `;if(m.status==="error")return`
      <section class="state-panel state-panel--soft" role="alert">
        <h1 class="state-panel__title">Index failed to load</h1>
        <p class="state-panel__text">${m.message}</p>
        <p class="state-panel__text">Run <code>npm run build -- --target=internal</code> before <code>npm run dev</code>.</p>
      </section>
    `;const e=Le(m.index);switch(f.name){case"archive":return he(e,S,v,H);case"capture":return be(e,f.slug,v);case"intake":return Se(x);case"history":return ke(e);case"notfound":return Ae(f.path)}}function g(){var t;const e=document.querySelector("#app");if(!e)throw new Error("#app not found");W(E()),v=A(),e.innerHTML=Pe(Me()),(t=e.querySelector("#mode-toggle"))==null||t.addEventListener("click",()=>{W(E()==="dark"?"light":"dark"),g()}),m.status==="ready"&&(f.name==="archive"&&pe(e,S,{onFilterChange:a=>{const s=document.activeElement,n=(s==null?void 0:s.id)==="archive-search"?"search":null;if(S=a,g(),n==="search"){const r=document.querySelector("#archive-search");r==null||r.focus();const i=(r==null?void 0:r.value.length)??0;r==null||r.setSelectionRange(i,i)}},onClearFilters:()=>{var a;S={query:"",platforms:[],screenTypes:[],uiPatterns:[],tags:[],tones:[]},g(),(a=document.querySelector("#archive-search"))==null||a.focus()},onTabChange:a=>{var s;H=a,g(),(s=document.querySelector(`[data-archive-tab="${a}"]`))==null||s.focus()}}),f.name==="capture"&&we(e,a=>{v=I(a),g()}),f.name==="intake"&&xe(e,{onAnalyzeFiles:a=>{(async()=>{x=`${a.length}개 파일 분석 중...`,g();try{const s=await Promise.all(a.map(re));P=[...s,...P],v=s.reduce((n,r)=>n.includes(r.slug)?n:I(r.slug),v),x=`${s.length}개 카드가 Archive에 추가되었습니다.`,window.location.hash=y({name:"archive"}).replace(/^#/,""),f={name:"archive"},g()}catch(s){x=s instanceof Error?s.message:String(s),g()}})()}}))}async function Fe(){m={status:"loading"},g();try{const e=await fetch(z,{cache:"no-store"});if(!e.ok)throw new Error(`${z} → HTTP ${e.status}`);const t=await e.json();if(!t||!Array.isArray(t.captures)||!t.facets)throw new Error("Index JSON is missing captures or facets");m={status:"ready",index:t}}catch(e){m={status:"error",message:e instanceof Error?e.message:String(e)}}g()}oe(e=>{f=e,g()});Fe();
