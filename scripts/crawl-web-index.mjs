import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { createHash } from "node:crypto";

const raw = process.env.GAMEVERSE_DATABASE_URL || process.env.DATABASE_URL;
if (!raw) throw new Error("Set GAMEVERSE_DATABASE_URL (or DATABASE_URL) before running the crawler.");
const maxPages = Math.max(1, Math.min(250, Number(process.env.CRAWL_MAX_PAGES || 80)));
const userAgent = "GameVerseBot/1.0 (+https://gameverse-platform.onrender.com/search)";
const url = new URL(raw);
const db = await mysql.createConnection({
  host:url.hostname, port:Number(url.port||4000), user:decodeURIComponent(url.username),
  password:decodeURIComponent(url.password), database:decodeURIComponent(url.pathname.replace(/^\//,"")),
  ssl:{minVersion:"TLSv1.2"}
});
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
const publicIPv4 = ip => {
  const p=ip.split(".").map(Number); if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
  const [a,b]=p;
  return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19)));
};
const publicIPv6 = ip => {
  const v=ip.toLowerCase().split("%")[0];
  if(v==="::1"||v==="::"||v.startsWith("fc")||v.startsWith("fd")||v.startsWith("fe8")||v.startsWith("fe9")||v.startsWith("fea")||v.startsWith("feb"))return false;
  return /^2[0-9a-f]{3}:/.test(v);
};
async function assertPublicHost(host) {
  const h=host.toLowerCase().replace(/^\[|\]$/g,"");
  if(h==="localhost"||h.endsWith(".localhost")||h.endsWith(".local")||h.endsWith(".internal"))throw new Error("Private hostname blocked");
  if(net.isIP(h)===4){if(!publicIPv4(h))throw new Error("Private IP blocked");return}
  if(net.isIP(h)===6){if(!publicIPv6(h))throw new Error("Private IPv6 blocked");return}
  const records=await lookup(h,{all:true,verbatim:true});
  if(!records.length||records.some(r=>net.isIP(r.address)===4?!publicIPv4(r.address):!publicIPv6(r.address)))throw new Error("Hostname resolves to a non-public address");
}
function normalizeUrl(value, base) {
  try {
    const u=new URL(value,base);
    if(!["http:","https:"].includes(u.protocol)||u.username||u.password)return null;
    u.hash=""; u.hostname=u.hostname.toLowerCase();
    if((u.protocol==="https:"&&u.port==="443")||(u.protocol==="http:"&&u.port==="80"))u.port="";
    if(u.pathname.length>700||u.href.length>1900)return null;
    return u;
  } catch { return null; }
}
async function safeFetch(startUrl, maxRedirects=4) {
  let current=new URL(startUrl);
  for(let i=0;i<=maxRedirects;i++){
    await assertPublicHost(current.hostname);
    const response=await fetch(current,{redirect:"manual",signal:AbortSignal.timeout(15000),headers:{"User-Agent":userAgent,"Accept":"text/html,application/xhtml+xml;q=0.9,*/*;q=0.1"}});
    if([301,302,303,307,308].includes(response.status)){
      const loc=response.headers.get("location"); if(!loc)throw new Error("Redirect without location");
      const next=normalizeUrl(loc,current); if(!next)throw new Error("Unsafe redirect");
      current=next; continue;
    }
    return {response,url:current};
  }
  throw new Error("Too many redirects");
}
const robotsCache=new Map();
async function robotsAllowed(pageUrl) {
  const origin=pageUrl.origin;
  if(!robotsCache.has(origin)){
    let rules=[];
    try{
      const {response}=await safeFetch(origin+"/robots.txt",2);
      if(response.ok){
        const txt=(await response.text()).slice(0,100000);
        let active=false;
        for(const line of txt.split(/\r?\n/)){
          const s=line.split("#")[0].trim(); if(!s)continue;
          const m=s.match(/^([^:]+):\s*(.*)$/); if(!m)continue;
          const key=m[1].toLowerCase(), value=m[2].trim();
          if(key==="user-agent"){active=value==="*"||value.toLowerCase().includes("gameversebot")}
          else if(active&&(key==="disallow"||key==="allow")&&value)rules.push({key,path:value});
        }
      }
    }catch{rules=[]}
    robotsCache.set(origin,rules);
  }
  const path=pageUrl.pathname+pageUrl.search;
  const matching=robotsCache.get(origin).filter(r=>path.startsWith(r.path)).sort((a,b)=>b.path.length-a.path.length);
  return !matching.length||matching[0].key==="allow";
}
function decodeEntities(s){return s.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)||32)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)||32))}
function textFromHtml(html){
  return decodeEntities(html.replace(/<(script|style|noscript|svg|canvas|template)[^>]*>[\s\S]*?<\/\1>/gi," ").replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/section|\/article|\/tr)[^>]*>/gi,"\n").replace(/<[^>]+>/g," ").replace(/[\t\r ]+/g," ").replace(/\n\s+/g,"\n")).replace(/\n{3,}/g,"\n\n").trim().slice(0,60000);
}
function extract(html,pageUrl){
  const title=decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/<[^>]+>/g," ").trim()).slice(0,500);
  const description=decodeEntities(html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)/i)?.[1]||"").slice(0,1000);
  const canonicalRaw=html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)/i)?.[1];
  const canonical=canonicalRaw?normalizeUrl(canonicalRaw,pageUrl):pageUrl;
  const robots=(html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1]||"").toLowerCase();
  const language=html.match(/<html[^>]+lang=["']([^"']+)/i)?.[1]?.slice(0,12)||null;
  const body=textFromHtml(html);
  const links=[]; const re=/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi; let m;
  while((m=re.exec(html))!==null&&links.length<1000){const u=normalizeUrl(m[1],pageUrl);if(u&&u.hostname===pageUrl.hostname&&!/\.(?:pdf|zip|rar|7z|png|jpe?g|gif|webp|svg|mp[34]|exe|dmg|apk|deb|rpm)(?:$|\?)/i.test(u.pathname))links.push(u.href)}
  return {title,description,canonical:canonical||pageUrl,language,body,links,noindex:/\bnoindex\b/.test(robots)};
}
async function ensureSite(root){
  const host=root.hostname.toLowerCase();
  await db.execute("INSERT INTO web_sites(host,root_url,status) VALUES(?,?, 'active') ON DUPLICATE KEY UPDATE root_url=VALUES(root_url),status=IF(status='blocked','blocked','active')",[host,root.href]);
  const [rows]=await db.execute("SELECT id FROM web_sites WHERE host=?",[host]); return rows[0].id;
}
async function enqueue(siteId,href){
  await db.execute("INSERT IGNORE INTO web_crawl_queue(site_id,page_url,status) VALUES(?,?,'pending')",[siteId,href]);
}
const seeds=JSON.parse(await fs.readFile("data/web-search-seeds.json","utf8")).seeds;
for(const value of seeds){const u=normalizeUrl(value);if(!u)continue;try{const siteId=await ensureSite(u);await enqueue(siteId,u.href)}catch(e){console.warn("Seed rejected:",value,String(e).slice(0,180))}}
let indexed=0,skipped=0,failed=0;
while(indexed+skipped+failed<maxPages){
  const [rows]=await db.execute("SELECT id,site_id,page_url FROM web_crawl_queue WHERE status='pending' AND available_at<=CURRENT_TIMESTAMP ORDER BY priority DESC,id ASC LIMIT 1");
  if(!rows.length)break;
  const job=rows[0]; await db.execute("UPDATE web_crawl_queue SET status='processing',attempts=attempts+1 WHERE id=?",[job.id]);
  try{
    const pageUrl=normalizeUrl(job.page_url); if(!pageUrl)throw new Error("Invalid URL");
    if(!await robotsAllowed(pageUrl)){await db.execute("UPDATE web_crawl_queue SET status='skipped' WHERE id=?",[job.id]);skipped++;continue}
    const {response,url:finalUrl}=await safeFetch(pageUrl.href);
    const type=response.headers.get("content-type")||"";
    if(!response.ok||!/(text\/html|application\/xhtml\+xml)/i.test(type)){await db.execute("UPDATE web_crawl_queue SET status='skipped' WHERE id=?",[job.id]);skipped++;continue}
    const declared=Number(response.headers.get("content-length")||0); if(declared>1800000)throw new Error("Page too large");
    const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>1800000)throw new Error("Page too large");
    const html=bytes.toString("utf8"); const data=extract(html,finalUrl);
    if(data.noindex||!data.body||data.body.length<80){await db.execute("UPDATE web_crawl_queue SET status='skipped' WHERE id=?",[job.id]);skipped++;continue}
    const hash=createHash("sha256").update(data.title+"\n"+data.description+"\n"+data.body).digest("hex");
    await db.execute("INSERT INTO web_pages(site_id,canonical_url,title,description,content_text,language_code,http_status,content_hash,crawl_status,last_crawled_at) VALUES(?,?,?,?,?,?,?,?, 'indexed',CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE site_id=VALUES(site_id),title=VALUES(title),description=VALUES(description),content_text=VALUES(content_text),language_code=VALUES(language_code),http_status=VALUES(http_status),content_hash=VALUES(content_hash),crawl_status='indexed',last_crawled_at=CURRENT_TIMESTAMP",[job.site_id,data.canonical.href,data.title,data.description,data.body,data.language,response.status,hash]);
    await db.execute("UPDATE web_crawl_queue SET status='done' WHERE id=?",[job.id]);
    await db.execute("UPDATE web_sites SET pages_indexed=(SELECT COUNT(*) FROM web_pages WHERE site_id=?),last_crawled_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?",[job.site_id,job.site_id]);
    for(const link of new Set(data.links)){await enqueue(job.site_id,link)}
    indexed++; console.log("Indexed",data.canonical.href);
    await sleep(1500);
  }catch(e){
    failed++; const message=String(e?.message||e).slice(0,450);
    await db.execute("UPDATE web_crawl_queue SET status=IF(attempts>=3,'failed','pending'),available_at=DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 30 MINUTE) WHERE id=?",[job.id]);
    await db.execute("UPDATE web_sites SET last_error=? WHERE id=?",[message,job.site_id]);
    console.warn("Crawl failed:",job.page_url,message);
  }
}
const [[totals]]=await db.query("SELECT (SELECT COUNT(*) FROM web_sites) AS sites,(SELECT COUNT(*) FROM web_pages WHERE crawl_status='indexed') AS pages,(SELECT COUNT(*) FROM web_crawl_queue WHERE status='pending') AS queued");
console.log(JSON.stringify({indexedThisRun:indexed,skipped,failed,...totals}));
await db.end();
