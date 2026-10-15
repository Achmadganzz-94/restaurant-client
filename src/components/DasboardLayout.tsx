import {
  FiBarChart2,
  FiBookOpen,
  FiChevronRight,
  FiGrid,
  FiLogOut,
  FiShoppingCart,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import logoApp from "../assets/logo-restoinnApp.png";

type UserRole = "ADMIN" | "STAFF";

type NavItem = {
  label: string;
  mobileLabel: string;
  path: string;
  roles: UserRole[];
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}",
  );

  const userRole: UserRole =
    user.role === "ADMIN" ? "ADMIN" : "STAFF";

  const userName = user.name || "User Restoran";
  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      mobileLabel: "Dashboard",
      path: "/dashboard",
      roles: ["ADMIN", "STAFF"],
      icon: FiGrid,
    },
    {
      label: "Pesanan / POS",
      mobileLabel: "Pesanan",
      path: "/dashboard/orders",
      roles: ["ADMIN", "STAFF"],
      icon: FiShoppingCart,
    },
    {
      label: "Management Menu",
      mobileLabel: "Menu",
      path: "/dashboard/menu",
      roles: ["ADMIN", "STAFF"],
      icon: FiBookOpen,
    },
    {
      label: "Meja",
      mobileLabel: "Meja",
      path: "/dashboard/tables",
      roles: ["ADMIN", "STAFF"],
      icon: FiGrid,
    },
    {
      label: "Member",
      mobileLabel: "Member",
      path: "/dashboard/customers",
      roles: ["ADMIN", "STAFF"],
      icon: FiUsers,
    },
    {
      label: "Laporan",
      mobileLabel: "Laporan",
      path: "/dashboard/reports",
      roles: ["ADMIN"],
      icon: FiBarChart2,
    },
    {
      label: "Management Staff",
      mobileLabel: "Staff",
      path: "/dashboard/staff",
      roles: ["ADMIN"],
      icon: FiUserCheck,
    },
  ];

  const mainMenu = navItems.slice(0, 5);

  const managementMenu = navItems.filter(
    (item) =>
      item.label === "Laporan" ||
      item.label === "Management Staff",
  );

  const visibleMainMenu = mainMenu.filter(
    (item) => item.roles.includes(userRole),
  );

  const visibleManagementMenu =
    managementMenu.filter((item) =>
      item.roles.includes(userRole),
    );

  const isItemActive = (item: NavItem) => {
    if (item.path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === item.path ||
      location.pathname.startsWith(
        `${item.path}/`,
      )
    );
  };

  const renderNavItem = (item: NavItem) => {
    if (!item.roles.includes(userRole)) {
      return null;
    }

    const isActive = isItemActive(item);
    const Icon = item.icon;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`
          group
          relative
          flex
          items-center
          gap-3
          px-3
          py-2.5
          rounded-xl
          text-[14px]
          font-semibold
          transition-all
          duration-200
          ${
            isActive
              ? `
                bg-blue-600
                text-white
                shadow-md
                shadow-blue-950/20
              `
              : `
                text-slate-300
                hover:bg-white/5.5
                hover:text-white
              `
          }
        `}
      >
        {isActive && (
          <span
            className="
              absolute
              left-0
              top-1/2
              -translate-y-1/2
              w-1
              h-6
              rounded-r-full
              bg-cyan-300
            "
          />
        )}

        <span
          className={`
            flex
            items-center
            justify-center
            w-9
            h-9
            shrink-0
            rounded-lg
            transition-all
            ${
              isActive
                ? "bg-white/15 text-white"
                : `
                  bg-white/4.5
                  text-slate-400
                  group-hover:bg-white/8
                  group-hover:text-slate-100
                `
            }
          `}
        >
          <Icon
            size={18}
            strokeWidth={2}
          />
        </span>

        <span className="flex-1 truncate">
          {item.label}
        </span>

        {isActive && (
          <FiChevronRight
            size={15}
            strokeWidth={2}
            className="text-white/70 shrink-0"
          />
        )}
      </Link>
    );
  };

  return (
    <div
      className="
        w-full
        h-screen
        bg-slate-50
        text-slate-800
        font-sans
      "
    >
      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="
          hidden
          md:flex
          fixed
          left-0
          top-0
          bottom-0
          z-40
          flex-col
          w-67.5
          shrink-0
          bg-[#0b1424]
          border-r
          border-white/8
        "
      >
        {/* Logo */}
        <div
          className="
    px-5
    pt-6
    pb-5
    border-b
    border-white/8
  "
        >
          <div className="flex items-center gap-3">
            <div
              className="
    flex
    h-12
    w-12
    shrink-0
    items-center
    justify-center
    overflow-hidden
    rounded-full
    bg-[#071126]
  "
            >
              <img
                src={logoApp}
                alt="RestoInnApp"
                className="
      h-full
      w-full
      scale-[1.45]
      object-contain
    "
              />
            </div>

            <div className="min-w-0">
              <h1
                className="
          text-[20px]
          leading-none
          font-extrabold
          tracking-tight
          text-white
        "
              >
                Resto
                <span className="text-cyan-400">InnApp</span>
              </h1>

              <p
                className="
          mt-1.5
          text-[9px]
          leading-none
          font-bold
          uppercase
          tracking-[0.13em]
          text-slate-500
        "
              >
                Restaurant Management
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Menu */}
        <div
          className="
            flex-1
            min-h-0
            overflow-y-auto
            px-4
            py-6
          "
        >
          {visibleMainMenu.length > 0 && (
            <section className="mb-8">
              <p
                className="
                  px-3
                  mb-3
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-slate-500
                "
              >
                Main Menu
              </p>

              <nav className="space-y-1.5">
                {visibleMainMenu.map(renderNavItem)}
              </nav>
            </section>
          )}

          {visibleManagementMenu.length > 0 && (
            <section>
              <p
                className="
                  px-3
                  mb-3
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-slate-500
                "
              >
                Management
              </p>

              <nav className="space-y-1.5">
                {visibleManagementMenu.map(renderNavItem)}
              </nav>
            </section>
          )}
        </div>

        {/* Desktop User */}
        <div
          className="
            px-4
            pt-3
            pb-4
            border-t
            border-white/8
          "
        >
          <div className="flex items-center gap-2">
            <div
              className="
                flex
                items-center
                gap-3
                flex-1
                min-w-0
                px-3
                py-2.5
                rounded-xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-9
                  h-9
                  shrink-0
                  rounded-lg
                  bg-blue-600
                  text-white
                  text-sm
                  font-bold
                "
              >
                {userInitial}
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                    truncate
                  "
                >
                  {userName}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-blue-400
                  "
                >
                  {user.role || "STAFF"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              className="
                flex
                items-center
                justify-center
                w-10
                h-10
                shrink-0
                rounded-xl
                bg-white/4.5
                border
                border-white/6
                text-slate-400
                transition-all
                duration-200
                hover:bg-rose-500/10
                hover:border-rose-500/20
                hover:text-rose-400
              "
            >
              <FiLogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="
          w-full
          h-screen
          overflow-y-auto
          bg-slate-50
          md:pl-67.5
        "
      >
        <div
          className="
            w-full
            min-h-full
            p-4
            sm:p-5
            lg:p-8
            pb-22.5
            md:pb-8
          "
        >
          <Outlet />
        </div>
      </main>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      <div
        className="
          fixed
          left-0
          right-0
          bottom-0
          z-9999
          block
          md:hidden
          w-full
          bg-white
          border-t
          border-slate-200
          shadow-[0_-8px_30px_rgba(15,23,42,0.10)]
        "
      >
        <nav
          className="
            flex
            items-center
            w-full
            h-17.5
            px-1
            pb-[env(safe-area-inset-bottom)]
          "
        >
          {visibleMainMenu.map((item) => {
            const isActive = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="
                  relative
                  flex
                  flex-1
                  flex-col
                  items-center
                  justify-center
                  min-w-0
                  h-full
                  gap-1
                  no-underline
                  transition-all
                  duration-200
                "
              >
                <span
                  className={`
                    flex
                    items-center
                    justify-center
                    w-10
                    h-8
                    rounded-xl
                    transition-all
                    duration-200
                    ${
                      isActive
                        ? `
                          bg-blue-600
                          text-white
                          shadow-sm
                          shadow-blue-600/20
                        `
                        : `
                          bg-transparent
                          text-slate-400
                        `
                    }
                  `}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                </span>

                <span
                  className={`
                    max-w-16
                    truncate
                    text-[9px]
                    leading-none
                    font-semibold
                    ${isActive ? "text-blue-600" : "text-slate-500"}
                  `}
                >
                  {item.mobileLabel}
                </span>

                {isActive && (
                  <span
                    className="
                      absolute
                      bottom-0
                      left-1/2
                      -translate-x-1/2
                      w-6
                      h-0.75
                      rounded-t-full
                      bg-cyan-400
                    "
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}