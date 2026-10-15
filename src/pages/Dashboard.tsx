import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import {
  LuChefHat,
  LuReceiptText,
  LuUtensils,
  LuWalletCards,
} from "react-icons/lu";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = "http://localhost:3000";

const formatRupiah = (value: number) => {
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  READY: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SERVED: "bg-sky-50 text-sky-700 border-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  PREPARING: "Diproses",
  READY: "Siap",
  SERVED: "Disajikan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const orderTypeLabel: Record<string, string> = {
  DINE_IN: "Dine In",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  orderType: string;
  table?: {
    id: string;
    tableNumber: number;
  } | null;
  customer?: {
    name?: string;
  } | null;
  customerSession?: {
    status?: string;
  } | null;
};

type Menu = {
  id: string;
  name: string;
  category: string;
  isAvailable: boolean;
};

type PopularMenu = {
  name: string;
  category: string;
  sold: number;
  price: number;
};

const isSameCalendarDate = (
  dateValue: string | Date,
  targetDate: Date,
) => {
  const sourceDate =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue);

  return (
    sourceDate.getDate() === targetDate.getDate() &&
    sourceDate.getMonth() === targetDate.getMonth() &&
    sourceDate.getFullYear() === targetDate.getFullYear()
  );
};

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [popularMenus, setPopularMenus] = useState<PopularMenu[]>([]);
  const [salesPeriod, setSalesPeriod] = useState("7");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Token tidak ditemukan");
        }

        const authHeaders: HeadersInit = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [ordersResponse, menusResponse, popularResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/orders`, {
              method: "GET",
              headers: authHeaders,
            }),
            fetch(`${API_URL}/api/menu`, {
              method: "GET",
            }),
            fetch(`${API_URL}/api/menu/popular`, {
              method: "GET",
            }),
          ]);

        if (!ordersResponse.ok) {
          throw new Error(
            `Gagal mengambil orders: ${ordersResponse.status}`,
          );
        }

        if (!menusResponse.ok) {
          throw new Error(
            `Gagal mengambil menu: ${menusResponse.status}`,
          );
        }

        if (!popularResponse.ok) {
          throw new Error(
            `Gagal mengambil menu populer: ${popularResponse.status}`,
          );
        }

        const [
          ordersResult,
          menusResult,
          popularResult,
        ] = await Promise.all([
          ordersResponse.json(),
          menusResponse.json(),
          popularResponse.json(),
        ]);

        if (!mounted) {
          return;
        }

        setOrders(
          Array.isArray(ordersResult.data)
            ? ordersResult.data
            : [],
        );

        setMenus(
          Array.isArray(menusResult.data)
            ? menusResult.data
            : [],
        );

        setPopularMenus(
          Array.isArray(popularResult.data)
            ? popularResult.data
            : [],
        );

        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Gagal mengambil data dashboard:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    const interval = window.setInterval(
      fetchDashboardData,
      10000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const today = useMemo(() => {
    return new Date();
  }, []);

  const ordersToday = useMemo(() => {
    return orders.filter((order) => {
      return (
        isSameCalendarDate(order.createdAt, today) &&
        order.status !== "CANCELLED"
      );
    });
  }, [orders, today]);

  const salesToday = useMemo(() => {
    return orders
      .filter((order) => {
        return (
          isSameCalendarDate(order.createdAt, today) &&
          order.status !== "CANCELLED" &&
          order.paymentStatus === "PAID"
        );
      })
      .reduce(
        (total, order) =>
          total + Number(order.totalPrice),
        0,
      );
  }, [orders, today]);

  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);

    return date;
  }, []);

  const salesYesterday = useMemo(() => {
    return orders
      .filter((order) => {
        return (
          isSameCalendarDate(
            order.createdAt,
            yesterday,
          ) &&
          order.status !== "CANCELLED" &&
          order.paymentStatus === "PAID"
        );
      })
      .reduce(
        (total, order) =>
          total + Number(order.totalPrice),
        0,
      );
  }, [orders, yesterday]);

  const salesPercentage =
    salesYesterday === 0
      ? salesToday > 0
        ? 100
        : 0
      : ((salesToday - salesYesterday) /
          salesYesterday) *
        100;

  const salesPercentageText =
    salesPercentage > 0
      ? `+${salesPercentage.toFixed(1)}%`
      : `${salesPercentage.toFixed(1)}%`;

  const preparingOrders = ordersToday.filter(
    (order) => order.status === "PREPARING",
  ).length;

  const availableMenus = menus.filter(
    (menu) => menu.isAvailable,
  ).length;

  const salesChartData = useMemo(() => {
    const totalDays =
      salesPeriod === "7"
        ? 7
        : salesPeriod === "30"
          ? 30
          : 90;

    return Array.from(
      { length: totalDays },
      (_, index) => {
        const chartDate = new Date();

        chartDate.setDate(
          chartDate.getDate() -
            (totalDays - 1 - index),
        );

        const total = orders
          .filter((order) => {
            return (
              isSameCalendarDate(
                order.createdAt,
                chartDate,
              ) &&
              order.status !== "CANCELLED" &&
              order.paymentStatus === "PAID"
            );
          })
          .reduce(
            (sum, order) =>
              sum + Number(order.totalPrice),
            0,
          );

        return {
          name:
            salesPeriod === "7"
              ? chartDate.toLocaleDateString(
                  "id-ID",
                  {
                    weekday: "short",
                  },
                )
              : chartDate.toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "short",
                  },
                ),
          sales: total,
        };
      },
    );
  }, [orders, salesPeriod]);

  return (
    <div className="space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-7 py-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] lg:px-9 lg:py-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />

        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2">
              <FiActivity className="text-sm text-blue-400" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Restaurant Overview
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-slate-300 lg:text-[15px]">
              Pantau aktivitas restoran, penjualan,
              pesanan, menu, dan performa bisnis dalam
              satu tampilan.
            </p>
          </div>

          <div className="min-w-[270px] rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-blue-400" />

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Hari Ini
              </p>
            </div>

            <p className="mt-2 text-sm font-bold text-white">
              {today.toLocaleDateString(
                "id-ID",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
              <FiClock />

              <span>
                {lastUpdated
                  ? `Diperbarui ${lastUpdated.toLocaleTimeString(
                      "id-ID",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}`
                  : "Memuat data..."}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<LuWalletCards />}
          title="Penjualan Hari Ini"
          value={formatRupiah(salesToday)}
          description="Pembayaran yang sudah lunas"
          badge={salesPercentageText}
          badgePositive={salesPercentage >= 0}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          icon={<FiShoppingBag />}
          title="Pesanan Hari Ini"
          value={ordersToday.length.toString()}
          description="Pesanan masuk hari ini"
          badge="Hari ini"
          iconClass="bg-slate-100 text-slate-700"
        />

        <StatCard
          icon={<LuChefHat />}
          title="Sedang Diproses"
          value={preparingOrders.toString()}
          description="Pesanan sedang dikerjakan"
          badge="Aktif"
          badgePositive
          iconClass="bg-violet-50 text-violet-600"
        />

        <StatCard
          icon={<LuUtensils />}
          title="Menu Tersedia"
          value={availableMenus.toString()}
          description={`Dari ${menus.length} menu`}
          badge={`${availableMenus}/${menus.length}`}
          badgePositive
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md xl:col-span-2 lg:p-7">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-blue-600" />

                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  Analytics
                </p>
              </div>

              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                Penjualan
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Ringkasan transaksi yang sudah dibayar
              </p>
            </div>

            <select
              value={salesPeriod}
              onChange={(event) =>
                setSalesPeriod(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="7">7 Hari</option>
              <option value="30">30 Hari</option>
              <option value="90">3 Bulan</option>
            </select>
          </div>

          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={salesChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 5,
                }}
              >
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
                    fill: "#64748b",
                    fontFamily: "Poppins",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                    fontFamily: "Poppins",
                  }}
                  tickFormatter={(value) =>
                    value >= 1000000
                      ? `${value / 1000000}jt`
                      : value >= 1000
                        ? `${value / 1000}rb`
                        : value
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatRupiah(Number(value))
                  }
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                    fontFamily: "Poppins",
                    boxShadow:
                      "0 15px 40px rgba(15, 23, 42, 0.10)",
                  }}
                />

                <Bar
                  dataKey="sales"
                  radius={[8, 8, 2, 2]}
                  fill="#2563eb"
                  barSize={
                    salesPeriod === "7" ? 34 : 14
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md lg:p-7">
          <div className="mb-7">
            <div className="flex items-center gap-2">
              <FiActivity className="text-blue-600" />

              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                Order Monitor
              </p>
            </div>

            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
              Status Pesanan
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Kondisi pesanan hari ini
            </p>
          </div>

          <div className="space-y-6">
            <OrderStatus
              label="Pending"
              count={
                ordersToday.filter(
                  (order) =>
                    order.status === "PENDING",
                ).length
              }
              total={ordersToday.length}
              color="bg-amber-400"
            />

            <OrderStatus
              label="Diproses"
              count={
                ordersToday.filter(
                  (order) =>
                    order.status === "PREPARING",
                ).length
              }
              total={ordersToday.length}
              color="bg-blue-500"
            />

            <OrderStatus
              label="Siap"
              count={
                ordersToday.filter(
                  (order) =>
                    order.status === "READY",
                ).length
              }
              total={ordersToday.length}
              color="bg-indigo-500"
            />

            <OrderStatus
              label="Disajikan"
              count={
                ordersToday.filter(
                  (order) =>
                    order.status === "SERVED",
                ).length
              }
              total={ordersToday.length}
              color="bg-sky-500"
            />

            <OrderStatus
              label="Selesai"
              count={
                ordersToday.filter(
                  (order) =>
                    order.status === "COMPLETED",
                ).length
              }
              total={ordersToday.length}
              color="bg-emerald-500"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md xl:col-span-2 lg:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-blue-600" />

                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  Product Performance
                </p>
              </div>

              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                Menu Terlaris
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Menu dengan penjualan tertinggi
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
              Top 5
            </span>
          </div>

          {popularMenus.length === 0 ? (
            <EmptyState
              icon={<LuUtensils />}
              title="Belum ada penjualan"
              description="Data menu terlaris akan muncul setelah ada transaksi."
            />
          ) : (
            <div className="space-y-3">
              {popularMenus
                .slice(0, 5)
                .map((menu, index) => (
                  <div
                    key={`${menu.name}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/30"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                        index === 0
                          ? "bg-blue-50 text-blue-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {menu.name}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        {menu.category}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-800">
                        {menu.sold}
                      </p>

                      <p className="text-[10px] font-medium text-slate-500">
                        terjual
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md xl:col-span-3 lg:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LuReceiptText className="text-blue-600" />

                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  Live Activity
                </p>
              </div>

              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                Pesanan Terbaru
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Lima transaksi terakhir
              </p>
            </div>

            <Link
              to="/dashboard/orders"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100"
            >
              Lihat Semua

              <FiArrowRight className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                Memuat data...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<FiShoppingBag />}
              title="Belum ada pesanan"
              description="Pesanan baru akan muncul di sini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Order
                    </th>

                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Meja
                    </th>

                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tipe
                    </th>

                    <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total
                    </th>

                    <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders
                    .slice(0, 5)
                    .map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <FiCreditCard className="text-sm" />
                            </div>

                            <div>
                              <p className="text-xs font-extrabold text-slate-800">
                                {order.orderNumber}
                              </p>

                              <p className="mt-1 text-[10px] font-medium text-slate-500">
                                {new Date(
                                  order.createdAt,
                                ).toLocaleTimeString(
                                  "id-ID",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                              <FiUser className="text-xs" />
                            </div>

                            <p className="max-w-[130px] truncate text-xs font-semibold text-slate-700">
                              {order.customer?.name ||
                                "Walk-in Customer"}
                            </p>
                          </div>
                        </td>

                        <td className="py-4">
                          {order.table?.tableNumber ? (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700">
                              Meja{" "}
                              {order.table.tableNumber}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-4">
                          <span className="text-xs font-semibold text-slate-600">
                            {orderTypeLabel[
                              order.orderType
                            ] ||
                              order.orderType}
                          </span>
                        </td>

                        <td className="py-4 text-right">
                          <p className="text-xs font-extrabold text-slate-800">
                            {formatRupiah(
                              Number(
                                order.totalPrice,
                              ),
                            )}
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[8px] font-extrabold ${
                              order.paymentStatus ===
                              "PAID"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {order.paymentStatus ===
                            "PAID"
                              ? "LUNAS"
                              : "BELUM BAYAR"}
                          </span>
                        </td>

                        <td className="py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${
                              statusStyle[
                                order.status
                              ] ||
                              "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            {statusLabel[
                              order.status
                            ] ||
                              order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
  badge,
  badgePositive = false,
  iconClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  badge: string;
  badgePositive?: boolean;
  iconClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-slate-50 opacity-0 blur-2xl transition group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span
          className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${
            badgePositive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="relative">
        <p className="mt-6 text-sm font-semibold text-slate-500">
          {title}
        </p>

        <h2 className="mt-1 truncate text-[27px] font-extrabold tracking-tight text-slate-900">
          {value}
        </h2>

        <p className="mt-2 text-xs font-medium text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

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
  const percentage =
    total === 0
      ? 0
      : Math.round((count / total) * 100);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${color}`}
          />

          <span className="text-sm font-semibold text-slate-700">
            {label}
          </span>
        </div>

        <span className="text-sm font-extrabold text-slate-900">
          {count}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p className="mt-1.5 text-right text-[10px] font-medium text-slate-400">
        {percentage}% dari pesanan
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl text-slate-500 shadow-sm">
        {icon}
      </div>

      <p className="mt-4 text-sm font-extrabold text-slate-800">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs font-medium leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
