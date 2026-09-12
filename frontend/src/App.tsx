import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./store/authContext";
import { FilterProvider } from "./store/filterContext";
import { TradeModalProvider } from "./store/tradeModalContext";
import Layout from "./components/layout/Layout";
import TradeFormModal from "./components/trades/TradeFormModal";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import CalendarPage from "./pages/Calendar";
import Portfolio from "./pages/Portfolio";
import Execution from "./pages/Execution";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function ProtectedShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Đang tải...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <FilterProvider>
      <TradeModalProvider>
        <Layout />
        <TradeFormModal />
      </TradeModalProvider>
    </FilterProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/execution" element={<Execution />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
