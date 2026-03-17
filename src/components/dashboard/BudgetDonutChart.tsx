import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BudgetDonutChartProps {
  categorySpending: Record<string, number>;
  totalExpense: number;
  budgetPercentages?: Record<string, number>;
  categoryIcons?: Record<string, string>;
}

const DEFAULT_COLORS = [
  'hsl(168, 76%, 36%)',
  'hsl(43, 74%, 49%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 70%, 50%)',
  'hsl(340, 65%, 55%)',
  'hsl(120, 50%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(260, 55%, 50%)',
];

export function BudgetDonutChart({ categorySpending, totalExpense, budgetPercentages = {}, categoryIcons = {} }: BudgetDonutChartProps) {
  const categories = Object.keys(budgetPercentages).length > 0
    ? Object.keys(budgetPercentages)
    : Object.keys(categorySpending).filter(k => categorySpending[k] > 0);

  const data = categories.map((category, i) => ({
    name: category,
    value: categorySpending[category] || 0,
    percentage: totalExpense > 0 ? ((categorySpending[category] || 0) / totalExpense) * 100 : 0,
    target: budgetPercentages[category] || 0,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
