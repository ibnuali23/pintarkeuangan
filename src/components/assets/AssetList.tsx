import { Asset, calculateDepreciatedValue } from '@/types/asset';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Home, Car, Smartphone, TrendingUp, HelpCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AssetListProps {
    assets: Asset[];
    isDepreciationEnabled: boolean;
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Properti':
            return <Home className="h-5 w-5" />;
        case 'Kendaraan':
            return <Car className="h-5 w-5" />;
        case 'Elektronik':
            return <Smartphone className="h-5 w-5" />;
        case 'Investasi':
            return <TrendingUp className="h-5 w-5" />;
        default:
            return <HelpCircle className="h-5 w-5" />;
    }
};

export function AssetList({ assets, isDepreciationEnabled, onEdit, onDelete }: AssetListProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (assets.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Belum Ada Aset</h3>
                <p className="text-muted-foreground">Silakan tambahkan aset pertama Anda.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
                const currentValue = isDepreciationEnabled
                    ? calculateDepreciatedValue(asset)
                    : asset.value;

                const isDepreciated = isDepreciationEnabled && currentValue < asset.value;

                return (
                    <Card key={asset.id} className="glass-card flex flex-col hover:border-primary/30 transition-colors group">
                        <CardContent className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                        {getCategoryIcon(asset.category)}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-base line-clamp-1" title={asset.name}>
                                            {asset.name}
                                        </h4>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                            {asset.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions that appear on hover */}
                                <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={() => onEdit(asset)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Aset?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Anda akan menghapus aset {asset.name}. Tindakan ini tidak dapat dibatalkan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onDelete(asset.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>

                            <div className="mt-auto space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm text-muted-foreground">Nilai Saat Ini</span>
                                    <span className="text-lg font-bold text-foreground">
                                        {formatCurrency(currentValue)}
                                    </span>
                                </div>

                                {isDepreciated && (
                                    <div className="flex justify-between items-end pb-1 border-b border-border/50">
                                        <span className="text-xs text-muted-foreground">Harga Beli ({asset.purchase_year})</span>
                                        <span className="text-xs line-through text-muted-foreground">
                                            {formatCurrency(asset.value)}
                                        </span>
                                    </div>
                                )}

                                {asset.notes && (
                                    <p className="text-xs text-muted-foreground pt-2 line-clamp-2">
                                        {asset.notes}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
