import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authContext";

const HKFIN_URL = import.meta.env.VITE_HKFIN_URL || "";

export default function Login() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithToken(token.trim());
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Token không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-gray-900">
          TRADING JOURNAL<span className="text-brand"> _ Đăng nhập</span>
        </h1>
        <p className="mt-1 text-center text-xs text-gray-400">Nhật ký giao dịch cá nhân</p>

        <p className="mt-6 text-center text-sm text-gray-600">
          Trading Journal dùng chung tài khoản với hkfin — hãy đăng nhập hkfin rồi mở Trading Journal từ đó
          {HKFIN_URL ? (
            <>
              , hoặc{" "}
              <a href={HKFIN_URL} className="font-semibold text-brand">
                tới hkfin
              </a>{" "}
              để đăng nhập.
            </>
          ) : (
            "."
          )}
        </p>

        <details className="mt-6">
          <summary className="cursor-pointer text-center text-xs text-gray-400">Dán token thủ công (dev)</summary>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <textarea
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token JWT từ hkfin"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand"
            />
            {error && <p className="text-xs text-loss">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Đang xác thực..." : "Dùng token này"}
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
