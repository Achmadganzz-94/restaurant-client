import { useEffect, useMemo, useRef, useState } from "react";
import Invoice from "../components/invoice/invoice";

const API_URL = "http://localhost:3000";

const formatRupiah = (value: number) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
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

type ToastType = "success" | "error" | "warning";

type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  emptyText?: string;
};

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih pilihan",
  searchPlaceholder = "Cari pilihan...",
  className = "",
  disabled = false,
  emptyText = "Tidak ada pilihan.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const text = `${option.label} ${option.searchText || ""}`.toLowerCase();

      return text.includes(query);
    });
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const handleSelect = (option: SearchableOption) => {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }

          setOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition ${
          open
            ? "border-blue-500 ring-2 ring-blue-100"
            : "hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-slate-700" : "text-slate-400"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <span
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                ⌕
              </span>

              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <div className="w-9 h-9 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  ⌕
                </div>

                <p className="text-[11px] font-semibold text-slate-500 mt-2">
                  {emptyText}
                </p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between gap-3 ${
                      option.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>

                    {active && (
                      <span className="text-blue-600 font-extrabold shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination daftar pesanan
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

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

  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
  }>({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3000);
  };

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil orders");
      }

      setOrders(result.data || []);

      if (selectedOrder) {
        const refreshedOrder = (result.data || []).find(
          (order: any) => order.id === selectedOrder.id,
        );

        if (refreshedOrder) {
          setSelectedOrder((prev: any) => ({
            ...prev,
            ...refreshedOrder,
          }));
        }
      }

      if (!showLoader) {
        showToast("Data pesanan berhasil diperbarui.", "success");
      }
    } catch (error: any) {
      console.error("GAGAL MENGAMBIL ORDERS:", error);

      showToast(error.message || "Gagal mengambil data pesanan.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil menu");
      }

      setMenus(result.data || []);
    } catch (error: any) {
      console.error("GAGAL MENGAMBIL MENU:", error);

      showToast(error.message || "Gagal mengambil data menu.", "error");
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data member");
      }

      setCustomers(result.data || []);
    } catch (error: any) {
      console.error("GAGAL MENGAMBIL MEMBER:", error);

      showToast(error.message || "Gagal mengambil data member.", "error");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenus();
    fetchCustomers();
  }, []);

  const members = useMemo(() => {
    return customers.filter((customer) => customer.membership);
  }, [customers]);

  const memberOptions = useMemo<SearchableOption[]>(() => {
    return [
      {
        value: "",
        label: "Walk-in Customer — Tanpa Diskon",
        searchText: "walk in customer tanpa diskon",
      },
      ...members.map((member) => ({
        value: member.id,
        label: `${member.name} — ${member.phone} — Member 10%`,
        searchText: `${member.name} ${member.phone} member 10%`,
      })),
    ];
  }, [members]);

  const menuOptions = useMemo<SearchableOption[]>(() => {
    return [
      {
        value: "",
        label: "Pilih menu",
        searchText: "pilih menu",
      },
      ...menus
        .filter((menu) => menu.isAvailable)
        .map((menu) => ({
          value: menu.id,
          label: `${menu.name} — ${formatRupiah(Number(menu.price))}`,
          searchText: `${menu.name} ${menu.price}`,
        })),
    ];
  }, [menus]);

  const orderTypeOptions = useMemo<SearchableOption[]>(() => {
    return [
      {
        value: "DINE_IN",
        label: "Dine In",
        searchText: "dine in makan di tempat",
      },
      {
        value: "TAKEAWAY",
        label: "Takeaway",
        searchText: "takeaway bawa pulang",
      },
      {
        value: "DELIVERY",
        label: "Delivery",
        searchText: "delivery antar",
      },
    ];
  }, []);

  const paymentOptions = useMemo<SearchableOption[]>(() => {
    return [
      {
        value: "CASH",
        label: "Cash",
        searchText: "cash tunai",
      },
      {
        value: "QRIS",
        label: "QRIS",
        searchText: "qris",
      },
      {
        value: "TRANSFER",
        label: "Transfer",
        searchText: "transfer bank",
      },
    ];
  }, []);

  const statusOptions = useMemo<SearchableOption[]>(() => {
    return orderStatuses.map((status) => ({
      value: status,
      label: statusLabel[status] || status,
      searchText: status,
    }));
  }, []);

  // Hanya tampilkan pesanan yang dibuat pada tanggal hari ini
  // berdasarkan zona waktu lokal browser/admin.
  const todayOrders = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    return orders.filter((order) => {
      if (!order.createdAt) return false;

      const createdAt = new Date(order.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;

      return (
        createdAt.getFullYear() === todayYear &&
        createdAt.getMonth() === todayMonth &&
        createdAt.getDate() === todayDate
      );
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return todayOrders.filter((order) => {
      const matchesStatus =
        selectedStatus === "ALL" || order.status === selectedStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const orderNumber = String(order.orderNumber || "").toLowerCase();
      const customerName = String(
        order.customer?.name || "Walk-in Customer",
      ).toLowerCase();
      const orderType = String(order.orderType || "").toLowerCase();
      const tableNumber = String(order.tableNumber || "").toLowerCase();

      return (
        orderNumber.includes(query) ||
        customerName.includes(query) ||
        orderType.includes(query) ||
        tableNumber.includes(query)
      );
    });
  }, [todayOrders, selectedStatus, searchQuery]);

  // Kembali ke halaman pertama saat pencarian atau filter status berubah.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage]);

  const startItem =
    filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredOrders.length);

  const orderStatistics = useMemo(() => {
    return {
      total: todayOrders.length,
      pending: todayOrders.filter((order) => order.status === "PENDING").length,
      preparing: todayOrders.filter((order) => order.status === "PREPARING")
        .length,
      completed: todayOrders.filter((order) => order.status === "COMPLETED")
        .length,
      unpaid: todayOrders.filter((order) => order.paymentStatus !== "PAID")
        .length,
    };
  }, [todayOrders]);

  const fetchStatusHistory = async (orderId: string) => {
    try {
      setLoadingHistory(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/orders/${orderId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusMessage("");
    setStatusHistory([]);
    setPaymentAmount("");
    setPaymentMessage("");
    setShowInvoice(false);
    setPaymentMethod(order.payment?.method || "CASH");

    fetchStatusHistory(order.id);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    if (newStatus === selectedOrder.status) {
      setStatusMessage("Status belum berubah.");
      showToast("Pilih status yang berbeda terlebih dahulu.", "warning");
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/orders/${selectedOrder.id}/status`,
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

      showToast(
        `Status pesanan ${selectedOrder.orderNumber} berhasil diperbarui.`,
        "success",
      );

      await fetchStatusHistory(selectedOrder.id);
    } catch (error: any) {
      console.error("UPDATE STATUS ERROR:", error);

      const message = error.message || "Gagal memperbarui status pesanan.";

      setStatusMessage(message);
      showToast(message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    const amount = Number(paymentAmount);
    const total = Number(selectedOrder.totalPrice);

    if (!amount || amount <= 0) {
      setPaymentMessage("Masukkan jumlah pembayaran.");
      showToast("Masukkan jumlah pembayaran terlebih dahulu.", "warning");
      return;
    }

    if (amount < total) {
      const message = `Pembayaran kurang. Total tagihan ${formatRupiah(
        total,
      )}.`;

      setPaymentMessage(message);
      showToast(message, "warning");
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/payments`, {
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

      showToast(
        `Pembayaran ${selectedOrder.orderNumber} berhasil dicatat.`,
        "success",
      );
    } catch (error: any) {
      console.error("PROCESS PAYMENT ERROR:", error);

      const message = error.message || "Gagal memproses pembayaran.";

      setPaymentMessage(message);
      showToast(message, "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleAddOrderItem = () => {
    if (!selectedMenuId) {
      setCreateOrderMessage("Pilih menu terlebih dahulu.");
      showToast("Pilih menu terlebih dahulu.", "warning");
      return;
    }

    const quantity = Number(selectedMenuQty);

    if (!quantity || quantity < 1) {
      setCreateOrderMessage("Quantity harus minimal 1.");
      showToast("Quantity harus minimal 1.", "warning");
      return;
    }

    const menu = menus.find((item) => item.id === selectedMenuId);

    if (!menu) {
      setCreateOrderMessage("Menu tidak ditemukan.");
      showToast("Menu tidak ditemukan.", "error");
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

  const handleRemoveOrderItem = (menuItemId: string) => {
    setCreateOrderItems((prev) =>
      prev.filter((item) => item.menuItemId !== menuItemId),
    );
  };

  const handleCreateOrder = async () => {
    if (createOrderItems.length === 0) {
      setCreateOrderMessage("Tambahkan minimal satu menu.");
      showToast("Tambahkan minimal satu menu terlebih dahulu.", "warning");
      return;
    }

    if (
      createOrderType === "DINE_IN" &&
      (!createTableNumber || Number(createTableNumber) < 1)
    ) {
      setCreateOrderMessage("Nomor meja wajib diisi untuk Dine In.");
      showToast("Nomor meja wajib diisi untuk Dine In.", "warning");
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

      const response = await fetch(`${API_URL}/api/orders`, {
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

      showToast(
        result.data?.orderNumber
          ? `Order ${result.data.orderNumber} berhasil dibuat.`
          : "Order berhasil dibuat.",
        "success",
      );
    } catch (error: any) {
      console.error("CREATE ORDER ERROR:", error);

      const message = error.message || "Gagal membuat order.";

      setCreateOrderMessage(message);
      showToast(message, "error");
    } finally {
      setCreatingOrder(false);
    }
  };

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
      {toast.show && (
        <div className="fixed top-5 right-5 z-100 w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200"
                : toast.type === "error"
                  ? "bg-rose-50 border-rose-200"
                  : "bg-amber-50 border-amber-200"
            }`}
          >
            <div
              className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                toast.type === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : toast.type === "error"
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600"
              }`}
            >
              {toast.type === "success" ? "✓" : "!"}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p
                className={`text-xs font-extrabold ${
                  toast.type === "success"
                    ? "text-emerald-700"
                    : toast.type === "error"
                      ? "text-rose-700"
                      : "text-amber-700"
                }`}
              >
                {toast.type === "success"
                  ? "Berhasil"
                  : toast.type === "error"
                    ? "Gagal"
                    : "Perhatian"}
              </p>

              <p
                className={`text-[11px] mt-1 leading-relaxed ${
                  toast.type === "success"
                    ? "text-emerald-600"
                    : toast.type === "error"
                      ? "text-rose-600"
                      : "text-amber-600"
                }`}
              >
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setToast((prev) => ({
                  ...prev,
                  show: false,
                }))
              }
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm transition ${
                toast.type === "success"
                  ? "text-emerald-500 hover:bg-emerald-100"
                  : toast.type === "error"
                    ? "text-rose-500 hover:bg-rose-100"
                    : "text-amber-500 hover:bg-amber-100"
              }`}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="space-y-7 pb-8">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                Order Management
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
              Pesanan
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Kelola dan pantau pesanan yang masuk hari ini dalam satu halaman.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrders(false)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>
              {refreshing ? "Memuat..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreateOrder(true);
                setCreateOrderMessage("");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-200 transition"
            >
              <span className="text-base leading-none">+</span>
              Tambah Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Total Pesanan
              </p>

              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span>▣</span>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-4">
              {orderStatistics.total}
            </h2>

            <p className="text-[10px] text-slate-400 mt-1">Semua order masuk</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Pending</p>

              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <span>◷</span>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-amber-500 mt-4">
              {orderStatistics.pending}
            </h2>

            <p className="text-[10px] text-slate-400 mt-1">Menunggu diproses</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Diproses</p>

              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span>◉</span>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-blue-500 mt-4">
              {orderStatistics.preparing}
            </h2>

            <p className="text-[10px] text-slate-400 mt-1">Sedang dikerjakan</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Selesai</p>

              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span>✓</span>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-emerald-500 mt-4">
              {orderStatistics.completed}
            </h2>

            <p className="text-[10px] text-slate-400 mt-1">Order completed</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-slate-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Pesanan Hari Ini
                  </h2>

                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-extrabold text-slate-500">
                    {filteredOrders.length}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Klik pesanan untuk melihat detail dan melakukan tindakan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    ⌕
                  </span>

                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari order, customer..."
                    className="w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              {Object.entries(statusLabel).map(([status, label]) => {
                const active = selectedStatus === status;

                const count =
                  status === "ALL"
                    ? todayOrders.length
                    : todayOrders.filter((order) => order.status === status)
                        .length;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                      active
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {label}

                    <span
                      className={active ? "text-white/70" : "text-slate-400"}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="p-14 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl border-2 border-slate-200 border-t-blue-600 animate-spin" />

              <p className="text-sm font-semibold text-slate-500 mt-4">
                Memuat data pesanan...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-14 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>

              <p className="text-sm font-extrabold text-slate-600 mt-4">
                Tidak ada pesanan
              </p>

              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ditemukan pesanan yang cocok dengan "${searchQuery}".`
                  : `Tidak ditemukan order dengan status ${
                      statusLabel[selectedStatus]?.toLowerCase() || ""
                    }.`}
              </p>

              {(searchQuery || selectedStatus !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("ALL");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-237.5">
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

                    <th className="text-center px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Status
                    </th>

                    <th className="text-center px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order)}
                      className="group border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-extrabold group-hover:bg-blue-100 transition">
                            #
                          </div>

                          <div>
                            <p className="text-xs font-extrabold text-slate-800">
                              {order.orderNumber}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(order.createdAt).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                        </div>
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
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
                          {order.orderType}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600">
                          {order.table?.tableNumber
                            ? `Meja ${order.table.tableNumber}`
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
                          className={`inline-flex px-3 py-1.5 rounded-full border text-[9px] font-extrabold ${statusStyle[order.status]}`}
                        >
                          {statusLabel[order.status] || order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-[9px] font-extrabold ${
                            paymentStyle[order.paymentStatus] ||
                            paymentStyle.UNPAID
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
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Menampilkan{" "}
                  <span className="font-bold text-slate-800">
                    {startItem}–{endItem}
                  </span>{" "}
                  dari{" "}
                  <span className="font-bold text-slate-800">
                    {filteredOrders.length}
                  </span>{" "}
                  pesanan
                </p>

                <p className="text-xs text-slate-400">
                  Klik baris untuk melihat detail
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1,
                  )
                  .reduce<(number | string)[]>((result, page, index, pages) => {
                    if (index > 0 && page - Number(pages[index - 1]) > 1) {
                      result.push("...");
                    }

                    result.push(page);
                    return result;
                  }, [])
                  .map((page, index) =>
                    typeof page === "number" ? (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={`min-w-9 h-9 px-3 rounded-xl text-xs font-extrabold transition ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-slate-400"
                      >
                        …
                      </span>
                    ),
                  )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 p-5 lg:p-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase tracking-wider">
                    Order Detail
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-lg border text-[9px] font-extrabold ${statusStyle[selectedOrder.status]}`}
                  >
                    {statusLabel[selectedOrder.status] || selectedOrder.status}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-950 mt-3">
                  {selectedOrder.orderNumber}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg transition"
              >
                ×
              </button>
            </div>

            <div className="p-5 lg:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer
                  </p>

                  <p className="text-sm font-bold text-slate-800 mt-2 truncate">
                    {selectedOrder.customer?.name || "Walk-in"}
                  </p>

                  {selectedOrder.customer?.membership && (
                    <span className="inline-flex mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-extrabold">
                      MEMBER • 10%
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Meja
                  </p>

                  <p className="text-sm font-bold text-slate-800 mt-2">
                    {selectedOrder.table?.tableNumber
                      ? `Meja ${selectedOrder.table.tableNumber}`
                      : "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Tipe
                  </p>

                  <p className="text-sm font-bold text-slate-800 mt-2">
                    {selectedOrder.orderType}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Status
                  </p>

                  <SearchableSelect
                    value={newStatus}
                    onChange={(value) => {
                      setNewStatus(value);
                      setStatusMessage("");
                    }}
                    options={statusOptions}
                    placeholder="Pilih status"
                    searchPlaceholder="Cari status..."
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                <div>
                  <p className="text-xs font-bold text-blue-700">
                    Perubahan Status
                  </p>

                  <p className="text-[10px] text-blue-500 mt-1">
                    Perbarui status order sesuai proses restoran.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={
                    updatingStatus || newStatus === selectedOrder.status
                  }
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    updatingStatus || newStatus === selectedOrder.status
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  }`}
                >
                  {updatingStatus ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>

              {statusMessage && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600">
                    {statusMessage}
                  </p>
                </div>
              )}

              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Detail Pesanan
                    </h3>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Daftar menu yang terdapat dalam order.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[9px] font-bold text-slate-500">
                    {selectedOrder.orderItems?.length || 0} item
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  {selectedOrder.orderItems?.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {selectedOrder.orderItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-extrabold shrink-0">
                              {item.quantity}x
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {item.menuItem?.name || "Menu"}
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                {item.quantity} ×{" "}
                                {formatRupiah(Number(item.price))}
                              </p>

                              {item.notes && (
                                <p className="text-xs text-slate-500 mt-1 italic">
                                  Catatan: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-sm font-extrabold text-slate-800 whitespace-nowrap">
                            {formatRupiah(
                              Number(item.price) * Number(item.quantity),
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 text-center text-sm text-slate-400">
                      Tidak ada item pesanan.
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.note && (
                <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      !
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-amber-600">
                        Catatan Order
                      </p>

                      <p className="text-sm text-amber-800 mt-1">
                        {selectedOrder.note}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Pembayaran
                    </h3>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Kelola pembayaran dan invoice order.
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-full border text-[9px] font-extrabold ${
                      paymentStyle[selectedOrder.paymentStatus] ||
                      paymentStyle.UNPAID
                    }`}
                  >
                    {selectedOrder.paymentStatus || "UNPAID"}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] uppercase font-bold text-slate-400">
                        Total Tagihan
                      </p>

                      <p className="text-lg font-extrabold text-slate-900 mt-1">
                        {formatRupiah(Number(selectedOrder.totalPrice))}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] uppercase font-bold text-slate-400">
                        Metode Pembayaran
                      </p>

                      <p className="text-sm font-extrabold text-slate-800 mt-2">
                        {selectedOrder.payment?.method || "-"}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.paymentStatus !== "PAID" && (
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Metode Pembayaran
                        </label>

                        <div className="mt-1">
                          <SearchableSelect
                            value={paymentMethod}
                            onChange={(value) => {
                              setPaymentMethod(value);
                              setPaymentMessage("");
                            }}
                            options={paymentOptions}
                            placeholder="Pilih metode pembayaran"
                            searchPlaceholder="Cari metode pembayaran..."
                          />
                        </div>
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
                        type="button"
                        onClick={handleProcessPayment}
                        disabled={processingPayment}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                          processingPayment
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        }`}
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

                      {selectedOrder.paymentStatus === "PAID" && (
                        <div className="border-t border-slate-200 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowInvoice(true)}
                            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2"
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

              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Status History
                    </h3>

                    <p className="text-[10px] text-slate-400 mt-1">
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
                      <div className="w-7 h-7 mx-auto rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />

                      <p className="text-xs text-slate-400 mt-3">
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
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[9px] font-extrabold ${
                                statusStyle[history.status] ||
                                "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
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
                                className={`inline-flex w-fit px-3 py-1.5 rounded-full border text-[9px] font-extrabold ${
                                  statusStyle[history.status] ||
                                  "bg-slate-50 text-slate-500 border-slate-200"
                                }`}
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

              <div className="mt-7">
                <div className="bg-slate-950 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        Ringkasan Pembayaran
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Perhitungan mengikuti data dari backend.
                      </p>
                    </div>

                    {selectedOrder.customer?.membership && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 text-[9px] font-extrabold">
                        MEMBER
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal</span>

                      <span className="font-semibold text-slate-200">
                        {formatRupiah(Number(selectedOrder.subtotal))}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Discount Member</span>

                      <span className="font-semibold text-rose-300">
                        - {formatRupiah(Number(selectedOrder.discount || 0))}
                      </span>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-400">Total</p>

                        <p className="text-[10px] text-slate-500 mt-1">
                          Setelah discount
                        </p>
                      </div>

                      <span className="text-2xl font-extrabold text-white">
                        {formatRupiah(Number(selectedOrder.totalPrice))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 lg:px-6 py-5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={() => setShowCreateOrder(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 p-5 lg:p-6 flex items-start justify-between">
              <div>
                <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase tracking-wider">
                  Order Management
                </span>

                <h2 className="text-2xl font-extrabold text-slate-950 mt-3">
                  Tambah Order
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Buat pesanan baru untuk pelanggan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateOrder(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg transition"
              >
                ×
              </button>
            </div>

            <div className="p-5 lg:p-6 space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    %
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-emerald-700">
                      Program Member
                    </p>

                    <p className="text-[10px] text-emerald-600 mt-1">
                      Member mendapatkan diskon 10%.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Member
                  </label>

                  <span className="text-[9px] font-semibold text-emerald-500">
                    Diskon 10%
                  </span>
                </div>

                <div className="mt-1">
                  <SearchableSelect
                    value={selectedCustomerId}
                    onChange={(value) => {
                      setSelectedCustomerId(value);
                      setCreateOrderMessage("");
                    }}
                    options={memberOptions}
                    placeholder="Walk-in Customer — Tanpa Diskon"
                    searchPlaceholder="Cari nama atau nomor HP member..."
                    emptyText="Member tidak ditemukan."
                  />
                </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Tipe Order
                  </label>

                  <div className="mt-1">
                    <SearchableSelect
                      value={createOrderType}
                      onChange={(value) => {
                        setCreateOrderType(value);

                        if (value !== "DINE_IN") {
                          setCreateTableNumber("");
                        }

                        setCreateOrderMessage("");
                      }}
                      options={orderTypeOptions}
                      placeholder="Pilih tipe order"
                      searchPlaceholder="Cari tipe order..."
                    />
                  </div>
                </div>

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
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Tambahkan Menu
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px_auto] gap-2 mt-1">
                  <SearchableSelect
                    value={selectedMenuId}
                    onChange={(value) => {
                      setSelectedMenuId(value);
                      setCreateOrderMessage("");
                    }}
                    options={menuOptions}
                    placeholder="Pilih menu"
                    searchPlaceholder="Cari nama menu atau harga..."
                    emptyText="Menu tidak ditemukan."
                  />

                  <input
                    type="number"
                    min="1"
                    value={selectedMenuQty}
                    onChange={(event) => setSelectedMenuQty(event.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    <div className="p-8 text-center bg-slate-50/50">
                      <div className="w-11 h-11 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                        <span>🛒</span>
                      </div>

                      <p className="text-xs font-semibold text-slate-500 mt-3">
                        Belum ada menu yang ditambahkan.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {createOrderItems.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                              {item.quantity}x
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {item.name}
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                {item.quantity} × {formatRupiah(item.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="text-sm font-extrabold text-slate-800 whitespace-nowrap">
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

              <div className="bg-slate-950 rounded-2xl p-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Subtotal</span>

                    <span className="text-sm font-semibold text-slate-200">
                      {formatRupiah(createOrderSubtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">
                      Diskon Member
                    </span>

                    <span className="text-sm font-semibold text-rose-300">
                      {isSelectedMember
                        ? `- ${formatRupiah(createOrderDiscount)}`
                        : "Rp 0"}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-extrabold text-white">
                        Total
                      </span>

                      <p className="text-[10px] text-slate-500 mt-1">
                        Setelah discount
                      </p>
                    </div>

                    <span className="text-xl font-extrabold text-blue-400">
                      {formatRupiah(createOrderTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-500">
                  {isSelectedMember
                    ? "Member mendapatkan diskon 10%. Nominal final tetap dihitung dan divalidasi oleh backend."
                    : "Walk-in Customer tidak mendapatkan diskon member."}
                </p>
              </div>

              {createOrderMessage && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-xs font-semibold text-rose-600">
                    {createOrderMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 lg:px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
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
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                  creatingOrder
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                }`}
              >
                {creatingOrder ? "Membuat Order..." : "Buat Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoice && selectedOrder && (
        <Invoice order={selectedOrder} onClose={() => setShowInvoice(false)} />
      )}
    </>
  );
}
