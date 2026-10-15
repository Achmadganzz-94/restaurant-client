import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import { io } from "socket.io-client";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiGrid,
  FiCoffee,
  FiPackage,
  FiShoppingBag,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from "react-icons/fi";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  stockQty?: number;
}

type CategoryValue =
  | "SEMUA"
  | "MAKANAN"
  | "MINUMAN"
  | "SNACK"
  | "DESSERT"
  | "PAKET";

type StatusValue = "SEMUA" | "TERSEDIA" | "HABIS";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  show: boolean;
  type: ToastType;
  message: string;
}

interface MenuApiResponse {
  success?: boolean;
  data?: MenuItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message?: string;
}

const API_URL = "http://localhost:3000";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

const formatRupiah = (value: number) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const categoryConfig: Record<
  Exclude<CategoryValue, "SEMUA">,
  {
    label: string;
    icon: ReactNode;
  }
> = {
  MAKANAN: {
    label: "Makanan",
    icon: <FiShoppingBag size={14} />,
  },
  MINUMAN: {
    label: "Minuman",
    icon: <FiCoffee size={14} />,
  },
  SNACK: {
    label: "Snack",
    icon: <FiGrid size={14} />,
  },
  DESSERT: {
    label: "Dessert",
    icon: <FiCoffee size={14} />,
  },
  PAKET: {
    label: "Paket",
    icon: <FiPackage size={14} />,
  },
};

