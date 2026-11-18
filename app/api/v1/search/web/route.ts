import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const escapeLike=(value:string)=>value.replace(/[\\%_]/g,"\\$&");
export async function GET(request:NextRequest){
  const q=(request.nextUrl.searchParams.get("q")||"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,120);
  if(q.length<2)return NextResponse.json({query:q,results:[],total:0,error:"اكتب حرفين على الأقل للبحث."});
  const limit=Math.max(1,Math.min(30,Number(request.nextUrl.searchParams.get("limit")||20)||20));
  try{
    const pool=getDbPool(); const term="%"+escapeLike(q)+"%";
    const [rows]=await pool.execute(
      "SELECT p.id,p.canonical_url AS url,p.title,p.description,p.content_text AS contentText,p.language_code AS language,s.host,s.last_crawled_at AS siteUpdated FROM web_pages p JOIN web_sites s ON s.id=p.site_id WHERE p.crawl_status='indexed' AND (p.title LIKE ? ESCAPE '\\\\' OR p.description LIKE ? ESCAPE '\\\\' OR p.content_text LIKE ? ESCAPE '\\\\') ORDER BY CASE WHEN p.title LIKE ? ESCAPE '\\\\' THEN 0 WHEN p.description LIKE ? ESCAPE '\\\\' THEN 1 ELSE 2 END,p.last_crawled_at DESC LIMIT ?",
      [term,term,term,term,term,limit]
    );
    const results=(rows as any[]).map(row=>{
      const content=String(row.contentText||""); const at=content.toLocaleLowerCase().indexOf(q.toLocaleLowerCase());
      const start=Math.max(0,at<0?0:at-130); const snippet=(row.description||content.slice(start,start+300)).replace(/\s+/g," ").slice(0,320);
      return {id:row.id,url:row.url,title:row.title||row.host,description:row.description||"",snippet,host:row.host,language:row.language||null,lastCrawledAt:row.siteUpdated};
    });
    return NextResponse.json({query:q,results,total:results.length},{headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("Web search failed:",error);return NextResponse.json({query:q,results:[],total:0,error:"فهرس البحث غير جاهز حالياً. تحقق من إعداد قاعدة البيانات وتطبيق الترحيلات."},{status:503})}
}
