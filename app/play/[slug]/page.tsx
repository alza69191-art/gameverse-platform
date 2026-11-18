import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrowserGame } from "@/lib/catalog";
import GameCommunity from "@/components/game-community";

export default async function PlayGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getBrowserGame(slug);
  if (!game) notFound();

  return (
    <main className="site-shell play-page">
      <header className="topbar"><a className="brand" href="/">GAME<span>VERSE</span></a><nav className="main-nav"><a href="/">الرئيسية</a><a className="active" href="/games">الألعاب</a><a href="/libraries">مكتبة المطور</a><a href="/rules">القواعد</a><a href="/account">حسابي</a></nav><Link className="nav-cta" href="/games">كل الألعاب ←</Link></header>
      <section className="play-heading"><div><span className="eyebrow"><i /> تشغيل مباشر · {game.mode} HTML5/WebGL</span><h1>{game.title}</h1><p>{game.description}</p></div><Link className="back-to-games" href="/games">← العودة إلى المكتبة</Link></section>
      <section className="game-player-shell">
        <div className="game-player-top"><span>GAMEVERSE PLAYER</span><span>{game.category} · {game.mode}</span></div>
        <iframe className="game-player-frame" src={game.embedUrl} title={game.title + " - GameVerse game player"} allow="fullscreen; gamepad; autoplay; accelerometer; gyroscope" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals" />
        <div className="game-player-credit">اللعبة مقدمة من <a href={game.sourceUrl} target="_blank" rel="noopener noreferrer">{game.sourceName}</a> · الترخيص المعلن: {game.license}</div>
      </section>
      <section className="game-details"><article><span>طريقة التحكم</span><strong>{game.controls}</strong></article><article><span>التصنيف</span><strong>{game.category}</strong></article><article><span>المنصة</span><strong>المتصفح · {game.mode} · الكمبيوتر والهاتف</strong></article></section>
      <GameCommunity slug={game.slug} />
      <section className="play-actions"><a href={game.sourceUrl} target="_blank" rel="noopener noreferrer">فتح صفحة اللعبة الأصلية ↗</a><Link href="/games">اكتشف ألعاباً أخرى ←</Link></section>
      <footer className="footer"><a className="brand" href="/">GAME<span>VERSE</span></a><p>تُشغّل اللعبة من مصدرها الخارجي، وتظل حقوقها محفوظة لأصحابها.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
    </main>
  );
}
