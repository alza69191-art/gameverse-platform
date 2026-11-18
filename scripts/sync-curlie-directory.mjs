import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createWriteStream} from "node:fs";
import {Readable} from "node:stream";
import {pipeline} from "node:stream/promises";
import {execFileSync} from "node:child_process";
import readline from "node:readline";

const maxEntries=Math.max(1000,Math.min(50000,Number(process.env.CURLIE_MAX_ENTRIES||25000)));
const archive=path.join(os.tmpdir(),"curlie-rdf-all.tar.gz");
const work=path.join(os.tmpdir(),"gameverse-curlie");
const response=await fetch("https://curlie.org/directory-dl",{headers:{"user-agent":"GameVerse-Catalog-Sync/1.0","accept":"application/gzip,application/octet-stream"},signal:AbortSignal.timeout(180000)});
if(!response.ok||!response.body)throw new Error("Curlie download failed: "+response.status);
await pipeline(Readable.fromWeb(response.body),createWriteStream(archive));
await fs.mkdir(work,{recursive:true});
execFileSync("tar",["-xzf",archive,"-C",work],{stdio:"inherit"});
const files=execFileSync("find",[work,"-type","f"],{encoding:"utf8"}).trim().split("\n").filter(Boolean);
const categoryFiles=files.filter(f=>/-s\.tsv$/i.test(f));
const siteFiles=files.filter(f=>/-c\.tsv$/i.test(f));
if(!siteFiles.length)throw new Error("Curlie archive did not contain expected *-c.tsv website files.");
const categories=new Map();
for(const file of categoryFiles){
 const rl=readline.createInterface({input: (await import("node:fs")).createReadStream(file),crlfDelay:Infinity});
 for await(const line of rl){const c=line.split("\t");if(c.length>=2&&c[0])categories.set(c[0],c[1]);}
}
const seen=new Set(),items=[];
const perFile=Math.max(250,Math.ceil(maxEntries/siteFiles.length));
for(const file of siteFiles){
 let inFile=0;
 const rl=readline.createInterface({input:(await import("node:fs")).createReadStream(file),crlfDelay:Infinity});
 for await(const line of rl){
  const c=line.split("\t");const url=(c[0]||"").trim();const title=(c[1]||"").trim();const description=(c[2]||"").trim();const category=categories.get((c[3]||"").trim())||"مواقع متنوعة";
  if(!/^https?:\/\//i.test(url)||!title)continue;
  let normalized;try{const u=new URL(url);if(!["http:","https:"].includes(u.protocol)||u.username||u.password)continue;u.hash="";normalized=u.href;}catch{continue}
  if(seen.has(normalized))continue;seen.add(normalized);
  items.push({id:"curlie-"+Buffer.from(normalized).toString("base64url").slice(0,32),title:title.slice(0,240),description:description.slice(0,500),category,platform:"Web",sourceUrl:normalized,license:"CC BY 3.0 — attribution required",source:"Curlie human-edited directory",verified:false});
  inFile++;
  if(items.length>=maxEntries||inFile>=perFile)break;
 }
 if(items.length>=maxEntries)break;
}
if(!items.length)throw new Error("Curlie import produced no valid website entries; refusing to overwrite.");
const output={generatedAt:new Date().toISOString(),source:"Curlie directory download",license:"CC BY 3.0",attribution:"Data from Curlie (https://curlie.org), CC BY 3.0. Titles, descriptions and URLs are directory metadata; website content and trademarks remain with their owners.",total:items.length,items};
await fs.mkdir("data",{recursive:true});
await fs.writeFile("data/site-catalog.json",JSON.stringify(output,null,2)+"\n","utf8");
console.log("Imported "+items.length+" Curlie website records from "+siteFiles.length+" category files.");
await fs.rm(work,{recursive:true,force:true});await fs.rm(archive,{force:true});
