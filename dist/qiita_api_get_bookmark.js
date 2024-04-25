javascript:/* v1.0.0 */(()=>{const t=(t,e,n)=>{let o=document.getElementById("qag_dialog");o&&o.remove(),document.body.insertAdjacentHTML("beforeend",'<dialog id="qag_dialog" style="margin: auto; padding: 10px;">\n\t\t<form id="qag_form">\n\t\t\t<div>次の記事を取得します。</div>\n\t\t\t<div id="qag_target" style="margin-inline-start: 20px; margin-block-start: 10px;"></div>\n\t\t\t<div id="qag_buttons" style="display: flex; justify-content: space-around; margin-block-start: 10px;">\n\t\t\t\t<button id="ok_button">OK</button>\n\t\t\t\t<button id="cancel_button" value="cancel" formmethod="dialog">キャンセル</button>\n\t\t\t</div>\n\t\t</form>\n\t</dialog>'),o=document.getElementById("qag_dialog");const a=document.getElementById("ok_button"),r=document.getElementById("qag_form"),i=document.getElementById("qag_target"),s=document.getElementById("qag_buttons");switch(t){case"tag":i.innerHTML=`<div>\n\t\t\t\t\tタグ： <span>${decodeURIComponent(e)}</span>\n\t\t\t\t</div>`;break;case"search":i.innerHTML=`<div>\n\t\t\t\t\t検索語： <span>${decodeURIComponent(e)}</span>\n\t\t\t\t</div>`;break;case"user":i.innerHTML=`<div>\n\t\t\t\t\tユーザー： <span>@${e}</span>\n\t\t\t\t</div>\n\t\t\t\t<div style="display: flex; align-items: center; margin-block-start: 10px;">\n\t\t\t\t\t対象：\n\t\t\t\t\t<div style="display: inline-flex; flex-direction: column; margin-inline-start: 10px;">\n\t\t\t\t\t\t<label><input type="radio" name="target" value="投稿" checked><span>投稿した記事</span></label>\n\t\t\t\t\t\t<label><input type="radio" name="target" value="ストック"><span>ストックした記事</span></label>\n\t\t\t\t\t</div>\n\t\t\t\t</div>`;break;default:throw new Error("予期されないswitchです。")}a.addEventListener("click",(i=>{i.preventDefault(),a.addEventListener("click",(t=>{t.preventDefault(),o.close("completed")}),{once:!0}),a.disabled=1;const c=[...o.querySelectorAll("input")];for(let t=0;t<c.length;t++)c[t].disabled=1;s.insertAdjacentHTML("beforebegin",'<div style="margin-block-start: 10px;">\n\t\t\tページ： <span id="qag_current_page">1</span> / <span id="qag_last_page">?</span>\n\t\t</div>\n\t\t<div>\n\t\t\t残レート： <span id="qag_rate_remaining">?</span> / <span id="qag_rate_limit">?</span>\n\t\t</div>\n\t\t<div>\n\t\t\tリセット日時： <span id="qag_reset">?</span>\n\t\t</div>'),n(t,e,"user"===t?r.elements.target.value:"")}),{once:!0}),o.addEventListener("close",(()=>{console.log("qag_dialog.returnValue =",o.returnValue),o.remove()})),o.showModal(),a.focus()},e=(t,e)=>{const n=document.getElementById(t);if(!n)throw new Error("予期されないs_idです。",t);n.innerText=e},n=t=>{const e=document.getElementById("qag_buttons");if(!e)return void alert(t);const n=document.getElementById("ok_button"),o=document.getElementById("cancel_button");e.insertAdjacentHTML("beforebegin",`<div style="margin-block-start: 10px;">${t}</div>`),n.disabled=!1,o.disabled=!0,n.focus()},o=(t,n=!1,o=!1)=>{if(void 0===t)return;const{headers:a}=t,r=Number(a.get("rate-remaining")),i=a.get("rate-limit");n||console.log("rate:",r,"/",i),o||(e("qag_rate_remaining",r),e("qag_rate_limit",i));const s=new Date(1e3*Number(t.headers.get("rate-reset"))).toLocaleString().replace(/:\d+$/u,"");return n||console.log("rate-reset:",s),o||e("qag_reset",s),[r,s]},a=(t,n,o)=>{console.log(`fetch ${t} page = ${n}${o?` / ${o}`:""}`),e("qag_current_page",n)},r=(t,e,n=0)=>(a("user",e,n),fetch(`https://qiita.com/api/v2/users/${t}/items?page=${e}&per_page=100`)),i=(t,e,n=0)=>(a("user stocked",e,n),fetch(`https://qiita.com/api/v2/users/${t}/stocks?page=${e}&per_page=100`)),s=(t,e,n=0)=>(a("tag",e,n),fetch(`https://qiita.com/api/v2/tags/${t}/items?page=${e}&per_page=100`)),c=(t,e,n=0)=>(a("search",e,n),fetch(`https://qiita.com/api/v2/items?page=${e}&per_page=100&query=${t}`)),l=t=>new Date(t).toLocaleString(),d=async(t,n)=>{let a,r,i,s,c;try{i=await n(t,1),[s,c]=o(i),r=await i.json(),a=r;const l=(t=>{const n=t.headers.get("link").match(/(?<=\bpage=)(\d+)/gu),o=Number(n.at(-1));return console.log("n_last_page = ",o),e("qag_last_page",o),o})(i);((t,e)=>{if(t>e+1){const n=`***WARNING*** last_page(${t}) > rate_remaining(${e}) + 1`;console.log(`%c${n}`,"color:hotpink;"),(t=>{const e=document.getElementById(t);if(!e)throw new Error("予期されないs_idです。",t);e.style.color="red",e.style.fontWeight="bold"})("qag_rate_remaining")}})(l,s);for(let e=2;e<=l;e++)i=await n(t,e,l),o(i,!0),r=await i.json(),a.push(...r);return console.log("fetch完了"),o(i),[a,c,i]}catch(t){return console.log("例外が発生しました。",t),console.log("json=",r),console.log("response=",i),o(i,!1,!0),[a,c,i]}},g=async(t,e,o)=>{const[a,g,u]=await((t,e,n)=>{switch(t){case"tag":return console.log(`タグ:「${decodeURIComponent(e)}」でfetch開始します。`),d(e,s);case"search":return console.log(`検索語:「${decodeURIComponent(e)}」でfetch開始します。`),d(e,c);case"user":if(console.log(`ユーザーID:「${e}」（${n}）でfetch開始します。`),"投稿"===n)return d(e,r);if("ストック"===n)return d(e,i);throw new Error("予期されないs_arg2です。",n);default:throw new Error("予期されないswitchです。")}})(t,e,o);((t,e,o)=>{if(!o){const t="ネットワークが未接続のようです。";return console.error(t),void n(t)}if(!t){if(!o.ok){const t=`サーバーの調子が悪いようです。HTTPステータスコード: ${o.status}`;return console.error(t),void n(t)}const t="jsonを取得できませんでした。「"+(e?`${e.toLocaleString()}」まで待ってください。`:"");return console.error(t),void n(t)}if(console.log(t),window.json=t,"rate_limit_exceeded"===t.type){const t="回数制限を超えました。「"+(e?`${e.toLocaleString()}」まで待ってください。`:"");return console.error(t),void n(t)}const a=(t=>`${["title","url","tags","created","updated","comments","likes","stocks","id"].join("\t")}\n${t.map((t=>{return[(e=t.title,e.replaceAll(/\t/gu," ")),t.url,`,${t.tags.map((t=>t.name)).join(",")},`,l(t.created_at),l(t.updated_at),t.comments_count,t.likes_count,t.stocks_count,t.id].join("\t");var e})).join("\n")}`)(t);window.r=a,navigator.clipboard.writeText(a).then((()=>{const t="クリップボードにコピー完了しました。";console.log(t),n(t)}),(()=>{const t=new Blob([a],{type:"text/plain"}),e=document.createElement("a"),o=new Date;e.download=`Qiita記事一覧 ${o.getFullYear()}-${o.getMonth()+1}-${o.getDate()}_${o.getHours()}-${o.getMinutes()}-${o.getSeconds()}.txt`,e.href=URL.createObjectURL(t),e.click(),URL.revokeObjectURL(e.href);const r="クリップボードにコピーできなかったのでダウンロードしました。";console.log(r),n(r)}))})(a,g,u)};(()=>{if("qiita.com"!==location.host){const t="https://qiita.com/のトップページ以外を開いてください。";throw alert(t),new Error(t)}const e=(()=>{const t=location.href.match(/^https:\/\/qiita\.com\/tags\/([^?#/]+)/u);return t?t[1]:null})();if(e)return void t("tag",e,g);const n=(()=>{const t=location.href.match(/^https:\/\/qiita\.com\/search\?.*?q=([^?#&/]+)/u);return t?t[1]:null})();if(n)return void t("search",n,g);const o=(()=>{const t=location.href.match(/^https:\/\/qiita\.com\/([^?#/]+)/u);if(!t)return null;const e=t[1];return["api","search","organizations","official-columns","official-events","question-feed","release-notes","advent-calendar","qiita-award","privacy","terms","about","official-campaigns"].includes(e)?null:e})();if(o)return void t("user",o,g);const a=`未対応のURL「${location.href}」です。タグも検索語もユーザーIDも見つかりませんでした。`;throw alert(a),new Error(a)})()})();