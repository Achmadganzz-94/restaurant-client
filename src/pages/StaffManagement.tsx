import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });
  // GET STAFF
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/api/auth/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setStaffList(result.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data staf", err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // SEARCH
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const keyword = search.toLowerCase();

      return (
        staff.name.toLowerCase().includes(keyword) ||
        staff.email.toLowerCase().includes(keyword) ||
        staff.role.toLowerCase().includes(keyword)
      );
    });
  }, [staffList, search]);

  // STATISTIC
  const totalStaff = staffList.length;

  const totalAdmin = staffList.filter((staff) => staff.role === "ADMIN").length;

  const totalRegularStaff = staffList.filter(
    (staff) => staff.role === "STAFF",
  ).length;

  // CREATE
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

  // EDIT
  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff);

    setFormData({
      name: staff.name,
      email: staff.email,
      password: "",
      role: staff.role,
    });

    setError("");
    setIsOpen(true);
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const url = editingStaff
        ? `http://localhost:5000/api/auth/staff/${editingStaff.id}`
        : "http://localhost:5000/api/auth/register";

      const method = editingStaff ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses data");
      }

      setIsOpen(false);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus staf ini?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/auth/staff/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchStaff();
      } else {
        alert("Gagal menghapus staf");
      }
    } catch (err) {
      console.error("Gagal hapus staf", err);
    }
  };

  // INITIAL
  const getInitial = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <FiUsers size={16} />
            <span>Staff Management</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-blue-600">
            Kelola Tim Restoran
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola akun, role, dan akses seluruh staff restoran.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="
            h-11
            rounded-xl
            bg-blue-600
            px-5
            font-semibold
            text-white
            shadow-sm
            transition-all
            hover:bg-blue-700
            hover:shadow-md
          "
        >
          <FiPlus className="mr-2" size={18} />
          Tambah Staff
        </Button>
      </div>

      {/* STATISTIC  */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total */}
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

        {/* Staff */}
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

        {/* Admin */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Administrator
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {totalAdmin}
              </h2>

              <p className="mt-1 text-xs text-slate-400">Akses penuh sistem</p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FiShield size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD  */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Card Header */}
        <div className="border-b border-slate-100 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daftar Staff</h2>

              <p className="mt-1 text-sm text-slate-500">
                Semua akun staff dan administrator restoran.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <FiSearch
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="
                  h-10
                  rounded-xl
                  border-slate-200
                  bg-slate-50
                  pl-10
                  text-sm
                  shadow-none
                  focus:bg-white
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Staff
                </TableHead>

                <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </TableHead>

                <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </TableHead>

                <TableHead className="h-12 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Bergabung
                </TableHead>

                <TableHead className="h-12 px-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <TableRow
                    key={staff.id}
                    className="
                      border-b
                      border-slate-100
                      transition-colors
                      hover:bg-slate-50/70
                    "
                  >
                    {/* Staff */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-blue-50
                            text-sm
                            font-bold
                            text-blue-600
                          "
                        >
                          {getInitial(staff.name)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {staff.name}
                          </p>

                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiMail size={15} className="text-slate-400" />

                        {staff.email}
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      {staff.role === "ADMIN" ? (
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-violet-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-violet-700
                          "
                        >
                          <FiShield size={13} />
                          Administrator
                        </span>
                      ) : (
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-blue-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-blue-700
                          "
                        >
                          <FiUser size={13} />
                          Staff
                        </span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <FiCalendar size={15} className="text-slate-400" />

                        {new Date(staff.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(staff)}
                          className="
                            h-9
                            rounded-lg
                            border-slate-200
                            bg-white
                            px-3
                            text-slate-600
                            shadow-none
                            hover:border-blue-200
                            hover:bg-blue-50
                            hover:text-blue-600
                          "
                        >
                          <FiEdit2 size={14} />
                          <span className="ml-2 hidden sm:inline">Edit</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(staff.id)}
                          className="
                            h-9
                            rounded-lg
                            border-slate-200
                            bg-white
                            px-3
                            text-slate-500
                            shadow-none
                            hover:border-rose-200
                            hover:bg-rose-50
                            hover:text-rose-600
                          "
                        >
                          <FiTrash2 size={14} />
                          <span className="ml-2 hidden sm:inline">Hapus</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <FiUsers size={22} />
                      </div>

                      <p className="font-medium text-slate-700">
                        {search ? "Staff tidak ditemukan" : "Belum ada staff"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {search
                          ? "Coba gunakan kata pencarian lain."
                          : "Tambahkan staff pertama untuk restoran Anda."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <p className="text-xs text-slate-400">
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
        </div>
      </div>

      {/* DIALOG */}
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
            {/* Name */}
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Role & Hak Akses
              </label>

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
                  })
                }
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  text-sm
                  text-slate-700
                  outline-none
                  transition
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-50
                "
              >
                <option value="STAFF">STAFF — Kasir / POS</option>

                <option value="ADMIN">ADMIN — Akses Penuh</option>
              </select>
            </div>

            {/* Buttons */}
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
                className="
                  rounded-xl
                  bg-blue-600
                  px-5
                  font-semibold
                  text-white
                  hover:bg-blue-700
                "
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
