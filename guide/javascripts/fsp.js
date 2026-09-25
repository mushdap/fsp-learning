(function () {
  'use strict';
  const scriptURL = document.currentScript.src;
  const KEY = 'fsp-guide-practised-v1';
  let cleanup = [];
  const saved = () => { try { const v=JSON.parse(localStorage.getItem(KEY)||'[]'); return new Set(Array.isArray(v)?v:[]); } catch { return new Set(); } };
  function persist(set) { try { localStorage.setItem(KEY,JSON.stringify([...set])); return true; } catch { return false; } }
  function init() {
    cleanup.forEach(fn=>fn()); cleanup=[];
    document.querySelectorAll('[data-fsp-library]').forEach(lib=>{
      const search=lib.querySelector('[data-search]'), topic=lib.querySelector('[data-topic]'),level=lib.querySelector('[data-level]'),cards=[...lib.querySelectorAll('[data-card]')];
      lib.querySelector('.fsp-filters').hidden=false;
      const filter=()=>{
        const words=search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
        let n=0;cards.forEach(c=>{const haystack=(c.textContent+' '+c.dataset.searchTerms).toLocaleLowerCase();const ok=(topic.value==='all'||topic.value===c.dataset.topic)&&(level.value==='all'||level.value===c.dataset.level)&&words.every(w=>haystack.includes(w));c.hidden=!ok;if(ok)n++;});
        lib.querySelector('.fsp-library-count').textContent=n+' of '+cards.length+' practice stories';lib.querySelector('[data-empty]').hidden=n!==0;
      };
      search.addEventListener('input',filter);topic.addEventListener('change',filter);level.addEventListener('change',filter);filter();
    });
    document.querySelectorAll('[data-choice]').forEach(box=>{
      const button=box.querySelector('[data-check]');button.hidden=false;
      button.addEventListener('click',()=>{
        const selected=box.querySelector('input:checked');const status=box.querySelector('[role=status]');
        if(!selected){status.textContent='Choose a response first. There is no score to lose.';return;}
        const correct=Number(selected.value)===Number(box.dataset.correct);
        status.textContent=correct?'That keeps the conversation on track. Here is why.':'A useful moment to pause. Compare your choice with the explanation.';
        box.querySelector('details').open=true;
      });
    });
    document.querySelectorAll('[data-practised]').forEach(btn=>{
      btn.hidden=false;const update=()=>{const done=saved().has(btn.dataset.practised);btn.setAttribute('aria-pressed',String(done));btn.textContent=done?'Practised ✓ · click to undo':'Mark practised';};update();
      btn.addEventListener('click',()=>{const set=saved();set.has(btn.dataset.practised)?set.delete(btn.dataset.practised):set.add(btn.dataset.practised);if(!persist(set)){btn.parentNode.querySelector('.fsp-save-note').textContent='Your browser could not save this mark. You can still practise normally.';}update();});
    });
    document.querySelectorAll('[data-register]').forEach(lab=>{
      const controls=lab.querySelector('.fsp-register-controls');controls.hidden=false;
      const cards=[...lab.querySelectorAll('[data-register-card]')];let turn=null,active=0,disposed=false;
      const choose=n=>{active=n;controls.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===n)));cards.forEach((c,i)=>c.hidden=i!==n);if(turn)turn.select(n);};
      controls.querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>choose(i)));choose(0);
      // Load only on the two pages that contain this optional visual.
      import(new URL('register-three.js',scriptURL).href).then(async mod=>{
        if(disposed)return;turn=await mod.mount(lab.querySelector('.fsp-three'));if(disposed){turn?.dispose();return;}turn.select(active);
      }).catch(()=>{if(!disposed)lab.querySelector('.fsp-three-status').textContent='The 3D view is unavailable on this device. All three explanations still work above.';});
      cleanup.push(()=>{disposed=true;turn?.dispose();});
    });
    document.querySelectorAll('[data-practice-tools]').forEach(desk=>{
      const timer=desk.querySelector('.fsp-timer'),duration=desk.querySelector('[data-duration]'),clock=desk.querySelector('[data-clock]'),start=desk.querySelector('[data-timer-start]'),status=desk.querySelector('[data-timer-status]');
      timer.hidden=false;let remaining=Number(duration.value),deadline=null,id=null;
      const render=()=>{clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');};
      const stop=()=>{clearInterval(id);id=null;deadline=null;start.textContent='Start';};
      const tick=()=>{remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));render();if(!remaining){stop();status.textContent='Time is up. Pause and compare what you heard with what you recorded.';}};
      const reset=()=>{stop();remaining=Number(duration.value);render();status.textContent='Timer reset.';};
      start.addEventListener('click',()=>{if(id){tick();stop();status.textContent='Paused.';return;}if(!remaining)remaining=Number(duration.value);deadline=Date.now()+remaining*1000;id=setInterval(tick,250);start.textContent='Pause';status.textContent='Rehearsal running.';});
      desk.querySelector('[data-timer-reset]').addEventListener('click',reset);duration.addEventListener('change',reset);cleanup.push(stop);render();
      const summary=desk.querySelector('[data-progress-summary]'),clear=desk.querySelector('[data-clear-progress]');clear.hidden=false;
      const progress=()=>summary.textContent=saved().size+' cases marked practised in this browser.';progress();
      clear.addEventListener('click',()=>{persist(new Set());progress();});
    });
  }
  if(typeof document$!=='undefined')document$.subscribe(init);
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
