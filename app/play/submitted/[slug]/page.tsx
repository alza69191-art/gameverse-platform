import Link from "next/link";
import { notFound } from "next/navigation";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SubmittedGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let rows: Array<{ title: string; description: string; official_url: string; game_type: string }> = [];
  try {
    const [result] = await getDbPool().query(
      "SELECT title, description, official_url, game_type FROM games WHERE slug = ? AND status = 'approved' LIMIT 1",
      [slug]
    );
    rows = result as typeof rows;
  } catch (error) {
    console.error("Submitted game lookup failed:", error);
    notFound();
  }
  const game = rows[0];
  if (!game || !game.official_url || !["browser", "both"].includes(game.game_type)) notFound();
  let playableUrl: URL;
  try {
    playableUrl = new URL(game.official_url);
    if (playableUrl.protocol !== "https:") notFound();
  } catch {
    notFound();
  }

  return (
    <main className="site-shell play-page">
      <header className="topbar"><a className="brand" href="/">GAME<span>VERSE</span></a><nav className="main-nav"><a href="/">الرئيسية</a><a className="active" href="/games">الألعاب</a><a href="/libraries">مكتبة المطور</a><a href="/rules">القواعد</a></nav><Link className="nav-cta" href="/games">كل الألعاب ←</Link></header>
      <section className="play-heading"><div><span className="eyebrow"><i /> لعبة معتمدة من GameVerse</span><h1>{game.title}</h1><p>{game.description}</p></div><Link className="back-to-games" href="/games">← العودة إلى المكتبة</Link></section>
      <section className="game-player-shell"><div className="game-player-top"><span>GAMEVERSE PLAYER</span><span>لعبة مطور · تشغيل عبر HTTPS</span></div><iframe className="game-player-frame" src={playableUrl.toString()} title={game.title + " - GameVerse game player"} allow="fullscreen; gamepad" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-pointer-lock" /><div className="game-player-credit">هذه اللعبة مقدمة من أحد مطوري GameVerse. إذا لم يسمح مصدر اللعبة بالتضمين، استخدم الرابط الأصلي.</div></section>
      <div className="play-actions"><a href={playableUrl.toString()} target="_blank" rel="noopener noreferrer">فتح اللعبة في نافذة جديدة ↗</a><Link href="/games">اكتشف ألعاباً أخرى ←</Link></div>
      <footer className="footer"><a className="brand" href="/">GAME<span>VERSE</span></a><p>حقوق اللعبة محفوظة لمطورها.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
    </main>
  );
}
