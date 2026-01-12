import { useState } from "react";
import { toast } from "react-toastify";
import "../../css/LoginRegister.css";
import { useUser } from "../../context/UserContext";
import axios from "axios";

export default function LoginBox({ onCancel, onLoginSuccess }) {
  const [form, setForm] = useState({
    userid: "",
    pwd: "",
  });

  const { setUser } = useUser();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    // ============================
    // 1) 로그인 요청
    // ============================
    try {
      await axios.post("/api/auth/login", form, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("🔥 로그인 통신 오류:", err);
      toast.error(
        "로그인 실패: " + (err.response?.data?.message || "통신 오류")
      );
      return; // ⭐ 실패하면 아래 로직 실행 금지
    }

    // ============================
    // 2) 로그인 성공 → /me 조회
    // ============================
    try {
      const meRes = await axios.get("/api/users/me", {
        withCredentials: true,
      });

      const userData = meRes.data;
      setUser(userData);

      toast.success(`${userData.username}님, 어서오고`);
      onLoginSuccess();
    } catch (err) {
      console.error("🔥 로그인 후 /me 조회 오류:", err);
      toast.error("로그인 후 사용자 정보 로딩 실패");
    }
  };

  return (
    <div className="login-replace-box">
      <h2>로그인</h2>

      <input
        name="userid"
        placeholder="아이디"
        className="auth-input"
        value={form.userid}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
      />

      <input
        name="pwd"
        type="password"
        placeholder="비밀번호"
        className="auth-input"
        value={form.pwd}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
      />

      <button className="auth-btn" onClick={handleLogin}>
        로그인
      </button>

      <button className="auth-cancel-btn" onClick={onCancel}>
        돌아가기
      </button>
    </div>
  );
}
