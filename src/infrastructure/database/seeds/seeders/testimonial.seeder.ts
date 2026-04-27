import { DataSource, Repository } from 'typeorm';
import { TestimonialEntity } from '../../entities/testimonial.entity';

type SeedRow = Partial<TestimonialEntity>;

/** Realistic donor-style testimonials: English `content` for EN UI, Arabic in `contentAr`. */
const TESTIMONIAL_SEED_ROWS: SeedRow[] = [
  {
    userName: 'Khalid Al-Otaibi',
    avatar: '🇸🇦',
    rating: 5,
    content:
      'Thank you for your trustworthiness and integrity. May Allah grant you every good, in sha Allah.',
    contentAr: 'شكرا الثقه والمصداقية بتعتكم ربنا يديكم كل الخير أن شاء الله',
    isVisible: true,
  },
  {
    userName: 'Yusuf Al-Mahmoud',
    avatar: '🇯🇴',
    rating: 5,
    content:
      'MashaAllah tabarak Allah — may Allah accept all good deeds from us and from you.',
    contentAr: 'بسم الله ما شاء الله تبارك الله تقبل الله منا ومنكم سائر الاعمال',
    isVisible: true,
  },
  {
    userName: 'Tariq El-Masry',
    avatar: '🇪🇬',
    rating: 5,
    content:
      'Since Ramadan began I had not felt this happy until today when I saw the children so joyful. Thank you — I will keep supporting you, in sha Allah.',
    contentAr:
      'انا مش عايز اقول لكم ان السعادة والفرحة من اول رمضان ما فرحتش ولا كنت سعيد الا النهارده عشان شفت الاطفال وهي مبسوطة وفرحانة ميزان حسناتنا جميعا والاطفال الصغيرين اللي حضرتكم مصورينهم وهم فرحانين شكرا بجد انا ان شاء الله هشارك معاكم على طول',
    isVisible: true,
  },
  {
    userName: 'Huda Al-Shammari',
    avatar: '🇰🇼',
    rating: 5,
    content: 'MashaAllah — you truly made us happy.',
    contentAr: 'ماشاء الله ❤️ فرحتونا والله ❤️❤️❤️',
    isVisible: true,
  },
  {
    userName: 'Majed Al-Harbi',
    avatar: '🇸🇦',
    rating: 5,
    content:
      'You are truly as trustworthy as we had heard. I will be with you every time, in sha Allah.',
    contentAr: 'انتوا فعلاً قد المصداقية اللي اخذناها عنكم وان شاء الله كل مرة هتكون معاكم',
    isVisible: true,
  },
  {
    userName: 'Salma Al-Zahrani',
    avatar: '🇸🇦',
    rating: 5,
    content:
      'May Allah accept from us and from you, and bless whoever introduced us to you — may they share in this good.',
    contentAr:
      'ربنا يتقبل منا ومنكم ويبارك اللي كان سبب في معرفتنا بيكم ويجعله شريك في الخير ده',
    isVisible: true,
  },
  {
    userName: 'Omar Al-Sulaiti',
    avatar: '🇶🇦',
    rating: 5,
    content: 'May Allah give you strength — jazakum Allahu khayran.',
    contentAr: 'يعطيكم الف عافية وجزاكم الله خير',
    isVisible: true,
  },
  {
    userName: 'Rania Khattab',
    avatar: '🇪🇬',
    rating: 5,
    content:
      'Thank you for your generosity. May Allah reward you — we hope to do an aqiqah with you soon, in sha Allah.',
    contentAr: 'شكرا كتر خيركم وربنا يجازيكم خير وباذن الله نعمل عقيقه قريبا معاكم',
    isVisible: true,
  },
  {
    userName: 'Abdulrahman Al-Ghamdi',
    avatar: '🇸🇦',
    rating: 5,
    content:
      'BarakAllahu feekum — best organization for trust, integrity, and care. May Allah multiply your reward and keep you in goodness.',
    contentAr:
      'بجد بارك الله فيكم ويجعله ف ميزان حسناتك ويردهولكم أضعاف مضاعفه من الخير والرزق الواسع احسن مؤسسه وثقه ومصدقيه وف قمه الجمال ربنا يجعلكم ف الخير دايما يااااارب العالمين🤲',
    isVisible: true,
  },
  {
    userName: 'Layla Al-Mutairi',
    avatar: '🇰🇼',
    rating: 5,
    content:
      'MashaAllah — you made us so happy. May Allah brighten your hearts always; we will keep dealing with you. May He use you for good and never replace you.',
    contentAr:
      'ماشاء الله بجد فرحتونا الله يسعد قلوبكم ديما وبأذن الله نتعامل معاكم دايما ربنا يستخدمكم ولا يستبدلكم ويجزيكم الله خيرا 🤲♥️',
    isVisible: true,
  },
  {
    userName: 'Noura Al-Ajmi',
    avatar: '🇰🇼',
    rating: 5,
    content: 'Allahumma barak — may Allah reward you with goodness.',
    contentAr: 'اللهم بارك ربنا يجزيكم خير ♥♥',
    isVisible: true,
  },
  {
    userName: 'Fahad Al-Mazrouei',
    avatar: '🇦🇪',
    rating: 5,
    content:
      'Jazakum Allahu khayran — may Allah accept righteous deeds from us and from you. We will work together again and again, in sha Allah.',
    contentAr:
      'جزاكم الله خيرا وربنا يتقبل منا ومنكم صالح الاعمال وان شاء الله هنتعامل مع بعض تانى وثالث بإذن الله',
    isVisible: true,
  },
  {
    userName: 'Mariam Al-Balushi',
    avatar: '🇴🇲',
    rating: 5,
    content:
      'I was so happy — the video was full of joy. May Allah relieve every hardship from His bounty.',
    contentAr: 'فرحت جدا والله والفيديو فى بهجه وسعاده وان شاء الله ربنا يفرجها من عنده',
    isVisible: true,
  },
  {
    userName: 'Sultan Al-Qahtani',
    avatar: '🇸🇦',
    rating: 5,
    content: 'Jazakum Allahu khayran — may Allah place this in your scale of good deeds.',
    contentAr: 'جزاكم الله خير الله يجعلها في ميزان حسناتكم ياارب',
    isVisible: true,
  },
  {
    userName: 'Yasmin Ashour',
    avatar: '🇪🇬',
    rating: 5,
    content:
      'I am so happy I cannot stop crying since this morning. Please tell me when it is posted so I can share it.',
    contentAr:
      'انا فرحانه جدا اقسم بالله من كتر الفرحه مش عارفه ابطل عياط من الصبح ممكن لما ينزل على الصفحه تقولوا لي عشان اعمل له مشاركه',
    isVisible: true,
  },
  {
    userName: 'Ibrahim Al-Dosari',
    avatar: '🇧🇭',
    rating: 5,
    content:
      'May Allah reward you abundantly on our behalf. You are truly worthy of trust — I have referred many people to you.',
    contentAr: 'ربنا يجازيكم عنا كل خير قد الثقة انا بعت لحضراتكم كذا حد والله',
    isVisible: true,
  },
  {
    userName: 'Reem Al-Kuwari',
    avatar: '🇶🇦',
    rating: 5,
    content:
      'Thank you — may Allah reward you. You brought joy to many hearts; your work is trustworthy for anyone who wants to do good.',
    contentAr:
      'شكرا ربنا يجازيكم خير فرحتوا قلوب كتير والتعامل معاكم موثوق لأي حد يحب يعمل خير ♥',
    isVisible: true,
  },
  {
    userName: 'Karim Al-Najjar',
    avatar: '🇱🇧',
    rating: 5,
    content:
      'Honestly it was our first time with you and it will not be the last. Thank you for integrity, great communication, and fast delivery.',
    contentAr:
      'بصراحة كان أول مرة نتعامل معاكم ومش هتكون آخر مرة شكرا على المصداقية وحسن التعامل وسرعة التنفيذ',
    isVisible: true,
  },
  {
    userName: 'Amal Trabelsi',
    avatar: '🇹🇳',
    rating: 5,
    content:
      'One of the best places we have dealt with. Thank you for your care and effort — jazakum Allahu khayran.',
    contentAr:
      'من أفضل الأماكن اللي اتعاملنا معاها نشكركم جدا على اهتمامكم وتعبكم جزاكم الله خير الجزاء 😊',
    isVisible: true,
  },
  // —— Ten additional testimonials in the same voice ——
  {
    userName: 'Suleiman Al-Deeb',
    avatar: '🇵🇸',
    rating: 5,
    content:
      'I was worried at first about paying online for charity, but alhamdulillah everything was clear and documented. May Allah reward you.',
    contentAr:
      'كنت متوتر أول مرة أدفع أونلاين خير، الحمد لله كل حاجة كانت واضحة وموثقة، الله يجزيكم الخير',
    isVisible: true,
  },
  {
    userName: 'Nada El-Sherif',
    avatar: '🇪🇬',
    rating: 5,
    content:
      'When I saw the report and photos I was at ease. May Allah bless you and grant you success.',
    contentAr:
      'والله ما كان نفسي أشككوا بس لما شفت التقرير والصور طمنت، ربنا يبارك فيكم ويوفقكم',
    isVisible: true,
  },
  {
    userName: 'Hamza Al-Malki',
    avatar: '🇲🇦',
    rating: 5,
    content:
      'We did qurbani with you last year and came back again — same trust, same quality. Jazakum Allahu khayran.',
    contentAr:
      'جربنا الأضحية معاكم السنة اللي فاتت ورجعنا تاني، نفس الثقة ونفس الجودة جزاكم الله خيرًا',
    isVisible: true,
  },
  {
    userName: 'Dalal Al-Harthy',
    avatar: '🇸🇦',
    rating: 5,
    content:
      'Greetings from the heart to the Khairat team — you kept your promises and explained every step clearly. Allahumma barak.',
    contentAr:
      'تحية من قلبي لفريق خيرات، التزام بالمواعيد وشرح واضح لكل خطوة، اللهم بارك',
    isVisible: true,
  },
  {
    userName: 'Mustafa Al-Obeidi',
    avatar: '🇮🇶',
    rating: 4,
    content:
      'I asked our imam before dealing with you, and your name was recommended. May Allah bless this work.',
    contentAr: 'سألت الشيخ عندنا في المسجد قبل ما أتعامل معاكم، وطلع اسمكم معتمد، الله يبارك',
    isVisible: true,
  },
  {
    userName: 'Khadija Al-Barasi',
    avatar: '🇱🇾',
    rating: 5,
    content:
      'From Libya — you are a fine ambassador for charitable work. We trust you and recommend you to our families.',
    contentAr:
      'من ليبيا وبعتبركم خير سفير للعمل الخيري، نثق فيكم ونوصي بكم لكل الأهل',
    isVisible: true,
  },
  {
    userName: 'Zainab Al-Kaabi',
    avatar: '🇦🇪',
    rating: 5,
    content:
      'I made duʿa for you in salah after watching the video — mashaAllah, refined work and noble character.',
    contentAr: 'دعيت لكم في صلاتي بعد ما شفت الفيديو، ما شاء الله عليكم عمل راقي وأخلاق عالية',
    isVisible: true,
  },
  {
    userName: 'Anas Al-Mutawa',
    avatar: '🇰🇼',
    rating: 5,
    content:
      'Integrity is not just words — even the invoice and WhatsApp replies were clear. BarakAllahu feekum.',
    contentAr:
      'المصداقية مش كلام بس، حتى الفاتورة والواتساب ردهم كان واضح، بارك الله فيكم',
    isVisible: true,
  },
  {
    userName: 'Hanan Al-Saadi',
    avatar: '🇩🇿',
    rating: 5,
    content:
      'The aid you delivered in my late mother’s name was the most fitting gift — thank you from the depths of my heart.',
    contentAr:
      'الخدمة لذوي الاحتياج اللي عملتوها باسم والدتي كانت أنسب هدية، شكرًا من الأعماق',
    isVisible: true,
  },
  {
    userName: 'Waleed Al-Sharif',
    avatar: '🇯🇴',
    rating: 5,
    content:
      'May Allah make it ongoing charity — we will be with you every year, in sha Allah; may He keep you in goodness.',
    contentAr:
      'ربنا يجعلها صدقة جارية، إحنا معاكم كل سنة بإذن الله إن شاء الله تفضلوا',
    isVisible: true,
  },
];

async function removeLegacySeedTestimonials(repo: Repository<TestimonialEntity>): Promise<void> {
  await repo
    .createQueryBuilder()
    .delete()
    .from(TestimonialEntity)
    .where('(content LIKE :seed OR "user_name" LIKE :un)', {
      seed: 'Seed testimonial%',
      un: 'Seed Testimonial User%',
    })
    .execute();

  const legacyNames = ['Ahmad Al-Rashid', 'Fatima Hassan', 'Omar Khan'];
  await repo
    .createQueryBuilder()
    .delete()
    .from(TestimonialEntity)
    .where('"user_name" IN (:...names)', { names: legacyNames })
    .execute();
}

export async function seedTestimonials(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(TestimonialEntity);
  await removeLegacySeedTestimonials(repo);

  for (const row of TESTIMONIAL_SEED_ROWS) {
    const ar = row.contentAr?.trim();
    const exists = ar
      ? await repo.findOne({ where: { contentAr: ar } })
      : await repo.findOne({ where: { userName: row.userName, content: row.content } });
    if (!exists) {
      await repo.save(repo.create(row));
    }
  }
}
