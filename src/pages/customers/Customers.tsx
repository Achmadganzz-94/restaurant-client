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

const ITEMS_PER_PAGE = 10;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [currentPage, setCurrentPage] = useState(1);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data member (${response.status})`);
      }

      const result = await response.json();

      setCustomers(result.data || []);
    } catch (error) {
      console.error("Gagal mengambil data member:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalMembers = customers.length;

  const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = startIndex + ITEMS_PER_PAGE;

  const currentCustomers = customers.slice(startIndex, endIndex);

  // ==========================================
  // JAGA CURRENT PAGE
  // ==========================================

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ==========================================
  // PAGE NAVIGATION
  // ==========================================

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // ==========================================
  // PAGE NUMBERS
  // ==========================================

  const getPageNumbers = () => {
    const pages: number[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
            Management
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 lg:text-4xl">
            Membership
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Kelola data membership restoran.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          + Tambah Member
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Member</p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
            {totalMembers}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Semua member yang terdaftar
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Benefit Member</p>

          <h2 className="mt-2 text-2xl font-extrabold text-blue-600">
            Diskon 10%
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Setiap member mendapatkan diskon otomatis 10%.
          </p>
        </div>
      </div>

      {/* MEMBER TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-extrabold text-slate-900">
            Daftar Member
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Semua data yang ditambahkan melalui halaman ini otomatis menjadi
            member.
          </p>
        </div>

        <CustomerTable
          customers={currentCustomers}
          loading={loading}
          onDetail={(customer) => setSelectedCustomer(customer)}
        />

        {/* PAGINATION */}
        {!loading && totalPages > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* INFO */}
              <p className="text-xs text-slate-500">
                Menampilkan{" "}
                <span className="font-semibold text-slate-700">
                  {startIndex + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-700">
                  {Math.min(endIndex, totalMembers)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-700">
                  {totalMembers}
                </span>{" "}
                member
              </p>

              {/* BUTTONS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-1.5">
                  {/* PREVIOUS */}
                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-sm
                      text-slate-500
                      transition
                      hover:bg-slate-100
                      disabled:pointer-events-none
                      disabled:opacity-40
                    "
                    aria-label="Halaman sebelumnya"
                  >
                    ‹
                  </button>

                  {/* PAGE NUMBERS */}
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`
                        flex
                        h-8
                        min-w-8
                        items-center
                        justify-center
                        rounded-lg
                        px-2
                        text-xs
                        font-semibold
                        transition
                        ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                        }
                      `}
                    >
                      {page}
                    </button>
                  ))}

                  {/* NEXT */}
                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-sm
                      text-slate-500
                      transition
                      hover:bg-slate-100
                      disabled:pointer-events-none
                      disabled:opacity-40
                    "
                    aria-label="Halaman berikutnya"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADD MEMBER */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setCurrentPage(1);
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
