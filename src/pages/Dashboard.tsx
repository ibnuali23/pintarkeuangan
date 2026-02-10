import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { BudgetDonutChart } from '@/components/dashboard/BudgetDonutChart';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { BudgetStatusList } from '@/components/dashboard/BudgetStatusList';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TodayExpenseCard } from '@/components/dashboard/TodayExpenseCard';
import { DailyExpenseChart } from '@/components/dashboard/DailyExpenseChart';
import { DailyExpenseList } from '@/components/dashboard/DailyExpenseList';
import { DailyExpenseFilter, FilterType } from '@/components/dashboard/DailyExpenseFilter';
import { PaymentMethodsCard } from '@/components/dashboard/PaymentMethodsCard';
import { BudgetRealizationCard } from '@/components/dashboard/BudgetRealizationCard';
import { TransferHistoryCard } from '@/components/dashboard/TransferHistoryCard';
import { MoneyTransferModal } from '@/components/dashboard/MoneyTransferModal';
import { useSupabaseFinanceData } from '@/hooks/useSupabaseFinanceData';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { useMoneyTransfers } from '@/hooks/useMoneyTransfers';
import { useDailyExpenseData } from '@/hooks/useDailyExpenseData';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { profile, isAdmin } = useAuthContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyFilter, setDailyFilter] = useState<FilterType>('7days');
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  const { getMonthlyData, getMonthlySummary, expenses, isLoading } = useSupabaseFinanceData();
  const { paymentMethods, budgetSettings, adjustPaymentMethodBalance } = useProfileSettings();
  const { transfers, addTransfer, deleteTransfer } = useMoneyTransfers();
  
  // Convert Supabase transactions to the format expected by useDailyExpenseData
  const expensesForDaily = expenses.map(e => ({
    id: e.id,
    date: e.date,
    category: e.category as any,
    subcategory: e.subcategory,
    description: e.description || '',
    amount: Number(e.amount),
    createdAt: e.created_at,
  }));
  
  const {
    dailyData,
    chartData,
    todayTotal,
    todayTransactionCount,
    totalExpense,
    averageDaily,
    exportToExcel,
  } = useDailyExpenseData(expensesForDaily, dailyFilter, customRange);

  const monthlyData = getMonthlyData(currentDate);
  const monthlySummary = getMonthlySummary(6);

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

  // Get greeting name
  const getGreetingName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return 'Pengguna';
  };

  // Check if admin
  const displayName = isAdmin ? `${getGreetingName()} 👑` : getGreetingName();

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
        {/* Header with greeting */}
        <div className="animate-fade-in">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Selamat datang, {displayName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Semoga hari Anda penuh keberkahan dan keuangan Anda semakin tertata.
          </p>
        </div>

        {/* Today's expense card */}
        <TodayExpenseCard total={todayTotal} transactionCount={todayTransactionCount} />

        {/* Month selector */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
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

        {/* Payment Methods & Budget Realization */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PaymentMethodsCard
            paymentMethods={paymentMethods}
            onTransferClick={() => setIsTransferModalOpen(true)}
          />
          <BudgetRealizationCard
            budgetSettings={budgetSettings}
            expenses={expenses}
          />
        </div>

        {/* Transfer History */}
        <TransferHistoryCard
          transfers={transfers}
          paymentMethods={paymentMethods}
          onDelete={deleteTransfer}
          isAdmin={isAdmin}
        />

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title="Total Pemasukan"
            value={formatCurrency(monthlyData.totalIncome)}
            subtitle={`${monthlyData.incomes.length} transaksi`}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="income"
          />
          <SummaryCard
            title="Total Pengeluaran"
            value={formatCurrency(monthlyData.totalExpense)}
            subtitle={`${monthlyData.expenses.length} transaksi`}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="expense"
          />
          <SummaryCard
            title="Saldo Bersih"
            value={formatCurrency(monthlyData.balance)}
            subtitle={monthlyData.balance >= 0 ? 'Surplus 💰' : 'Defisit ⚠️'}
            icon={<Wallet className="h-6 w-6" />}
            variant="balance"
          />
        </div>

        {/* Daily expense section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-serif text-lg">
              📊 Grafik Pengeluaran Harian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DailyExpenseFilter
              filter={dailyFilter}
              onFilterChange={setDailyFilter}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              onExport={exportToExcel}
            />
            
            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Periode</p>
                <p className="font-serif text-lg font-semibold text-foreground">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Rata-rata/Hari</p>
                <p className="font-serif text-lg font-semibold text-foreground">
                  {formatCurrency(averageDaily)}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Hari Aktif</p>
                <p className="font-serif text-lg font-semibold text-foreground">
                  {dailyData.length} hari
                </p>
              </div>
            </div>

            <DailyExpenseChart data={chartData} />
          </CardContent>
        </Card>

        {/* Daily expense list */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-serif text-lg">
              📅 Ringkasan Pengeluaran Harian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DailyExpenseList data={dailyData} />
          </CardContent>
        </Card>

        {/* Charts section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget allocation donut chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                Alokasi Pengeluaran 50-30-15-5
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetDonutChart
                categorySpending={monthlyData.categorySpending}
                totalExpense={monthlyData.totalExpense}
              />
            </CardContent>
          </Card>

          {/* Monthly comparison bar chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                Tren Bulanan (6 Bulan)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={monthlySummary} />
            </CardContent>
          </Card>
        </div>

        {/* Budget status and recent transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget status list */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                Status Anggaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetStatusList
                budgetStatus={monthlyData.budgetStatus}
                totalIncome={monthlyData.totalIncome}
              />
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                Transaksi Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions
                incomes={monthlyData.incomes}
                expenses={monthlyData.expenses}
              />
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {monthlyData.budgetStatus.some((s) => s.status === 'danger') && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <p className="font-semibold text-destructive">Perhatian!</p>
                  <p className="text-sm text-muted-foreground">
                    {monthlyData.budgetStatus
                      .filter((s) => s.status === 'danger')
                      .map(
                        (s) =>
                          `${s.category} sudah ${s.spentPercentage.toFixed(0)}% (target ${s.targetPercentage}%)`
                      )
                      .join('. ')}
                    . Pertimbangkan penghematan untuk bulan ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Money Transfer Modal */}
      <MoneyTransferModal
        open={isTransferModalOpen}
        onOpenChange={setIsTransferModalOpen}
        paymentMethods={paymentMethods}
        onTransfer={addTransfer}
        onUpdateBalance={adjustPaymentMethodBalance}
      />
    </Layout>
  );
}
