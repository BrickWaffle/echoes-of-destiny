import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
const root=process.cwd();
const data=JSON.parse(await fs.readFile(path.join(root,"src/compendium-moves.json"),"utf8"));
const playbookData=JSON.parse(await fs.readFile(path.join(root,"src/compendium-playbooks.json"),"utf8"));
const packs=[["basic-moves",data.basicMoves],["playbook-moves",data.playbookMoves],["playbooks",playbookData.playbooks]];
const idFor=(id)=>createHash("sha256").update(id).digest("hex").slice(0,16);
const playbooks=["Scoundrel","Ace","Warrior","Operative","Leader","Force User","Diplomat"];
const folderIdFor=(name)=>idFor("playbook-folder:"+name);
for(const [pack,entries] of packs){
 const dir=path.join(root,"src/packs",pack);
 await fs.rm(dir,{recursive:true,force:true}); await fs.mkdir(dir,{recursive:true});
 if(pack==="playbook-moves"){
  for(const playbook of playbooks){
   const folderId=folderIdFor(playbook);
   const folder={_id:folderId,_key:"!folders!"+folderId,name:playbook,type:"Item",sorting:"a",folder:null,color:null,flags:{}};
   await fs.writeFile(path.join(dir,"folder-"+folderId+".json"),JSON.stringify(folder,null,2)+"\n");
  }
 }
 for(const entry of entries){
  if(pack==="playbooks"){
   const moveById=new Map(data.playbookMoves.map(m=>[m.id,m]));
   const moveUuid=id=>"Compendium.echoes-of-destiny.playbook-moves.Item."+idFor(id);
   const sig=moveById.get(entry.signature);
   const opts=entry.optional.map(id=>moveById.get(id));
   const echoHtml="<h3>Echoes of Destiny</h3><p>These six questions remain unanswered until invoked during play.</p><ol>"+entry.echoes.map(q=>"<li>"+q+"</li>").join("")+"</ol>";
   const desc="<p>"+entry.theme+"</p>"+echoHtml;
   const basicMoveUuid=id=>"Compendium.echoes-of-destiny.basic-moves.Item."+idFor(id);
   const basicSets=data.basicMoves.map(move=>({title:"Basic Move: "+move.name,desc:"Granted automatically to every character when this playbook is selected.",type:"single",repeatable:false,choices:[{uuid:basicMoveUuid(move.id),img:"icons/svg/d20.svg",granted:true,advancement:0}],grantOn:0,granted:true,advancement:0}));
   const choices=(arr,granted=false)=>arr.map(m=>({uuid:moveUuid(m.id),img:"icons/svg/d20.svg",granted,advancement:0}));
   const item={_id:idFor("eod-playbook-"+entry.slug),_key:"!items!"+idFor("eod-playbook-"+entry.slug),name:entry.name,type:"playbook",img:"icons/svg/book.svg",system:{description:desc,slug:entry.slug,actorType:"",stats:{[entry.abilityIncrease]:{value:1}},statsDetail:"",attributes:{},choiceSets:[...basicSets,{title:"Signature Move",desc:"Granted automatically when this playbook is selected.",type:"single",repeatable:false,choices:choices([sig],true),grantOn:0,granted:true,advancement:0},{title:"Optional Moves",desc:"Choose an optional move with the Director during play or when an advancement permits it. Do not grant these automatically at character creation.",type:"single",repeatable:false,choices:choices(opts,false),grantOn:1,granted:false,advancement:1}]},flags:{"echoes-of-destiny":{sourceId:"eod-playbook-"+entry.slug,playbook:entry.name,signatureMove:entry.signature,optionalMoves:entry.optional}}};
   await fs.writeFile(path.join(dir,"eod-playbook-"+entry.slug+".json"),JSON.stringify(item,null,2)+"\n");
   continue;
  }
  const item={_id:idFor(entry.id),_key:"!items!"+idFor(entry.id),name:entry.name,type:"move",img:"icons/svg/d20.svg",folder:entry.playbook?folderIdFor(entry.playbook):null,system:{moveType:entry.kind==="basic"?"basic":entry.kind==="signature"?"advanced":"playbook",description:entry.text,rollFormula:"",moveResults:{failure:{key:"failure",label:"6−",value:entry.results?.failure??""},partial:{key:"partial",label:"7–9",value:entry.results?.partial??""},success:{key:"success",label:"10–11",value:entry.results?.success??""},critical:{key:"critical",label:"12+",value:entry.results?.critical??""}},uses:0,rollType:"ask",rollMod:0,actorType:"character",choices:""},flags:{ "echoes-of-destiny":{sourceId:entry.id,playbook:entry.playbook??null}}};
  await fs.writeFile(path.join(dir,entry.id+".json"),JSON.stringify(item,null,2)+"\n");
 }
 const dest=path.join(root,"packs",pack);
 await fs.rm(dest,{recursive:true,force:true});
 const sourceFiles=(await fs.readdir(dir)).filter(name=>name.endsWith(".json"));
 const expectedSourceCount=entries.length+(pack==="playbook-moves"?playbooks.length:0);
 if(sourceFiles.length!==expectedSourceCount) throw new Error(pack+": expected "+expectedSourceCount+" JSON source documents including folders, got "+sourceFiles.length);
 await compilePack(dir,dest,{log:true});
 const outputFiles=await fs.readdir(dest);
 if(!outputFiles.includes("CURRENT") || !outputFiles.some(name=>name.startsWith("MANIFEST-"))) throw new Error(pack+": compiler did not create a LevelDB pack");
 const verify=path.join(root,".pack-verify",pack);
 await fs.rm(verify,{recursive:true,force:true});
 const {extractPack}=await import("@foundryvtt/foundryvtt-cli");
 await extractPack(dest,verify,{log:false});
 const countJson=async dir=>(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?countJson(path.join(dir,e.name)):e.isFile()&&e.name.endsWith(".json")?1:0))).reduce((a,b)=>a+b,0);
 const count=await countJson(verify);
 const expectedCount=entries.length+(pack==="playbook-moves"?playbooks.length:0);
 if(count!==expectedCount) throw new Error(pack+": round-trip expected "+expectedCount+" documents including folders, got "+count);
 if(pack==="playbooks"){
  const docs=[];
  const walk=async d=>{for(const e of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())await walk(p);else if(e.isFile()&&e.name.endsWith(".json"))docs.push(JSON.parse(await fs.readFile(p,"utf8")));}};
  await walk(verify);
  const playDocs=docs.filter(d=>d.type==="playbook");
  const expectedStats={scoundrel:"wits",ace:"agility",warrior:"might",operative:"wits",leader:"presence","force-user":"force",diplomat:"presence"};
  if(playDocs.length!==7||playDocs.some(p=>{const sets=p.system.choiceSets??[];const basics=sets.slice(0,3);const signature=sets.find(s=>s.title==="Signature Move");const optional=sets.find(s=>s.title==="Optional Moves");const slug=p.system.slug;const stat=expectedStats[slug];return !stat||p.system.stats?.[stat]?.value!==1||Object.keys(p.system.stats??{}).length!==1||basics.length!==3||basics.some(s=>s.choices?.length!==1||s.choices[0]?.granted!==true||s.granted!==true||s.grantOn!==0)||signature?.choices?.length!==1||signature.choices[0]?.granted!==true||optional?.choices?.length!==5||optional.choices.some(c=>c.granted!==false)||optional.granted!==false;})) throw new Error("Playbook ability or move grant validation failed");
 }
 if(pack==="playbook-moves"){
  const extracted=(await fs.readdir(verify,{withFileTypes:true}));
  const docs=[];
  const walk=async d=>{for(const e of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())await walk(p);else if(e.isFile()&&e.name.endsWith(".json"))docs.push(JSON.parse(await fs.readFile(p,"utf8")));}};
  await walk(verify);
  const folders=docs.filter(d=>d.type==="Item"&&d.name&&playbooks.includes(d.name)&&d._key?.startsWith("!folders!"));
  const assigned=docs.filter(d=>d.type==="move"&&d.folder);
  if(folders.length!==7||assigned.length!==42) throw new Error("Playbook folder assignment validation failed: "+folders.length+" folders, "+assigned.length+" assigned moves");
  const signatures=docs.filter(d=>d.type==="move"&&d.system?.moveType==="advanced");
  const rolled=["eod-scoundrel-never-tell-me-the-odds","eod-scoundrel-one-last-hand","eod-ace-that-s-impossible","eod-warrior-my-word-is-my-bond","eod-force-user-reach-through-the-force","eod-diplomat-make-them-an-offer","eod-diplomat-you-don-t-want-a-war"];
  const bySource=new Map(docs.filter(d=>d.type==="move").map(d=>[d.flags?.["echoes-of-destiny"]?.sourceId,d]));
  if(signatures.length!==7||rolled.some(id=>{const r=bySource.get(id)?.system?.moveResults;return !r||["failure","partial","success","critical"].some(k=>!r[k]?.value);})) throw new Error("Signature category or roll-result validation failed");
 }
 await fs.rm(verify,{recursive:true,force:true});
}
console.log("Compendium pack build completed.");
