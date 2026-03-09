export type AssetCategory =
    | 'Properti'
    | 'Kendaraan'
    | 'Elektronik'
    | 'Investasi'
    | 'Lainnya';

export type PropertySubcategory = 'Rumah' | 'Tanah' | 'Kebun' | 'Ruko' | string;
export type VehicleSubcategory = 'Motor' | 'Mobil' | string;
export type ElectronicSubcategory = 'HP' | 'Laptop' | 'Kamera' | string;
export type InvestmentSubcategory = 'Emas' | 'Saham' | 'Reksa Dana' | 'Crypto' | string;

export const ASSET_CATEGORIES: AssetCategory[] = [
    'Properti',
    'Kendaraan',
    'Elektronik',
    'Investasi',
    'Lainnya',
];

export const ASSET_SUBCATEGORIES: Record<AssetCategory, string[]> = {
    Properti: ['Rumah', 'Tanah', 'Kebun', 'Ruko', 'Lainnya'],
    Kendaraan: ['Motor', 'Mobil', 'Lainnya'],
    Elektronik: ['HP', 'Laptop', 'Kamera', 'Lainnya'],
    Investasi: ['Emas', 'Saham', 'Reksa Dana', 'Crypto', 'Lainnya'],
    Lainnya: ['Lainnya'],
};

export const ASSET_DEPRECIATION_RATES: Record<string, number> = {
    Motor: 0.10, // 10% per year
    Mobil: 0.15, // 15% per year
    Elektronik: 0.20, // 20% per year
    HP: 0.20,
    Laptop: 0.20,
    Kamera: 0.20,
    // Other assets like Property, Gold, Stocks usually appreciate, or we can assume 0% depreciation for simplicity
};

export interface Asset {
    id: string;
    user_id: string;
    name: string;
    category: AssetCategory | string;
    value: number;
    purchase_year: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export function calculateDepreciatedValue(asset: Asset, currentYear: number = new Date().getFullYear()): number {
    if (!asset.purchase_year) return asset.value;

    const yearsOwned = currentYear - asset.purchase_year;
    if (yearsOwned <= 0) return asset.value;

    // Try to find depreciation rate for specific name or category/subcategory
    // For simplicity, we just use some known keywords mapping from ASSET_DEPRECIATION_RATES
    // If we had subcategory in DB it would be better. But we only have `category` in DB.
    // Wait, the user said Category: Kendaraan, Subcategory: Motor.
    // But our DB schema only has `category`. Let's assume the `category` field stores "Kendaraan - Motor" or `name` is what we match,
    // actually let's update the hook to store category as just "Properti", "Kendaraan". 
    // We can use `ASSET_DEPRECIATION_RATES[asset.category]` or match by keywords.

    // Let's refine: The user requirement: "Motor: 10% per tahun, Mobil: 15%, Elektronik: 20%".
    // We can check if category is "Elektronik", or if name/category matches "Motor" / "Mobil".

    let rate = 0;
    if (asset.category === 'Elektronik') {
        rate = 0.20;
    } else if (asset.name.toLowerCase().includes('motor')) {
        rate = 0.10;
    } else if (asset.name.toLowerCase().includes('mobil')) {
        rate = 0.15;
    }

    if (rate === 0) return asset.value;

    // Straight-line or declining balance? "Menghitung penyusutan nilai aset setiap tahun. Motor 10% per tahun"
    // Let's use declining balance: value * (1 - rate)^years
    // Or straight-line: value - (value * rate * years)
    // Declining balance is more realistic for vehicles.
    const depreciatedValue = asset.value * Math.pow(1 - rate, yearsOwned);

    return Math.max(0, depreciatedValue); // Value can't be negative
}
