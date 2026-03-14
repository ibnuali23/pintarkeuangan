import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DebtPayment } from '@/hooks/useDebts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DebtPaymentHistoryProps {
    open: boolean;
    onClose: () => void;
    debtId: string;
    getPayments: (debtId: string) => Promise<DebtPayment[]>;
}

export function DebtPaymentHistory({ open, onClose, debtId, getPayments }: DebtPaymentHistoryProps) {
    const [payments, setPayments] = useState<DebtPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && debtId) {
            setLoading(true);
            getPayments(debtId).then((data) => {
                setPayments(data);
                setLoading(false);
            });
        }
    }, [open, debtId, getPayments]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Riwayat Pembayaran</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <p className="text-center text-muted-foreground py-4">Memuat...</p>
                ) : payments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Belum ada pembayaran.</p>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {payments.map((p) => (
                            <div key={p.id} className="flex justify-between items-start p-3 rounded-lg border bg-card">
                                <div>
                                    <p className="font-medium text-success">{formatCurrency(Number(p.amount))}</p>
                                    {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(p.paid_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
