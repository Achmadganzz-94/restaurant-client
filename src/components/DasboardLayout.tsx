import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import logoApp from "../assets/gemini-svg.svg";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      roles: ["ADMIN", "STAFF"],
      icon: "▦",
    },
    {
      label: "Pesanan / POS",
      path: "/dashboard/orders",
      roles: ["ADMIN", "STAFF"],
      icon: "🛒",
    },
    {
      label: "Management Menu",
      path: "/dashboard/menu",
      roles: ["ADMIN", "STAFF"],
      icon: "🍽",
    },
    {
      label: "Member",
      path: "/dashboard/customers",
      roles: ["ADMIN", "STAFF"],
      icon: "♙",
    },
    {
      label: "Laporan",
      path: "/dashboard/reports",
      roles: ["ADMIN"],
      icon: "▥",
    },
    {
      label: "Management Staff",
      path: "/dashboard/staff",
      roles: ["ADMIN"],
      icon: "♙",
    }
  ];

  const mainMenu = navItems.slice(0, 4);

  const managementMenu = navItems.filter(
    (item) => item.label === "Laporan" || item.label === "Management Staff",
  );

  const administrationMenu = navItems.filter(
    (item) => item.label === "Activity Log",
  );

  const renderNavItem = (item: (typeof navItems)[number]) => {
    if (!item.roles.includes(user.role || "STAFF")) {
      return null;
    }

    const isActive =
      item.path === "/dashboard"
        ? location.pathname === "/dashboard"
        : location.pathname === item.path ||
          location.pathname.startsWith(item.path + "/");

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`
          group relative flex items-center gap-3
          px-3.5 py-3 rounded-xl
          text-[15px] font-semibold
          transition-all duration-200
          ${
            isActive
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
              : "text-slate-200 hover:bg-white/10 hover:text-white"
          }
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-cyan-300 rounded-r-full" />
        )}

        <span
          className={`
            w-9 h-9 rounded-lg
            flex items-center justify-center
            text-lg
            transition
            ${isActive ? "bg-white/15" : "bg-white/10 group-hover:bg-white/15"}
          `}
        >
          {item.icon}
        </span>

        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden scrollbar-none">
      {/* SIDEBAR */}
      <aside
        className="
          hidden md:flex
          w-67,5
          bg-[#0b1424]
          border-r border-white/10
          flex-col
          shrink-0
        "
      >
        {/*  LOGO  */}
        <div className="px-3 pt-5 pb-5 border-b border-white/10 mb-5">
          <div className="flex items-center gap-4">
            <img
              src={logoApp}
              alt="Logo RestoInApp"
              className="w-6 h-6 m-2 object-contain shrink-0 scale-[2]"
            />

            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Resto<span className="text-cyan-400">InApp</span>
              </h1>

              <p className="text-xs text-slate-200 font-semibold uppercase tracking-wider mt-1">
                Restaurant Management
              </p>
            </div>
          </div>
        </div>

        {/* DIVIDER  */}
        <div className="mx-5 border-t border-white/10" />

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* MAIN */}
          <div className="mb-7">
            <p className="px-3 mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Main Menu
            </p>

            <nav className="space-y-1">{mainMenu.map(renderNavItem)}</nav>
          </div>

          {/* MANAGEMENT */}
          {managementMenu.some((item) =>
            item.roles.includes(user.role || "STAFF"),
          ) && (
            <div className="mb-7">
              <p className="px-3 mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Management
              </p>

              <nav className="space-y-1">
                {managementMenu.map(renderNavItem)}
              </nav>
            </div>
          )}

          {/* ADMINISTRATION */}
          {administrationMenu.some((item) =>
            item.roles.includes(user.role || "STAFF"),
          ) && (
            <div>
              <p className="px-3 mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Administration
              </p>

              <nav className="space-y-1">
                {administrationMenu.map(renderNavItem)}
              </nav>
            </div>
          )}
        </div>

        {/* USER AREA */}
        <div className="p-4">
          <div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="
                mt-4
                w-full
                flex items-center justify-center gap-2
                py-2.5
                rounded-xl
                text-sm
                font-bold
                text-slate-300
                bg-white/10
                hover:bg-rose-500/15
                hover:text-rose-400
                transition
              "
            >
              <span className=" text-base">↪</span>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR  */}
        <header
          className="
            h-16
            bg-white
            border-b border-slate-200
            flex items-center justify-between
            px-5 lg:px-8
            shrink-0
          "
        >
          {/* Left */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Restaurant Dashboard
            </p>

            <p className="text-base font-bold text-slate-800 mt-0.5">
              {location.pathname === "/dashboard"
                ? "Overview"
                : "Management System"}
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-800">
                {user.name || "User Restoran"}
              </p>

              <p className="text-xs font-medium text-blue-500">
                {user.role || "STAFF"}
              </p>
            </div>

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-blue-50
                border border-blue-100
                text-blue-600
                flex items-center justify-center
                font-bold
                text-base
              "
            >
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/*  PAGE CONTENT */}
        <main
          className="
            flex-1
            overflow-y-auto
            bg-slate-50
          "
        >
          <div className="p-5 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
