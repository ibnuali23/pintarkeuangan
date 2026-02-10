// Kategori Pemasukan
export type IncomeCategory = 'Pemasukan';

export type IncomeSubcategory = 
  | 'Gaji bulanan'
  | 'Insentif'
  | 'Warisan ayah'
  | 'Dari orang tua'
  | 'Hibah'
  | 'Khutbah'
  | 'Kajian'
  | 'Imam'
  | 'Barang pribadi'
  | 'Barang dagangan'
  | 'Refund'
  | 'Lainnya';

// Kategori Pengeluaran
export type ExpenseCategory = 
  | 'Kebutuhan' 
  | 'Investasi' 
  | 'Keinginan' 
  | 'Dana Darurat';

export type KebutuhanSubcategory = 
  | 'Perawatan sepeda motor'
  | 'Bensin motor'
  | 'Pajak Honda'
  | 'Belanja Mingguan'
  | 'Belanja Bulanan'
  | 'Makan/Minum di luar'
  | 'Perabotan Rumah'
  | 'Laundry'
  | 'Buah-buahan'
  | 'Arisan'
  | 'Pulsa HP'
  | 'Internet data'
  | 'Berobat abang & adik'
  | 'Skincare'
  | 'Kebutuhan istri'
  | 'Lainnya';

export type KeinginanSubcategory = 
  | 'Healing'
  | 'Hiburan'
  | 'Staycation'
  | 'Jajanan'
  | 'Aksesoris Motor/Mobil'
  | 'Aksesoris HP'
  | 'Langganan'
  | 'Lainnya';

export type InvestasiSubcategory = 
  | 'Ibu kandung'
  | 'Mertua'
  | 'Sedekah'
  | 'Hadiah'
  | 'Bahan dagangan'
  | 'Perawatan sawit'
  | 'Lainnya';

export type DanaDaruratSubcategory = 
  | 'Kesehatan'
  | 'Tak Terduga'
  | 'Servis'
  | 'Lainnya';

export type ExpenseSubcategory = 
  | KebutuhanSubcategory 
  | KeinginanSubcategory 
  | InvestasiSubcategory 
  | DanaDaruratSubcategory;

export interface Income {
  id: string;
  date: string;
  category: IncomeCategory;
  subcategory: IncomeSubcategory;
  description: string;
  amount: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  subcategory: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface MonthlyNote {
  id: string;
  month: string; // Format: YYYY-MM
  note: string;
  createdAt: string;
}

export interface BudgetAllocation {
  category: ExpenseCategory;
  percentage: number;
  color: string;
  spent: number;
  limit: number;
}

export const BUDGET_PERCENTAGES: Record<ExpenseCategory, number> = {
  Kebutuhan: 50,
  Investasi: 30,
  Keinginan: 15,
  'Dana Darurat': 5,
};

export const EXPENSE_SUBCATEGORIES: Record<ExpenseCategory, string[]> = {
  Kebutuhan: [
    'Perawatan sepeda motor',
    'Bensin motor',
    'Pajak Honda',
    'Belanja Mingguan',
    'Belanja Bulanan',
    'Makan/Minum di luar',
    'Perabotan Rumah',
    'Laundry',
    'Buah-buahan',
    'Arisan',
    'Pulsa HP',
    'Internet data',
    'Berobat abang & adik',
    'Skincare',
    'Kebutuhan istri',
    'Lainnya',
  ],
  Keinginan: [
    'Healing',
    'Hiburan',
    'Staycation',
    'Jajanan',
    'Aksesoris Motor/Mobil',
    'Aksesoris HP',
    'Langganan',
    'Lainnya',
  ],
  Investasi: [
    'Ibu kandung',
    'Mertua',
    'Sedekah',
    'Hadiah',
    'Bahan dagangan',
    'Perawatan sawit',
    'Lainnya',
  ],
  'Dana Darurat': [
    'Kesehatan',
    'Tak Terduga',
    'Servis',
    'Lainnya',
  ],
};

export const INCOME_SUBCATEGORIES: IncomeSubcategory[] = [
  'Gaji bulanan',
  'Insentif',
  'Warisan ayah',
  'Dari orang tua',
  'Hibah',
  'Khutbah',
  'Kajian',
  'Imam',
  'Barang pribadi',
  'Barang dagangan',
  'Refund',
  'Lainnya',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Kebutuhan',
  'Investasi',
  'Keinginan',
  'Dana Darurat',
];
