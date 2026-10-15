import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiDownload,
  FiGrid,
  FiPlus,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { MdOutlineTableRestaurant, MdPowerSettingsNew } from "react-icons/md";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";

const CUSTOMER_APP_URL = (
  import.meta.env.VITE_CUSTOMER_APP_URL || "http://localhost:5174"
).replace(/\/$/, "");

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

interface TableSession {
  id: string;
  status: string;
  expiresAt?: string | null;
  createdAt?: string;
}

interface RestaurantTable {
  id: string;
  tableNumber: number;
  tableToken: string;
  status: "ACTIVE" | "INACTIVE";
  isOccupied?: boolean;
  session?: TableSession | null;
  activeSession?: TableSession | null;
  sessions?: TableSession[];
}

interface TableSocketEvent {
  id?: string;
  tableId?: string;
  tableNumber?: number;
  status?: string;
  occupancyStatus?: string;
  isOccupied?: boolean;
  sessionId?: string;
  expiresAt?: string | null;
}

interface TableToast {
  type: "confirm" | "success" | "error";
  title: string;
  message: string;
}

function getServerOccupancy(table: RestaurantTable): boolean | undefined {
  if (typeof table.isOccupied === "boolean") {
    return table.isOccupied;
  }

  const session = table.session ?? table.activeSession;

  if (session !== undefined) {
    return (
      session !== null &&
      session.status === "ACTIVE" &&
      (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now())
    );
  }

  if (Array.isArray(table.sessions)) {
    return table.sessions.some(
      (item) =>
        item.status === "ACTIVE" &&
        (!item.expiresAt || new Date(item.expiresAt).getTime() > Date.now()),
    );
  }

  return undefined;
}

