const features = ["ألعاب متصفح فورية","ألعاب 2D و3D","صفحات ألعاب موثوقة","حساب ومكتبة ألعاب"];

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav"><a className="brand" href="/">GameVerse</a><span className="nav-tag">اللاعبون</span></nav>
      <section className="hero">
        <div className="eyebrow">GAMEVERSE · GAMEVERSE</div>
        <h1>منصة الألعاب</h1>
        <p className="lead">اكتشف ألعاب المتصفح وحمّل ألعاب الحاسوب والهاتف.</p>
        <a className="primary" href="#features">استكشف الألعاب<span aria-hidden="true"> ←</span></a>
      </section>
      <section id="features" className="features"><h2>منظومة متكاملة</h2><div className="grid">{features.map((feature) => <article className="card" key={feature}><span className="dot" />{feature}</article>)}</div></section>
      <footer>© {new Date().getFullYear()} GameVerse. جميع الحقوق محفوظة.</footer>
    </main>
  );
}
