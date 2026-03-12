import { useAuthContext } from '@/contexts/AuthContext';
import { useSupabaseFinanceData } from './useSupabaseFinanceData';
import { useProfileSettings } from './useProfileSettings';
import { useDebts } from './useDebts';
import { useAssets } from './useAssets';
import { calculateDepreciatedValue } from '@/types/asset';
import { useMemo } from 'react';

export function useFinancialInsights() {
    const { user } = useAuthContext();
    const { getMonthlyData, expenses } = useSupabaseFinanceData();
    const { paymentMethods } = useProfileSettings();
    const { debts } = useDebts();
    const { assets } = useAssets();

    return useMemo(() => {
        // 1. Calculate Net Worth
        const liquidAssets = paymentMethods.reduce((sum, method) => sum + method.balance, 0);
        const nonLiquidAssets = assets.reduce((sum, asset) => sum + calculateDepreciatedValue(asset), 0);
        const totalAssets = liquidAssets + nonLiquidAssets;
        const unpaidHutang = debts
            .filter((d) => d.type === 'hutang' && d.status === 'belum_lunas')
            .reduce((sum, d) => sum + Number(d.amount), 0);
        const unpaidPiutang = debts
            .filter((d) => d.type === 'piutang' && d.status === 'belum_lunas')
            .reduce((sum, d) => sum + Number(d.amount), 0);

        // Include piutang as an asset since it's money owed to the user
        // Subtract hutang since it's a liability
        const netWorth = (totalAssets + unpaidPiutang) - unpaidHutang;

        // We need some historical data for ratios, let's look at the current month
        // as well as the average of the last 3 months if possible, but for simplicity, 
        // we use the current month for most metrics or a generic calculation.
        const currentMonthData = getMonthlyData(new Date());

        // Hitung pengeluaran hanya dari kategori Kebutuhan dan Keinginan
        const essentialExpense = (currentMonthData.categorySpending['Kebutuhan'] || 0) + (currentMonthData.categorySpending['Keinginan'] || 0);

        // Estimate Annual Expense based on essential categories only
        const annualExpenseEstimate = essentialExpense * 12;

        // Calculate Investment Assets
        // Find payment methods that are likely investments (or sum up the 'Investasi' category spending)
        // For ratio, we'll use total assets as investment assets if no specific "investment" account is marked,
        // or we can use the "Investasi" spending to project. Let's assume 20% of net worth is liquid investments 
        // if not specified, but let's just use `totalAssets` as the liquid investment pool for now.
        const investmentAssets = Math.max(0, netWorth); // Simplification

        // 2. Financial Freedom Ratio = Investment Assets / Annual Expense
        const financialFreedomRatio = annualExpenseEstimate > 0
            ? investmentAssets / annualExpenseEstimate
            : 0;

        let freedomLevel = 1;
        let freedomLevelName = "Survival";
        let freedomLevelDesc = "Pendapatan pasif belum menutupi pengeluaran dasar.";

        if (financialFreedomRatio >= 25) {
            freedomLevel = 5;
            freedomLevelName = "Abundance";
            freedomLevelDesc = "Aset Anda lebih dari cukup untuk menutupi gaya hidup mewah tanpa bekerja.";
        } else if (financialFreedomRatio >= 10) {
            freedomLevel = 4;
            freedomLevelName = "Freedom";
            freedomLevelDesc = "Pendapatan pasif sudah bisa menutupi seluruh pengeluaran tahunan Anda.";
        } else if (financialFreedomRatio >= 5) {
            freedomLevel = 3;
            freedomLevelName = "Security";
            freedomLevelDesc = "Anda memiliki bantalan keuangan yang sangat kuat untuk beberapa tahun.";
        } else if (financialFreedomRatio >= 1) {
            freedomLevel = 2;
            freedomLevelName = "Stability";
            freedomLevelDesc = "Pondasi keuangan Anda sudah stabil, pertahankan kebiasaan baik Anda.";
        }

        // 3. Financial Health Check (Ratios)
        const totalIncome = currentMonthData.totalIncome;
        const totalExpense = currentMonthData.totalExpense;
        const totalTabungan = currentMonthData.categorySpending['Investasi'] + currentMonthData.categorySpending['Dana Darurat']; // Assuming these are saved

        const debtRatio = totalAssets > 0 ? unpaidHutang / totalAssets : (unpaidHutang > 0 ? 1 : 0);
        const savingRatio = totalIncome > 0 ? totalTabungan / totalIncome : 0;
        const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 0;

        // Hitung Dana Darurat dari total semua pengeluaran historis yang masuk kategori 'Dana Darurat'
        const emergencyFunds = expenses
            .filter(e => e.category === 'Dana Darurat')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const emergencyRatio = essentialExpense > 0 ? emergencyFunds / essentialExpense : 0;

        // Calculate Health Score (0-100)
        let healthScore = 100;
        if (debtRatio > 0.5) healthScore -= 30;
        else if (debtRatio > 0.3) healthScore -= 15;

        if (savingRatio < 0.1) healthScore -= 20;
        else if (savingRatio < 0.2) healthScore -= 10;

        if (expenseRatio > 0.9) healthScore -= 30;
        else if (expenseRatio > 0.7) healthScore -= 15;

        if (emergencyRatio < 3) healthScore -= 20;

        healthScore = Math.max(0, Math.min(100, healthScore));

        let healthStatus = "Sangat Sehat";
        if (healthScore < 40) healthStatus = "Risiko Finansial";
        else if (healthScore < 60) healthStatus = "Perlu Perbaikan";
        else if (healthScore < 80) healthStatus = "Cukup Sehat";

        // 4. Emergency Fund Recommendation
        // Assuming user is single for now (factor = 3). Next iteration could pull this from profile.
        const emergencyFactor = 3;
        const recommendedEmergencyFund = totalExpense * emergencyFactor;
        const emergencyProgress = recommendedEmergencyFund > 0 ? (emergencyFunds / recommendedEmergencyFund) * 100 : 0;

        // 5. Retirement Fund Recommendation
        const retirementTarget = annualExpenseEstimate * 25;
        const retirementProgress = retirementTarget > 0 ? (investmentAssets / retirementTarget) * 100 : 0;
        const monthlyInvestmentRequired = retirementTarget > investmentAssets ? (retirementTarget - investmentAssets) / (20 * 12) : 0; // Assume 20 years to retirement

        // 6. Generated Advice
        const advice = [];
        if (savingRatio < 0.1) {
            advice.push({
                type: 'warning',
                title: 'Tingkatkan Tabungan Anda',
                message: `Rasio tabungan Anda saat ini ${(savingRatio * 100).toFixed(1)}%. Usahakan untuk menabung minimal 10-20% dari pendapatan bulanan.`,
            });
        }

        if (debtRatio > 0.5) {
            advice.push({
                type: 'danger',
                title: 'Prioritaskan Pelunasan Utang',
                message: 'Rasio utang terhadap aset Anda cukup tinggi (>50%). Fokuslah melunasi utang dengan bunga tertinggi terlebih dahulu.',
            });
        }

        if (emergencyRatio < 3) {
            advice.push({
                type: 'info',
                title: 'Bangun Dana Darurat',
                message: `Dana darurat yang ideal adalah 3-6 kali pengeluaran bulanan. Saat ini Anda berada di rasio ${emergencyRatio.toFixed(1)}x.`,
            });
        }

        if (expenseRatio < 0.5 && savingRatio > 0.2) {
            advice.push({
                type: 'success',
                title: 'Pertahankan Kinerja Baik!',
                message: 'Pengeluaran dan tabungan Anda berada dalam rasio yang sangat sehat. Jangan lupa berinvestasi untuk mengalahkan inflasi.',
            });
        }

        if (advice.length === 0) {
            advice.push({
                type: 'success',
                title: 'Keuangan Stabil',
                message: 'Kondisi keuangan Anda terlihat stabil bulan ini. Lanjutkan kebiasaan pencatatan yang baik!',
            });
        }

        return {
            netWorth: {
                totalAssets,
                liquidAssets,
                nonLiquidAssets,
                totalDebts: unpaidHutang,
                netWorth,
                isPositive: netWorth >= 0,
            },
            freedom: {
                ratio: financialFreedomRatio,
                level: freedomLevel,
                levelName: freedomLevelName,
                levelDesc: freedomLevelDesc,
            },
            health: {
                score: healthScore,
                status: healthStatus,
                ratios: {
                    debt: debtRatio,
                    saving: savingRatio,
                    expense: expenseRatio,
                    emergency: emergencyRatio,
                }
            },
            emergency: {
                current: emergencyFunds,
                target: recommendedEmergencyFund,
                progress: Math.min(100, emergencyProgress),
                factor: emergencyFactor,
            },
            retirement: {
                current: investmentAssets,
                target: retirementTarget,
                progress: Math.min(100, retirementProgress),
                monthlyRequired: monthlyInvestmentRequired,
            },
            advice,
        };
    }, [getMonthlyData, paymentMethods, debts, expenses, assets]);
}
