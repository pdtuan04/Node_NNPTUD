import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { getRoleFromToken } from "../../utils/jwtHelper";
import { jwtDecode } from "jwt-decode";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSuccess = async (response) => {
    if (response.ok) {
      try {
        const result = await response.json();

        // Backend trả về { success: true, data: { token: "..." } }
        const token = result?.data?.token || result?.token;

        if (token) {
          // Giải mã token để lấy thông tin user
          const decodedToken = jwtDecode(token);
          const finalRole = decodedToken.role || "USER";

          // Lưu vào Context & LocalStorage
          login({
            userId: decodedToken.id,
            username: decodedToken.username,
            email: decodedToken.email,
            role: finalRole,
            token: token,
          });

          if (finalRole?.toUpperCase() === "ADMIN") {
            const redirectPath = from.startsWith("/admin") ? from : "/admin";
            navigate(redirectPath, { replace: true });
          } else {
            const redirectPath = from.startsWith("/admin") ? "/" : from || "/";
            navigate(redirectPath, { replace: true });
          }
        } else {
          alert("Không nhận được Token từ Server");
        }
      } catch (error) {
        alert("Lỗi phân tích dữ liệu đăng nhập");
      }
    } else {
      // Backend trả về string hoặc json khi lỗi 404
      try {
        const errText = await response.text();
        alert(`Đăng nhập thất bại: ${errText}`);
      } catch (e) {
        alert("Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu.");
      }
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cực kỳ quan trọng để lưu Cookie
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      await handleLoginSuccess(res);
    } catch (error) {
      alert("Không thể kết nối tới Server");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cực kỳ quan trọng để lưu Cookie
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      await handleLoginSuccess(res);
    } catch (error) {
      alert("Không thể kết nối tới Server");
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <div className="card shadow border-0 p-4 bg-white">
        <h2 className="mb-4 text-center text-primary fw-bold">PetSpa Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="form-label fw-bold">Tên đăng nhập</label>
            <input
              className="form-control"
              name="username"
              placeholder="Nhập username"
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="username"
              value={form.username}
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-bold">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              name="password"
              placeholder="Nhập mật khẩu"
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="current-password"
              value={form.password}
            />
          </div>

          <button
            className="btn btn-primary w-100 mb-3 py-2 fw-bold"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang xử lý...
              </>
            ) : (
              "ĐĂNG NHẬP"
            )}
          </button>
        </form>

        <div className="position-relative my-4">
          <hr />
          <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
            hoặc đăng nhập bằng
          </span>
        </div>

        <div className="d-flex justify-content-center mb-3">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google Login Failed")}
            useOneTap
            theme="outline"
            width="300"
          />
        </div>

        <div className="text-center">
          <span className="text-muted">Chưa có tài khoản? </span>
          <Link to="/register" className="text-decoration-none fw-bold">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
