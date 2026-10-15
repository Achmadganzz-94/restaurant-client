import { useState } from "react";

interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          address: address || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal menambahkan member");
        return;
      }

      alert("Member berhasil ditambahkan");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Gagal menambahkan member:", error);
      alert("Terjadi kesalahan saat menambahkan member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Tambah Member
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Daftarkan member baru untuk mendapatkan benefit membership.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* NAME */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Nama Member
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama member"
              required
              minLength={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Nomor Telepon
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Email
              <span className="font-normal text-slate-400 ml-1">
                (Opsional)
              </span>
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            />
          </div>

          {/* ADDRESS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Alamat
              <span className="font-normal text-slate-400 ml-1">
                (Opsional)
              </span>
            </label>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masukkan alamat member"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            />
          </div>

          {/* MEMBERSHIP BENEFIT */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">✦</span>

              <p className="text-sm font-bold text-blue-900">
                Benefit Membership
              </p>
            </div>

            <p className="text-xs text-blue-700 mt-1 ml-6">
              Member mendapatkan diskon otomatis 10% pada setiap transaksi.
            </p>
          </div>

          {/* ACTION */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Daftarkan Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

