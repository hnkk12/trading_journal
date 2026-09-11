import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../store/authContext";
import FilterBar from "./FilterBar";
import { cn } from "../../utils/format";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng!";
  if (h < 14) return "Chào buổi trưa!";
  if (h < 18) return "Chào buổi chiều!";
  return "Chào buổi tối!";
}

const NAV_ITEMS = [
  { to: "/", label: "Tổng quan", end: true },
  { to: "/trades", label: "Lệnh giao dịch" },
  { to: "/calendar", label: "Lịch" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/execution", label: "Thực thi lệnh" },
  { to: "/analytics", label: "Phân tích" },
  { to: "/settings", label: "Cài đặt" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-amber-500">☀ {greeting()}</p>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              TRADING JOURNAL <span className="text-brand">_ Tổng quan</span>
            </h1>
            <p className="text-xs text-gray-400">Nhật ký giao dịch · Theo dõi hiệu suất giao dịch toàn diện</p>
          </div>
          <div className="flex items-center gap-4">
            <FilterBar />
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 text-sm">
              <span className="text-gray-500">{user?.name}</span>
              <button onClick={logout} className="font-medium text-gray-400 hover:text-loss">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1680px] px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
