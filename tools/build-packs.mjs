import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
const root=process.cwd();
const data=JSON.parse(await fs.readFile(path.join(root,"src/compendium-moves.json"),"utf8"));
const packs=[["basic-moves",data.basicMoves],["playbook-moves",data.playbookMoves]];
const idFor=(id)=>createHash("sha256").update(id).digest("hex").slice(0,16);
for(const [pack,entries] of packs){
 const dir=path.join(root,"src/packs",pack);
 await fs.rm(dir,{recursive:true,force:true}); await fs.mkdir(dir,{recursive:true});
 for(const entry of entries){
  const item={_id:idFor(entry.id),name:entry.name,type:"move",img:"icons/svg/d20.svg",system:{moveType:entry.kind==="basic"?"basic":"playbook",description:entry.text,rollFormula:"",moveResults:{failure:{key:"failure",label:"6−",value:""},partial:{key:"partial",label:"7–9",value:""},success:{key:"success",label:"10–11",value:""},critical:{key:"critical",label:"12+",value:""}},uses:0,rollType:"ask",rollMod:0,actorType:"character",choices:""},flags:{ "echoes-of-destiny":{sourceId:entry.id,playbook:entry.playbook??null}}};
  await fs.writeFile(path.join(dir,entry.id+".json"),JSON.stringify(item,null,2)+"\n");
 }
 const dest=path.join(root,"packs",pack);
 await fs.rm(dest,{recursive:true,force:true});
 const sourceFiles=(await fs.readdir(dir)).filter(name=>name.endsWith(".json"));
 if(sourceFiles.length!==entries.length) throw new Error(pack+": expected "+entries.length+" JSON source documents, got "+sourceFiles.length);
 await compilePack(dir,dest,{log:true});
 const outputFiles=await fs.readdir(dest);
 if(outputFiles.length===0) throw new Error(pack+": compiler produced an empty pack directory");
}
console.log("Compendium pack build completed.");
