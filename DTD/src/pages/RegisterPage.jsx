import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // ⭐ api 제거 → axios 사용
import { toast } from "react-toastify";
import "../css/LoginRegister.css";

export default function RegisterPage() {
  const [regData, setRegData] = useState({
    userid: "",
    pwd: "",
    username: "",
    birth: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      // ⭐ axios 기본 POST
      await axios.post("/api/auth/register", regData);

      toast.success("야 너 들어왔다");
      navigate("/", { state: { openLogin: true } });
    } catch (err) {
      alert("회원가입 실패: " + (err.response?.data?.message || "에러 발생"));
    }
  };

  return (
    <div className="auth-container">
      <h2>회원가입</h2>

      <input
        name="userid"
        placeholder="아이디"
        value={regData.userid}
        onChange={handleChange}
        className="auth-input"
      />

      <input
        name="pwd"
        type="password"
        placeholder="비밀번호"
        value={regData.pwd}
        onChange={handleChange}
        className="auth-input"
      />

      <input
        name="username"
        placeholder="닉네임"
        value={regData.username}
        onChange={handleChange}
        className="auth-input"
      />

      <input
        name="birth"
        type="date"
        value={regData.birth}
        onChange={handleChange}
        className="auth-input"
      />

      <button className="auth-btn" onClick={handleRegister}>
        가입하기
      </button>

      <div className="auth-footer">
        <Link to="/">이미 계정이 있으신가요? 로그인</Link>
      </div>
    </div>
  );
}
