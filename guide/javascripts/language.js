/* Local EN/DE catalogue. Never translate user input or change stored answer values. */
(async function(){
  const source=document.currentScript.src,base=new URL(source),isGuide=base.pathname.includes('/javascripts/');
  const key='fsp-language';let language='de';try{language=localStorage.getItem(key)==='en'?'en':'de';}catch{}
  let dictionary={};try{const r=await fetch(new URL(isGuide?'../data/de.json':'de.json',source));if(!r.ok)throw Error('catalogue');dictionary=await r.json();}catch{language='en';}
  const norm=s=>s.replace(/\s+/g,' ').trim(), originals=new WeakMap(),attrs=new WeakMap();
  const panel=document.createElement('div');panel.className='fsp-language-switch';panel.setAttribute('data-no-translate','');panel.setAttribute('role','group');panel.setAttribute('aria-label','Sprache / Language');
  panel.innerHTML='<button type="button" data-language="de" lang="de">Deutsch</button><button type="button" data-language="en" lang="en">English</button>';
  const note=document.createElement('div');note.className='fsp-translation-note';note.setAttribute('data-no-translate','');
  note.textContent='Deutsche Begleittexte automatisch übersetzt · Original unter English. Medizinische Formulierungen bitte fachlich prüfen.';
  const style=document.createElement('style');style.textContent='.fsp-language-switch{position:relative;flex-shrink:0;z-index:100;display:flex;gap:3px;padding:4px;border:1px solid #8d9ab5;border-radius:12px;background:#162238;box-shadow:0 3px 15px #0003}.fsp-language-switch button{font:600 13px/1.3 system-ui;padding:9px 12px;border:0;border-radius:8px;color:#fff;background:transparent;cursor:pointer}.fsp-language-switch button[aria-pressed=true]{background:#b7c4ff;color:#132037}.fsp-language-switch button:focus-visible{outline:3px solid #efbd62}.fsp-translation-note{position:relative;padding:8px 180px 8px 20px;font:12px/1.5 system-ui;background:#17263d;color:#e2e9ff;border-bottom:1px solid #596882}.fsp-translation-note[hidden]{display:none}@media(max-width:600px){.fsp-translation-note{padding:8px 15px}.fsp-language-switch button{font-size:11px;padding:7px 8px}}';document.head.append(style);document.body.prepend(note);(document.querySelector('.md-header__inner')||document.querySelector('header')||document.body).append(panel);
  function skip(el){for(let p=el;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){if(p.matches('script,style,textarea,input,code,pre,[data-no-translate]')||p.getAttribute('lang')==='de')return true;}return false;}
  function translate(text){const t=norm(text);if(dictionary[t])return dictionary[t];let m;
    if(m=t.match(/^([A-C] · )(.*)$/))return m[1]+(dictionary[m[2]]||m[2]);
    if(m=t.match(/^(\d+) of (\d+) practice stories$/))return `${m[1]} von ${m[2]} Übungsfällen`;
    if(m=t.match(/^(\d+) cases marked practised in this browser\.$/))return `${m[1]} Fälle in diesem Browser als geübt markiert.`;
    if(m=t.match(/^(\d+) questions available\. Topic checks use up to 8 questions\.$/))return `${m[1]} Fragen verfügbar. Themenbezogene Tests enthalten bis zu 8 Fragen.`;
    if(m=t.match(/^QUESTION (\d+) \/ (\d+)$/))return `FRAGE ${m[1]} / ${m[2]}`;
    if(m=t.match(/^(\d+:\d+) remaining$/))return `${m[1]} verbleibend`;
    if(m=t.match(/^(Assessment submitted\.|Time ended and the assessment was submitted automatically\.) (\d+) unanswered\. This is an exercise score, not an official pass or fail\.$/))return `${m[1].startsWith('Time')?'Die Zeit ist abgelaufen; der Test wurde automatisch abgegeben.':'Test abgegeben.'} ${m[2]} Fragen unbeantwortet. Dies ist ein Übungsergebnis, keine offizielle Bestehensbewertung.`;
    if(m=t.match(/^Companion guide: (.*?) · Source PDF pages (.*?)\.$/))return `Begleitender Leitfaden: ${m[1]} · Seiten im Quell-PDF: ${m[2]}.`;
    if(m=t.match(/^(Question )(\d+)(.*)$/))return `Frage ${m[2]}${m[3].replace('answered','beantwortet').replace('flagged','markiert')}`;
    if(t.includes(' · '))return t.split(' · ').map(x=>dictionary[x]||x.replace(/(\d+) answered/,'$1 beantwortet').replace(/(\d+\/\d+) correct/,'$1 richtig')).join(' · ');
    return t;
  }
  let titleRecord=null;
  function update(){observer.disconnect();document.documentElement.lang=language;note.hidden=language!=='de';panel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
    if(!titleRecord||document.title!==titleRecord.last)titleRecord={en:document.title,last:document.title};
    document.title=language==='de'?translate(titleRecord.en):titleRecord.en;titleRecord.last=document.title;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while(n=walker.nextNode()){if(skip(n.parentElement)||!norm(n.nodeValue))continue;let record=originals.get(n);if(!record||n.nodeValue!==record.last){record={en:n.nodeValue,last:n.nodeValue};originals.set(n,record);}const value=language==='de'?record.en.replace(/\S[\s\S]*\S|\S/,()=>translate(record.en)):record.en;if(n.nodeValue!==value)n.nodeValue=value;record.last=value;}
    document.querySelectorAll('[title],[alt],[placeholder],[aria-label]').forEach(el=>{if(skip(el.matches('input,textarea')?el.parentElement:el))return;let map=attrs.get(el);if(!map){map={};attrs.set(el,map);}for(const name of ['title','alt','placeholder','aria-label']){if(!el.hasAttribute(name))continue;const now=el.getAttribute(name);if(!map[name]||now!==map[name].last)map[name]={en:now,last:now};const v=language==='de'?translate(map[name].en):map[name].en;if(v!==now)el.setAttribute(name,v);map[name].last=v;}});
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;update();});});
  panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{language=b.dataset.language;try{localStorage.setItem(key,language);}catch{}update();});
  addEventListener('storage',e=>{if(e.key===key){language=e.newValue==='en'?'en':'de';update();}});update();
})();
