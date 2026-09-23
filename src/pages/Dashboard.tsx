import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

export default function Dashboard() {
  // =====================================================
  // STATE
  // =====================================================

  const [orders, setOrders] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [popularMenus, setPopularMenus] = useState<any[]>([]);
  const [salesPeriod, setSalesPeriod] = useState("7");

  // =====================================================
  // FETCH DATA
  // =====================================================

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

        setOrders(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil orders:", error);
      }
    };

    const fetchMenus = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/menu");

        const result = await response.json();

        setMenus(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil menu:", error);
      }
    };

    const fetchPopularMenus = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/menu/popular");

        const result = await response.json();

        setPopularMenus(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil menu terlaris:", error);
      }
    };

    fetchOrders();
    fetchMenus();
    fetchPopularMenus();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // DATE
  // =====================================================

  const today = new Date();

  // =====================================================
  // SALES TODAY
  // =====================================================

  const salesToday = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);

      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear() &&
        order.status !== "CANCELLED" &&
        order.paymentStatus === "PAID"
      );
    })
    .reduce((total, order) => total + Number(order.totalPrice), 0);

  // =====================================================
  // ORDERS TODAY
  // =====================================================

  const ordersToday = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);

    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear() &&
      order.status !== "CANCELLED"
    );
  });

  // =====================================================
  // SALES YESTERDAY
  // =====================================================

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const salesYesterday = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);

      return (
        orderDate.getDate() === yesterday.getDate() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getFullYear() === yesterday.getFullYear() &&
        order.status !== "CANCELLED" &&
        order.paymentStatus === "PAID"
      );
    })
    .reduce((total, order) => total + Number(order.totalPrice), 0);

  // =====================================================
  // SALES PERCENTAGE
  // =====================================================

  const salesPercentage =
    salesYesterday === 0
      ? salesToday > 0
        ? 100
        : 0
      : ((salesToday - salesYesterday) / salesYesterday) * 100;

  const salesPercentageText =
    salesPercentage > 0
      ? `+${salesPercentage.toFixed(1)}%`
      : `${salesPercentage.toFixed(1)}%`;

  // =====================================================
  // SALES CHART
  // =====================================================

  const salesChartData = Array.from(
    {
      length: salesPeriod === "7" ? 7 : salesPeriod === "30" ? 30 : 90,
    },
    (_, index) => {
      const date = new Date();

      date.setDate(
        date.getDate() -
          ((salesPeriod === "7" ? 6 : salesPeriod === "30" ? 29 : 89) - index),
      );

      const total = orders
        .filter((order) => {
          const orderDate = new Date(order.createdAt);

          return (
            orderDate.getDate() === date.getDate() &&
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear() &&
            order.status !== "CANCELLED" &&
            order.paymentStatus === "PAID"
          );
        })
        .reduce((sum, order) => sum + Number(order.totalPrice), 0);

      return {
        name:
          salesPeriod === "7"
            ? date.toLocaleDateString("id-ID", {
                weekday: "short",
              })
            : date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              }),
        sales: total,
      };
    },
  );

  return (
    <div className="space-y-7">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 mb-2">
            Overview
          </p>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            Dashboard
          </h1>

          <p className="text-sm text-slate-900 mt-2">
            Selamat datang kembali. Berikut ringkasan aktivitas restoran hari
            ini.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
            Hari ini
          </p>

          <p className="text-sm font-bold text-slate-900 mt-1">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* =====================================================
          STATISTIC CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* SALES */}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
              💰
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                salesPercentage >= 0
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-rose-600 bg-rose-50"
              }`}
            >
              {salesPercentageText}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 mt-5">
            Penjualan Hari Ini
          </p>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Rp {salesToday.toLocaleString("id-ID")}
          </h2>

          <p className="text-[11px] text-slate-900 mt-1">
            dibandingkan kemarin
          </p>
        </div>

        {/* ORDERS */}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-xl">
              🛒
            </div>

            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              Hari ini
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 mt-5">
            Pesanan Hari Ini
          </p>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            {ordersToday.length}
          </h2>

          <p className="text-[11px] text-slate-900 mt-1">
            transaksi berhasil dibuat
          </p>
        </div>

        {/* PREPARING */}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
              👨‍🍳
            </div>

            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              Aktif
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 mt-5">
            Sedang Diproses
          </p>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            {ordersToday.filter((order) => order.status === "PREPARING").length}
          </h2>

          <p className="text-[11px] text-slate-900 mt-1">pesanan di dapur</p>
        </div>

        {/* MENU */}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">
              🍽️
            </div>

            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              Ready
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 mt-5">
            Menu Tersedia
          </p>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            {menus.filter((menu) => menu.isAvailable).length}
          </h2>

          <p className="text-[11px] text-slate-900 mt-1">
            dari {menus.length} menu
          </p>
        </div>
      </div>

      {/* =====================================================
          CHART + ORDER STATUS
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* SALES CHART */}

        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Penjualan
              </h2>

              <p className="text-xs text-slate-900 mt-1">
                Ringkasan penjualan 7 hari terakhir
              </p>
            </div>

            <select
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none"
            >
              <option value="7">7 Hari</option>
              <option value="30">30 Hari</option>
              <option value="90">3 Bulan</option>
            </select>
          </div>

          <div className="h-70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#94a3b8",
                  }}
                  tickFormatter={(value) => `${value / 1000000}jt`}
                />

                <Tooltip
                  formatter={(value) => formatRupiah(Number(value))}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />

                <Bar
                  dataKey="sales"
                  radius={[6, 6, 0, 0]}
                  fill="#2563eb"
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ORDER STATUS */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Status Pesanan
            </h2>

            <p className="text-xs text-slate-900 mt-1">
              Kondisi pesanan hari ini
            </p>
          </div>
          <div className="space-y-5">
            <OrderStatus
              label="Pending"
              count={
                ordersToday.filter((order) => order.status === "PENDING").length
              }
              total={ordersToday.length}
              color="bg-amber-400"
            />

            <OrderStatus
              label="Preparing"
              count={
                ordersToday.filter((order) => order.status === "PREPARING")
                  .length
              }
              total={ordersToday.length}
              color="bg-blue-500"
            />

            <OrderStatus
              label="Ready"
              count={
                ordersToday.filter((order) => order.status === "READY").length
              }
              total={ordersToday.length}
              color="bg-violet-500"
            />

            <OrderStatus
              label="Served"
              count={
                ordersToday.filter((order) => order.status === "SERVED").length
              }
              total={ordersToday.length}
              color="bg-cyan-500"
            />

            <OrderStatus
              label="Completed"
              count={
                ordersToday.filter((order) => order.status === "COMPLETED")
                  .length
              }
              total={ordersToday.length}
              color="bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          POPULAR MENU + RECENT ORDERS
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* POPULAR MENU */}

        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Menu Terlaris
              </h2>

              <p className="text-xs text-slate-900 mt-1">
                Menu dengan penjualan tertinggi
              </p>
            </div>

            <span className="text-xs font-bold text-blue-600">Minggu ini</span>
          </div>

          <div className="space-y-4">
            {popularMenus.map((menu, index) => (
              <div key={menu.name} className="flex items-center gap-3">
                <div
                  className="
                    w-9 h-9 rounded-lg
                    bg-slate-100
                    flex items-center justify-center
                    text-xs font-extrabold
                    text-slate-500
                  "
                >
                  #{index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {menu.name}
                  </p>

                  <p className="text-[10px] text-slate-900 mt-0.5">
                    {menu.category}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-800">
                    {menu.sold}
                  </p>

                  <p className="text-[10px] text-slate-900">terjual</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ORDERS */}

        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Pesanan Terbaru
              </h2>

              <p className="text-xs text-slate-900 mt-1">
                Transaksi yang baru masuk
              </p>
            </div>

            <a
              href="/dashboard/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Lihat Semua →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-3 text-[10px] uppercase tracking-wider text-slate-900 font-bold">
                    Order
                  </th>

                  <th className="text-left pb-3 text-[10px] uppercase tracking-wider text-slate-900 font-bold">
                    Customer
                  </th>

                  <th className="text-left pb-3 text-[10px] uppercase tracking-wider text-slate-900 font-bold">
                    Tipe
                  </th>

                  <th className="text-right pb-3 text-[10px] uppercase tracking-wider text-slate-900 font-bold">
                    Total
                  </th>

                  <th className="text-right pb-3 text-[10px] uppercase tracking-wider text-slate-900 font-bold">
                    Status
                  </th>
                  <th className="text-right pb-3 text-[10px] uppercase tracking-wider text-slate-900 font-bold">
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4">
                      <p className="text-xs font-extrabold text-slate-800">
                        {order.orderNumber}
                      </p>

                      <p className="text-[10px] text-slate-900 mt-1">
                        {order.tableNumber ? `Meja ${order.tableNumber}` : "-"}
                      </p>
                    </td>

                    <td className="py-4">
                      <p className="text-xs font-semibold text-slate-700">
                        {order.customer?.name || "Walk-in Customer"}
                      </p>
                    </td>

                    <td className="py-4">
                      <span className="text-xs text-slate-900">
                        {order.orderType}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <p className="text-xs font-extrabold text-slate-800">
                        {formatRupiah(Number(order.totalPrice))}
                      </p>
                    </td>

                    <td className="py-4 text-right">
                      <span
                        className={`
                          inline-flex
                          px-2.5 py-1
                          rounded-full
                          border
                          text-[9px]
                          font-extrabold
                          ${statusStyle[order.status]}
                        `}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`
      inline-flex
      px-2.5 py-1
      rounded-full
      border
      text-[9px]
      font-extrabold
      ${
        order.paymentStatus === "PAID"
          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
          : "bg-rose-50 text-rose-600 border-rose-200"
      }
    `}
                      >
                        {order.paymentStatus === "PAID" ? "PAID" : "UNPAID"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ORDER STATUS COMPONENT
========================================================= */

function OrderStatus({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />

          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>

        <span className="text-xs font-extrabold text-slate-800">{count}</span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
