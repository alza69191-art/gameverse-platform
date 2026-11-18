"use client";

import { useEffect, useMemo, useState } from "react";

type Game = { title: string; category: string; platform: string; mode: string; description: string; source: string; sourceName: string; featured?: boolean };
const games: Game[] = [
  { title: "Kenney Solitaire", category: "ألعاب ورق", platform: "متصفح", mode: "2D", description: "لعبة سوليتير مجانية من صانع الأصول Kenney، تعمل من المتصفح.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io", featured: true },
  { title: "Pixepal", category: "منصات", platform: "متصفح", mode: "2D", description: "لعبة منصات قصيرة منشورة ضمن ألعاب Kenney المجانية.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
  { title: "KeyCars", category: "سباقات", platform: "متصفح", mode: "2D", description: "تحدٍّ سريع يعتمد على لوحة المفاتيح، من ألعاب Kenney المجانية.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
  { title: "Leadersheep", category: "استراتيجية", platform: "متصفح", mode: "2D", description: "لعبة استراتيجية صغيرة منشورة ضمن مجموعة ألعاب Kenney المجانية.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
  { title: "Wizards & Dinosaurs", category: "أكشن", platform: "متصفح", mode: "2D", description: "لعبة أكشن متصفح من مجموعة ألعاب Kenney.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
  { title: "Oopi's Quest", category: "مغامرات", platform: "متصفح", mode: "2D", description: "مغامرة ألغاز بطابع كلاسيكي، معروضة على صفحة المطور.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
  { title: "Davilex Tycoon", category: "محاكاة", platform: "متصفح", mode: "2D", description: "لعبة إدارة ومحاكاة منشورة ضمن كتالوج Kenney.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
  { title: "MakeGame", category: "إبداع", platform: "متصفح", mode: "2D", description: "مساحة تفاعلية للتجربة وصناعة الألعاب ضمن مجتمع Kenney.", source: "https://kenney.itch.io/", sourceName: "Kenney · itch.io" },
];
const categories = ["الكل", "أكشن", "مغامرات", "ألغاز", "سباقات", "استراتيجية", "ألعاب ورق", "منصات", "محاكاة", "إبداع"];
const platforms = ["الكل", "متصفح", "كمبيوتر", "هاتف"];

export default function GamesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [platform, setPlatform] = useState("الكل");
  const [mode, setMode] = useState("الكل");
  useEffect(() => { const params = new URLSearchParams(window.location.search); setQuery(params.get("q") || ""); setCategory(params.get("category") || "الكل"); setPlatform(params.get("platform") || "الكل"); }, []);
  const filtered = useMemo(() => games.filter((game) => {
    const text = (game.title + " " + game.category + " " + game.description).toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (category === "الكل" || game.category === category) && (platform === "الكل" || game.platform === platform) && (mode === "الكل" || game.mode === mode);
  }), [query, category, platform, mode]);
  return (
    <main className="site-shell catalog-page">
      <header className="topbar"><a className="brand" href="/">GAME<span>VERSE</span></a><nav className="main-nav"><a href="/">الرئيسية</a><a className="active" href="/games">الألعاب</a><a href="/libraries">مكتبة المطور</a></nav><a className="nav-cta" href="/libraries">للمطورين ←</a></header>
      <section className="catalog-hero"><span className="eyebrow"><i /> مكتبة GameVerse</span><h1>اختر لعبتك،<em> وابدأ الآن.</em></h1><p>ابحث في الألعاب واستخدم التصنيفات لتصل إلى النوع الذي تحبه.</p>
        <label className="catalog-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اكتب اسم اللعبة أو نوعها..." /><kbd>بحث مباشر</kbd></label>
      </section>
      <section className="catalog-layout">
        <aside className="filters"><h3>التصنيفات</h3><div className="filter-list">{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}<span>{item === "الكل" ? games.length : games.filter(g => g.category === item).length}</span></button>)}</div>
          <h3 className="filter-subtitle">المنصة</h3><div className="filter-list">{platforms.map((item) => <button key={item} className={platform === item ? "selected" : ""} onClick={() => setPlatform(item)}>{item}</button>)}</div>
          <h3 className="filter-subtitle">الأبعاد</h3><div className="filter-list">{["الكل", "2D", "3D"].map((item) => <button key={item} className={mode === item ? "selected" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
        </aside>
        <div className="catalog-results"><div className="results-head"><div><span className="eyebrow">اكتشف شيئاً جديداً</span><h2>{category === "الكل" ? "جميع الألعاب" : category}</h2></div><span className="result-count">{filtered.length} لعبة</span></div>
          {filtered.length ? <div className="game-grid">{filtered.map((game, index) => <article className="game-card" key={game.title}><div className={"game-art art-" + (index % 6)}><span className="game-art-label">{game.mode} · {game.platform}</span><span className="game-glyph">{["✦", "◈", "⌁", "⬡", "✧", "◉"][index % 6]}</span><span className="game-category">{game.category}</span></div><div className="game-info"><h3>{game.title}</h3><p>{game.description}</p><div className="game-card-foot"><span>{game.sourceName}</span><a href={game.source} target="_blank" rel="noopener noreferrer">استكشف المصدر ↗</a></div></div></article>)}</div> : <div className="empty-state"><span>⌕</span><h3>لا توجد نتائج مطابقة</h3><p>جرّب كلمة بحث أخرى أو غيّر التصنيف.</p><button onClick={() => { setQuery(""); setCategory("الكل"); setPlatform("الكل"); setMode("الكل"); }}>إعادة ضبط الفلاتر</button></div>}
          <p className="catalog-note">هذه روابط اكتشاف لمصدر اللعبة، وليست استضافة داخل GameVerse. سيتم إضافة الألعاب المستضافة بعد التحقق من ملفاتها وتراخيص إعادة النشر.</p>
        </div>
      </section>
      <footer className="footer"><a className="brand" href="/">GAME<span>VERSE</span></a><p>الألعاب تُضاف إلى المكتبة بعد مراجعة المصدر وحقوق الاستخدام.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
    </main>
  );
}
