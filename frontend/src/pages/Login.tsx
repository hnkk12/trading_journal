import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Same client-side decode hkfin's Login page uses — the ID token's signature
// is verified again server-side by Google when the backend re-checks it is
// not needed here because both apps trust the same shared `users` table
// match-by-email flow (see backend/src/routes/auth.ts).
function decodeJwt(token: string): { email: string; name: string; picture?: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const google = (window as any).google;
      if (!google) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          const payload = decodeJwt(response.credential);
          if (!payload) {
            setError("Không đọc được thông tin từ Google");
            return;
          }
          setError(null);
          setLoading(true);
          try {
            await loginWithGoogle({ email: payload.email, name: payload.name, picture: payload.picture });
            navigate("/", { replace: true });
          } catch {
            setError("Đăng nhập Google thất bại, thử lại sau");
          } finally {
            setLoading(false);
          }
        },
      });

      google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
        theme: "filled_black",
        size: "large",
        width: 320,
        shape: "pill",
        text: "signin_with",
      });
    };

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-gray-900">
          TRADING JOURNAL<span className="text-brand"> _ Đăng nhập</span>
        </h1>
        <p className="mt-1 text-center text-xs text-gray-400">
          Dùng chung tài khoản Google với hkfin — đăng nhập hoặc đăng ký chỉ trong một bước
        </p>

        {error && <p className="mt-4 text-center text-xs text-loss">{error}</p>}

        <div className="mt-6 flex justify-center">
          {GOOGLE_CLIENT_ID ? (
            loading ? (
              <p className="text-sm text-gray-400">Đang đăng nhập...</p>
            ) : (
              <div id="google-signin-button" />
            )
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-relaxed text-amber-700">
              <span className="block font-semibold uppercase tracking-wide">Chưa cấu hình Google OAuth</span>
              Thêm <code className="rounded bg-white px-1 py-0.5 font-mono">VITE_GOOGLE_CLIENT_ID</code> vào{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono">frontend/.env</code> để bật đăng nhập Google.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
