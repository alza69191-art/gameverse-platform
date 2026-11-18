const collections = [
  { icon: "▦", title: "أصول 2D", text: "شخصيات، sprites، tilesets، خلفيات وأيقونات.", links: [{ name: "Kenney · أصول مجانية CC0", url: "https://kenney.nl/assets" }, { name: "OpenGameArt", url: "https://opengameart.org/" }] },
  { icon: "⬡", title: "نماذج 3D", text: "مجسمات وبيئات وأدوات وأصول جاهزة لمحركات الألعاب.", links: [{ name: "Quaternius", url: "https://quaternius.com/" }, { name: "Poly Haven · CC0", url: "https://polyhaven.com/" }] },
  { icon: "♫", title: "الصوت والموسيقى", text: "مؤثرات صوتية وموسيقى وخامات صوتية للألعاب.", links: [{ name: "Kenney Audio", url: "https://kenney.nl/assets" }, { name: "Freesound", url: "https://freesound.org/" }] },
  { icon: "▤", title: "واجهات المستخدم", text: "أزرار، لوحات، مؤشرات، خطوط وأيقونات واجهات.", links: [{ name: "Kenney UI Pack", url: "https://kenney.nl/assets" }, { name: "Game-icons.net", url: "https://game-icons.net/" }] },
];
const engines = [
  { name: "Phaser", text: "إطار عمل لألعاب HTML5 ثنائية الأبعاد.", url: "https://phaser.io/" },
  { name: "Three.js", text: "مكتبة JavaScript لإنشاء الرسوم والمشاهد ثلاثية الأبعاد.", url: "https://threejs.org/" },
  { name: "Godot", text: "محرك ألعاب مفتوح المصدر لألعاب 2D و3D.", url: "https://godotengine.org/" },
  { name: "Bevy", text: "محرك ألعاب مفتوح المصدر مبني بلغة Rust.", url: "https://bevy.org/" },
];
export default function LibrariesPage() {
  return <main className="site-shell catalog-page">
    <header className="topbar"><a className="brand" href="/">GAME<span>VERSE</span></a><nav className="main-nav"><a href="/">الرئيسية</a><a href="/games">الألعاب</a><a className="active" href="/libraries">مكتبة المطور</a></nav><a className="nav-cta" href="/games">اكتشف الألعاب ←</a></header>
    <section className="catalog-hero"><span className="eyebrow"><i /> موارد صناعة الألعاب</span><h1>أدواتك وأصولك،<em> في مكان واحد.</em></h1><p>مكتبة منظمة لمصادر الأصول ومحركات التطوير، مع روابط مباشرة للمصدر الأصلي.</p></section>
    <section className="library-grid">{collections.map((item) => <article className="library-card" key={item.title}><span className="library-icon">{item.icon}</span><h2>{item.title}</h2><p>{item.text}</p><div className="library-links">{item.links.map(link => <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">{link.name} ↗</a>)}</div></article>)}</section>
    <section className="engine-section"><div className="section-heading"><div><span className="eyebrow">للمطورين</span><h2>محركات ومكتبات التطوير</h2></div></div><div className="engine-grid">{engines.map(engine => <a className="engine-card" key={engine.name} href={engine.url} target="_blank" rel="noopener noreferrer"><h3>{engine.name} <span>↗</span></h3><p>{engine.text}</p></a>)}</div></section>
    <section className="license-note"><strong>مهم: راجع الترخيص قبل الاستخدام.</strong><p>بعض المصادر تجمع محتوى بتراخيص مختلفة. ترخيص CC0 يسمح بالاستخدام الواسع، لكن لا تفترض أن كل ملف على OpenGameArt أو Freesound أو Sketchfab مجاني لإعادة النشر. سنحفظ ترخيص كل أصل ورابطه قبل إدخاله إلى مكتبة GameVerse المستضافة.</p><a href="https://kenney.nl/support" target="_blank" rel="noopener noreferrer">سياسة ترخيص Kenney الرسمية ↗</a></section>
    <footer className="footer"><a className="brand" href="/">GAME<span>VERSE</span></a><p>مصادر المطورين مع توثيق حقوق الاستخدام.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
  </main>;
}
