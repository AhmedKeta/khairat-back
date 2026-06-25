export type AboutStatCard = {
  icon: string;
  value: number;
  suffix: string;
  labelEn: string;
  labelAr: string;
};

export const DEFAULT_ABOUT_STATS: AboutStatCard[] = [
  {
    icon: 'GiSheep',
    value: 85000,
    suffix: '+',
    labelEn: 'Heads of sheep',
    labelAr: 'رأس من الخراف',
  },
  {
    icon: 'GiGoat',
    value: 13200,
    suffix: '+',
    labelEn: 'Heads of goats',
    labelAr: 'رأس من الماعز',
  },
  {
    icon: 'GiCow',
    value: 5000,
    suffix: '+',
    labelEn: 'Heads of cattle & calves',
    labelAr: 'رأس من الأبقار والعجول',
  },
  {
    icon: 'GiWorld',
    value: 50,
    suffix: '+',
    labelEn: 'Countries we serve',
    labelAr: 'دولة نخدمها',
  },
];
