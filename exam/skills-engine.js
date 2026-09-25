// Objective reading exercises. Clinical decisions and free speech are not auto-scored.
export const ATTEMPT_VERSION=2;
const pair=(de,en)=>({de,en});
const clean=s=>s.toLowerCase().replace(/\s+/g,' ').trim();
export function buildSkillQuestions(profiles,glossary){
 const out=[];
 const factFor=p=>p.facts.find(f=>/^(onset|timing|urinary)$/.test(f.key))||p.facts.find(f=>f.key!=='identity');
 for(const [i,p] of profiles.entries()){
  const fact=factFor(p),other=profiles.filter(x=>x.id!==p.id).map(factFor).filter(f=>f&&clean(f.value.de)!==clean(fact.value.de));
  const distractors=[...new Map(other.map(f=>[clean(f.value.de),f])).values()].slice(i%3,i%3+2);
  if(fact&&distractors.length===2)out.push({id:`recall:${p.id}`,type:'recall',profileId:p.id,patient:p.patient.name,
   question:pair('Welche Angabe steht in dieser Faktenkarte?','Which statement appears in this fact card?'),
   options:[fact.value,...distractors.map(f=>f.value)],correct:0,
   explanation:pair('Diese Angabe stammt aus der Faktenkarte. Die anderen Angaben gehören zu anderen erfundenen Profilen.','This statement comes from the fact card. The other statements belong to other fictional profiles.'),
   evidence:fact.value,source:pair('Faktenkarte · '+fact.label.de,'Fact card · '+fact.label.en),facts:p.facts});
  const unknown=p.followups.find(f=>f.type==='unknown');
  if(unknown)out.push({id:`unknown:${p.id}`,type:'unknown',profileId:p.id,patient:p.patient.name,
   question:pair(`Rückfrage: ${unknown.question.de} Welche Dokumentation passt zur Faktenkarte?`,`Follow-up: ${unknown.question.en} Which documentation matches the fact card?`),
   options:[pair('Als offen kennzeichnen und gezielt klären.','Mark it as unknown and clarify it specifically.'),pair('Als verneint dokumentieren, weil keine Angabe vorliegt.','Document it as denied because no information is given.'),pair('Als unauffällig übernehmen, solange kein Befund dagegen spricht.','Record it as normal unless a finding contradicts it.')],correct:0,
   explanation:unknown.answer,evidence:unknown.answer,source:pair('Verfasste Rückfrage dieses Profils','Authored follow-up in this profile'),facts:p.facts});
 }
 // Explicit contrast groups avoid random, overlapping clinical definitions.
 const groups=[['Pruritus','Myalgie','Ödem'],['Dysphagie','Odynophagie','Dysphonie'],['Nausea','Emesis','Regurgitation'],['Tachykardie','Bradykardie','Palpitation'],['Hämaturie','Hämatemesis','Hämatochezie'],['Inspiration','Exspiration','Tachypnoe'],['Obstipation','Diarrhö','Meteorismus'],['Myopie','Katarakt','Glaukom'],['Epistaxis','Rhinorrhö','Hypakusis'],['Hypoglykämie','Hypercholesterinämie','Arterielle Hypertonie']];
 for(const terms of groups){const entries=terms.map(t=>glossary.entries.find(e=>e.term===t));if(entries.some(e=>!e))continue;
  for(const e of entries)out.push({id:`language:${e.id}`,type:'language',profileId:null,patient:'',
   question:pair(`Was bedeutet „${e.term}“ in einfacher Sprache?`,`What does “${e.term}” mean in everyday language?`),
   options:entries.map(x=>pair(x.de,x.en)),correct:entries.indexOf(e),explanation:pair(e.example_de,`Everyday meaning: ${e.en}.`),evidence:pair(e.de,e.en),source:pair(`Wortschatz · ${e.term}`,`Glossary · ${e.term}`),facts:[]});
 }
 return out;
}
export function practiceStages(profile){return [
 {id:'facts',de:'Faktenkarte',en:'Fact card'}, {id:'report',de:'Bericht',en:'Report'},
 {id:'handover',de:'Vorstellung',en:'Presentation'}, {id:'followups',de:'10 Rückfragen',en:'10 follow-ups'}];}
export function practiceFollowups(profile){
 const indices=[...profile.followups.keys()],known=indices.filter(i=>profile.followups[i].type!=='unknown'),unknown=indices.filter(i=>profile.followups[i].type==='unknown');
 return [...new Set([...known.slice(0,7),...unknown.slice(0,2),...known.slice(7),...indices])].slice(0,10);
}
export function startPracticeRun(profile,now=Date.now(),timed=false){return {attempt_version:ATTEMPT_VERSION,profileId:profile.id,profile:structuredClone(profile),stage:0,started:now,timed,finished:null,report:'',handover:'',answers:{},followupIndices:practiceFollowups(profile)};}
export function elapsedSeconds(run,now=Date.now()){return Math.max(0,Math.floor(((run.finished||now)-run.started)/1000));}
export function legacyAttemptNotice(attempt){return !Array.isArray(attempt.questions);}
export function viewDataCounts(bank,profiles,glossary){const skills=buildSkillQuestions(profiles,glossary);return {home:bank.length,setup:bank.length,writing:bank.length,profiles:profiles.length,glossary:glossary.entries.length,skills:skills.length,practice:profiles.filter(p=>p.followups.length>=10).length};}
