// Objective reading exercises. Clinical decisions and free speech are not auto-scored.
export const ATTEMPT_VERSION=2;
const pair=(de,en)=>({de,en});
const clean=s=>s.toLowerCase().replace(/\s+/g,' ').trim();
// These language tasks select existing model wording, never infer new patient facts.
const speechForms={
 habe:['hat','hätte'],sei:['ist','wäre'],nehme:['nimmt','nähme'],lebe:['lebt','lebte'],
 arbeite:['arbeitet','arbeitete'],trinke:['trinkt','tränke'],rauche:['raucht','rauchte'],
 könne:['kann','könnte'],müsse:['muss','müsste'],wolle:['will','wollte'],werde:['wird','würde'],
 wisse:['weiß','wüsste'],kenne:['kennt','kennte'],fühle:['fühlt','fühlte'],gebe:['gibt','gäbe'],
 verneine:['verneint','verneinte']
};
export function reportedSpeechQuestion(profile){
 const pattern=new RegExp('\\b('+Object.keys(speechForms).join('|')+')\\b');
 const sentence=profile.presentation?.de?.split(/(?<=[.!?])\s+/).find(s=>pattern.test(s));
 if(!sentence)return null;
 const match=sentence.match(pattern),verb=match[0],gap=sentence.slice(0,match.index)+'____'+sentence.slice(match.index+verb.length);
 const feedback=[
  pair(`„${verb}“ ist hier Konjunktiv I. Der Satz gibt eine berichtete Angabe wieder; er bestätigt keinen Untersuchungsbefund.`,`“${verb}” is Konjunktiv I here. The sentence reports information; it does not confirm an examination finding.`),
  pair(`„${speechForms[verb][0]}“ ist Indikativ. Gesucht ist ausdrücklich Konjunktiv I. Indikativ kann in anders formulierter indirekter Rede möglich sein.`,`“${speechForms[verb][0]}” is indicative. This task explicitly asks for Konjunktiv I. Indicative can be possible in differently framed reported speech.`),
  pair(`„${speechForms[verb][1]}“ ist nicht die gesuchte Konjunktiv-I-Form. Andere Redeformen sind nicht grundsätzlich falsch; hier wird eine bestimmte Form geübt.`,`“${speechForms[verb][1]}” is not the requested Konjunktiv I form. Other reporting forms are not inherently wrong; this task practises one specific form.`)
 ];
 return {id:`speech:${profile.id}`,type:'speech',profileId:profile.id,patient:profile.patient.name,
 question:pair('Ergänzen Sie den deutschen Berichtssatz ausdrücklich im Konjunktiv I. Welche Form passt in die Lücke?','Complete the German reporting sentence specifically using Konjunktiv I (reported speech). Which form fits the gap?'),
 stimulus:[{label:pair('Deutscher Satz','German sentence'),value:pair(gap,gap)}],
 options:[verb,...speechForms[verb]].map(v=>pair(v,v)),correct:0,optionFeedback:feedback,
 explanation:feedback[0],evidence:pair(sentence,sentence),source:pair('Verfasste deutsche Patientenvorstellung dieses Profils','Authored German presentation in this profile'),facts:profile.facts};
}
export function presentationOrderQuestion(profile,index=0){
 const find=keys=>keys.map(k=>profile.facts.find(f=>f.key===k)).find(Boolean);
 const sections=[find(['identity']),find(['complaint','onset','urinary','reason']),find(['unknown','findings','examination'])];
 if(sections.some(s=>!s))return null;
 const permutations=[[1,2,0],[2,0,1],[0,2,1],[2,1,0],[1,0,2],[0,1,2]],order=permutations[index%permutations.length];
 const letters=['A','B','C'],correct=[0,1,2].map(n=>letters[order.indexOf(n)]);
 const alternatives=[correct,[correct[1],correct[0],correct[2]],[correct[0],correct[2],correct[1]]];
 const rationale=pair('Für die vorgegebene Übungsstruktur: zuerst die Person, dann Anlass oder zeitlicher Verlauf, zuletzt den Befundstand und offene Fragen. Andere Gesprächssituationen erlauben andere Reihenfolgen. Dringende Hilfe hat immer Vorrang.','For the specified practice structure: first the person, then reason or timing, and finally available findings and open questions. Other situations allow different orders. Urgent help always takes priority.');
 return {id:`order:${profile.id}`,type:'order',profileId:profile.id,patient:profile.patient.name,
 question:pair('Ordnen Sie diese drei Ausschnitte für eine spätere, ruhige Vorstellung: Person → Anlass/Verlauf → Befundstand/offene Fragen. Welche Reihenfolge folgt genau dieser Vorgabe? Keine Anleitung zur Reihenfolge akuter Versorgung.','Arrange these three extracts for a later, calm presentation: person → reason/course → findings/open questions. Which order follows this specific structure? This is not a sequence for acute care.'),
 stimulus:order.map((n,i)=>({label:pair(letters[i],letters[i]),value:sections[n].value})),
 options:alternatives.map(a=>pair(`Zuerst ${a[0]}, dann ${a[1]}, zuletzt ${a[2]}`,`First ${a[0]}, then ${a[1]}, last ${a[2]}`)),correct:0,
 optionFeedback:[rationale,pair('Diese Folge setzt den Anlass vor die Person. Sie erfüllt daher die hier vorgegebene Reihenfolge nicht.','This sequence puts the reason before the person, so it does not follow the structure requested here.'),pair('Diese Folge setzt den Befundstand vor den Anlass. Sie erfüllt daher die hier vorgegebene Reihenfolge nicht.','This sequence puts findings before the reason, so it does not follow the structure requested here.')],
 explanation:rationale,evidence:pair(sections.map(f=>f.value.de).join(' → '),sections.map(f=>f.value.en).join(' → ')),
 source:pair('Drei unveränderte Ausschnitte aus der Faktenkarte','Three unchanged extracts from the fact card'),facts:profile.facts};
}
export function buildSkillQuestions(profiles,glossary){
 const out=[];
 const factFor=p=>p.facts.find(f=>/^(onset|timing|urinary)$/.test(f.key))||p.facts.find(f=>f.key!=='identity');
 for(const [i,p] of profiles.entries()){
  out.push(...[reportedSpeechQuestion(p),presentationOrderQuestion(p,i)].filter(Boolean));
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
