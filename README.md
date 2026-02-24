# 🛡️ DTD (Digimon Tower Defense)

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.5.8-6DB33F?logo=spring-boot&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7.0-646CFF?logo=vite&logoColor=white" />
</p>

---

### 🎮 프로젝트 소개
**DTD (Digimon Tower Defense)**는 별도의 설치 없이 웹 브라우저에서 바로 플레이 가능한 **전략 디펜스 게임**입니다. 
추억의 디지몬들과 함께 타워를 건설하고 진화시키며 몰려오는 적들을 막아내세요!

---

## � 프로젝트 시연 영상
[![DTD 시연 영상](https://img.youtube.com/vi/wgvUnytxOFY/0.jpg)](https://youtu.be/wgvUnytxOFY)
> **위 이미지를 클릭하면 YouTube 시연 영상으로 이동합니다.**

---

## �📂 프로젝트 구조
```bash
  📦 DTD (Root)
   ┣ 📂 dtd-react       # 💡 Frontend (React + Custom Game Engine)
   ┣ 📂 dtd-project     # ⚙️ Backend (Spring Boot API Server)
   ┗ � README.md       # 📖 가이드문서
```

---

## 🛠 Tech Stack

| 구분 | 기술 스택 |
| :--- | :--- |
| **Frontend** | `React 19`, `Vite`, `Canvas API`, `Axios` |
| **Backend** | `Spring Boot 3.5.8`, `Java 17`, `JPA`, `QueryDSL` |
| **Database** | `MySQL` |
| **Security** | `Spring Security`, `JWT` (Access/Refresh Token) |

---

## ⚙️ 환경 설정 (Configuration)

### 1️⃣ Database 세팅
* **MySQL**을 사용하며, `dtd_project` 데이터베이스가 필요합니다.
```sql
CREATE DATABASE dtd_project;
```
* 루트 디렉토리의 `sql_bak.sql` (혹은 `db/schema.sql`)을 실행하여 스키마와 데이터를 로드하세요.

### 2️⃣ Backend 설정 (`dtd-project`)
`src/main/resources/application.properties` 수정:
* **DB 계정**: `spring.datasource.username` / `password` 본인 계정으로 수정
* **JWT 비밀키**: `jwt.secret` 항목에 본인만의 시크릿 키 입력
* **포트 확인**: 서버 포트는 기본 `8080`으로 설정되어 있습니다.

### 3️⃣ Frontend 설정 (`dtd-react`)
`vite.config.js` 수정:
* **Proxy Target**: 백엔드 포트에 맞춰 `target: "http://localhost:8080"` 확인

---

## � 실행 방법 (How to Run)

### 🟢 Backend
```bash
cd dtd-project
./gradlew bootRun
```
> 서버 접속 주소: `http://localhost:8080`

### 🔵 Frontend
```bash
cd dtd-react
npm install
npm run dev
```
> 게임 접속 주소: `http://localhost:5173`

---

## ⚠️ 주의사항
* **포트 불일치**: 백엔드의 `server.port`와 프론트의 `proxy.target`이 일치해야 통신이 가능합니다.
* **CORS 설정**: `application.properties`의 `frontend.base-url`이 프론트 실행 주소와 맞는지 확인하세요.

---

## ✨ 주요 특징
* 🛠 **자체 제작 엔진**: HTML5 Canvas를 활용한 최적화된 게임 엔진
* 🧬 **진화 시스템**: 1성부터 4성까지 이어지는 타워 진화 및 전략적 조합
* 💎 **성장 요소**: 게임 내 재화로 타워를 영구적으로 강화하는 RPG 시스템
* 🗺 **맵 에디터**: 브라우저에서 직접 맵을 디자인할 수 있는 내장 툴 제공