import { Asset, calculateDepreciatedValue } from '@/types/asset';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, TrendingDown } from 'lucide-react';

interface AssetSummaryProps {
    assets: Asset[];
    isDepreciationEnabled: boolean;
}

export function AssetSummary({ assets, isDepreciationEnabled }: AssetSummaryProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const totalOriginalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

    const totalCurrentValue = assets.reduce((sum, asset) => {
        if (isDepreciationEnabled) {
            return sum + calculateDepreciatedValue(asset);
        }
        return sum + asset.value;
    }, 0);

    const totalDepreciation = totalOriginalValue - totalCurrentValue;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="glass-card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        Total Nilai Aset (Saat Ini)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">
                        {formatCurrency(totalCurrentValue)}
                    </div>
                    {isDepreciationEnabled && totalDepreciation > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Sudah termasuk penyusutan aktif
                        </p>
                    )}
                </CardContent>
            </Card>

            {isDepreciationEnabled && (
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            Total Nilai Susut
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {formatCurrency(totalDepreciation)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Berdasarkan tahun pembelian aset
                        </p>
                    </CardContent>
                </Card>
            )}

            {!isDepreciationEnabled && (
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Nilai Pembelian Awal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalOriginalValue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total aset tanpa depresiasi
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
