import Link from "next/link";

const stores = [
  { title: "Offroad Outlaws", genre: "عالم مفتوح وقيادة طرق وعرة", android: "https://play.google.com/store/apps/details?id=com.battlecreek.offroadoutlaws", ios: "https://apps.apple.com/us/app/offroad-outlaws/id1286538410", pc: null, source: "https://www.madkidgames.com/game/offroad-outlaws" },
  { title: "Bus Simulator: Ultimate", genre: "محاكاة قيادة الحافلات", android: "https://play.google.com/store/apps/details?id=com.zuuks.bus.simulator.ultimate", ios: "https://apps.apple.com/us/app/bus-simulator-ultimate/id1461749632", pc: null, source: "https://www.madkidgames.com/game/bus-simulator-ultimate" },
  { title: "Airplane Flight Simulator EVO", genre: "محاكاة الطيران", android: "https://play.google.com/store/apps/details?id=com.ovilex.flightsim2018", ios: "https://apps.apple.com/id/app/flight-sim-18/id1398956467", pc: null, source: "https://www.madkidgames.com/game/airplane-flight-simulator-evo" },
  { title: "Hot Wheels: Race Off", genre: "سباق سيارات وحركات", android: null, ios: "https://apps.apple.com/us/app/hot-wheels-race-off/id6670202361", pc: null, source: "https://www.madkidgames.com/game/hot-wheels-race-off" },
  { title: "Truckers of Europe 2", genre: "محاكاة الشاحنات والنقل", android: "https://play.google.com/store/apps/details?id=europe.truck.simulator2", ios: "https://apps.apple.com/us/app/truckers-of-europe-2/id1373739355", pc: null, source: "https://www.madkidgames.com/game/truckers-of-europe-2" },
  { title: "Stunt Bike Extreme", genre: "دراجات نارية وحركات بهلوانية", android: "https://play.google.com/store/apps/details?id=com.hyperkani.trialbike", ios: "https://apps.apple.com/us/app/stunt-bike-extreme/id6478860621", pc: "https://store.steampowered.com/app/3212130/Stunt_Bike_Extreme/", source: "https://www.madkidgames.com/game/stunt-bike-extreme" }
];

export default function StorePage() {
  return <main className="site-shell catalog-page">
    <header className="topbar"><Link className="brand" href="/">GAME<span>VERSE</span></Link><nav className="main-nav"><Link href="/">الرئيسية</Link><Link href="/games">ألعاب المتصفح</Link><Link href="/store" className="active">متجر الألعاب</Link><Link href="/downloads">تنزيلات المطورين</Link><Link href="/libraries">مكتبة المطور</Link><Link href="/account">حسابي</Link></nav><Link className="nav-cta" href="/games">العب الآن ←</Link></header>
    <section className="catalog-hero"><span className="eyebrow"><i/> متاجر رسمية وروابط موثوقة</span><h1>متجر الألعاب<em> والتنزيلات.</em></h1><p>ألعاب تحتاج إلى تثبيت؟ انتقل إلى صفحة المطور الرسمية في Google Play أو App Store أو Steam. لا نستضيف ملفات لا نملك حقوق توزيعها.</p></section>
    <section className="store-grid">{stores.map(game=><article className="store-card" key={game.title}><div className="store-card-top"><span className="eyebrow">GAMEVERSE STORE</span><span className="store-3d">3D</span></div><h2>{game.title}</h2><p>{game.genre}</p><div className="store-links">{game.android&&<a href={game.android} target="_blank" rel="noopener noreferrer">Google Play ↗</a>}{game.ios&&<a href={game.ios} target="_blank" rel="noopener noreferrer">App Store ↗</a>}{game.pc&&<a href={game.pc} target="_blank" rel="noopener noreferrer">Steam للكمبيوتر ↗</a>}</div><a className="store-source" href={game.source} target="_blank" rel="noopener noreferrer">صفحة اللعبة ومصدرها ↗</a></article>)}</section>
    <p className="store-disclaimer">GameVerse لا تبيع هذه الألعاب ولا تستضيف ملفاتها. التنزيلات تتم من المتاجر الرسمية التابعة للمطورين، وقد تتضمن مشتريات داخل التطبيق أو اشتراكات أو متطلبات جهاز محددة. توافر اللعبة يختلف حسب البلد والجهاز.</p>
    <footer className="footer"><Link className="brand" href="/">GAME<span>VERSE</span></Link><p>حمّل من المصدر الرسمي دائماً.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
  </main>;
}
