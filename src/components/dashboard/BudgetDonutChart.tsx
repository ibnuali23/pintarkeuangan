import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BUDGET_PERCENTAGES, ExpenseCategory } from '@/types/finance';

interface BudgetDonutChartProps {
  categorySpending: Record<ExpenseCategory, number>;
  totalExpense: number;
}

const COLORS = {
  Kebutuhan: 'hsl(168, 76%, 36%)',
  Investasi: 'hsl(43, 74%, 49%)',
  Keinginan: 'hsl(280, 65%, 60%)',
  'Dana Darurat': 'hsl(200, 70%, 50%)',
};

export function BudgetDonutChart({ categorySpending, totalExpense }: BudgetDonutChartProps) {
  const data = (Object.keys(BUDGET_PERCENTAGES) as ExpenseCategory[]).map((category) => ({
    name: category,
    value: categorySpending[category],
    percentage: totalExpense > 0 ? (categorySpending[category] / totalExpense) * 100 : 0,
    target: BUDGET_PERCENTAGES[category],
    color: COLORS[category],
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status =
        data.percentage > data.target
          ? 'Melebihi Batas!'
          : data.percentage > data.target * 0.8
          ? 'Mendekati Batas'
          : 'Aman';
      const statusColor =
        data.percentage > data.target
          ? 'text-destructive'
          : data.percentage > data.target * 0.8
          ? 'text-warning'
          : 'text-success';

      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
          <p className="text-sm">
            {data.percentage.toFixed(1)}% dari total (target: {data.target}%)
          </p>
          <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.value} ({data[index]?.percentage.toFixed(0) || 0}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (totalExpense === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-muted-foreground">Belum ada pengeluaran bulan ini</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
