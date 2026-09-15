import { useEffect, useState } from "react";
import CustomerTable from "./components/CustomerTable";
import AddCustomerModal from "./components/AddCustomerModal";
import CustomerDetailModal from "./components/CustomerDetailModal";

interface Membership {
  id: string;
  memberCode: string;
  discountPercent: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  createdAt: string;
  membership?: Membership | null;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      setCustomers(result.data || []);
    } catch (error) {
      console.error("Gagal mengambil data member:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalMembers = customers.length;

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 mb-2">
            Management
          </p>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            Membership
          </h1>

          <p className="text-sm text-slate-600 mt-2">
            Kelola data membership restoran.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
        >
          + Tambah Member
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Total Member
          </p>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            {totalMembers}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Benefit Member
          </p>

          <h2 className="text-2xl font-extrabold text-blue-600 mt-2">
            Diskon 10%
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Setiap member mendapatkan diskon otomatis 10%.
          </p>
        </div>
      </div>

      {/* MEMBER TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">
            Daftar Member
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Semua data yang ditambahkan melalui halaman ini otomatis menjadi
            member.
          </p>
        </div>

        <CustomerTable
          customers={customers}
          loading={loading}
          onDetail={(customer) => setSelectedCustomer(customer)}
        />
      </div>

      {/* ADD MEMBER */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchCustomers();
          }}
        />
      )}

      {/* MEMBER DETAIL */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

