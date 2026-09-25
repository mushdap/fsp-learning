export function shuffle(items, random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function selectQuestions(bank,topic,count){const pool=bank.filter(q=>topic==='all'||q.topic===topic);if(topic!=='all')return shuffle(pool).slice(0,count);const groups=new Map();for(const q of shuffle(pool)){if(!groups.has(q.topic))groups.set(q.topic,[]);groups.get(q.topic).push(q);}const out=[];while(out.length<Math.min(count,pool.length)){for(const topic of shuffle([...groups.keys()])){const q=groups.get(topic).pop();if(q)out.push(q);if(out.length===count)break;}}return out;}
export function score(questions,answers){let correct=0,answered=0;const topics={};for(const q of questions){const a=answers[q.id];const has=Number.isInteger(a)&&a>=0&&a<q.options.length;const ok=has&&a===q.correct;answered+=Number(has);correct+=Number(ok);const t=topics[q.topic]??={title:q.topicTitle,total:0,correct:0};t.total++;t.correct+=Number(ok);}return {total:questions.length,correct,answered,unanswered:questions.length-answered,percent:questions.length?Math.round(correct/questions.length*100):0,topics};}

// Case content stays paired with its authored German, independent of UI catalogues.
export function assessmentCopy(q,field,index){
 const a=q.assessment;
 if(a){const value=a[field],de=a[field+'_de'];return {en:index===undefined?value:value[index],de:index===undefined?de:de[index]};}
 const key=field==='stem'?'hook':field;
 return {en:index===undefined?q[key]:q[key]?.[index],de:index===undefined?q.reading?.[key+'_de']:q.reading?.[key+'_de']?.[index]};
}
export const writingFields=[
 ['complaint','Current symptoms and timing','Aktuelle Beschwerden und zeitlicher Verlauf'],
 ['allergies','Allergies and reactions','Allergien und Reaktionen'],
 ['medicines','Reported medicines','Angegebene Medikamente'],
 ['past','Past illnesses and operations','Vorerkrankungen und Operationen'],
 ['habits','Smoking, alcohol and other substances','Rauchen, Alkohol und andere Substanzen'],
 ['social','Social and family history','Sozial- und Familienanamnese'],
 ['uncertainty','What is missing or uncertain?','Was fehlt oder ist unklar?'],
 ['next','Questions still to ask','Noch offene Fragen']
];
export function saveWritingDraft(previous,fields,structured,rubric){return {...previous,...fields,structured:{...(previous?.structured||{}),...structured},rubric};}

// New attempts retain the exact assessed content when the bank is updated later.
export function resolveAttemptQuestions(attempt,bank){
 return attempt.ids.map(id=>attempt.questions?.find(q=>q.id===id)||bank.find(q=>q.id===id));
}

export function setupChoices(bank,set,requestedTopic='all'){
 const pool=set==='focused'?bank.filter(q=>q.assessment):bank;
 const topics=[...new Map(pool.map(q=>[q.topic,q.topicTitle])).entries()];
 const topic=topics.length===1?topics[0][0]:requestedTopic==='all'||topics.some(([id])=>id===requestedTopic)?requestedTopic:'all';
 const available=pool.filter(q=>topic==='all'||q.topic===topic).length;
 return {topics,topic,available,counts:available?[...new Set([10,30,60].map(n=>Math.min(n,available)))]:[]};
}