export default function Tables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const tablesRef = useRef<RestaurantTable[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(
    null,
  );

  const [tableNumber, setTableNumber] = useState("");
  const [adding, setAdding] = useState(false);

  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);

  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

  const [occupiedByTableId, setOccupiedByTableId] = useState<
    Record<string, boolean>
  >({});

  const [toast, setToast] = useState<TableToast | null>(null);
  const [endSessionTarget, setEndSessionTarget] =
    useState<RestaurantTable | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  // ==========================================
  // TOAST
  // ==========================================

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast(null);
    setEndSessionTarget(null);
  }, []);

  const showToast = useCallback((notification: TableToast, duration = 3500) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast(notification);

    // Toast konfirmasi menunggu tindakan admin.
    if (notification.type !== "confirm") {
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, duration);
    }
  }, []);

  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // ==========================================
  // AMBIL DATA MEJA
  // ==========================================

  const fetchTables = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await api.get("/tables");
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("Format data meja dari backend tidak sesuai.");
      }

      const receivedTables = data as RestaurantTable[];

      setTables(receivedTables);
      tablesRef.current = receivedTables;

      setOccupiedByTableId((previous) => {
        const next = { ...previous };

        const ids = new Set(receivedTables.map((table) => table.id));

        for (const id of Object.keys(next)) {
          if (!ids.has(id)) {
            delete next[id];
          }
        }

        for (const table of receivedTables) {
          const serverValue = getServerOccupancy(table);

          if (serverValue !== undefined) {
            next[table.id] = serverValue;
          } else if (next[table.id] === undefined) {
            next[table.id] = false;
          }
        }

        return next;
      });
    } catch (error) {
      console.error("Gagal mengambil data meja:", error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  // ==========================================
  // SOCKET.IO DAN REFRESH BERKALA
  // ==========================================

  useEffect(() => {
    void fetchTables(true);

    const socket = io(SOCKET_URL);

    const resolveTableId = (event: TableSocketEvent) => {
      if (event.tableId || event.id) {
        return event.tableId || event.id;
      }

      if (event.tableNumber != null) {
        return tablesRef.current.find(
          (table) => table.tableNumber === event.tableNumber,
        )?.id;
      }

      return undefined;
    };

    const handleTableOccupied = (event: TableSocketEvent) => {
      const id = resolveTableId(event);

      if (id) {
        setOccupiedByTableId((previous) => ({
          ...previous,
          [id]: true,
        }));
      }

      void fetchTables(false);
    };

    const handleTableAvailable = (event: TableSocketEvent) => {
      const id = resolveTableId(event);

      if (id) {
        setOccupiedByTableId((previous) => ({
          ...previous,
          [id]: false,
        }));
      }

      void fetchTables(false);
    };

    const handleTableChanged = () => {
      void fetchTables(false);
    };

    socket.on("table:occupied", handleTableOccupied);
    socket.on("table:available", handleTableAvailable);
    socket.on("table:status-changed", handleTableChanged);
    socket.on("table:created", handleTableChanged);
    socket.on("table:deleted", handleTableChanged);

    const interval = window.setInterval(() => {
      void fetchTables(false);
    }, 15000);

    return () => {
      window.clearInterval(interval);

      socket.off("table:occupied", handleTableOccupied);
      socket.off("table:available", handleTableAvailable);
      socket.off("table:status-changed", handleTableChanged);
      socket.off("table:created", handleTableChanged);
      socket.off("table:deleted", handleTableChanged);

      socket.disconnect();
    };
  }, [fetchTables]);

  // ==========================================
  // TAMBAH MEJA
  // ==========================================

  const handleAddTable = async () => {
    const number = Number(tableNumber);

    if (!tableNumber.trim() || !Number.isInteger(number) || number <= 0) {
      showToast({
        type: "error",
        title: "Nomor meja tidak valid",
        message: "Masukkan bilangan bulat positif.",
      });
      return;
    }

    try {
      setAdding(true);

      await api.post("/tables", {
        tableNumber: number,
      });

      setTableNumber("");
      setShowAddModal(false);

      await fetchTables(false);

      showToast({
        type: "success",
        title: "Meja berhasil ditambahkan",
        message: `Meja ${number} siap dikonfigurasi.`,
      });
    } catch (error: any) {
      console.error("Gagal menambahkan meja:", error);

      showToast({
        type: "error",
        title: "Gagal menambahkan meja",
        message:
          error?.response?.data?.message ||
          "Periksa koneksi backend dan coba lagi.",
      });
    } finally {
      setAdding(false);
    }
  };

  // ==========================================
  // UBAH STATUS OPERASIONAL MEJA
  // ==========================================

  const handleToggleStatus = async (table: RestaurantTable) => {
    const nextStatus = table.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    if (nextStatus === "INACTIVE" && occupiedByTableId[table.id]) {
      showToast({
        type: "error",
        title: "Meja masih digunakan",
        message: "Akhiri sesi pelanggan terlebih dahulu.",
      });
      return;
    }

    try {
      setUpdatingTableId(table.id);

      await api.patch(`/tables/${table.id}/status`, {
        status: nextStatus,
      });

      await fetchTables(false);

      showToast({
        type: "success",
        title: "Status meja diperbarui",
        message: `Meja ${table.tableNumber} sekarang ${
          nextStatus === "ACTIVE" ? "aktif" : "nonaktif"
        }.`,
      });
    } catch (error: any) {
      console.error("Gagal mengubah status meja:", error);

      showToast({
        type: "error",
        title: "Gagal mengubah status",
        message:
          error?.response?.data?.message ||
          "Status meja tidak berhasil diperbarui.",
      });
    } finally {
      setUpdatingTableId(null);
    }
  };

  // ==========================================
  // AKHIRI SESI: TAMPILKAN KONFIRMASI
  // ==========================================

  const handleEndSession = (table: RestaurantTable) => {
    const session = table.session ?? table.activeSession;

    if (!session?.id) {
      showToast({
        type: "error",
        title: "Sesi tidak ditemukan",
        message: "Refresh data meja, lalu coba lagi.",
      });
      return;
    }

    setEndSessionTarget(table);

    showToast({
      type: "confirm",
      title: `Akhiri sesi Meja ${table.tableNumber}?`,
      message:
        "Pastikan pelanggan sudah selesai. Meja akan tersedia kembali jika tidak ada sesi aktif lainnya.",
    });
  };

  // ==========================================
  // AKHIRI SESI: KIRIM PERMINTAAN KE BACKEND
  // ==========================================

  const confirmEndSession = async () => {
    if (!endSessionTarget || endingSessionId !== null) {
      return;
    }

    const table = endSessionTarget;
    const session = table.session ?? table.activeSession;

    if (!session?.id) {
      dismissToast();

      showToast({
        type: "error",
        title: "Sesi tidak ditemukan",
        message: "Refresh data meja, lalu coba lagi.",
      });
      return;
    }

    try {
      setEndingSessionId(session.id);
      dismissToast();

      await api.patch(`/customer-sessions/admin/${session.id}/complete`);

      // Ambil status terbaru dari backend.
      await fetchTables(false);

      showToast({
        type: "success",
        title: "Sesi berhasil diakhiri",
        message: `Sesi pelanggan di Meja ${table.tableNumber} sudah selesai.`,
      });
    } catch (error: any) {
      console.error("Gagal mengakhiri sesi meja:", error);

      showToast({
        type: "error",
        title: "Gagal mengakhiri sesi",
        message:
          error?.response?.data?.message ||
          "Periksa koneksi backend dan endpoint sesi admin.",
      });
    } finally {
      setEndingSessionId(null);
    }
  };

  // ==========================================
  // QR CODE
  // ==========================================

  const handleShowQr = (table: RestaurantTable) => {
    setSelectedTable(table);
    setShowQrModal(true);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById("table-qr-code") as SVGElement | null;

    if (!svg || !selectedTable) {
      showToast({
        type: "error",
        title: "QR tidak ditemukan",
        message: "Coba buka QR Code meja kembali.",
      });
      return;
    }

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);

    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `QR-Meja-${selectedTable.tableNumber}.svg`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast({
      type: "success",
      title: "QR Code diunduh",
      message: `QR Meja ${selectedTable.tableNumber} berhasil diunduh.`,
    });
  };

  // ==========================================
  // STATISTIK MEJA
  // ==========================================

  const totalTables = tables.length;

  const occupiedTables = tables.filter(
    (table) => occupiedByTableId[table.id] === true,
  ).length;

  const availableTables = tables.filter(
    (table) =>
      table.status === "ACTIVE" && occupiedByTableId[table.id] !== true,
  ).length;

  const inactiveTables = tables.filter(
    (table) => table.status === "INACTIVE",
  ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                Table Monitor
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
              Manajemen Meja
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Pantau status meja dan kelola QR Code pelanggan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchTables(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiRefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <FiPlus size={16} />
              Tambah Meja
            </button>
          </div>
        </header>

        {/* STATISTIK */}
        <section className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            {
              label: "Total Meja",
              value: totalTables,
              color: "text-slate-950",
            },
            {
              label: "Sedang Dipakai",
              value: occupiedTables,
              color: "text-red-600",
            },
            {
              label: "Tersedia",
              value: availableTables,
              color: "text-emerald-600",
            },
            {
              label: "Meja Nonaktif",
              value: inactiveTables,
              color: "text-slate-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
            >
              <p className="text-[11px] font-semibold text-slate-500">
                {stat.label}
              </p>

              <p className={`mt-0.5 text-xl font-extrabold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* DAFTAR MEJA */}
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-blue-600">
                <FiGrid size={13} />

                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                  Table Monitor
                </span>
              </div>

              <h2 className="mt-0.5 text-lg font-extrabold text-slate-950">
                Daftar Meja
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Terisi
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Tersedia
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Nonaktif
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-slate-500">
              <FiRefreshCw size={18} className="animate-spin text-blue-600" />

              <span className="text-xs font-medium">Memuat data meja...</span>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-5 text-center">
              <MdOutlineTableRestaurant
                size={30}
                className="mb-2 text-blue-600"
              />

              <h3 className="text-sm font-bold text-slate-800">
                Belum ada meja
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Tambahkan meja pertama untuk mulai menggunakan QR.
              </p>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <FiPlus size={14} />
                Tambah Meja
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {tables.map((table) => {
                const active = table.status === "ACTIVE";
                const occupied = occupiedByTableId[table.id] === true;

                const session = table.session ?? table.activeSession ?? null;

                const hasSession = active && occupied && Boolean(session?.id);

                const isUpdating = updatingTableId === table.id;

                const isEnding = endingSessionId === session?.id;

                const statusLabel = !active
                  ? "NONAKTIF"
                  : occupied
                    ? "TERISI"
                    : "TERSEDIA";

                const cardColor = !active
                  ? "border-slate-200 bg-slate-50"
                  : occupied
                    ? "border-red-200 bg-red-50/70"
                    : "border-emerald-200 bg-emerald-50/40";

                const iconColor = !active
                  ? "bg-slate-100 text-slate-400"
                  : occupied
                    ? "bg-red-100 text-red-600"
                    : "bg-emerald-100 text-emerald-600";

                const statusColor = !active
                  ? "bg-slate-200 text-slate-700"
                  : occupied
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700";

                return (
                  <article
                    key={table.id}
                    className={`flex min-w-0 flex-col rounded-xl border p-2.5 shadow-sm transition hover:shadow-md sm:p-3 ${cardColor}`}
                  >
                    {/* NOMOR DAN INDIKATOR */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-base font-extrabold leading-tight text-slate-950 sm:text-lg">
                        Meja {table.tableNumber}
                      </h3>

                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          !active
                            ? "bg-slate-400"
                            : occupied
                              ? "bg-red-500"
                              : "bg-emerald-500"
                        }`}
                        title={statusLabel}
                      />
                    </div>

                    {/* STATUS RINGKAS */}
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
                      >
                        <MdOutlineTableRestaurant size={25} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold tracking-wide ${statusColor}`}
                        >
                          {statusLabel}
                        </span>

                        <p className="mt-1 truncate text-[10px] leading-4 text-slate-500">
                          {!active
                            ? "Meja dinonaktifkan"
                            : occupied
                              ? "Sesi sedang aktif"
                              : "Siap digunakan"}
                        </p>
                      </div>
                    </div>

                    {hasSession && session?.expiresAt && (
                      <p className="mt-2 truncate border-t border-slate-200/70 pt-1.5 text-[9px] text-slate-400">
                        Berakhir:{" "}
                        {new Date(session.expiresAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}

                    {/* TOMBOL KARTU */}
                    <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-200/80 pt-2">
                      {hasSession && (
                        <button
                          type="button"
                          onClick={() => handleEndSession(table)}
                          disabled={endingSessionId !== null}
                          className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isEnding ? (
                            <FiRefreshCw size={12} className="animate-spin" />
                          ) : (
                            <FiCheckCircle size={12} />
                          )}

                          {isEnding ? "Mengakhiri..." : "Akhiri Sesi"}
                        </button>
                      )}

                      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(table)}
                          disabled={isUpdating || (occupied && active)}
                          title={
                            occupied && active
                              ? "Akhiri sesi sebelum menonaktifkan meja"
                              : active
                                ? "Nonaktifkan meja"
                                : "Aktifkan meja"
                          }
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isUpdating ? (
                            <FiRefreshCw size={13} className="animate-spin" />
                          ) : (
                            <MdPowerSettingsNew size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShowQr(table)}
                          disabled={!active}
                          className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[10px] font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiGrid size={12} className="shrink-0" />

                          <span className="truncate">QR Code</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================
          TOAST KONFIRMASI / SUKSES / ERROR
         ====================================== */}

      {toast && (
        <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6">
          <div
            role={toast.type === "confirm" ? "alertdialog" : "status"}
            aria-live={toast.type === "confirm" ? "assertive" : "polite"}
            className={`overflow-hidden rounded-2xl border bg-white shadow-2xl ${
              toast.type === "confirm"
                ? "border-amber-200"
                : toast.type === "success"
                  ? "border-emerald-200"
                  : "border-rose-200"
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  toast.type === "confirm"
                    ? "bg-amber-100 text-amber-600"
                    : toast.type === "success"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                }`}
              >
                {toast.type === "confirm" ? (
                  <MdPowerSettingsNew size={21} />
                ) : toast.type === "success" ? (
                  <FiCheckCircle size={20} />
                ) : (
                  <FiX size={20} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {toast.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={dismissToast}
                disabled={endingSessionId !== null}
                aria-label="Tutup notifikasi"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 disabled:opacity-40"
              >
                <FiX size={17} />
              </button>
            </div>

            {toast.type === "confirm" && (
              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={dismissToast}
                  disabled={endingSessionId !== null}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => void confirmEndSession()}
                  disabled={endingSessionId !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {endingSessionId !== null && (
                    <FiRefreshCw size={12} className="animate-spin" />
                  )}

                  {endingSessionId !== null ? "Memproses..." : "Ya, Akhiri"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================
          MODAL TAMBAH MEJA
         ====================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  Tambah Meja
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Masukkan nomor meja baru.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup modal"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <label
              htmlFor="table-number"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Nomor Meja
            </label>

            <input
              id="table-number"
              type="number"
              min="1"
              step="1"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="Contoh: 8"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => void handleAddTable()}
                disabled={
                  !tableNumber.trim() ||
                  !Number.isInteger(Number(tableNumber)) ||
                  Number(tableNumber) <= 0 ||
                  adding
                }
                className="rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Menambahkan..." : "Tambah Meja"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          MODAL QR CODE
         ====================================== */}

      {showQrModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />

                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    QR Table
                  </span>
                </div>

                <h2 className="mt-1 text-lg font-extrabold text-slate-950">
                  Meja {selectedTable.tableNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                aria-label="Tutup QR"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex justify-center rounded-xl bg-slate-50 p-4">
              <QRCodeSVG
                id="table-qr-code"
                value={`${CUSTOMER_APP_URL}/table/${encodeURIComponent(
                  selectedTable.tableToken,
                )}`}
                size={210}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                includeMargin
              />
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Table Token
              </p>

              <p className="mt-1 break-all text-[11px] font-semibold text-slate-700">
                {selectedTable.tableToken}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                <FiDownload size={14} />
                Download
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
