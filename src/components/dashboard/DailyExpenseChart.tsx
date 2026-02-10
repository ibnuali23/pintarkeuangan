import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyData {
  date: string;
  dateLabel: string;
  total: number;
}

interface DailyExpenseChartProps {
  data: DailyData[];
}

export function DailyExpenseChart({ data }: DailyExpenseChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}jt`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}rb`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.dateLabel === label);
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg animate-fade-in">
          <p className="font-semibold mb-1 text-foreground">{dataPoint?.date || label}</p>
          <p className="text-sm font-medium" style={{ color: 'hsl(168, 76%, 36%)' }}>
            Total:{' '}
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-muted-foreground">Belum ada data pengeluaran</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(168, 76%, 36%)" stopOpacity={0.8} />
            <stop offset="50%" stopColor="hsl(168, 70%, 45%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="hsl(168, 76%, 36%)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorExpense)"
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
