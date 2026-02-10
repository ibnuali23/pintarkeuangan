import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '../hooks/useSupabaseFinanceData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const exportToPDF = (
  transactions: Transaction[],
  period: string,
  summary?: { totalIncome: number; totalExpense: number; balance: number }
) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Laporan Keuangan', 14, 22);

  // Period
  doc.setFontSize(12);
  doc.text(`Periode: ${period}`, 14, 30);

  // Summary if provided
  if (summary) {
    doc.setFontSize(10);
    doc.text(`Total Pemasukan: ${formatCurrency(summary.totalIncome)}`, 14, 40);
    doc.text(`Total Pengeluaran: ${formatCurrency(summary.totalExpense)}`, 14, 46);
    doc.text(`Saldo: ${formatCurrency(summary.balance)}`, 14, 52);
  }

  const tableData = transactions.map((t) => [
    format(parseISO(t.date), 'dd MMM yyyy', { locale: id }),
    t.category,
    t.description || '-',
    formatCurrency(t.amount),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
  ]);

  autoTable(doc, {
    startY: summary ? 60 : 40,
    head: [['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah', 'Tipe']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // primary color
  });

  doc.save(`Laporan_Keuangan_${period.replace(' ', '_')}.pdf`);
};

export const exportToExcel = (
  transactions: Transaction[],
  period: string,
  summary?: { totalIncome: number; totalExpense: number; balance: number }
) => {
  const incomeTrans = transactions.filter(t => t.type === 'income');
  const expenseTrans = transactions.filter(t => t.type === 'expense');

  const mapData = (data: Transaction[]) => data.map(t => ({
    Tanggal: format(parseISO(t.date), 'yyyy-MM-dd'),
    Kategori: t.category,
    Subkategori: t.subcategory,
    Deskripsi: t.description || '-',
    Jumlah: t.amount,
  }));

  const wb = XLSX.utils.book_new();

  // Summary Sheet
  if (summary) {
    const summaryData = [
      { Keterangan: 'Periode', Nilai: period },
      { Keterangan: 'Total Pemasukan', Nilai: summary.totalIncome },
      { Keterangan: 'Total Pengeluaran', Nilai: summary.totalExpense },
      { Keterangan: 'Saldo', Nilai: summary.balance },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
  }

  // Income Sheet
  const wsIncome = XLSX.utils.json_to_sheet(mapData(incomeTrans));
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Pemasukan');

  // Expense Sheet
  const wsExpense = XLSX.utils.json_to_sheet(mapData(expenseTrans));
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Pengeluaran');

  XLSX.writeFile(wb, `Laporan_Keuangan_${period.replace(' ', '_')}.xlsx`);
};
