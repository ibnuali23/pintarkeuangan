import { useAuthContext } from '@/contexts/AuthContext';
import { useSupabaseFinanceData } from './useSupabaseFinanceData';
import { useProfileSettings } from './useProfileSettings';
import { useDebts } from './useDebts';
import { useAssets } from './useAssets';
import { calculateDepreciatedValue } from '@/types/asset';
import { useMemo } from 'react';
import { subMonths } from 'date-fns';

function getAverageEssentialExpense(getMonthlyData: (date: Date) => any, months: number): number {
    const now = new Date();
    let total = 0;
    let validMonths = 0;

    for (let i = 0; i < months; i++) {
        const date = subMonths(now, i);
        const data = getMonthlyData(date);
        const essential = (data.categorySpending['Kebutuhan'] || 0) + (data.categorySpending['Keinginan'] || 0);
        if (essential > 0) validMonths++;
        total += essential;
    }

    return validMonths > 0 ? total / validMonths : 0;
}

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
            .reduce((sum, d) => sum + Number(d.remaining_amount ?? d.amount), 0);
        const unpaidPiutang = debts
            .filter((d) => d.type === 'piutang' && d.status === 'belum_lunas')
            .reduce((sum, d) => sum + Number(d.remaining_amount ?? d.amount), 0);

        const netWorth = (totalAssets + unpaidPiutang) - unpaidHutang;

        const currentMonthData = getMonthlyData(new Date());

        // Rata-rata pengeluaran Kebutuhan+Keinginan 3 bulan untuk dana darurat
        const avgEssential3Months = getAverageEssentialExpense(getMonthlyData, 3);
        // Rata-rata pengeluaran Kebutuhan+Keinginan 12 bulan untuk dana pensiun
        const avgEssential12Months = getAverageEssentialExpense(getMonthlyData, 12);

        // Annual expense estimate for retirement based on 12-month average
        const annualExpenseEstimate = avgEssential12Months * 12;

        const investmentAssets = Math.max(0, netWorth);

        // 2. Financial Freedom Ratio
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

        // 3. Financial Health Check
        const totalIncome = currentMonthData.totalIncome;
        const totalExpense = currentMonthData.totalExpense;
        const totalTabungan = Object.entries(currentMonthData.categorySpending)
            .filter(([cat]) => cat !== 'Kebutuhan' && cat !== 'Keinginan')
            .reduce((sum, [, val]) => sum + val, 0);

        const debtRatio = totalAssets > 0 ? unpaidHutang / totalAssets : (unpaidHutang > 0 ? 1 : 0);
        const savingRatio = totalIncome > 0 ? totalTabungan / totalIncome : 0;
        const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 0;

        const emergencyFunds = expenses
            .filter(e => e.category === 'Dana Darurat')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const emergencyRatio = avgEssential3Months > 0 ? emergencyFunds / avgEssential3Months : 0;

        // Health Score
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

        // 4. Emergency Fund - based on 3-month average
        const emergencyFactor = 3;
        const recommendedEmergencyFund = avgEssential3Months * emergencyFactor;
        const emergencyProgress = recommendedEmergencyFund > 0 ? (emergencyFunds / recommendedEmergencyFund) * 100 : 0;

        // 5. Retirement Fund - based on 12-month average
        const retirementTarget = annualExpenseEstimate * 25;
        const retirementProgress = retirementTarget > 0 ? (investmentAssets / retirementTarget) * 100 : 0;
        const monthlyInvestmentRequired = retirementTarget > investmentAssets ? (retirementTarget - investmentAssets) / (20 * 12) : 0;

        // 6. Advice
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
