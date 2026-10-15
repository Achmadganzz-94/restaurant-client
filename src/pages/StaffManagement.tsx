import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import {
  FiUsers,
  FiShield,
  FiUser,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  const normalizeRole = (role: string) => {
    return String(role || "").toUpperCase();
  };

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token login tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("http://localhost:3000/api/auth/staff", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Gagal mengambil data staff (${res.status})`,
        );
      }

      const rawData = result?.data ?? result?.staff ?? result?.users ?? result;

      const data = Array.isArray(rawData) ? rawData : [];

      const normalizedData: StaffUser[] = data.map((item: any) => ({
        id: String(item.id ?? item._id ?? ""),
        name: item.name ?? item.fullName ?? item.username ?? "Tanpa Nama",
        email: item.email ?? "-",
        role: normalizeRole(item.role),
        createdAt:
          item.createdAt ??
          item.created_at ??
          item.joinedAt ??
          new Date().toISOString(),
      }));

      setStaffList(normalizedData);
    } catch (err: any) {
      console.error("Gagal mengambil data staff:", err);
      setStaffList([]);
      setError(err?.message || "Gagal mengambil data staff.");
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return staffList;
    }

    return staffList.filter((staff) => {
      return (
        staff.name.toLowerCase().includes(keyword) ||
        staff.email.toLowerCase().includes(keyword) ||
        staff.role.toLowerCase().includes(keyword)
      );
    });
  }, [staffList, search]);

  const administrators = useMemo(() => {
    return filteredStaff.filter(
      (staff) => normalizeRole(staff.role) === "ADMIN",
    );
  }, [filteredStaff]);

  const regularStaff = useMemo(() => {
    return filteredStaff.filter(
      (staff) => normalizeRole(staff.role) !== "ADMIN",
    );
  }, [filteredStaff]);

  const totalStaff = staffList.length;

  const totalAdmin = staffList.filter(
    (staff) => normalizeRole(staff.role) === "ADMIN",
  ).length;

  const totalRegularStaff = staffList.filter(
    (staff) => normalizeRole(staff.role) !== "ADMIN",
  ).length;

  const handleOpenCreate = () => {
    setEditingStaff(null);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "STAFF",
    });

    setError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff);

    setFormData({
      name: staff.name,
      email: staff.email,
      password: "",
      role: normalizeRole(staff.role) === "ADMIN" ? "ADMIN" : "STAFF",
    });

    setError("");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token login tidak ditemukan. Silakan login kembali.");
      }

      const url = editingStaff
        ? `http://localhost:3000/api/auth/staff/${editingStaff.id}`
        : "http://localhost:3000/api/auth/register";

      const method = editingStaff ? "PUT" : "POST";

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        ...(editingStaff ? {} : { password: formData.password }),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Gagal memproses data (${res.status})`,
        );
      }

      setIsOpen(false);

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
      });

      setEditingStaff(null);

      await fetchStaff();
    } catch (err: any) {
      console.error("Gagal menyimpan staff:", err);
      setError(err?.message || "Gagal memproses data staff.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus staff ini?")) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token login tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch(`http://localhost:3000/api/auth/staff/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Gagal menghapus staff (${res.status})`,
        );
      }

      await fetchStaff();
    } catch (err: any) {
      console.error("Gagal hapus staff:", err);
      setError(err?.message || "Gagal menghapus staff.");
    }
  };

  const getInitial = (name: string) => {
    const words = name.trim().split(" ").filter(Boolean);

    if (words.length === 0) {
      return "U";
    }

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderStaffCard = (staff: StaffUser) => {
    const isAdmin = normalizeRole(staff.role) === "ADMIN";

    return (
      <div
        key={staff.id}
        className="group relative w-full max-w-70 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                isAdmin
                  ? "bg-violet-50 text-violet-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {getInitial(staff.name)}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">
                {staff.name}
              </p>

              <div
                className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${
                  isAdmin ? "text-violet-600" : "text-blue-600"
                }`}
              >
                {isAdmin ? (
                  <>
                    <FiShield size={12} />
                    Administrator
                  </>
                ) : (
                  <>
                    <FiUser size={12} />
                    Staff / Kasir
                  </>
                )}
              </div>
            </div>
          </div>

          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              isAdmin ? "bg-violet-500" : "bg-emerald-500"
            }`}
            title="Aktif"
          />
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiMail size={13} className="shrink-0 text-slate-400" />
            <span className="truncate">{staff.email}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiCalendar size={13} className="shrink-0 text-slate-400" />
            <span>Bergabung {formatDate(staff.createdAt)}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(staff)}
            className="h-8 flex-1 rounded-lg border-slate-200 px-2 text-xs text-slate-600 shadow-none hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <FiEdit2 size={13} className="mr-1.5" />
            Edit
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDelete(staff.id)}
            className="h-8 flex-1 rounded-lg border-slate-200 px-2 text-xs text-slate-500 shadow-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <FiTrash2 size={13} className="mr-1.5" />
            Hapus
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-slate-50 p-5 md:p-7">
      <style>{`
        .organization-children {
          position: relative;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 34px 20px;
          width: 100%;
          padding-top: 38px;
        }

        .organization-children::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 1px;
          height: 38px;
          background: #cbd5e1;
          transform: translateX(-50%);
        }

        .organization-child {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .organization-child::before {
          content: "";
          position: absolute;
          top: -38px;
          left: 50%;
          width: 1px;
          height: 38px;
          background: #cbd5e1;
          transform: translateX(-50%);
        }

        .organization-child::after {
          content: "";
          position: absolute;
          top: -38px;
          left: 50%;
          width: 100%;
          height: 1px;
          background: #cbd5e1;
          transform: translateX(-50%);
        }

        .organization-child:first-child::after {
          left: 50%;
        }

        @media (max-width: 640px) {
          .organization-children {
            grid-template-columns: 1fr;
          }

          .organization-child::after {
            display: none;
          }

          .organization-child::before {
            height: 24px;
            top: -24px;
          }

          .organization-children {
            padding-top: 24px;
          }

          .organization-children::before {
            height: 24px;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-375">
        <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <FiUsers size={16} />
              <span>Staff Management</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-black">
              Kelola Tim Restoran
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Kelola akun, role, dan struktur tim restoran Anda.
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            <FiPlus className="mr-2" size={18} />
            Tambah Staff
          </Button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Pengguna
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {totalStaff}
                </h2>

                <p className="mt-1 text-xs text-slate-400">Akun terdaftar</p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiUsers size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Staff</p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {totalRegularStaff}
                </h2>

                <p className="mt-1 text-xs text-slate-400">Kasir / POS</p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiUser size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Administrator
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {totalAdmin}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Akses penuh sistem
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FiShield size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Struktur Organisasi
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Struktur akun dan pembagian role tim restoran.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <FiSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="min-h-107.5 overflow-x-auto p-5 md:p-8">
            {loadingStaff ? (
              <div className="flex min-h-87.5 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                  <p className="text-sm text-slate-500">Memuat data staff...</p>
                </div>
              </div>
            ) : error && staffList.length === 0 ? (
              <div className="flex min-h-87.5 items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <FiUsers size={24} />
                  </div>

                  <p className="font-semibold text-slate-800">
                    Gagal mengambil data staff
                  </p>

                  <p className="mt-2 text-sm text-slate-500">{error}</p>

                  <Button
                    type="button"
                    onClick={fetchStaff}
                    className="mt-5 rounded-xl bg-blue-600 px-5 hover:bg-blue-700"
                  >
                    Coba Lagi
                  </Button>
                </div>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex min-h-87.5 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <FiUsers size={24} />
                  </div>

                  <p className="font-semibold text-slate-700">
                    {search ? "Staff tidak ditemukan" : "Belum ada staff"}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {search
                      ? "Coba gunakan kata pencarian lain."
                      : "Tambahkan staff pertama untuk restoran Anda."}
                  </p>

                  {!search && (
                    <Button
                      type="button"
                      onClick={handleOpenCreate}
                      className="mt-5 rounded-xl bg-blue-600 px-5 hover:bg-blue-700"
                    >
                      <FiPlus className="mr-2" size={16} />
                      Tambah Staff
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-300">
                {administrators.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-75">
                      <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <FiShield size={22} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                              Administrator
                            </p>

                            <p className="mt-1 truncate text-base font-bold text-slate-800">
                              {administrators.length === 1
                                ? administrators[0].name
                                : `${administrators.length} Administrator`}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Akses penuh sistem
                            </p>
                          </div>
                        </div>

                        {administrators.length === 1 && (
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <FiMail size={13} className="text-slate-400" />
                              <span className="truncate">
                                {administrators[0].email}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {regularStaff.length > 0 && (
                      <>
                        <div className="flex h-10 w-px bg-slate-300" />

                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <span className="h-px w-8 bg-slate-300" />
                          Tim Staff
                          <span className="h-px w-8 bg-slate-300" />
                        </div>

                        <div className="organization-children">
                          {regularStaff.map((staff) => (
                            <div key={staff.id} className="organization-child">
                              {renderStaffCard(staff)}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center">
                      <div className="w-full max-w-75 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FiUsers size={22} />
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                              Tim Restoran
                            </p>

                            <p className="mt-1 text-base font-bold text-slate-800">
                              Staff
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Administrator belum tersedia
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {regularStaff.length > 0 && (
                      <>
                        <div className="mx-auto flex h-10 w-px bg-slate-300" />

                        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <span className="h-px w-8 bg-slate-300" />
                          Anggota Staff
                          <span className="h-px w-8 bg-slate-300" />
                        </div>

                        <div className="organization-children">
                          {regularStaff.map((staff) => (
                            <div key={staff.id} className="organization-child">
                              {renderStaffCard(staff)}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Menampilkan{" "}
                <span className="font-semibold text-slate-600">
                  {filteredStaff.length}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-600">
                  {staffList.length}
                </span>{" "}
                pengguna
              </p>

              {error && staffList.length > 0 && (
                <p className="text-rose-500">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-2xl border-slate-200 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editingStaff ? "Edit Data Staff" : "Tambah Staff Baru"}
            </DialogTitle>

            <p className="text-sm text-slate-500">
              {editingStaff
                ? "Perbarui informasi akun staff."
                : "Buat akun baru untuk tim restoran."}
            </p>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Nama Lengkap
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
                placeholder="Contoh: Budi Santoso"
                className="h-11 rounded-xl border-slate-200 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>

              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder="staff@restoran.com"
                className="h-11 rounded-xl border-slate-200 focus:ring-blue-100"
              />
            </div>

            {!editingStaff && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>

                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Masukkan password"
                  className="h-11 rounded-xl border-slate-200 focus:ring-blue-100"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Role & Hak Akses
              </label>

              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value,
                    })
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="STAFF">STAFF — Kasir / POS</option>

                  <option value="ADMIN">ADMIN — Akses Penuh</option>
                </select>

                <FiChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-slate-200 px-5"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
              >
                {loading ? "Menyimpan..." : "Simpan Staff"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