export default function MenuManagement() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    message: "",
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryValue>("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState<StatusValue>("SEMUA");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "MAKANAN",
    imageUrl: "",
  });

  // ==========================================
  // TOAST
  // ==========================================

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({
      show: true,
      type,
      message,
    });
  };

  const hideToast = () => {
    setToast((previous) => ({
      ...previous,
      show: false,
    }));
  };

  useEffect(() => {
    if (!toast.show) return;

    const timer = window.setTimeout(() => {
      hideToast();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast.show]);

  // ==========================================
  // AMBIL SEMUA MENU DARI BACKEND
  //
  // Mendukung pagination backend.
  // Jadi admin tidak berhenti di lima menu pertama.
  // ==========================================

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");

      const fetchPage = async (page: number): Promise<MenuApiResponse> => {
        const response = await fetch(
          `${API_URL}/api/menu?page=${page}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data menu");
        }

        return (await response.json()) as MenuApiResponse;
      };

      const firstResult = await fetchPage(1);

      const firstPageData = Array.isArray(firstResult.data)
        ? firstResult.data
        : [];

      const totalPages = Math.max(
        1,
        Math.ceil(Number(firstResult.pagination?.totalPages) || 1),
      );

      const remainingResults =
        totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                fetchPage(index + 2),
              ),
            )
          : [];

      const allMenus = [
        ...firstPageData,
        ...remainingResults.flatMap((result) =>
          Array.isArray(result.data) ? result.data : [],
        ),
      ];

      setMenuList(allMenus);
      setError("");
    } catch (err) {
      console.error("Gagal mengambil data menu:", err);

      showToast("Gagal mengambil data menu", "error");
    }
  };

  // ==========================================
  // SOCKET.IO: SINKRONISASI REALTIME
  //
  // Backend mengirim event menu:changed setelah
  // menu berhasil dibuat, diedit, atau dihapus.
  // ==========================================

  useEffect(() => {
    void fetchMenu();

    const socket = io(SOCKET_URL);

    const handleMenuChanged = () => {
      void fetchMenu();
    };

    socket.on("menu:changed", handleMenuChanged);

    return () => {
      socket.off("menu:changed", handleMenuChanged);
      socket.disconnect();
    };
  }, []);

  // ==========================================
  // FOTO MENU
  // ==========================================

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto terlalu besar! Maksimal 2MB.");
      showToast("Ukuran foto maksimal 2MB", "error");
      event.target.value = "";
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((previous) => ({
        ...previous,
        imageUrl: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  };

  // ==========================================
  // MODAL TAMBAH MENU
  // ==========================================

  const handleOpenCreate = () => {
    setEditingMenu(null);

    setFormData({
      name: "",
      description: "",
      price: "",
      category: "MAKANAN",
      imageUrl: "",
    });

    setError("");
    setIsOpen(true);
  };

  // ==========================================
  // MODAL EDIT MENU
  // ==========================================

  const handleOpenEdit = (item: MenuItem) => {
    setEditingMenu(item);

    setFormData({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category,
      imageUrl: item.imageUrl || "",
    });

    setError("");
    setIsOpen(true);
  };

  // ==========================================
  // SIMPAN MENU
  // ==========================================

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Nama menu wajib diisi.");
      showToast("Nama menu wajib diisi", "error");
      return;
    }

    if (
      formData.price.trim() === "" ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) < 0
    ) {
      setError("Harga menu tidak valid.");
      showToast("Harga menu tidak valid", "error");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const url = editingMenu
        ? `${API_URL}/api/menu/${editingMenu.id}`
        : `${API_URL}/api/menu`;

      const method = editingMenu ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          price: Number(formData.price),
          isAvailable: editingMenu ? editingMenu.isAvailable : true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan menu");
      }

      setIsOpen(false);

      // Ambil hasil terbaru. Event Socket.IO juga akan
      // membuat frontend customer mengambil data terbaru.
      await fetchMenu();

      showToast(
        editingMenu ? "Menu berhasil diperbarui" : "Menu berhasil ditambahkan",
        "success",
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan menu";

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UBAH KETERSEDIAAN MENU
  // ==========================================

  const handleToggleAvailability = async (item: MenuItem) => {
    if (loadingStatusId) return;

    const nextStatus = !item.isAvailable;

    setLoadingStatusId(item.id);

    // Update tampilan sementara.
    setMenuList((previous) =>
      previous.map((menu) =>
        menu.id === item.id
          ? {
              ...menu,
              isAvailable: nextStatus,
            }
          : menu,
      ),
    );

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/menu/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description || "",
          price: Number(item.price),
          category: item.category,
          imageUrl: item.imageUrl || "",
          isAvailable: nextStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengubah status menu");
      }

      // Ambil nilai server agar status dan stok konsisten.
      await fetchMenu();

      showToast(
        nextStatus
          ? `${item.name} sekarang tersedia`
          : `${item.name} ditandai habis`,
        "success",
      );
    } catch (err: unknown) {
      console.error("Gagal mengubah status menu:", err);

      // Batalkan perubahan lokal jika request gagal.
      setMenuList((previous) =>
        previous.map((menu) =>
          menu.id === item.id
            ? {
                ...menu,
                isAvailable: item.isAvailable,
              }
            : menu,
        ),
      );

      showToast(
        err instanceof Error ? err.message : "Gagal mengubah status menu",
        "error",
      );
    } finally {
      setLoadingStatusId(null);
    }
  };

  // ==========================================
  // HAPUS MENU
  // ==========================================

  const handleOpenDelete = (item: MenuItem) => {
    setMenuToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!menuToDelete || deletingId) return;

    const id = menuToDelete.id;

    setDeletingId(id);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/menu/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus menu");
      }

      setDeleteDialogOpen(false);
      setMenuToDelete(null);

      await fetchMenu();

      showToast(result.message || "Menu berhasil dihapus", "success");
    } catch (err: unknown) {
      console.error("Gagal menghapus menu:", err);

      showToast(
        err instanceof Error ? err.message : "Gagal menghapus menu",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // FILTER MENU
  // ==========================================

  const filteredMenu = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return menuList.filter((item) => {
      const matchSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword);

      const matchCategory =
        selectedCategory === "SEMUA" || item.category === selectedCategory;

      const matchStatus =
        selectedStatus === "SEMUA" ||
        (selectedStatus === "TERSEDIA" && item.isAvailable) ||
        (selectedStatus === "HABIS" && !item.isAvailable);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [menuList, search, selectedCategory, selectedStatus]);

  const totalMenu = menuList.length;

  const totalAvailable = menuList.filter((item) => item.isAvailable).length;

  const totalSoldOut = menuList.filter((item) => !item.isAvailable).length;

  const resetFilter = () => {
    setSearch("");
    setSelectedCategory("SEMUA");
    setSelectedStatus("SEMUA");
  };

  const hasFilter =
    Boolean(search) ||
    selectedCategory !== "SEMUA" ||
    selectedStatus !== "SEMUA";

  const renderCategoryButton = (
    value: CategoryValue,
    label: string,
    icon?: ReactNode,
  ) => {
    const active = selectedCategory === value;

    return (
      <button
        key={value}
        type="button"
        onClick={() => setSelectedCategory(value)}
        className={`
          inline-flex items-center gap-2 whitespace-nowrap
          px-3.5 py-2 rounded-xl text-[11px] font-bold
          transition-all duration-200 border
          ${
            active
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
          }
        `}
      >
        {icon}
        {label}
      </button>
    );
  };

  const getToastIcon = () => {
    if (toast.type === "success") {
      return <FiCheckCircle size={17} />;
    }

    if (toast.type === "error") {
      return <FiXCircle size={17} />;
    }

    if (toast.type === "warning") {
      return <FiAlertTriangle size={17} />;
    }

    return <FiInfo size={17} />;
  };

  const getToastClass = () => {
    if (toast.type === "success") {
      return "bg-emerald-600 text-white";
    }

    if (toast.type === "error") {
      return "bg-rose-600 text-white";
    }

    if (toast.type === "warning") {
      return "bg-amber-500 text-white";
    }

    return "bg-blue-600 text-white";
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 lg:p-6">
      {/* TOAST */}
      {toast.show && (
        <div className="fixed right-5 top-5 z-[100] max-w-[calc(100vw-2rem)] animate-in slide-in-from-right-5 fade-in duration-200 sm:max-w-sm">
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl ${getToastClass()}`}
          >
            <div className="shrink-0">{getToastIcon()}</div>

            <p className="flex-1 text-xs font-bold leading-5">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={hideToast}
              aria-label="Tutup notifikasi"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition hover:bg-white/10"
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deletingId) {
            setDeleteDialogOpen(open);

            if (!open) {
              setMenuToDelete(null);
            }
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white sm:max-w-sm">
          <div className="flex flex-col items-center py-2 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <FiAlertTriangle size={23} />
            </div>

            <DialogHeader className="w-full">
              <DialogTitle className="text-center text-lg font-bold text-slate-900">
                Hapus Menu?
              </DialogTitle>
            </DialogHeader>

            <p className="mt-2 px-2 text-xs leading-5 text-slate-500">
              Apakah Anda yakin ingin menghapus menu{" "}
              <span className="font-bold text-slate-800">
                "{menuToDelete?.name}"
              </span>
              ?
              <br />
              Menu yang pernah digunakan dalam transaksi akan dinonaktifkan agar
              riwayat tetap aman.
            </p>

            <div className="mt-5 flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(deletingId)}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setMenuToDelete(null);
                }}
                className="h-10 flex-1 rounded-xl border-slate-200 text-xs"
              >
                Batal
              </Button>

              <Button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => void handleDelete()}
                className="h-10 flex-1 rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
              >
                {deletingId ? (
                  <span className="flex items-center gap-2">
                    <FiRefreshCw size={14} className="animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiTrash2 size={13} />
                    Hapus Menu
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                Restaurant Management
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-black lg:text-3xl">
              Kelola Menu
            </h1>

            <p className="mt-1.5 text-xs text-slate-500">
              Kelola daftar makanan, minuman, harga, dan ketersediaan menu
              restoran.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <FiPlus size={16} strokeWidth={2.5} />
              Tambah Menu
            </button>

            {/* FORM TAMBAH / EDIT */}
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {editingMenu ? "Edit Menu" : "Tambah Menu Baru"}
                </DialogTitle>
              </DialogHeader>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                  {error}
                </div>
              )}

              <form
                onSubmit={(event) => void handleSubmit(event)}
                className="space-y-4 pt-2"
              >
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Nama Menu
                  </label>

                  <Input
                    required
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Nasi Goreng Spesial"
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Foto Produk
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1.5 w-full cursor-pointer text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {formData.imageUrl && (
                  <div className="relative h-40 overflow-hidden rounded-xl border border-slate-200">
                    <img
                      src={formData.imageUrl}
                      alt="Preview menu"
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          imageUrl: "",
                        }))
                      }
                      className="absolute right-2.5 top-2.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white shadow hover:bg-rose-700"
                    >
                      Hapus Foto
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Harga
                    </label>

                    <Input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={formData.price}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          price: event.target.value,
                        }))
                      }
                      placeholder="25000"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Kategori
                    </label>

                    <select
                      value={formData.category}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          category: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MAKANAN">Makanan</option>
                      <option value="MINUMAN">Minuman</option>
                      <option value="SNACK">Snack / Camilan</option>
                      <option value="DESSERT">Dessert</option>
                      <option value="PAKET">Paket Hemat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Deskripsi
                  </label>

                  <Input
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Penjelasan singkat menu..."
                    className="mt-1.5 h-10 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Batal
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-blue-600 px-5 text-xs text-white hover:bg-blue-700"
                  >
                    {loading
                      ? "Menyimpan..."
                      : editingMenu
                        ? "Simpan Perubahan"
                        : "Simpan Menu"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Total Menu
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {totalMenu}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Semua menu restoran
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiGrid size={17} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Tersedia
              </p>

              <p className="mt-1 text-2xl font-black text-emerald-600">
                {totalAvailable}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Menu siap dipesan
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiCheckCircle size={17} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Habis
              </p>

              <p className="mt-1 text-2xl font-black text-rose-500">
                {totalSoldOut}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">Perlu restock</p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <FiXCircle size={17} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2.5 lg:flex-row">
          <div className="relative flex-1">
            <FiSearch
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama menu..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as StatusValue)
            }
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="TERSEDIA">Tersedia</option>
            <option value="HABIS">Habis</option>
          </select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2.5">
          {renderCategoryButton("SEMUA", "Semua Menu", <FiGrid size={13} />)}

          {renderCategoryButton(
            "MAKANAN",
            "Makanan",
            categoryConfig.MAKANAN.icon,
          )}

          {renderCategoryButton(
            "MINUMAN",
            "Minuman",
            categoryConfig.MINUMAN.icon,
          )}

          {renderCategoryButton("SNACK", "Snack", categoryConfig.SNACK.icon)}

          {renderCategoryButton(
            "DESSERT",
            "Dessert",
            categoryConfig.DESSERT.icon,
          )}

          {renderCategoryButton("PAKET", "Paket", categoryConfig.PAKET.icon)}
        </div>
      </div>

      {/* DAFTAR MENU */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Daftar Menu
          </h2>

          <p className="mt-0.5 text-[10px] text-slate-400">
            Menampilkan{" "}
            <span className="font-bold text-slate-600">
              {filteredMenu.length}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-slate-600">{menuList.length}</span>{" "}
            menu
          </p>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={resetFilter}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
          >
            <FiRefreshCw size={12} />
            Reset Filter
          </button>
        )}
      </div>

      {filteredMenu.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 pb-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredMenu.map((item) => {
            const isUpdating = loadingStatusId === item.id;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenEdit(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenEdit(item);
                  }
                }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <div className="relative h-24 overflow-hidden bg-slate-100">
                  <img
                    src={
                      item.imageUrl ||
                      "https://placehold.co/600x400?text=No+Image"
                    }
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(event) => {
                      const image = event.currentTarget;
                      image.onerror = null;
                      image.src = "https://placehold.co/600x400?text=No+Image";
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                  <div className="absolute right-2.5 top-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[7px] font-bold shadow-sm backdrop-blur-md ${
                        item.isAvailable
                          ? "bg-emerald-500/95 text-white"
                          : "bg-rose-500/95 text-white"
                      }`}
                    >
                      {item.isAvailable ? (
                        <FiCheckCircle size={11} />
                      ) : (
                        <FiXCircle size={11} />
                      )}

                      {item.isAvailable ? "Tersedia" : "Habis"}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    <span className="inline-flex rounded-md bg-white/90 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide text-slate-700 backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-1 text-[13px] font-extrabold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="mt-0.5 line-clamp-2 min-h-7 text-[9px] leading-3.5 text-slate-400">
                    {item.description || "Tidak ada deskripsi menu."}
                  </p>

                  <div className="mt-2.5 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        Harga
                      </p>

                      <p className="mt-0.5 text-sm font-black text-blue-600">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[7px] font-bold ${
                        item.isAvailable
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      {item.isAvailable ? "Siap dipesan" : "Tidak tersedia"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 px-2.5 pb-2.5">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleAvailability(item);
                    }}
                    className={`inline-flex h-7 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border text-[9px] font-bold transition disabled:cursor-wait disabled:opacity-60 ${
                      item.isAvailable
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    }`}
                  >
                    {isUpdating ? (
                      <FiRefreshCw size={11} className="animate-spin" />
                    ) : item.isAvailable ? (
                      <FiCheckCircle size={11} />
                    ) : (
                      <FiXCircle size={11} />
                    )}

                    {isUpdating
                      ? "Mengubah..."
                      : item.isAvailable
                        ? "Tersedia"
                        : "Habis"}
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenDelete(item);
                    }}
                    className="inline-flex h-7 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-rose-100 bg-rose-50/40 text-[9px] font-bold text-rose-500 transition hover:border-rose-200 hover:bg-rose-50"
                  >
                    <FiTrash2 size={11} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <FiShoppingBag size={22} />
          </div>

          <h3 className="mt-3 text-base font-bold text-slate-800">
            Menu tidak ditemukan
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            Coba ubah pencarian atau filter kategori.
          </p>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilter}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700"
            >
              <FiRefreshCw size={12} />
              Reset Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
