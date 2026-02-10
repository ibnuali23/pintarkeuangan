import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart3, ChevronLeft, ChevronRight, FileText, Save, FileSpreadsheet, FileOutput } from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import { Layout } from '@/components/layout/Layout';
import { useSupabaseFinanceData } from '@/hooks/useSupabaseFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { BudgetDonutChart } from '@/components/dashboard/BudgetDonutChart';
import { BUDGET_PERCENTAGES, ExpenseCategory } from '@/types/finance';
import { toast } from 'sonner';

export default function ReportPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [note, setNote] = useState('');
  const { getMonthlyData, getMonthlySummary, saveMonthlyNote, isLoading } = useSupabaseFinanceData();

  const monthlyData = getMonthlyData(currentDate);
  const monthlySummary = getMonthlySummary(6);

  // Initialize note when month changes
  useEffect(() => {
    setNote(monthlyData.monthNote);
  }, [monthlyData.monthNote]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleSaveNote = async () => {
    const monthKey = format(currentDate, 'yyyy-MM');
    const result = await saveMonthlyNote(monthKey, note);
    if (result.error) {
      toast.error('Gagal menyimpan catatan');
    } else {
      toast.success('Catatan bulanan tersimpan!');
    }
  };

  const handleExportPDF = () => {
    const period = format(currentDate, 'MMMM yyyy', { locale: id });
    const allTransactions = [...monthlyData.incomes, ...monthlyData.expenses].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const summary = {
      totalIncome: monthlyData.totalIncome,
      totalExpense: monthlyData.totalExpense,
      balance: monthlyData.balance,
    };

    toast.info('Menyiapkan PDF...');
    try {
      exportToPDF(allTransactions, period, summary);
      toast.success('Ekspor PDF berhasil!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handleExportExcel = () => {
    const period = format(currentDate, 'MMMM yyyy', { locale: id });
    const allTransactions = [...monthlyData.incomes, ...monthlyData.expenses];
    const summary = {
      totalIncome: monthlyData.totalIncome,
      totalExpense: monthlyData.totalExpense,
      balance: monthlyData.balance,
    };

    toast.info('Menyiapkan Excel...');
    try {
      exportToExcel(allTransactions, period, summary);
      toast.success('Ekspor Excel berhasil!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Gagal mengekspor Excel');
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

  const getCategoryData = () => {
    return (Object.keys(BUDGET_PERCENTAGES) as ExpenseCategory[]).map((category) => {
      const spent = monthlyData.categorySpending[category];
      const target = BUDGET_PERCENTAGES[category];
      const spentPercentage = monthlyData.totalExpense > 0
        ? (spent / monthlyData.totalExpense) * 100
        : 0;
      const idealAmount = (monthlyData.totalIncome * target) / 100;

      return {
        category,
        target,
        spent,
        spentPercentage,
        idealAmount,
        difference: idealAmount - spent,
        status: spentPercentage > target ? 'over' : spentPercentage > target * 0.8 ? 'warning' : 'good',
      };
    });
  };

  const categoryData = getCategoryData();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Laporan Bulanan
            </h1>
            <p className="text-muted-foreground">
              Analisis keuangan dan evaluasi pengeluaran
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportPDF}
            >
              <FileOutput className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[150px]">
            <p className="font-serif text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: id })}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('next')}
            disabled={currentDate >= new Date()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Pemasukan</p>
              <p className="text-2xl font-bold font-serif text-success">
                {formatCurrency(monthlyData.totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              <p className="text-2xl font-bold font-serif text-destructive">
                {formatCurrency(monthlyData.totalExpense)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-2xl font-bold font-serif ${monthlyData.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(monthlyData.balance)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Rasio Pengeluaran</p>
              <p className="text-2xl font-bold font-serif">
                {monthlyData.totalIncome > 0
                  ? ((monthlyData.totalExpense / monthlyData.totalIncome) * 100).toFixed(0)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-serif">Distribusi Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetDonutChart
                categorySpending={monthlyData.categorySpending}
                totalExpense={monthlyData.totalExpense}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-serif">Tren 6 Bulan Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={monthlySummary} />
            </CardContent>
          </Card>
        </div>

        {/* Category breakdown table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-serif">Rincian per Kategori</CardTitle>
            <CardDescription>
              Perbandingan antara target dan realisasi pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kategori</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Target</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ideal (Rp)</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Realisasi</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Selisih</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((item) => (
                    <tr key={item.category} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{item.category}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{item.target}%</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.idealAmount)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.spent)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${item.difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {item.difference >= 0 ? '+' : ''}{formatCurrency(item.difference)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.status === 'good' ? 'bg-success/10 text-success' :
                          item.status === 'warning' ? 'bg-warning/10 text-warning' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                          {item.status === 'good' ? 'Aman' : item.status === 'warning' ? 'Waspada' : 'Melebihi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly note */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Catatan Bulanan
            </CardTitle>
            <CardDescription>
              Tulis refleksi dan rencana untuk bulan ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Bulan ini fokus ke sawit & perabot, insyaAllah bulan depan ditambah sedekah..."
              className="min-h-[100px] resize-none"
            />
            <Button onClick={handleSaveNote} className="gradient-primary text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              Simpan Catatan
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
