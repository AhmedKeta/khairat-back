import { DataSource } from 'typeorm';
import { FaqEntity } from '../../entities/faq.entity';

const TARGET_FAQ_ROWS = 15;

function buildFaqRows(): Partial<FaqEntity>[] {
  const rows: Partial<FaqEntity>[] = [
    {
      question: {
        en: 'What payment methods do you accept?',
        ar: 'ما هي طرق الدفع التي تقبلونها؟',
      },
      answer: {
        en: 'We accept major cards and local gateways where available via our payment partner.',
        ar: 'نقبل البطاقات الرئيسية والبوابات المحلية حيثما توفرت عبر شريكنا في الدفع.',
      },
      sortOrder: 1,
      isActive: true,
    },
    {
      question: {
        en: 'How long does a typical consultation take?',
        ar: 'كم تستغرق الاستشارة النموذجية؟',
      },
      answer: {
        en: 'Most sessions are between 30 and 60 minutes depending on the service.',
        ar: 'تتراوح معظم الجلسات بين 30 و60 دقيقة حسب الخدمة.',
      },
      sortOrder: 2,
      isActive: true,
    },
    {
      question: {
        en: 'Can I request a refund?',
        ar: 'هل يمكنني طلب استرداد؟',
      },
      answer: {
        en: 'Refund eligibility depends on the service stage; contact support with your order ID.',
        ar: 'تعتمد أهلية الاسترداد على مرحلة الخدمة؛ تواصل مع الدعم مع رقم الطلب.',
      },
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (let i = rows.length + 1; i <= TARGET_FAQ_ROWS; i++) {
    const idx = String(i).padStart(2, '0');
    rows.push({
      question: {
        en: `General question ${idx} about Khairat services?`,
        ar: `سؤال عام ${idx} حول خدمات خيرات؟`,
      },
      answer: {
        en: `This is a seeded FAQ answer ${idx} to help populate the FAQ listing in development.`,
        ar: `هذه إجابة تجريبية رقم ${idx} لملء قائمة الأسئلة الشائعة في بيئة التطوير.`,
      },
      sortOrder: i,
      isActive: i % 6 !== 0,
    });
  }

  return rows;
}

export async function seedFaqs(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(FaqEntity);

  const rows = buildFaqRows();
  for (const row of rows) {
    const en = row.question?.en;
    if (!en) {
      continue;
    }
    const exists = await repo
      .createQueryBuilder('f')
      .where("f.question->>'en' = :en", { en })
      .getOne();
    if (!exists) {
      await repo.save(repo.create(row));
    }
  }
}
