import { Layout } from '@/components/layout/Layout';
import { useFinancialInsights } from '@/hooks/useFinancialInsights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ShieldAlert, ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, Info, Shield, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function FinancialInsightsPage() {
    const insights = useFinancialInsights();
    const { theme } = useTheme();

    // Re-scroll to top when loaded
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-primary';
        if (score >= 40) return 'text-warning';
        return 'text-destructive';
    };

    const getHealthBg = (score: number) => {
        if (score >= 80) return 'bg-success/10 border-success/30';
        if (score >= 60) return 'bg-primary/10 border-primary/30';
        if (score >= 40) return 'bg-warning/10 border-warning/30';
        return 'bg-destructive/10 border-destructive/30';
    };

    const adviceIconMap = {
        'success': <CheckCircle2 className="h-5 w-5 text-success" />,
        'warning': <AlertTriangle className="h-5 w-5 text-warning" />,
        'danger': <ShieldAlert className="h-5 w-5 text-destructive" />,
        'info': <Info className="h-5 w-5 text-primary" />,
    };

    const adviceClassMap = {
        'success': 'bg-success/5 border-success/20',
        'warning': 'bg-warning/5 border-warning/20',
        'danger': 'bg-destructive/5 border-destructive/20',
        'info': 'bg-primary/5 border-primary/20',
    };

    return (
        <Layout>
            <div className="space-y-6 pb-12">
                <div className="animate-fade-in">
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Financial Insights 💡</h1>
                    <p className="text-muted-foreground mt-1">Analisis otomatis dari data keuangan dan aset Anda.</p>
                </div>

                {/* Top Overview: Net Worth & Health Score */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Net Worth Card */}
                    <Card className="glass-card flex flex-col justify-between overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="font-serif text-lg">Kekayaan Bersih (Net Worth)</CardTitle>
                            <CardDescription>Total aset dikurangi kewajiban (utang)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <h3 className={cn(
                                    "text-4xl font-bold",
                                    insights.netWorth.isPositive ? 'text-foreground' : 'text-destructive'
                                )}>
                                    {formatCurrency(insights.netWorth.netWorth)}
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                    <div className="bg-secondary/50 p-3 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Total Saldo + Piutang</p>
                                        <p className="font-medium text-success">{formatCurrency(insights.netWorth.liquidAssets)}</p>
                                    </div>
                                    <div className="bg-secondary/50 p-3 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Aset Non-Likuid</p>
                                        <p className="font-medium text-primary">{formatCurrency(insights.netWorth.nonLiquidAssets)}</p>
                                    </div>
                                    <div className="bg-secondary/50 p-3 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Total Utang</p>
                                        <p className="font-medium text-destructive">{formatCurrency(insights.netWorth.totalDebts)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Health Score Card */}
                    <Card className={cn("glass-card border-2", getHealthBg(insights.health.score))}>
                        <CardHeader>
                            <CardTitle className="font-serif text-lg flex items-center justify-between">
                                Skor Kesehatan Finansial
                                {insights.health.score >= 60 ? <ShieldCheck className="h-6 w-6 text-success" /> : <ShieldAlert className="h-6 w-6 text-destructive" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-4 space-y-4">
                                <div className="relative flex items-center justify-center">
                                    {/* Circle background */}
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-muted/30" />
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray={351.858} strokeDashoffset={351.858 - (351.858 * insights.health.score) / 100} className={getHealthColor(insights.health.score)} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold">{insights.health.score}</span>
                                        <span className="text-xs font-medium text-muted-foreground">/ 100</span>
                                    </div>
                                </div>
                                <h4 className={cn("text-xl font-bold", getHealthColor(insights.health.score))}>
                                    {insights.health.status}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Level Kebebasan Finansial */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="font-serif text-lg">Level Kebebasan Finansial</CardTitle>
                        <CardDescription>Rasio Aset Investasi dibandingkan Pengeluaran Tahunan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        Level {insights.freedom.level}: {insights.freedom.levelName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                                        {insights.freedom.levelDesc}
                                    </p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm text-muted-foreground mb-1">Financial Freedom Ratio</p>
                                    <p className="text-2xl font-bold font-serif">{insights.freedom.ratio.toFixed(2)}x</p>
                                </div>
                            </div>

                            <div className="relative pt-4">
                                <div className="flex mb-2 items-center justify-between">
                                    <div className="text-xs font-semibold inline-block py-1 px-2 rounded text-primary-foreground bg-primary">
                                        Progres ke Level Selanjutnya
                                    </div>
                                </div>
                                {/* Visual Level Tracker */}
                                <div className="flex h-3 mb-4 overflow-hidden rounded bg-secondary">
                                    <div style={{ width: `${(insights.freedom.level / 5) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center gradient-primary"></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>Lv 1 (Survival)</span>
                                    <span>Lv 3 (Security)</span>
                                    <span>Lv 5 (Abundance)</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Goals & Funds */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Emergency Fund */}
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center justify-between">
                                Dana Darurat
                                <Shield className="h-5 w-5 text-primary" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-3xl font-bold">{formatCurrency(insights.emergency.current)}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Terkumpul</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(insights.emergency.target)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Target ({insights.emergency.factor} bulan)</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium">{insights.emergency.progress.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={insights.emergency.progress} className="h-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Retirement Fund */}
                    <Card className="glass-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold flex items-center justify-between">
                                Dana Pensiun (Estimasi)
                                <TrendingUp className="h-5 w-5 text-accent" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-3xl font-bold">{formatCurrency(insights.retirement.current)}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Aset Tersedia</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(insights.retirement.target)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Target Optimal (25x Pengeluaran)</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium">{insights.retirement.progress.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={insights.retirement.progress} className="h-2 [&>div]:bg-accent" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Automatic Advice */}
                <div className="space-y-4">
                    <h2 className="font-serif text-xl font-bold mt-8 mb-4">Saran & Rekomendasi Pintar</h2>
                    <div className="grid gap-4">
                        {insights.advice.map((item, index) => (
                            <div key={index} className={cn("flex gap-4 p-4 rounded-xl border", adviceClassMap[item.type as keyof typeof adviceClassMap])}>
                                <div className="mt-1 flex-shrink-0">
                                    {adviceIconMap[item.type as keyof typeof adviceIconMap]}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </Layout>
    );
}
