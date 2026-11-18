export type BrowserGame = {
  slug: string;
  title: string;
  category: string;
  mode: "2D";
  platform: "متصفح";
  description: string;
  embedUrl: string;
  sourceUrl: string;
  sourceName: string;
  license: string;
  controls: string;
};

export const browserGames: BrowserGame[] = [
  { slug: "orbit-brake", title: "Orbit Brake", category: "مهارة", mode: "2D", platform: "متصفح", description: "تحكم بالجاذبية: اضغط للدفع واترك الزر للهبوط وتجنب الاصطدام.", embedUrl: "https://www.uploadarcade.com/embed/orbit-brake", sourceUrl: "https://www.uploadarcade.com/games/orbit-brake", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس أو مفتاح المسافة" },
  { slug: "parcel-panic", title: "Parcel Panic", category: "ألغاز", mode: "2D", platform: "متصفح", description: "رتّب الطرود والألوان بسرعة قبل أن يمتلئ خط الفرز.", embedUrl: "https://www.uploadarcade.com/embed/parcel-panic", sourceUrl: "https://www.uploadarcade.com/games/parcel-panic", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
  { slug: "lantern-lines", title: "Lantern Lines", category: "ألغاز", mode: "2D", platform: "متصفح", description: "صل كل زوج من النقاط من دون أن تتقاطع المسارات.", embedUrl: "https://www.uploadarcade.com/embed/lantern-lines", sourceUrl: "https://www.uploadarcade.com/games/lantern-lines", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
  { slug: "cloud-courier", title: "Cloud Courier", category: "أركيد", mode: "2D", platform: "متصفح", description: "لعبة طيران بزر واحد؛ حافظ على ارتفاعك وتفادَ العوائق.", embedUrl: "https://www.uploadarcade.com/embed/cloud-courier", sourceUrl: "https://www.uploadarcade.com/games/cloud-courier", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس أو مفتاح المسافة" },
  { slug: "pocket-reactor", title: "Pocket Reactor", category: "استراتيجية", mode: "2D", platform: "متصفح", description: "وازن شبكة المفاعل واتخذ قراراتك قبل أن ترتفع حرارته.", embedUrl: "https://www.uploadarcade.com/embed/pocket-reactor", sourceUrl: "https://www.uploadarcade.com/games/pocket-reactor", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
  { slug: "signal-garden", title: "Signal Garden", category: "ذاكرة", mode: "2D", platform: "متصفح", description: "راقب تسلسل الألوان ثم أعد النمط الصحيح من ذاكرتك.", embedUrl: "https://www.uploadarcade.com/embed/signal-garden", sourceUrl: "https://www.uploadarcade.com/games/signal-garden", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
  { slug: "tiny-turrets", title: "Tiny Turrets", category: "استراتيجية", mode: "2D", platform: "متصفح", description: "ضع الأبراج في المواقع المناسبة وامنع الأعداء من عبور المسار.", embedUrl: "https://www.uploadarcade.com/embed/tiny-turrets", sourceUrl: "https://www.uploadarcade.com/games/tiny-turrets", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
  { slug: "color-relay", title: "Color Relay", category: "مهارة", mode: "2D", platform: "متصفح", description: "بدّل اللون في اللحظة المناسبة واجتز البوابات المتحركة.", embedUrl: "https://www.uploadarcade.com/embed/color-relay", sourceUrl: "https://www.uploadarcade.com/games/color-relay", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
  { slug: "higher-or-lower", title: "Higher or Lower", category: "ورق", mode: "2D", platform: "متصفح", description: "توقع إن كانت البطاقة التالية أعلى أم أقل وحافظ على سلسلة الفوز.", embedUrl: "https://www.uploadarcade.com/embed/higher-or-lower", sourceUrl: "https://www.uploadarcade.com/games/higher-or-lower", sourceName: "Upload Arcade", license: "MIT", controls: "الماوس أو اللمس" },
];

export function getBrowserGame(slug: string) {
  return browserGames.find((game) => game.slug === slug);
}
