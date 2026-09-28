
import { useEffect, useState } from "react";
import Invoice from "../components/invoice/invoice";

const formatRupiah = (value: number) => {
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-600 border-blue-200",
  READY: "bg-violet-50 text-violet-600 border-violet-200",
  SERVED: "bg-cyan-50 text-cyan-600 border-cyan-200",
  COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-600 border-rose-200",
};

const paymentStyle: Record<string, string> = {
  UNPAID: "bg-rose-50 text-rose-600 border-rose-200",
  PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabel: Record<string, string> = {
  ALL: "Semua",
  PENDING: "Pending",
  PREPARING: "Diproses",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const orderStatuses = [
  "PENDING",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  // INVOICE
  const [showInvoice, setShowInvoice] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // STATUS HISTORY
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // PAYMENT
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // CREATE ORDER
  const [createOrderType, setCreateOrderType] = useState("DINE_IN");
  const [createTableNumber, setCreateTableNumber] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [selectedMenuQty, setSelectedMenuQty] = useState("1");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [createOrderItems, setCreateOrderItems] = useState<
    {
      menuItemId: string;
      name: string;
      price: number;
      quantity: number;
    }[]
  >([]);

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createOrderMessage, setCreateOrderMessage] = useState("");

  // ==============================
  // FETCH ORDERS
  // ==============================
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:3000/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil orders");
        }

        setOrders(result.data || []);
      } catch (error) {
        console.error("GAGAL MENGAMBIL ORDERS:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ==============================
  // FETCH MENUS
  // ==============================
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:3000/api/menu", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil menu");
        }

        setMenus(result.data || []);
      } catch (error) {
        console.error("GAGAL MENGAMBIL MENU:", error);
      }
    };

    fetchMenus();
  }, []);

  // ==============================
  // FETCH MEMBERS
  // ==============================
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:3000/api/customers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil data member");
        }

        setCustomers(result.data || []);
      } catch (error) {
        console.error("GAGAL MENGAMBIL MEMBER:", error);
      }
    };

    fetchCustomers();
  }, []);

  // ==============================
  // FILTER ORDERS
  // ==============================
  const filteredOrders =
    selectedStatus === "ALL"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  // ==============================
  // MEMBER LIST
  // ==============================
  const members = customers.filter((customer) => customer.membership);

  // ==============================
  // FETCH STATUS HISTORY
  // ==============================
  const fetchStatusHistory = async (orderId: string) => {
    try {
      setLoadingHistory(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/orders/${orderId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil status history");
      }

      setStatusHistory(result.data || []);
    } catch (error) {
      console.error("FETCH HISTORY ERROR:", error);
      setStatusHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ==============================
  // OPEN DETAIL
  // ==============================
  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusMessage("");
    setStatusHistory([]);
    setPaymentAmount("");
    setPaymentMessage("");
    setShowInvoice(false);

    fetchStatusHistory(order.id);
  };

  // ==============================
  // UPDATE STATUS
  // ==============================
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    if (newStatus === selectedOrder.status) {
      setStatusMessage("Status belum berubah.");
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/orders/${selectedOrder.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui status");
      }

      const updatedOrder = result.data.updatedOrder;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id
            ? {
                ...order,
                status: updatedOrder.status,
              }
            : order,
        ),
      );

      setSelectedOrder((prev: any) =>
        prev
          ? {
              ...prev,
              status: updatedOrder.status,
            }
          : prev,
      );

      setNewStatus(updatedOrder.status);

      setStatusMessage("Status pesanan berhasil diperbarui.");

      await fetchStatusHistory(selectedOrder.id);
    } catch (error: any) {
      console.error("UPDATE STATUS ERROR:", error);

      setStatusMessage(error.message || "Gagal memperbarui status pesanan.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==============================
  // PROCESS PAYMENT
  // ==============================
  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    const amount = Number(paymentAmount);
    const total = Number(selectedOrder.totalPrice);

    if (!amount || amount <= 0) {
      setPaymentMessage("Masukkan jumlah pembayaran.");
      return;
    }

    if (amount < total) {
      setPaymentMessage(
        `Pembayaran kurang. Total tagihan ${formatRupiah(total)}.`,
      );
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          amount,
          method: paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Pembayaran gagal.");
      }

      const payment = result.data.payment;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                paymentStatus: "PAID",
                payment,
              }
            : order,
        ),
      );

      setSelectedOrder((prev: any) =>
        prev
          ? {
              ...prev,
              paymentStatus: "PAID",
              payment,
            }
          : prev,
      );

      setPaymentAmount("");
      setPaymentMessage("Pembayaran berhasil dicatat.");
    } catch (error: any) {
      console.error("PROCESS PAYMENT ERROR:", error);

      setPaymentMessage(error.message || "Gagal memproses pembayaran.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // ==============================
  // ADD ORDER ITEM
  // ==============================
  const handleAddOrderItem = () => {
    if (!selectedMenuId) {
      setCreateOrderMessage("Pilih menu terlebih dahulu.");
      return;
    }

    const quantity = Number(selectedMenuQty);

    if (!quantity || quantity < 1) {
      setCreateOrderMessage("Quantity harus minimal 1.");
      return;
    }

    const menu = menus.find((item) => item.id === selectedMenuId);

    if (!menu) {
      setCreateOrderMessage("Menu tidak ditemukan.");
      return;
    }

    setCreateOrderItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === selectedMenuId);

      if (existing) {
        return prev.map((item) =>
          item.menuItemId === selectedMenuId
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          menuItemId: menu.id,
          name: menu.name,
          price: Number(menu.price),
          quantity,
        },
      ];
    });

    setSelectedMenuId("");
    setSelectedMenuQty("1");
    setCreateOrderMessage("");
  };

  // ==============================
  // REMOVE ORDER ITEM
  // ==============================
  const handleRemoveOrderItem = (menuItemId: string) => {
    setCreateOrderItems((prev) =>
      prev.filter((item) => item.menuItemId !== menuItemId),
    );
  };

  // ==============================
  // CREATE ORDER
  // ==============================
  const handleCreateOrder = async () => {
    if (createOrderItems.length === 0) {
      setCreateOrderMessage("Tambahkan minimal satu menu.");
      return;
    }

    if (
      createOrderType === "DINE_IN" &&
      (!createTableNumber || Number(createTableNumber) < 1)
    ) {
      setCreateOrderMessage("Nomor meja wajib diisi untuk Dine In.");
      return;
    }

    try {
      setCreatingOrder(true);
      setCreateOrderMessage("");

      const token = localStorage.getItem("token");

      const payload = {
        orderType: createOrderType,

        ...(selectedCustomerId
          ? {
              customerId: selectedCustomerId,
            }
          : {}),

        ...(createOrderType === "DINE_IN"
          ? {
              tableNumber: Number(createTableNumber),
            }
          : {}),

        items: createOrderItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal membuat order.");
      }

      setOrders((prevOrders) => [result.data, ...prevOrders]);

      setShowCreateOrder(false);

      setCreateOrderType("DINE_IN");
      setCreateTableNumber("");
      setSelectedCustomerId("");
      setSelectedMenuId("");
      setSelectedMenuQty("1");
      setCreateOrderItems([]);
      setCreateOrderMessage("");
    } catch (error: any) {
      console.error("CREATE ORDER ERROR:", error);

      setCreateOrderMessage(error.message || "Gagal membuat order.");
    } finally {
      setCreatingOrder(false);
    }
  };

  // ==============================
  // CREATE ORDER PREVIEW
  // ==============================

  const createOrderSubtotal = createOrderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const selectedMember = members.find(
    (member) => member.id === selectedCustomerId,
  );

  const isSelectedMember = Boolean(selectedMember);

  const createOrderDiscount = isSelectedMember
    ? Math.floor(createOrderSubtotal * 0.1)
    : 0;

  const createOrderTotal = Math.max(
    0,
    createOrderSubtotal - createOrderDiscount,
  );

  return (
    <>
      <div className="space-y-7">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 mb-2">
              Management
            </p>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
              Order Management
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Kelola dan pantau seluruh pesanan restoran.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreateOrder(true);
              setCreateOrderMessage("");
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <span className="text-base leading-none">+</span>
            Tambah Order
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">
              Total Pesanan
            </p>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
              {orders.length}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Pending</p>

            <h2 className="text-2xl font-extrabold text-amber-500 mt-2">
              {orders.filter((order) => order.status === "PENDING").length}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Diproses</p>

            <h2 className="text-2xl font-extrabold text-blue-500 mt-2">
              {orders.filter((order) => order.status === "PREPARING").length}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Selesai</p>

            <h2 className="text-2xl font-extrabold text-emerald-500 mt-2">
              {orders.filter((order) => order.status === "COMPLETED").length}
            </h2>
          </div>
        </div>

        {/* ORDER LIST */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Daftar Pesanan
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Klik pesanan untuk melihat detail lengkap.
                </p>
              </div>

              {/* FILTER */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabel).map(([status, label]) => {
                  const active = selectedStatus === status;

                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`
                        px-3.5 py-2
                        rounded-xl
                        text-xs
                        font-bold
                        border
                        transition
                        ${
                          active
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">Memuat data pesanan...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>

              <p className="text-sm font-bold text-slate-600 mt-3">
                Tidak ada pesanan
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Tidak ditemukan order dengan status{" "}
                {statusLabel[selectedStatus]?.toLowerCase()}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Order
                    </th>

                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Customer
                    </th>

                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Tipe
                    </th>

                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Meja
                    </th>

                    <th className="text-right px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Total
                    </th>

                    <th>Status</th>

                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order)}
                      className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="text-xs font-extrabold text-slate-800">
                          {order.orderNumber}
                        </p>

                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(order.createdAt).toLocaleString("id-ID")}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            {order.customer?.name || "Walk-in Customer"}
                          </p>

                          {order.customer?.membership && (
                            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold">
                              MEMBER 10%
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600">
                          {order.orderType}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600">
                          {order.tableNumber
                            ? `Meja ${order.tableNumber}`
                            : "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-extrabold text-slate-800">
                          {formatRupiah(Number(order.totalPrice))}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`
                            inline-flex
                            px-3 py-1.5
                            rounded-full
                            border
                            text-[9px]
                            font-extrabold
                            ${statusStyle[order.status]}
                          `}
                        >
                          {statusLabel[order.status] || order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.paymentStatus === "PAID" ? "PAID" : "UNPAID"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[11px] text-slate-400">
                Menampilkan{" "}
                <span className="font-bold text-slate-600">
                  {filteredOrders.length}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-600">
                  {orders.length}
                </span>{" "}
                pesanan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          DETAIL MODAL
      ====================================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-blue-600">
                  Order Detail
                </p>

                <h2 className="text-2xl font-extrabold text-slate-950 mt-1">
                  {selectedOrder.orderNumber}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg transition"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* ORDER INFO */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Customer
                  </p>

                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {selectedOrder.customer?.name || "Walk-in"}
                  </p>

                  {selectedOrder.customer?.membership && (
                    <span className="inline-flex mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-extrabold">
                      MEMBER • 10%
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Meja
                  </p>

                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {selectedOrder.tableNumber
                      ? `Meja ${selectedOrder.tableNumber}`
                      : "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Tipe
                  </p>

                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {selectedOrder.orderType}
                  </p>
                </div>

                {/* STATUS */}
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">
                    Status
                  </p>

                  <select
                    value={newStatus}
                    onChange={(event) => {
                      setNewStatus(event.target.value);
                      setStatusMessage("");
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* UPDATE STATUS */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                <div>
                  <p className="text-xs font-bold text-blue-700">
                    Perubahan Status
                  </p>

                  <p className="text-[11px] text-blue-500 mt-1">
                    Simpan perubahan untuk memperbarui status pesanan.
                  </p>
                </div>

                <button
                  onClick={handleUpdateStatus}
                  disabled={
                    updatingStatus || newStatus === selectedOrder.status
                  }
                  className={`
                    px-4 py-2.5
                    rounded-xl
                    text-xs
                    font-bold
                    transition
                    ${
                      updatingStatus || newStatus === selectedOrder.status
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    }
                  `}
                >
                  {updatingStatus ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>

              {/* MESSAGE */}
              {statusMessage && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600">
                    {statusMessage}
                  </p>
                </div>
              )}

              {/* ITEMS */}
              <div className="mt-6">
                <h3 className="text-sm font-extrabold text-slate-900 mb-3">
                  Pesanan
                </h3>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  {selectedOrder.orderItems?.length > 0 ? (
                    selectedOrder.orderItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.menuItem?.name || "Menu"}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {item.quantity} × {formatRupiah(Number(item.price))}
                          </p>

                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>

                        <p className="text-sm font-extrabold text-slate-800">
                          {formatRupiah(
                            Number(item.price) * Number(item.quantity),
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-sm text-slate-400">
                      Tidak ada item pesanan.
                    </div>
                  )}
                </div>
              </div>

              {/* NOTE */}
              {selectedOrder.note && (
                <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase text-amber-600">
                    Catatan Order
                  </p>

                  <p className="text-sm text-amber-800 mt-1">
                    {selectedOrder.note}
                  </p>
                </div>
              )}

              {/* PAYMENT */}
              <div className="mt-6">
                <h3 className="text-sm font-extrabold text-slate-900 mb-3">
                  Pembayaran
                </h3>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Status Pembayaran
                      </p>

                      <span
                        className={`
                          inline-flex
                          mt-2
                          px-3 py-1.5
                          rounded-full
                          border
                          text-[9px]
                          font-extrabold
                          ${paymentStyle[selectedOrder.paymentStatus]}
                        `}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>

                    {selectedOrder.payment && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Metode Pembayaran
                        </p>

                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {selectedOrder.payment.method}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* FORM PAYMENT */}
                  {selectedOrder.paymentStatus !== "PAID" && (
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Metode Pembayaran
                        </label>

                        <select
                          value={paymentMethod}
                          onChange={(event) => {
                            setPaymentMethod(event.target.value);
                            setPaymentMessage("");
                          }}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="CASH">Cash</option>
                          <option value="QRIS">QRIS</option>
                          <option value="TRANSFER">Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Jumlah Dibayar
                        </label>

                        <input
                          type="number"
                          min="0"
                          step={1000}
                          value={paymentAmount}
                          onChange={(event) => {
                            setPaymentAmount(event.target.value);
                            setPaymentMessage("");
                          }}
                          placeholder={String(selectedOrder.totalPrice)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <button
                        onClick={handleProcessPayment}
                        disabled={processingPayment}
                        className={`
                          w-full
                          py-2.5
                          rounded-xl
                          text-xs
                          font-bold
                          transition
                          ${
                            processingPayment
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          }
                        `}
                      >
                        {processingPayment
                          ? "Memproses Pembayaran..."
                          : "Proses Pembayaran"}
                      </button>

                      {paymentMessage && (
                        <div className="px-3 py-2.5 rounded-xl bg-white border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600">
                            {paymentMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PAYMENT DETAIL */}
                  {selectedOrder.payment && (
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Tagihan</span>

                        <span className="font-bold text-slate-700">
                          {formatRupiah(Number(selectedOrder.totalPrice))}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Dibayar</span>

                        <span className="font-bold text-slate-700">
                          {formatRupiah(
                            Number(selectedOrder.payment.payAmount),
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Kembalian</span>

                        <span className="font-bold text-emerald-600">
                          {formatRupiah(
                            Number(selectedOrder.payment.changeAmount),
                          )}
                        </span>
                      </div>

                      {/* INVOICE BUTTON */}
                      {selectedOrder.paymentStatus === "PAID" && (
                        <div className="border-t border-slate-200 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowInvoice(true)}
                            className="
                              w-full
                              py-3
                              rounded-xl
                              bg-slate-900
                              hover:bg-slate-800
                              text-white
                              text-xs
                              font-bold
                              transition
                              flex
                              items-center
                              justify-center
                              gap-2
                            "
                          >
                            <span className="text-base">🧾</span>
                            Lihat Invoice
                          </button>

                          <p className="text-[10px] text-center text-slate-400 mt-2">
                            Invoice tersedia setelah pembayaran berhasil.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STATUS HISTORY */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Status History
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Riwayat perubahan status pesanan.
                    </p>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">
                    {statusHistory.length} perubahan
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  {loadingHistory ? (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-400">
                        Memuat riwayat status...
                      </p>
                    </div>
                  ) : statusHistory.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-400">
                        Belum ada riwayat perubahan status.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {statusHistory.map((history: any, index: number) => (
                        <div key={history.id} className="p-4 flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`
                                w-9 h-9 rounded-xl
                                border
                                flex items-center justify-center
                                text-[9px]
                                font-extrabold
                                ${
                                  statusStyle[history.status] ||
                                  "bg-slate-50 text-slate-500 border-slate-200"
                                }
                              `}
                            >
                              {index === 0 ? "NOW" : "•"}
                            </div>

                            {index !== statusHistory.length - 1 && (
                              <div className="w-px flex-1 bg-slate-200 mt-2" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span
                                className={`
                                  inline-flex
                                  w-fit
                                  px-3 py-1.5
                                  rounded-full
                                  border
                                  text-[9px]
                                  font-extrabold
                                  ${
                                    statusStyle[history.status] ||
                                    "bg-slate-50 text-slate-500 border-slate-200"
                                  }
                                `}
                              >
                                {statusLabel[history.status] || history.status}
                              </span>

                              <span className="text-[10px] text-slate-400">
                                {new Date(history.changedAt).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                            </div>

                            <div className="mt-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Diubah oleh{" "}
                                <span className="font-extrabold text-slate-900">
                                  {history.changedBy?.name || "Unknown User"}
                                </span>
                              </p>

                              {history.changedBy?.role && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Role: {history.changedBy.role}
                                </p>
                              )}

                              {history.note && (
                                <div className="mt-2 bg-slate-50 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-slate-500">
                                    Catatan: {history.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TOTAL */}
              <div className="mt-6 border-t border-slate-200 pt-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>

                  <span className="font-semibold text-slate-700">
                    {formatRupiah(Number(selectedOrder.subtotal))}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>

                  <span className="font-semibold text-slate-700">
                    {formatRupiah(Number(selectedOrder.tax || 0))}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service Charge</span>

                  <span className="font-semibold text-slate-700">
                    {formatRupiah(Number(selectedOrder.serviceCharge || 0))}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount Member</span>

                  <span className="font-semibold text-rose-500">
                    - {formatRupiah(Number(selectedOrder.discount || 0))}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-900">
                    Total
                  </span>

                  <span className="text-xl font-extrabold text-blue-600">
                    {formatRupiah(Number(selectedOrder.totalPrice))}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          CREATE ORDER MODAL
      ====================================================== */}

      {showCreateOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={() => setShowCreateOrder(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-blue-600">
                  Order Management
                </p>

                <h2 className="text-2xl font-extrabold text-slate-950 mt-1">
                  Tambah Order
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Buat pesanan baru untuk pelanggan.
                </p>
              </div>

              <button
                onClick={() => setShowCreateOrder(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* MEMBER */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Member
                  </label>

                  <span className="text-[9px] font-semibold text-emerald-500">
                    Member = Diskon 10%
                  </span>
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(event) => {
                    setSelectedCustomerId(event.target.value);
                    setCreateOrderMessage("");
                  }}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Walk-in Customer — Tanpa Diskon</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} — {member.phone} — Member 10%
                    </option>
                  ))}
                </select>

                {isSelectedMember ? (
                  <div className="mt-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-700">
                      ✓ Member aktif
                    </p>

                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Diskon 10% akan diterapkan otomatis oleh sistem.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih member untuk mendapatkan diskon otomatis sebesar 10%.
                  </p>
                )}
              </div>

              {/* ORDER TYPE */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Tipe Order
                </label>

                <select
                  value={createOrderType}
                  onChange={(event) => {
                    setCreateOrderType(event.target.value);

                    if (event.target.value !== "DINE_IN") {
                      setCreateTableNumber("");
                    }

                    setCreateOrderMessage("");
                  }}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>

              {/* TABLE NUMBER */}
              {createOrderType === "DINE_IN" && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Nomor Meja
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={createTableNumber}
                    onChange={(event) => {
                      setCreateTableNumber(event.target.value);
                      setCreateOrderMessage("");
                    }}
                    placeholder="Contoh: 5"
                    className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* ADD MENU */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Tambahkan Menu
                </label>

                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <select
                    value={selectedMenuId}
                    onChange={(event) => {
                      setSelectedMenuId(event.target.value);
                      setCreateOrderMessage("");
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Pilih menu</option>

                    {menus
                      .filter((menu) => menu.isAvailable)
                      .map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name} — {formatRupiah(Number(menu.price))}
                        </option>
                      ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={selectedMenuQty}
                    onChange={(event) => setSelectedMenuQty(event.target.value)}
                    className="w-full sm:w-24 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* ORDER ITEMS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Daftar Pesanan
                  </h3>

                  <span className="text-[10px] font-bold text-slate-400">
                    {createOrderItems.length} menu
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  {createOrderItems.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-400">
                        Belum ada menu yang ditambahkan.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {createOrderItems.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800">
                              {item.name}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {item.quantity} × {formatRupiah(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="text-sm font-extrabold text-slate-800">
                              {formatRupiah(item.price * item.quantity)}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveOrderItem(item.menuItemId)
                              }
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 text-sm font-bold transition"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TOTAL */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Subtotal</span>

                  <span className="text-sm font-semibold text-slate-700">
                    {formatRupiah(createOrderSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    Diskon Member
                  </span>

                  <span className="text-sm font-semibold text-rose-500">
                    {isSelectedMember
                      ? `- ${formatRupiah(createOrderDiscount)} (10%)`
                      : "Rp 0"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-900">
                    Total
                  </span>

                  <span className="text-xl font-extrabold text-blue-600">
                    {formatRupiah(createOrderTotal)}
                  </span>
                </div>

                <div className="mt-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500">
                    {isSelectedMember
                      ? "Member mendapatkan diskon 10%. Nominal final tetap dihitung dan divalidasi oleh backend."
                      : "Walk-in Customer tidak mendapatkan diskon member."}
                  </p>
                </div>
              </div>

              {/* MESSAGE */}
              {createOrderMessage && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-xs font-semibold text-rose-600">
                    {createOrderMessage}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateOrder(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={creatingOrder}
                className={`
                  px-5 py-2.5 rounded-xl text-xs font-bold transition
                  ${
                    creatingOrder
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  }
                `}
              >
                {creatingOrder ? "Membuat Order..." : "Buat Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          INVOICE
      ====================================================== */}

      {showInvoice && selectedOrder && (
        <Invoice
          order={selectedOrder}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
}

