import { useEffect, useState } from "react";

interface Membership {
  id: string;
  memberCode: string;
  discountPercent: number;
  isActive?: boolean;
  joinedAt?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  points: number;
  createdAt: string;
  membership?: Membership | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  payAmount: number;
  changeAmount: number;
  method: string;
  paidAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
  orderItems: OrderItem[];
  payment?: Payment | null;
}

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerDetailModal({
  customer,
  onClose,
}: CustomerDetailModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activatingMembership, setActivatingMembership] = useState(false);

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        setLoadingOrders(true);

        const token = localStorage.getItem("token");

        const response = await fetch(
          `http://localhost:5000/api/customers/${customer.id}/orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          console.error(
            result.message || "Gagal mengambil riwayat transaksi",
          );
          return;
        }

        setOrders(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil riwayat transaksi:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchCustomerOrders();
  }, [customer.id]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleActivateMembership = async () => {
    try {
      const confirmed = window.confirm(
        `Aktifkan membership untuk ${customer.name}?`,
      );

      if (!confirmed) return;

      setActivatingMembership(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/customers/membership",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerId: customer.id,
            discountPercent: 10,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal mengaktifkan membership");
        return;
      }

      alert("Membership berhasil diaktifkan");

      window.location.reload();
    } catch (error) {
      console.error("Gagal mengaktifkan membership:", error);
      alert("Terjadi kesalahan saat mengaktifkan membership");
    } finally {
      setActivatingMembership(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-1">
              Customer Detail
            </p>

            <h2 className="text-xl font-extrabold text-slate-900">
              {customer.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* CUSTOMER INFO */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
              Informasi Customer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Nomor Telepon
                </p>

                <p className="text-sm font-bold text-slate-800 mt-1">
                  {customer.phone || "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Email
                </p>

                <p className="text-sm font-bold text-slate-800 mt-1 break-all">
                  {customer.email || "-"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[10px] text-slate-400 font-semibold">
                  Alamat
                </p>

                <p className="text-sm font-bold text-slate-800 mt-1">
                  {customer.address || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOMER STATUS */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
              Status Customer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] text-slate-400 font-semibold">
                  Membership
                </p>

                <div className="mt-2">
                  {customer.membership ? (
                    <>
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-extrabold">
                        MEMBER
                      </span>

                      <p className="text-xs font-bold text-slate-700 mt-2">
                        {customer.membership.memberCode}
                      </p>

                      <p className="text-[10px] text-slate-500 mt-1">
                        Diskon {customer.membership.discountPercent}%
                      </p>
                    </>
                  ) : (
                    <div>
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-extrabold">
                        NON-MEMBER
                      </span>

                      <button
                        type="button"
                        onClick={handleActivateMembership}
                        disabled={activatingMembership}
                        className="block mt-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {activatingMembership
                          ? "Mengaktifkan..."
                          : "Aktifkan Membership"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] text-slate-400 font-semibold">
                  Loyalty Points
                </p>

                <p className="text-xl font-extrabold text-slate-900 mt-2">
                  {customer.points}
                </p>

                <p className="text-[10px] text-slate-500 mt-1">Poin customer</p>
              </div>
            </div>
          </div>

          {/* REGISTERED DATE */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[10px] text-slate-400 font-semibold">
              Terdaftar Sejak
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {new Date(customer.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Riwayat Transaksi
                </h3>

                <p className="text-[10px] text-slate-400 mt-1">
                  Daftar pesanan customer
                </p>
              </div>

              {!loadingOrders && (
                <span className="text-[10px] font-bold text-slate-400">
                  {orders.length} transaksi
                </span>
              )}
            </div>

            {loadingOrders ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
                <p className="text-xs text-slate-500">
                  Memuat riwayat transaksi...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Belum ada transaksi
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  Customer ini belum memiliki riwayat pesanan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">
                          {order.orderNumber}
                        </p>

                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-amber-50 text-amber-600 border-amber-200"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-600">
                            {item.menuItem.name} × {item.quantity}
                          </span>

                          <span className="font-semibold text-slate-700">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Total
                      </span>

                      <span className="text-sm font-extrabold text-slate-900">
                        {formatRupiah(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

