import Link from "next/link";

const rules = [
  ["احترام الحقوق", "لا نعرض لعبة أو ملفاً قابلاً للتنزيل إلا إذا كان مصدره واضحاً ولدينا إذن أو ترخيص يسمح بطريقة الاستخدام المعروضة."],
  ["الاستخدام الآمن", "يُمنع رفع ملفات ضارة أو أدوات تجسس أو برمجيات تعدين خفي أو روابط تصيّد أو محتوى يحاول خداع اللاعبين."],
  ["مراجعة المطورين", "كل لعبة يرفعها مطور تمر بحالة مسودة ثم مراجعة إدارية. لا تظهر للعامة قبل الموافقة."],
  ["معلومات دقيقة", "يجب أن يكون وصف اللعبة وتصنيف العمر والمنصة وطريقة التحكم وروابط الدعم صحيحة وواضحة."],
  ["سلوك اللاعبين", "يُمنع التحرش والإساءة والتمييز والتهديد والغش أو استغلال ثغرات المنصة لإيذاء الآخرين. تخضع التعليقات والتقييمات للمراجعة قبل ظهورها."],
  ["البلاغات والإزالة", "يمكن الإبلاغ عن لعبة أو تعليق مخالف أو ملف مشتبه به. تراجع الإدارة البلاغات وتوثّق قراراتها، ويمكنها إخفاء المحتوى أو تعليق الحساب."],
];

export default function RulesPage() {
  return <main className="site-shell rules-page">
    <header className="topbar"><a className="brand" href="/">GAME<span>VERSE</span></a><nav className="main-nav"><a href="/">الرئيسية</a><a href="/games">ألعاب المتصفح</a><a href="/downloads">تنزيلات</a><a href="/libraries">مكتبة المطور</a><a className="active" href="/rules">القواعد</a><a href="/account">حسابي</a></nav><Link className="nav-cta" href="/games">ابدأ اللعب ←</Link></header>
    <section className="catalog-hero"><span className="eyebrow"><i /> مجتمع GameVerse</span><h1>قواعد المنصة،<em> لعب آمن وعادل.</em></h1><p>هذه القواعد تنظم نشر الألعاب والتفاعل داخل GameVerse وتحمي اللاعبين والمطورين وحقوق أصحاب المحتوى.</p></section>
    <section className="rules-grid">{rules.map(([title, body], index) => <article className="rule-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</section>
    <section className="license-note"><strong>سياسة حقوق الألعاب</strong><p>إتاحة لعبة مجاناً على الإنترنت لا تعني السماح بنسخها أو استضافتها أو إعادة توزيع ملفاتها. سنستخدم التضمين فقط عندما يصرّح صاحب اللعبة به، وسنطلب إثبات الحقوق قبل استضافة ملفات المطورين.</p></section>
    <footer className="footer"><a className="brand" href="/">GAME<span>VERSE</span></a><p>بيئة ألعاب تحترم اللاعبين والمطورين.</p><span>© {new Date().getFullYear()} GameVerse</span></footer>
  </main>;
}
