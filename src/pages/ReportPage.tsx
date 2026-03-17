import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart3, ChevronLeft, ChevronRight, FileText, Save, FileSpreadsheet, FileOutput, Filter, CloudUpload, Loader2 } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToPDFBase64, exportToExcelBase64 } from '@/utils/exportUtils';
import { saveToGoogleDrive } from '@/utils/googleDrive';
import { Layout } from '@/components/layout/Layout';
import { useSupabaseFinanceData } from '@/hooks/useSupabaseFinanceData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { BudgetDonutChart } from '@/components/dashboard/BudgetDonutChart';
import { useDynamicCategories } from '@/hooks/useDynamicCategories';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useDynamicCategories } from '@/hooks/useDynamicCategories';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function ReportPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  const { getMonthlyData, getMonthlySummary, saveMonthlyNote, isLoading: isDataLoading } = useSupabaseFinanceData();
  const { expenseCategories, incomeSubcategories, isLoading: isCategoriesLoading } = useDynamicCategories();
  const { isAuthenticated } = useAuth();
  const { getAccessToken, isTokenLoading } = useGoogleAuth();
  const [isUploading, setIsUploading] = useState(false);

  const isLoading = isDataLoading || isCategoriesLoading;

  const monthlyData = getMonthlyData(currentDate);
  const monthlySummary = getMonthlySummary(6);

  // Initialize note when month changes
  useEffect(() => {
    setNote(monthlyData.monthNote);
  }, [monthlyData.monthNote]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategory("all");
  }, [selectedCategory]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    if (selectedCategory === "Pemasukan") return incomeSubcategories;
    const catData = expenseCategories.find(c => c.category === selectedCategory);
    return catData?.subcategories || [];
  }, [selectedCategory, expenseCategories, incomeSubcategories]);

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

  const getFilteredData = () => {
    let allTransactions = [...monthlyData.incomes, ...monthlyData.expenses];

    if (selectedCategory !== "all") {
      if (selectedCategory === "Pemasukan") {
        allTransactions = allTransactions.filter(t => t.type === 'income');
      } else {
        allTransactions = allTransactions.filter(t => t.category === selectedCategory);
      }
    }

    if (selectedSubcategory !== "all") {
      allTransactions = allTransactions.filter(t => t.subcategory === selectedSubcategory);
    }

    const filteredTotalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const filteredTotalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions: allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      summary: {
        totalIncome: filteredTotalIncome,
        totalExpense: filteredTotalExpense,
        balance: filteredTotalIncome - filteredTotalExpense,
      }
    };
  };

  const getExportFilename = (extension: string) => {
    const periodStr = format(currentDate, 'MMMM_yyyy', { locale: id });
    let name = "Laporan";

    if (selectedSubcategory !== "all") {
      name = `Laporan_${selectedSubcategory.replace(/\s+/g, '')}`;
    } else if (selectedCategory !== "all") {
      name = `Laporan_${selectedCategory.replace(/\s+/g, '')}`;
    } else {
      name = "Laporan_Keuangan";
    }

    return `${name}_${periodStr}.${extension}`;
  };

  const handleExportPDF = () => {
    const period = format(currentDate, 'MMMM yyyy', { locale: id });
    const { transactions, summary } = getFilteredData();
    const filename = getExportFilename("pdf");

    toast.info('Menyiapkan PDF...');
    try {
      exportToPDF(transactions, period, summary, filename);
      toast.success('Ekspor PDF berhasil!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handleExportExcel = () => {
    const period = format(currentDate, 'MMMM yyyy', { locale: id });
    const { transactions, summary } = getFilteredData();
    const filename = getExportFilename("xlsx");

    toast.info('Menyiapkan Excel...');
    try {
      exportToExcel(transactions, period, summary, filename);
      toast.success('Ekspor Excel berhasil!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Excel export error:', error);
      toast.error('Gagal mengekspor Excel');
    }
  };

  const handleSaveToDrive = async (formatType: 'pdf' | 'excel') => {
    if (!isAuthenticated) {
      toast.error('Gagal menyimpan ke Drive. Silakan login terlebih dahulu.');
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      toast.error('Konfigurasi Google Drive belum diatur.');
      return;
    }

    try {
      const accessToken = await getAccessToken();

      const period = format(currentDate, 'MMMM yyyy', { locale: id });
      const { transactions, summary } = getFilteredData();
      const filename = getExportFilename(formatType);

      setIsUploading(true);
      toast.loading(`Menyimpan ${formatType.toUpperCase()} ke Google Drive...`, { id: 'drive-upload' });

      let base64Content = '';
      let mimeType = '';

      if (formatType === 'pdf') {
        const dataUri = exportToPDFBase64(transactions, period, summary, filename);
        base64Content = dataUri.split('base64,')[1] || dataUri;
        mimeType = 'application/pdf';
      } else {
        base64Content = exportToExcelBase64(transactions, period, summary);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      const result = await saveToGoogleDrive({
        filename,
        content: base64Content,
        accessToken,
        mimeType,
      });

      if (result && result.url) {
        toast.dismiss('drive-upload');
        toast.success(
          <div className="flex flex-col gap-1">
            <span>File berhasil disimpan ke Google Drive!</span>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline text-sm"
            >
              Buka File
            </a>
          </div>
        );
      } else {
        throw new Error('URL file tidak dikembalikan oleh server.');
      }
    } catch (error: any) {
      console.error('Drive upload error:', error);
      toast.dismiss('drive-upload');
      if (error && error.error === 'access_denied') {
        toast.error('Akses ke Google Drive dibatalkan oleh pengguna.');
      } else {
        toast.error('Gagal menyimpan ke Drive. Periksa koneksi atau izin akses.');
      }
    } finally {
      setIsUploading(false);
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
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Laporan Bulanan
              </h1>
              <p className="text-muted-foreground text-sm">
                Analisis keuangan dan evaluasi pengeluaran
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={handleExportPDF}
            >
              <FileOutput className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>

            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 h-9"
                    disabled={isUploading || isTokenLoading}
                  >
                    {isUploading || isTokenLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CloudUpload className="h-4 w-4" />
                    )}
                    Simpan ke Google Drive
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSaveToDrive('pdf')}>
                    Format PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSaveToDrive('excel')}>
                    Format Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="grid gap-2 w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 leading-none">
                  <Filter className="h-3 w-3" />
                  Filter Kategori
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-background/50 h-9">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.category} value={cat.category}>{cat.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 w-full sm:w-auto sm:min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 leading-none">
                  <Filter className="h-3 w-3" />
                  Filter Subkategori
                </label>
                <Select
                  value={selectedSubcategory}
                  onValueChange={setSelectedSubcategory}
                  disabled={selectedCategory === "all"}
                >
                  <SelectTrigger className="bg-background/50 h-9">
                    <SelectValue placeholder="Semua Subkategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Subkategori</SelectItem>
                    {availableSubcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1" />

              <div className="text-xs text-muted-foreground italic mb-2">
                * Filter berlaku untuk hasil export
              </div>
            </div>
          </CardContent>
        </Card>

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
