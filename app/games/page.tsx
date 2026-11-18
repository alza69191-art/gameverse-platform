"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { browserGames } from "@/lib/catalog";

type SubmittedGame = { id: number; title: string; slug: string; description: string; official_url: string; game_type: string };
const categories = ["الكل", ...Array.from(new Set(browserGames.map((game) => game.category)))];

export default function GamesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [submittedGames, setSubmittedGames] = useState<SubmittedGame[]>([]);
  useEffect(() => {
    fetch("/api/v1/games")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setSubmittedGames(Array.isArray(data.games) ? data.games : []))
      .catch(() => setSubmittedGames([]));
  }, []);
  const filtered = useMemo(() => browserGames.filter((game) => {
    const matchesText = (game.title + " " + game.category + " " + game.description).toLowerCase().includes(query.trim().toLowerCase());
    return matchesText && (category === "الكل" || game.category === category);
  }), [query, category]);

  return (
    <main className="site-shell catalog-page">
      <header className="topbar"><a className="brand" href="/">GAME<span>VERSE</span></a><nav className="main-nav"><a href="/">الرئيسية</a><a className="active" href="/games">الألعاب</a><a href="/libraries">مكتبة المطور</a><a href="/rules">القواعد</a></nav><a className="nav-cta" href="/libraries">للمطورين ←</a></header>
      <section className="catalog-hero"><span className="eyebrow"><i /> مكتبة GameVerse · ألعاب قابلة للعب</span><h1>اختر لعبتك،<em> وابدأ الآن.</em></h1><p>ألعاب 2D و3D حقيقية تعمل داخل المتصفح، من الألغاز الكلاسيكية إلى السباقات والعوالم المفتوحة.</p>
        <label className="catalog-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن لعبة أو نوعها..." /><kbd>بحث مباشر</kbd></label>
      </section>
      <section className="catalog-layout">
        <aside className="filters"><h3>التصنيفات</h3><div className="filter-list">{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}<span>{item === "الكل" ? browserGames.length : browserGames.filter((g) => g.category === item).length}</span></button>)}</div>
          <h3 className="filter-subtitle">نوع اللعبة</h3><div className="filter-list"><button className="selected">ألعاب متصفح HTML5</button><button onClick={() => setCategory("الكل")}>عرض الكل</button></div>
        </aside>
        <div className="catalog-results"><div className="results-head"><div><span className="eyebrow">العب مباشرة · 2D + 3D</span><h2>{category === "الكل" ? "جميع الألعاب" : category}</h2></div><span className="result-count">{filtered.length + submittedGames.length} لعبة</span></div>
          {(filtered.length || submittedGames.length) ? <div className="game-grid">
            {submittedGames.map((game) => <article className="game-card" key={"submitted-" + game.id}><div className="game-art art-2"><span className="game-art-label">لعبة مطور · {game.game_type}</span><span className="game-glyph">✧</span><span className="game-category">من المجتمع</span></div><div className="game-info"><h3>{game.title}</h3><p>{game.description}</p><div className="game-card-foot"><span>لعبة معتمدة من GameVerse</span><span>مراجعة إدارية</span></div><Link className="game-play-button" href={"/play/submitted/" + encodeURIComponent(game.slug)}>▶ العب الآن</Link></div></article>)}
            {filtered.map((game, index) => <article className="game-card" key={game.slug}><div className={"game-art " + (game.mode === "3D" ? "art-3d" : "art-" + (index % 6))}><span className="game-art-label">HTML5 · {game.mode}</span><span className="game-glyph">{["✦", "◈", "⌁", "⬡", "✧", "◉"][index % 6]}</span><span className="game-category">{game.category}</span></div><div className="game-info"><h3>{game.title}</h3><p>{game.description}</p><div className="game-card-foot"><span>{game.sourceName} · {game.license}</span><a href={game.sourceUrl} target="_blank" rel="noopener noreferrer">المصدر ↗</a></div><Link className="game-play-button" href={"/play/" + game.slug}>▶ العب الآن</Link></div></article>)}
          </div> : <div className="empty-state"><span>⌕</span><h3>لا توجد نتائج مطابقة</h3><p>جرّب كلمة بحث أخرى أو غيّر التصنيف.</p><button onClick={() => { setQuery(""); setCategory("الكل"); }}>إعادة ضبط الفلاتر</button></div>}
          <p className="catalog-note">تضم المكتبة ألعاباً من Upload Arcade ومجموعتي Games Hub وArcade 3D. تُشغّل الألعاب من خوادم مصادرها الأصلية ولا نعيد استضافة ملفاتها. تظهر معلومات المصدر والترخيص على صفحة كل لعبة؛ وقد تختلف متطلبات الاتصال والأداء بين ألعاب 2D و3D.</p>
        </div>
      </section>
      <footer className="footer"><a className="brand" href="/">GAME<span>VERSE</span></a><p>نحترم حقوق المطورين ونراجع مصدر وترخيص كل لعبة.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
    </main>
  );
}
