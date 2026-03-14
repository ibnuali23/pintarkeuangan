import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DebtType } from '@/hooks/useDebts';

interface DebtPaymentModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (amount: number, note?: string) => Promise<void>;
    remaining: number;
    type: DebtType;
}

export function DebtPaymentModal({ open, onClose, onSubmit, remaining, type }: DebtPaymentModalProps) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payAmount = Number(amount);
        if (!payAmount || payAmount <= 0 || payAmount > remaining) return;

        setIsSubmitting(true);
        await onSubmit(payAmount, note || undefined);
        setIsSubmitting(false);
        setAmount('');
        setNote('');
    };

    const isHutang = type === 'hutang';

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isHutang ? 'Bayar Hutang' : 'Terima Pembayaran Piutang'}</DialogTitle>
                    <DialogDescription>
                        Sisa {isHutang ? 'hutang' : 'piutang'}: <strong>{formatCurrency(remaining)}</strong>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="pay-amount">Jumlah Pembayaran (Rp)</Label>
                        <Input
                            id="pay-amount"
                            type="number"
                            placeholder="0"
                            required
                            min="1"
                            max={remaining}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex gap-2 flex-wrap">
                            <Button type="button" variant="outline" size="sm" onClick={() => setAmount(String(remaining))}>
                                Lunas Semua
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setAmount(String(Math.round(remaining / 2)))}>
                                50%
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pay-note">Catatan (Opsional)</Label>
                        <Input
                            id="pay-note"
                            placeholder="Keterangan pembayaran"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > remaining}>
                        {isSubmitting ? 'Memproses...' : `Bayar ${amount ? formatCurrency(Number(amount)) : ''}`}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
