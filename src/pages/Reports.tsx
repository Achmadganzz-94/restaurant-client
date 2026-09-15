import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatRupiah = (value: number) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
};

interface ReportData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    totalDiscount: number;
    averageTransaction: number;
  };

  dailySales: {
    date: string;
    transactions: number;
    revenue: number;
  }[];

  topMenus: {
    menuId: string;
    name: string;
    category: string;
    totalSold: number;
    revenue: number;
  }[];

  paymentMethods: {
    method: string;
    transactions: number;
    revenue: number;
  }[];

  membership: {
    memberTransactions: number;
    nonMemberTransactions: number;
    memberRevenue: number;
    nonMemberRevenue: number;
  };
}

type Period = "Hari Ini" | "7 Hari Terakhir" | "Bulan Ini" | "Bulan Lalu";

const getDateRange = (period: Period) => {
  const now = new Date();

  const startDate = new Date(now);
  const endDate = new Date(now);

  if (period === "7 Hari Terakhir") {
    startDate.setDate(now.getDate() - 6);
  }

  if (period === "Bulan Ini") {
    startDate.setDate(1);
  }

  if (period === "Bulan Lalu") {
    startDate.setMonth(now.getMonth() - 1);
    startDate.setDate(1);

    endDate.setDate(0);
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case "CASH":
      return "Cash";

    case "QRIS":
      return "QRIS";

    case "TRANSFER":
      return "Transfer";

    default:
      return method;
  }
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>("Bulan Ini");

  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [report, setReport] = useState<ReportData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExportOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");

        // ==================================================
        // AMBIL TOKEN LOGIN
        // ==================================================

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Token login tidak ditemukan. Silakan login kembali.",
          );
        }

        const { startDate, endDate } = getDateRange(period);

        const url =
          `http://localhost:5000/api/reports` +
          `?startDate=${startDate}` +
          `&endDate=${endDate}`;

        console.log("REPORT REQUEST:", url);

        // ==================================================
        // REQUEST KE BACKEND
        // ==================================================

        const response = await fetch(url, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // ==================================================
        // ERROR RESPONSE
        // ==================================================

        if (!response.ok) {
          const errorText = await response.text();

          console.error("REPORT API ERROR:", {
            status: response.status,
            statusText: response.statusText,
            response: errorText,
          });

          if (response.status === 401) {
            throw new Error(
              "Sesi login tidak ditemukan. Silakan login kembali.",
            );
          }

          if (response.status === 403) {
            throw new Error("Anda tidak memiliki izin untuk melihat laporan.");
          }

          throw new Error(`Gagal mengambil data laporan (${response.status})`);
        }

        // ==================================================
        // RESPONSE
        // ==================================================

        const result = await response.json();

        console.log("REPORT API RESPONSE:", result);

        if (!result?.data) {
          throw new Error("Response laporan tidak memiliki data.");
        }

        setReport(result.data);
      } catch (error: any) {
        console.error("REPORT FETCH ERROR:", error);

        setError(error?.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [period]);

  // ======================================================
  // MAX REVENUE
  // ======================================================

  const maxRevenue = useMemo(() => {
    if (!report?.dailySales?.length) {
      return 1;
    }

    return Math.max(
      ...report.dailySales.map((item) => Number(item.revenue) || 0),
      1,
    );
  }, [report]);

  // ======================================================
  // TOTAL PAYMENT
  // ======================================================

  const totalPaymentRevenue = useMemo(() => {
    if (!report?.paymentMethods) {
      return 0;
    }

    return report.paymentMethods.reduce(
      (total, payment) => total + Number(payment.revenue || 0),
      0,
    );
  }, [report]);

  // ======================================================
  // MEMBER PERCENTAGE
  // ======================================================

  const memberPercentage = useMemo(() => {
    if (!report) {
      return 0;
    }

    if (report.summary.totalTransactions === 0) {
      return 0;
    }

    return Math.round(
      (report.membership.memberTransactions /
        report.summary.totalTransactions) *
        100,
    );
  }, [report]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">
            Management
          </p>

          <h1 className="text-2xl font-extrabold text-slate-800 mt-1">
            Laporan
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Analisis dan rekap performa penjualan restoran.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />

            <p className="text-sm font-semibold text-slate-500 mt-4">
              Memuat laporan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">
              Management
            </p>

            <h1 className="text-2xl font-extrabold text-slate-800 mt-1">
              Laporan
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Analisis dan rekap performa penjualan restoran.
            </p>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>Hari Ini</option>
            <option>7 Hari Terakhir</option>
            <option>Bulan Ini</option>
            <option>Bulan Lalu</option>
          </select>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">
              !
            </div>

            <div>
              <p className="text-sm font-extrabold text-red-800">
                Gagal memuat laporan
              </p>

              <p className="text-sm text-red-600 mt-1">{error}</p>

              <p className="text-xs text-red-500 mt-3">
                Pastikan Anda masih dalam keadaan login.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const exportExcel = () => {
    if (!report) return;

    const workbook = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1 — RINGKASAN
    // ==========================================

    const summaryData = [
      ["LAPORAN PENJUALAN"],
      [],
      ["Periode", period],
      [],
      ["Total Penjualan", report.summary.totalRevenue],
      ["Total Transaksi", report.summary.totalTransactions],
      ["Total Diskon Member", report.summary.totalDiscount],
      ["Rata-rata Transaksi", report.summary.averageTransaction],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

    // ==========================================
    // SHEET 2 — PENJUALAN HARIAN
    // ==========================================

    const dailySalesData = report.dailySales.map((item) => ({
      Tanggal: item.date,
      Transaksi: item.transactions,
      Pendapatan: item.revenue,
    }));

    const dailySheet = XLSX.utils.json_to_sheet(dailySalesData);

    XLSX.utils.book_append_sheet(workbook, dailySheet, "Penjualan Harian");

    // ==========================================
    // SHEET 3 — PRODUK TERLARIS
    // ==========================================

    const topMenusData = report.topMenus.map((item, index) => ({
      Ranking: index + 1,
      Produk: item.name,
      Kategori: item.category,
      "Jumlah Terjual": item.totalSold,
      Pendapatan: item.revenue,
    }));

    const menuSheet = XLSX.utils.json_to_sheet(topMenusData);

    XLSX.utils.book_append_sheet(workbook, menuSheet, "Produk Terlaris");

    // ==========================================
    // SHEET 4 — PEMBAYARAN
    // ==========================================

    const paymentData = report.paymentMethods.map((item) => ({
      "Metode Pembayaran": formatPaymentMethod(item.method),
      Transaksi: item.transactions,
      Pendapatan: item.revenue,
    }));

    const paymentSheet = XLSX.utils.json_to_sheet(paymentData);

    XLSX.utils.book_append_sheet(workbook, paymentSheet, "Pembayaran");

    // ==========================================
    // SHEET 5 — MEMBERSHIP
    // ==========================================

    const membershipData = [
      {
        Tipe: "Member",
        Transaksi: report.membership.memberTransactions,
        Pendapatan: report.membership.memberRevenue,
      },
      {
        Tipe: "Non-Member",
        Transaksi: report.membership.nonMemberTransactions,
        Pendapatan: report.membership.nonMemberRevenue,
      },
    ];

    const membershipSheet = XLSX.utils.json_to_sheet(membershipData);

    XLSX.utils.book_append_sheet(workbook, membershipSheet, "Membership");

    // ==========================================
    // DOWNLOAD
    // ==========================================

    const fileName = `Laporan-${period
      .replaceAll(" ", "-")
      .toLowerCase()}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const exportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // ==========================================
    // HEADER
    // ==========================================

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN PENJUALAN", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${period}`, 14, 28);

    doc.text(
      `Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`,
      14,
      34,
    );

    // ==========================================
    // SUMMARY
    // ==========================================

    autoTable(doc, {
      startY: 42,

      head: [["Ringkasan", "Nilai"]],

      body: [
        ["Total Penjualan", formatRupiah(report.summary.totalRevenue)],
        [
          "Total Transaksi",
          report.summary.totalTransactions.toLocaleString("id-ID"),
        ],
        ["Total Diskon Member", formatRupiah(report.summary.totalDiscount)],
        [
          "Rata-rata Transaksi",
          formatRupiah(report.summary.averageTransaction),
        ],
      ],

      theme: "grid",

      headStyles: {
        fillColor: [30, 41, 59],
      },

      styles: {
        fontSize: 9,
      },
    });

    // ==========================================
    // PENJUALAN HARIAN
    // ==========================================

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Penjualan Harian", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,

      head: [["Tanggal", "Transaksi", "Pendapatan"]],

      body: report.dailySales.map((item) => [
        item.date,
        item.transactions.toLocaleString("id-ID"),
        formatRupiah(item.revenue),
      ]),

      theme: "grid",

      headStyles: {
        fillColor: [30, 41, 59],
      },

      styles: {
        fontSize: 8,
      },
    });

    // ==========================================
    // PRODUK TERLARIS
    // ==========================================

    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Produk Terlaris", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,

      head: [["No", "Produk", "Kategori", "Terjual", "Pendapatan"]],

      body: report.topMenus.map((item, index) => [
        index + 1,
        item.name,
        item.category,
        item.totalSold.toLocaleString("id-ID"),
        formatRupiah(item.revenue),
      ]),

      theme: "grid",

      headStyles: {
        fillColor: [30, 41, 59],
      },

      styles: {
        fontSize: 8,
      },
    });

    // ==========================================
    // PEMBAYARAN
    // ==========================================

    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Metode Pembayaran", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,

      head: [["Metode", "Transaksi", "Pendapatan"]],

      body: report.paymentMethods.map((item) => [
        formatPaymentMethod(item.method),
        item.transactions.toLocaleString("id-ID"),
        formatRupiah(item.revenue),
      ]),

      theme: "grid",

      headStyles: {
        fillColor: [30, 41, 59],
      },

      styles: {
        fontSize: 8,
      },
    });

    // ==========================================
    // MEMBERSHIP
    // ==========================================

    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Kontribusi Membership", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,

      head: [["Tipe", "Transaksi", "Pendapatan"]],

      body: [
        [
          "Member",
          report.membership.memberTransactions.toLocaleString("id-ID"),
          formatRupiah(report.membership.memberRevenue),
        ],
        [
          "Non-Member",
          report.membership.nonMemberTransactions.toLocaleString("id-ID"),
          formatRupiah(report.membership.nonMemberRevenue),
        ],
      ],

      theme: "grid",

      headStyles: {
        fillColor: [30, 41, 59],
      },

      styles: {
        fontSize: 8,
      },
    });

    // ==========================================
    // FOOTER
    // ==========================================

    const totalPages = (doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.text(`Halaman ${i} dari ${totalPages}`, 14, 290);

      doc.text("Generated by Restaurant Management System", 196, 290, {
        align: "right",
      });
    }

    // ==========================================
    // DOWNLOAD
    // ==========================================

    const fileName = `Laporan-${period.replaceAll(" ", "-").toLowerCase()}.pdf`;

    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">
            Management
          </p>

          <h1 className="text-2xl font-extrabold text-slate-800 mt-1">
            Laporan
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Analisis dan rekap performa penjualan restoran.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>Hari Ini</option>
            <option>7 Hari Terakhir</option>
            <option>Bulan Ini</option>
            <option>Bulan Lalu</option>
          </select>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isExportOpen}
              onClick={() => setIsExportOpen((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition flex items-center gap-2"
            >
              Export
              <span
                className={`text-xs transition-transform duration-200 ${
                  isExportOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {isExportOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsExportOpen(false);
                    exportPDF();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  📄 Export PDF
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsExportOpen(false);
                    exportExcel();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  📊 Export Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Penjualan
          </p>

          <h2 className="text-2xl font-extrabold text-slate-800 mt-2">
            {formatRupiah(report.summary.totalRevenue)}
          </h2>

          <p className="text-xs font-semibold text-slate-500 mt-2">
            Total pendapatan transaksi dibayar
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Transaksi
          </p>

          <h2 className="text-2xl font-extrabold text-slate-800 mt-2">
            {report.summary.totalTransactions.toLocaleString("id-ID")}
          </h2>

          <p className="text-xs font-semibold text-slate-500 mt-2">
            Transaksi dengan status PAID
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Diskon Member
          </p>

          <h2 className="text-2xl font-extrabold text-slate-800 mt-2">
            {formatRupiah(report.summary.totalDiscount)}
          </h2>

          <p className="text-xs font-semibold text-slate-500 mt-2">
            Total benefit membership
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Rata-rata Transaksi
          </p>

          <h2 className="text-2xl font-extrabold text-slate-800 mt-2">
            {formatRupiah(report.summary.averageTransaction)}
          </h2>

          <p className="text-xs font-semibold text-slate-500 mt-2">
            Nilai rata-rata per order
          </p>
        </div>
      </div>

      {/* SALES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Penjualan Periode
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Rekap penjualan berdasarkan periode yang dipilih.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-400">{period}</span>
        </div>

        {report.dailySales.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm font-semibold text-slate-400">
              Belum ada transaksi pada periode ini.
            </p>
          </div>
        ) : (
          <>
            <div className="h-64 flex items-end gap-2 sm:gap-3 border-b border-l border-slate-200 px-3 overflow-x-auto">
              {report.dailySales.map((item) => {
                const height = (Number(item.revenue || 0) / maxRevenue) * 100;

                return (
                  <div
                    key={item.date}
                    className="min-w-8 sm:min-w-10 flex-1 h-full flex items-end justify-center"
                  >
                    <div
                      className="w-full max-w-10 bg-blue-500 hover:bg-blue-600 rounded-t-lg transition cursor-pointer"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                      }}
                      title={`${item.date} • ${formatRupiah(item.revenue)} • ${
                        item.transactions
                      } transaksi`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 sm:gap-3 mt-3 overflow-x-auto">
              {report.dailySales.map((item) => (
                <span
                  key={item.date}
                  className="min-w-8 sm:min-w-10 flex-1 text-[10px] text-slate-400 text-center"
                >
                  {new Date(`${item.date}T00:00:00`).getDate()}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* TOP PRODUCTS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="text-base font-extrabold text-slate-800">
              Produk Terlaris
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Menu dengan jumlah penjualan tertinggi.
            </p>
          </div>

          {report.topMenus.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-400">
                Belum ada data menu.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.topMenus.map((item, index) => (
                <div key={item.menuId} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-600 shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {item.name}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.totalSold.toLocaleString("id-ID")} terjual
                    </p>
                  </div>

                  <p className="text-sm font-extrabold text-slate-800">
                    {formatRupiah(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAYMENT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="text-base font-extrabold text-slate-800">
              Metode Pembayaran
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Distribusi transaksi berdasarkan metode pembayaran.
            </p>
          </div>

          {report.paymentMethods.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-400">
                Belum ada data pembayaran.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {report.paymentMethods.map((payment) => {
                const percentage =
                  totalPaymentRevenue > 0
                    ? Math.round((payment.revenue / totalPaymentRevenue) * 100)
                    : 0;

                return (
                  <div key={payment.method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700">
                        {formatPaymentMethod(payment.method)}
                      </span>

                      <span className="text-xs font-bold text-slate-500">
                        {percentage}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs font-semibold text-slate-400">
                        {formatRupiah(payment.revenue)}
                      </p>

                      <p className="text-xs font-semibold text-slate-400">
                        {payment.transactions} transaksi
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MEMBERSHIP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Kontribusi Membership
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Perbandingan transaksi member dan non-member.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
            {memberPercentage}% transaksi member
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Member
            </p>

            <p className="text-xl font-extrabold text-slate-800 mt-2">
              {report.membership.memberTransactions.toLocaleString("id-ID")}
            </p>

            <p className="text-xs font-semibold text-slate-500 mt-1">
              {formatRupiah(report.membership.memberRevenue)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Non-Member
            </p>

            <p className="text-xl font-extrabold text-slate-800 mt-2">
              {report.membership.nonMemberTransactions.toLocaleString("id-ID")}
            </p>

            <p className="text-xs font-semibold text-slate-500 mt-1">
              {formatRupiah(report.membership.nonMemberRevenue)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{
                width: `${memberPercentage}%`,
              }}
            />

            <div
              className="h-full bg-slate-300 transition-all"
              style={{
                width: `${100 - memberPercentage}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-semibold text-slate-400">
              Member
            </span>

            <span className="text-[11px] font-semibold text-slate-400">
              Non-Member
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            ℹ
          </div>

          <div>
            <p className="text-sm font-bold text-blue-900">
              Laporan periode {period}
            </p>

            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Data laporan dihitung berdasarkan transaksi yang sudah dibayar.
              Laporan menampilkan ringkasan performa penjualan, produk terlaris,
              metode pembayaran, dan kontribusi membership tanpa menampilkan
              detail transaksi satu per satu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
