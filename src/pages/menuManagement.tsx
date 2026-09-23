import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export default function MenuManagement() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FILTER
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState("SEMUA");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "MAKANAN",
    imageUrl: "",
    isAvailable: true,
  });

  // FETCH MENU
  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/api/menu", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setMenuList(result.data || result);
      }
    } catch (err) {
      console.error("Gagal mengambil data menu", err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // IMAGE
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran foto terlalu besar! Maksimal 2MB.");
        return;
      }

      setError("");

      const reader = new FileReader();

      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  // CREATE
  const handleOpenCreate = () => {
    setEditingMenu(null);

    setFormData({
      name: "",
      description: "",
      price: "",
      category: "MAKANAN",
      imageUrl: "",
      isAvailable: true,
    });

    setError("");
    setIsOpen(true);
  };


  // EDIT
  const handleOpenEdit = (item: MenuItem) => {
    setEditingMenu(item);

    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || "",
      isAvailable: item.isAvailable,
    });

    setError("");
    setIsOpen(true);
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const url = editingMenu
        ? `http://localhost:3000/api/menu/${editingMenu.id}`
        : "http://localhost:3000/api/menu";

      const method = editingMenu ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan menu");
      }

      setIsOpen(false);
      fetchMenu();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:3000/api/menu/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchMenu();
      }
    } catch (err) {
      console.error("Gagal menghapus menu", err);
    }
  };

  // FILTER DATA
  const filteredMenu = menuList.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === "SEMUA" || item.category === selectedCategory;

    const matchStatus =
      selectedStatus === "SEMUA" ||
      (selectedStatus === "TERSEDIA" && item.isAvailable) ||
      (selectedStatus === "HABIS" && !item.isAvailable);

    return matchSearch && matchCategory && matchStatus;
  });

  // CATEGORY
  const categories = [
    {
      value: "SEMUA",
      label: "Semua Menu",
    },
    {
      value: "MAKANAN",
      label: "🍽️ Makanan",
    },
    {
      value: "MINUMAN",
      label: "🥤 Minuman",
    },
    {
      value: "SNACK",
      label: "🍟 Snack",
    },
    {
      value: "DESSERT",
      label: "🍰 Dessert",
    },
    {
      value: "PAKET",
      label: "📦 Paket",
    },
  ];

  // STATISTIC
  const totalMenu = menuList.length;

  const totalAvailable = menuList.filter((item) => item.isAvailable).length;

  const totalSoldOut = menuList.filter((item) => !item.isAvailable).length;

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Restaurant Management
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-blue-600 tracking-tight">
              Kelola Menu
            </h1>

            <p className="text-sm text-slate-900 mt-2">
              Kelola daftar makanan, minuman, harga, dan ketersediaan menu
              restoran.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2
              bg-blue-600 hover:bg-blue-700
              text-white px-5 py-3 rounded-xl
              text-sm font-bold shadow-lg shadow-blue-600/20
              transition-all hover:-translate-y-0.5"
            >
              <span className="text-lg">+</span>
              Tambah Menu
            </DialogTrigger>

            {/* ================= MODAL ================= */}
            <DialogContent className="sm:max-w-lg bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {editingMenu ? "Edit Menu" : "Tambah Menu Baru"}
                </DialogTitle>
              </DialogHeader>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {/* NAME */}
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Nama Menu
                  </label>

                  <Input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Contoh: Nasi Goreng Spesial"
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>

                {/* IMAGE */}
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Foto Produk
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full mt-1.5 text-xs text-slate-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-lg file:border-0
                    file:text-xs file:font-bold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                {/* PREVIEW */}
                {formData.imageUrl && (
                  <div className="relative h-44 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: "",
                        }))
                      }
                      className="absolute top-3 right-3
                      bg-rose-600 hover:bg-rose-700
                      text-white text-xs font-bold
                      px-3 py-2 rounded-lg shadow"
                    >
                      Hapus Foto
                    </button>
                  </div>
                )}

                {/* PRICE + CATEGORY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Harga
                    </label>

                    <Input
                      type="number"
                      required
                      step={1000}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: e.target.value,
                        })
                      }
                      placeholder="25000"
                      className="mt-1.5 h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Kategori
                    </label>

                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 h-11 px-3
                      border border-slate-200 rounded-xl
                      text-sm bg-white
                      focus:outline-none
                      focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MAKANAN">Makanan</option>

                      <option value="MINUMAN">Minuman</option>

                      <option value="SNACK">Snack / Camilan</option>

                      <option value="DESSERT">Dessert</option>

                      <option value="PAKET">Paket Hemat</option>
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="text-xs font-bold text-slate-600">
                    Deskripsi
                  </label>

                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Penjelasan singkat menu..."
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>

                {/* AVAILABLE */}
                <label
                  className="flex items-center gap-3 p-3
                  border border-slate-200 rounded-xl
                  cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Menu tersedia
                    </p>

                    <p className="text-xs text-slate-400">
                      Menu dapat dipesan oleh pelanggan
                    </p>
                  </div>
                </label>

                {/* BUTTON */}
                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl"
                  >
                    Batal
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
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

        {/* ================= STATISTIC ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Total Menu
            </p>

            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {totalMenu}
            </p>

            <p className="text-xs text-slate-900 mt-1">Semua menu restoran</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Tersedia
            </p>

            <p className="text-3xl font-extrabold text-emerald-600 mt-2">
              {totalAvailable}
            </p>

            <p className="text-xs text-slate-900 mt-1">Menu siap dipesan</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Habis
            </p>

            <p className="text-3xl font-extrabold text-rose-500 mt-2">
              {totalSoldOut}
            </p>

            <p className="text-xs text-slate-900 mt-1">Perlu restock</p>
          </div>
        </div>
      </div>

      {/* ================= FILTER AREA ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* SEARCH */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama menu..."
              className="w-full h-11 pl-11 pr-4
              rounded-xl border border-slate-200
              bg-slate-50 text-sm
              outline-none
              focus:bg-white
              focus:ring-2 focus:ring-blue-500
              transition"
            />
          </div>

          {/* STATUS */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 px-4 rounded-xl
            border border-slate-200
            bg-slate-50 text-sm font-medium
            outline-none focus:ring-2
            focus:ring-blue-500"
          >
            <option value="SEMUA">Semua Status</option>

            <option value="TERSEDIA">Tersedia</option>

            <option value="HABIS">Habis</option>
          </select>
        </div>

        {/* CATEGORY FILTER */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1">
          {categories.map((category) => {
            const active = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`
                  whitespace-nowrap px-4 py-2.5
                  rounded-xl text-xs font-bold
                  transition-all
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= RESULT INFO ================= */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Daftar Menu</h2>

          <p className="text-xs text-slate-900 mt-1">
            Menampilkan {filteredMenu.length} dari {menuList.length} menu
          </p>
        </div>

        {(search ||
          selectedCategory !== "SEMUA" ||
          selectedStatus !== "SEMUA") && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("SEMUA");
              setSelectedStatus("SEMUA");
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 border rounded-2xl p-2"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ================= MENU GRID ================= */}
      {filteredMenu.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="group bg-white
              border border-slate-200
              rounded-2xl overflow-hidden
              shadow-sm hover:shadow-xl
              hover:-translate-y-1
              transition-all duration-300"
            >
              {/* IMAGE */}
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  src={
                    item.imageUrl ||
                    "https://placehold.co/600x400?text=No+Image"
                  }
                  alt={item.name}
                  className="w-full h-full object-cover
                  group-hover:scale-105
                  transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x400?text=No+Image";
                  }}
                />

                {/* DARK OVERLAY */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

                {/* STATUS */}
                <span
                  className={`
                    absolute top-3 right-3
                    px-3 py-1.5 rounded-full
                    text-[10px] font-bold
                    backdrop-blur-md
                    ${
                      item.isAvailable
                        ? "bg-emerald-500/90 text-white"
                        : "bg-rose-500/90 text-white"
                    }
                  `}
                >
                  {item.isAvailable ? "✓ Tersedia" : "✕ Habis"}
                </span>

                {/* CATEGORY */}
                <span
                  className="absolute bottom-3 left-3
                  px-3 py-1.5 rounded-lg
                  bg-white/90 backdrop-blur-md
                  text-[10px] font-extrabold
                  text-slate-700 uppercase"
                >
                  {item.category}
                </span>
              </div>

              {/* CONTENT */}
              <div className="p-5">
                <h3 className="font-extrabold text-lg text-slate-900 line-clamp-1">
                  {item.name}
                </h3>

                <p className="text-xs text-slate-800 mt-1.5 line-clamp-2 min-h-8">
                  {item.description || "Tidak ada deskripsi menu."}
                </p>

                <div className="flex items-end justify-between mt-5">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-800 uppercase">
                      Harga
                    </p>

                    <p className="text-xl font-extrabold text-blue-600 mt-0.5">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <div className="px-5 pb-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(item)}
                  className="flex-1 rounded-xl
                  border-blue-200
                  text-blue-600
                  hover:bg-blue-50
                  hover:text-blue-700
                  font-bold"
                >
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 rounded-xl
                  border-rose-200
                  text-rose-500
                  hover:bg-rose-50
                  hover:text-rose-600
                  font-bold"
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= EMPTY STATE ================= */
        <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
            🍽️
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-5">
            Menu tidak ditemukan
          </h3>

          <p className="text-sm text-slate-400 mt-1">
            Coba ubah pencarian atau filter kategori kamu.
          </p>

          {(search ||
            selectedCategory !== "SEMUA" ||
            selectedStatus !== "SEMUA") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("SEMUA");
                setSelectedStatus("SEMUA");
              }}
              className="mt-5 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
