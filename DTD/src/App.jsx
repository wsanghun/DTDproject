import { BrowserRouter, Routes, Route } from "react-router-dom";
import StageCanvas from "./components/GameCanvas/StageCanvas";
import RegisterPage from "./pages/RegisterPage";
import StartPage from "./pages/StartPage";
import { ToastContainer } from "react-toastify";
import LobbyPage from "./pages/LobbyPage";
import { UserProvider } from "./context/UserContext";
import { TowerProvider } from "./context/TowerContext";
import { UserTowerProvider } from "./context/UserTowerContext";
import TestPathPage from "./stages/TestPathPage";
import PathEditor from "./tools/PathEditor";
import BuildZoneEditor from "./tools/BuildZoneEditor";

function App() {
  return (
    <UserProvider>
      <TowerProvider>
        <UserTowerProvider>
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            pauseOnHover={false}
            draggable
            theme="dark"
            className="custom-toast-container"
            toastClassName="custom-toast"
            progressClassName="custom-toast-progress"
          />

          <BrowserRouter>
            <Routes>
              <Route path="/" element={<StartPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 로비 화면 */}
              <Route path="/lobby" element={<LobbyPage />} />

              {/* 더 이상 SelectPage 없음 */}
              <Route path="/test-path" element={<TestPathPage />} />

              {/* ✅ 1-1 스테이지 인게임 */}
              <Route path="/stage/:stageId" element={<StageCanvas />} />

              {/* 🛠 경로 파서 (개발자용 툴) */}
              <Route path="/tool/path/:stageId" element={<PathEditor />} />

              <Route
                path="/tool/build-zone/:stageId"
                element={<BuildZoneEditor />}
              />
            </Routes>
          </BrowserRouter>
        </UserTowerProvider>
      </TowerProvider>
    </UserProvider>
  );
}

export default App;
