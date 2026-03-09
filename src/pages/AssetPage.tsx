import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAssets } from '@/hooks/useAssets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetForm } from '@/components/assets/AssetForm';
import { AssetList } from '@/components/assets/AssetList';
import { AssetSummary } from '@/components/assets/AssetSummary';
import { AssetChart } from '@/components/assets/AssetChart';
import { Asset } from '@/types/asset';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AssetPage() {
    const { assets, isLoading, addAsset, updateAsset, deleteAsset } = useAssets();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
    const [isDepreciationEnabled, setIsDepreciationEnabled] = useState(false);

    const handleOpenForm = (asset?: Asset) => {
        setEditingAsset(asset);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingAsset(undefined);
        setIsFormOpen(false);
    };

    const handleSubmit = async (data: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if (editingAsset) {
            return await updateAsset(editingAsset.id, data);
        } else {
            return await addAsset(data);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="animate-pulse text-center">
                        <div className="h-12 w-12 mx-auto rounded-full bg-primary/20 mb-4" />
                        <p className="text-muted-foreground">Memuat data...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            Aset Saya
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Kelola dan pantau nilai seluruh aset tidak likuid Anda.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-lg px-3 py-2">
                            <Switch
                                id="depreciation-mode"
                                checked={isDepreciationEnabled}
                                onCheckedChange={setIsDepreciationEnabled}
                            />
                            <Label htmlFor="depreciation-mode" className="text-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                                <Settings className="h-3.5 w-3.5" />
                                Fitur Penyusutan
                            </Label>
                        </div>

                        <Button onClick={() => handleOpenForm()} className="gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Tambah Aset</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <AssetSummary
                    assets={assets}
                    isDepreciationEnabled={isDepreciationEnabled}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Chart Section */}
                    <div className="lg:col-span-1">
                        <Card className="glass-card h-full">
                            <CardHeader>
                                <CardTitle className="font-serif">Distribusi Aset</CardTitle>
                                <CardDescription>
                                    Komposisi aset berdasarkan kategori
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AssetChart
                                    assets={assets}
                                    isDepreciationEnabled={isDepreciationEnabled}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-serif text-xl font-semibold">Daftar Aset</h3>
                            <span className="text-sm text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                                {assets.length} item
                            </span>
                        </div>

                        <AssetList
                            assets={assets}
                            isDepreciationEnabled={isDepreciationEnabled}
                            onEdit={handleOpenForm}
                            onDelete={deleteAsset}
                        />
                    </div>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                <DialogContent className="sm:max-w-[500px] glass-card border-none">
                    <DialogHeader>
                        <DialogTitle className="font-serif">
                            {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingAsset
                                ? 'Perbarui informasi aset Anda.'
                                : 'Pencatatan yang baik memberi gambaran akurat kekayaan Anda.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <AssetForm
                            initialData={editingAsset}
                            onSubmit={handleSubmit}
                            onSuccess={handleCloseForm}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
