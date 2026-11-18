"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
type Result={id:number;url:string;title:string;description:string;snippet:string;host:string;language?:string|null;lastCrawledAt?:string|null};
export default function SearchPage(){
 const [q,setQ]=useState("");const [results,setResults]=useState<Result[]>([]);const [busy,setBusy]=useState(false);const [searched,setSearched]=useState(false);const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();if(q.trim().length<2)return;setBusy(true);setError("");setSearched(true);try{const r=await fetch("/api/v1/search/web?q="+encodeURIComponent(q.trim()),{cache:"no-store"});const d=await r.json();setResults(d.results||[]);setError(d.error||"")}catch{setError("تعذر الاتصال بمحرك البحث.")}finally{setBusy(false)}}
 return <main className="site-shell"><header className="topbar"><Link className="brand" href="/">GAME<span>VERSE</span></Link><nav className="main-nav"><Link href="/">الرئيسية</Link><Link href="/games">الألعاب</Link><Link href="/store">المتجر</Link><Link href="/sites">دليل المواقع</Link><Link className="active" href="/search">محرك البحث</Link></nav><Link className="nav-cta" href="/sites">المصادر ↗</Link></header>
 <section className="catalog-hero"><span className="eyebrow"><i/> GAMEVERSE WEB SEARCH</span><h1>ابحث في <em>محتوى الويب.</em></h1><p>ابحث داخل الصفحات التي فهرسها GameVerse، وليس أسماء المواقع فقط. يتوسع الفهرس تدريجياً مع احترام تعليمات المواقع.</p>
 <form className="catalog-search" onSubmit={submit}><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن معلومة أو موضوع أو صفحة..." aria-label="عبارة البحث"/><button type="submit" disabled={busy} style={{background:"var(--accent)",border:0,borderRadius:8,padding:"12px 18px",font:"inherit",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>{busy?"يبحث...":"ابحث"}</button></form></section>
 <section style={{padding:"10px 3% 70px"}}><div className="results-head"><div><span className="eyebrow">نتائج الفهرس</span><h2>{searched?"نتائج البحث":"ابدأ البحث في صفحات الويب"}</h2></div><span className="result-count">{results.length} نتيجة</span></div>
 {error&&<p className="catalog-note">{error}</p>}
 {!searched&&<div className="empty-state"><span>⌕</span><h3>محرك البحث الداخلي في GameVerse</h3><p>ابدأ بكتابة كلمة أو عبارة للبحث في الصفحات المفهرسة.</p></div>}
 {searched&&!busy&&!results.length&&!error&&<div className="empty-state"><span>⌕</span><h3>لا توجد نتائج بعد</h3><p>قد لا تكون الصفحات المطلوبة دخلت الفهرس بعد. سيكبر الفهرس مع دورات الزحف القادمة.</p></div>}
 <div style={{display:"grid",gap:14}}>{results.map(r=><article key={r.id} className="feature-card"><a href={r.url} target="_blank" rel="noopener noreferrer nofollow" style={{color:"#ff995a",fontSize:16,fontWeight:800,textDecoration:"none"}}>{r.title||r.host}</a><p style={{margin:"8px 0",color:"#8fd19e",fontSize:11}}>{r.host} · {r.url}</p><p>{r.snippet||r.description}</p></article>)}</div>
 <p className="catalog-note">الفهرس يحفظ عناوين الصفحات وأوصافها ونصوصاً مستخرجة للبحث. لا يخزّن نسخ HTML كاملة ولا يعرض محتوى المواقع كاملاً.</p></section>
 <footer className="footer"><Link className="brand" href="/">GAME<span>VERSE</span></Link><p>اكتشاف الويب يبدأ من هنا.</p><span>© {new Date().getFullYear()} GameVerse</span></footer></main>
}
