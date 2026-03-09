import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Asset, ASSET_CATEGORIES, AssetCategory, calculateDepreciatedValue } from '@/types/asset';

interface AssetChartProps {
    assets: Asset[];
    isDepreciationEnabled: boolean;
}

const COLORS: Record<string, string> = {
    Properti: 'hsl(168, 76%, 36%)', // finance green
    Kendaraan: 'hsl(43, 74%, 49%)', // warning yellow
    Elektronik: 'hsl(200, 70%, 50%)', // info blue
    Investasi: 'hsl(280, 65%, 60%)', // purple
    Lainnya: 'hsl(220, 10%, 60%)', // gray
};

export function AssetChart({ assets, isDepreciationEnabled }: AssetChartProps) {
    const totalValue = assets.reduce((sum, asset) => {
        return sum + (isDepreciationEnabled ? calculateDepreciatedValue(asset) : asset.value);
    }, 0);

    const categorySpending = assets.reduce((acc, asset) => {
        const category = asset.category as AssetCategory;
        const value = isDepreciationEnabled ? calculateDepreciatedValue(asset) : asset.value;
        acc[category] = (acc[category] || 0) + value;
        return acc;
    }, {} as Record<string, number>);

    const data = ASSET_CATEGORIES.map((category) => {
        const value = categorySpending[category] || 0;
        return {
            name: category,
            value: value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
            color: COLORS[category] || COLORS.Lainnya,
        };
    }).filter(item => item.value > 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (assets.length === 0 || totalValue === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-muted-foreground">Belum ada data distribusi aset</p>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
                    <p className="text-sm font-medium">
                        {data.percentage.toFixed(1)}% dari total aset
                    </p>
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
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                        <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                            {entry.value} ({data.find(d => d.name === entry.value)?.percentage.toFixed(0) || 0}%)
                        </span>
                    </div>
                ))}
            </div>
        );
    };

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
