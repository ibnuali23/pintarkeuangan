import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useDebts, DebtType } from '@/hooks/useDebts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Clock, Plus, Trash2, Banknote, History } from 'lucide-react';
import { DebtPaymentModal } from '@/components/debts/DebtPaymentModal';
import { DebtPaymentHistory } from '@/components/debts/DebtPaymentHistory';

export default function DebtPage() {
    const { debts, isLoading, addDebt, makePayment, getPayments, deleteDebt } = useDebts();
    const [activeTab, setActiveTab] = useState<DebtType>('hutang');

    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        person_name: '',
        amount: '',
        description: '',
        due_date: '',
    });

    const [paymentModal, setPaymentModal] = useState<{ debtId: string; remaining: number; type: DebtType } | null>(null);
    const [historyModal, setHistoryModal] = useState<string | null>(null);

    const hutangList = debts.filter((d) => d.type === 'hutang');
    const piutangList = debts.filter((d) => d.type === 'piutang');

    const totalHutang = hutangList.filter(d => d.status === 'belum_lunas').reduce((sum, d) => sum + Number(d.remaining_amount ?? d.amount), 0);
    const totalPiutang = piutangList.filter(d => d.status === 'belum_lunas').reduce((sum, d) => sum + Number(d.remaining_amount ?? d.amount), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.person_name || !formData.amount) return;

        await addDebt({
            type: activeTab,
            person_name: formData.person_name,
            amount: Number(formData.amount),
            description: formData.description,
            due_date: formData.due_date || undefined,
        });

        setIsAdding(false);
        setFormData({ person_name: '', amount: '', description: '', due_date: '' });
    };

    const handlePayment = async (amount: number, note?: string) => {
        if (!paymentModal) return;
        await makePayment(paymentModal.debtId, amount, note);
        setPaymentModal(null);
    };

    const renderDebtList = (list: typeof debts, type: DebtType) => {
        const isHutang = type === 'hutang';
        const emptyMsg = isHutang ? 'Tidak ada hutang yang tercatat.' : 'Tidak ada piutang yang tercatat.';

        if (list.length === 0) {
            return (
                <div className="py-8 text-center text-muted-foreground">
                    {emptyMsg}
                </div>
            );
        }

        return (
            <div className="space-y-4 mt-4">
                {list.map((debt) => {
                    const remaining = Number(debt.remaining_amount ?? debt.amount);
                    const original = Number(debt.amount);
                    const paid = original - remaining;
                    const progressPercent = original > 0 ? (paid / original) * 100 : 0;

                    return (
                        <div
                            key={debt.id}
                            className={`flex flex-col gap-3 p-4 rounded-xl border ${debt.status === 'lunas' ? 'bg-secondary/30 opacity-70' : 'bg-card'}`}
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-base">
                                            {isHutang ? `Ke: ${debt.person_name}` : `Dari: ${debt.person_name}`}
                                        </h4>
                                        {debt.status === 'lunas' && (
                                            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Lunas
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{debt.description || '-'}</p>
                                    {debt.due_date && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Jatuh tempo: {format(new Date(debt.due_date), 'dd MMM yyyy', { locale: id })}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2">
                                    <div className="text-right">
                                        <span className={`font-semibold text-lg ${isHutang ? 'text-destructive' : 'text-success'}`}>
                                            {formatCurrency(remaining)}
                                        </span>
                                        {paid > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                dari {formatCurrency(original)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            {original > 0 && (
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${debt.status === 'lunas' ? 'bg-success' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                                    />
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {debt.status !== 'lunas' && (
                                    <Button
                                        size="sm"
                                        className="h-8"
                                        onClick={() => setPaymentModal({ debtId: debt.id, remaining, type })}
                                    >
                                        <Banknote className="h-4 w-4 mr-1" />
                                        {isHutang ? 'Bayar' : 'Terima Bayaran'}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setHistoryModal(debt.id)}
                                >
                                    <History className="h-4 w-4 mr-1" /> Riwayat
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 ml-auto"
                                    onClick={() => {
                                        if (window.confirm('Yakin ingin menghapus catatan ini?')) {
                                            deleteDebt(debt.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="animate-pulse text-center space-y-4">
                        <div className="h-12 w-12 mx-auto rounded-full bg-primary/20" />
                        <p className="text-muted-foreground">Memuat catatan hutang piutang...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Hutang Piutang</h1>
                    <p className="text-muted-foreground mt-1">Catat dan pantau hutang serta piutang Anda di sini.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="glass-card bg-destructive/5 border-destructive/20">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-destructive mb-1">Total Hutang Belum Lunas</p>
                            <h3 className="text-3xl font-bold text-foreground">{formatCurrency(totalHutang)}</h3>
                        </CardContent>
                    </Card>

                    <Card className="glass-card bg-success/5 border-success/20">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-success mb-1">Total Piutang Belum Lunas</p>
                            <h3 className="text-3xl font-bold text-foreground">{formatCurrency(totalPiutang)}</h3>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="hutang" value={activeTab} onValueChange={(v) => setActiveTab(v as DebtType)} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-secondary">
                            <TabsTrigger value="hutang" className="data-[state=active]:bg-background">
                                Hutang Saya
                            </TabsTrigger>
                            <TabsTrigger value="piutang" className="data-[state=active]:bg-background">
                                Piutang (Orang Pinjam)
                            </TabsTrigger>
                        </TabsList>

                        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
                            {isAdding ? 'Batal' : (
                                <><Plus className="h-4 w-4 mr-2" /> Tambah</>
                            )}
                        </Button>
                    </div>

                    {isAdding && (
                        <Card className="glass-card mb-6 animate-in slide-in-from-top-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Tambah {activeTab === 'hutang' ? 'Hutang Baru' : 'Piutang Baru'}</CardTitle>
                                <CardDescription>
                                    Masukkan detail {activeTab === 'hutang' ? 'hutang yang Anda pinjam' : 'uang yang dipinjam orang lain dari Anda'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="person_name">Pemberi/Penerima Pinjaman</Label>
                                            <Input
                                                id="person_name"
                                                placeholder={activeTab === 'hutang' ? 'Nama pemberi pinjaman' : 'Nama yang meminjam'}
                                                required
                                                value={formData.person_name}
                                                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Jumlah (Rp)</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="0"
                                                required
                                                min="1"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="due_date">Tenggat Waktu (Opsional)</Label>
                                            <Input
                                                id="due_date"
                                                type="date"
                                                value={formData.due_date}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2 mt-auto">
                                            <Button type="submit" className="w-full">Simpan</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Keterangan (Opsional)</Label>
                                        <Input
                                            id="description"
                                            placeholder="Catatan tambahan"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <TabsContent value="hutang" className="mt-0 outline-none">
                        {renderDebtList(hutangList, 'hutang')}
                    </TabsContent>
                    <TabsContent value="piutang" className="mt-0 outline-none">
                        {renderDebtList(piutangList, 'piutang')}
                    </TabsContent>
                </Tabs>
            </div>

            {paymentModal && (
                <DebtPaymentModal
                    open={!!paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSubmit={handlePayment}
                    remaining={paymentModal.remaining}
                    type={paymentModal.type}
                />
            )}

            {historyModal && (
                <DebtPaymentHistory
                    open={!!historyModal}
                    onClose={() => setHistoryModal(null)}
                    debtId={historyModal}
                    getPayments={getPayments}
                />
            )}
        </Layout>
    );
}
