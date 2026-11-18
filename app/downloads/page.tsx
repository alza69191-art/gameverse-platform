"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DownloadGame={title:string;slug:string;description:string;version:string;platform:string;fileSizeBytes:number};
export default function DownloadsPage(){
  const [games,setGames]=useState<DownloadGame[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/v1/downloads",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"تعذر تحميل القائمة");setGames(d.games??[]);}).catch(e=>setError(e instanceof Error?e.message:"حدث خطأ")).finally(()=>setLoading(false));},[]);
  return <main className="site-shell catalog-page"><header className="topbar"><Link className="brand" href="/">GAME<span>VERSE</span></Link><nav className="main-nav"><Link href="/">الرئيسية</Link><Link href="/games">ألعاب المتصفح</Link><Link className="active" href="/downloads">تنزيلات</Link><Link href="/libraries">مكتبة المطور</Link><Link href="/account">حسابي</Link></nav><a className="nav-cta" href="https://gameverse-developers.onrender.com">انشر لعبتك ←</a></header>
    <section className="catalog-hero"><span className="eyebrow"><i/> ألعاب من المطورين</span><h1>حمّل لعبتك،<em> واحتفظ بها.</em></h1><p>ملفات الألعاب التي اجتازت الفحص الأمني ومراجعة الإدارة فقط.</p></section>
    <section className="downloads-grid">{loading?<p>جارٍ تحميل الألعاب...</p>:error?<p className="empty-state">{error}</p>:games.length?games.map(g=><article className="download-card" key={g.slug}><div className="eyebrow">GAMEVERSE VERIFIED · v{g.version}</div><h2>{g.title}</h2><p>{g.description}</p><div className="download-meta"><span>{g.platform}</span><span>{(Number(g.fileSizeBytes)/1024/1024).toFixed(1)} MB</span></div><a className="download-button" href={`/api/v1/games/${encodeURIComponent(g.slug)}/download`}>تنزيل اللعبة ↓</a></article>):<div className="empty-state"><h2>لا توجد تنزيلات منشورة بعد</h2><p>ستظهر الألعاب هنا بعد فحصها وموافقة الإدارة.</p><Link href="/games">تصفح متجر التنزيلات</Link></div>}</section>
    <footer className="footer"><Link className="brand" href="/">GAME<span>VERSE</span></Link><p>كل ملف تنزيل مرّ بفحص أمني ومراجعة قبل النشر.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
  </main>;
}
