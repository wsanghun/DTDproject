# 🛡️ DTD (Digimon Tower Defense)

> **React + Spring Boot** 기반의 웹 타워 디펜스 게임 프로젝트입니다.
> 별도의 설치 없이 웹 브라우저에서 바로 플래이 가능한 전략 디펜스 게임을 지향합니다.


## 📂 프로젝트 구조 (Directory Structure)

이 저장소는 **프론트엔드**와 **백엔드**가 함께 포함된 모노레포 구조를 띄고 있습니다.

```bash
📦 Team-Project
 ├── 📂 dtd-react    # Frontend (React + Vite + Custom Game Engine)
 ├── 📂 dtd-project  # Backend (Spring Boot + MariaDB)
 └── 📄 README.md    # 메인 설명서
```

---

## 🛠 기술 스택 (Tech Stack)

### **Frontend (`dtd-react`)**
*   **Core**: React 19, Vite, JavaScript
*   **Engine**: HTML5 Canvas API + `requestAnimationFrame` (Custom Engine)
*   **State**: Context API, Axios (Interceptor)
*   **Style**: CSS Modules, Sparkles (Effect)

### **Backend (`dtd-project`)**
*   **Core**: Spring Boot 3.5.8, Java 17
*   **Database**: MariaDB
*   **ORM**: JPA (Hibernate), QueryDSL
*   **Security**: Spring Security, JWT (Access + Refresh Token)

---

## 🚀 실행 가이드 (How to Run)

### 1. 데이터베이스 설정 (Database)
*   **MariaDB**가 설치되어 있어야 합니다.
*   `dtd-project/src/main/resources/application.properties` 파일의 설정을 본인의 환경에 맞게 수정하세요.
    ```properties
    spring.datasource.url=jdbc:mariadb://localhost:3306/dtd_project
    spring.datasource.username=사용자명
    spring.datasource.password=비밀번호
    ```
*   **초기 데이터**: 루트 경로의 `sql_bak.sql` 파일을 실행하여 스키마와 데이터를 로드해 주세요.

### 2. 백엔드 실행 (Backend)
```bash
cd dtd-project
./gradlew bootRun
```
*   서버는 기본적으로 **8070 포트**에서 실행됩니다. (`http://localhost:8070`)

### 3. 프론트엔드 실행 (Frontend)
```bash
cd dtd-react
npm install
npm run dev
```
*   개발 서버가 실행되면 브라우저에서 접속합니다. (기본: `http://localhost:5173`)

---

## ⚠️ 설정 주의사항 (Configuration)

### **IP 주소 및 포트 변경**
개발 환경에 따라 프론트엔드와 백엔드의 통신 주소를 맞춰주어야 합니다.

1.  **Frontend (`dtd-react/vite.config.js`)**
    *   `proxy` 설정의 `target`을 백엔드 서버 주소로 변경하세요.
    *   ```javascript
        proxy: {
          "/api": {
            target: "http://localhost:8070", // 또는 백엔드 IP
            // ...
          }
        }
        ```

2.  **Backend (`dtd-project/.../application.properties`)**
    *   CORS 설정을 위해 프론트엔드 주소를 확인하세요.
    *   ```properties
        frontend.base-url=http://localhost:5173
        ```

---

## 🎮 주요 기능 (Key Features)

*   **무설치 웹 게임**: 고용량 에셋 로딩 최적화 및 웹 표준 기술 활용
*   **전략적 타워 건설**: 다양한 티어(1~4성)의 타워 조합 및 진화 시스템
*   **나만의 성장 (RPG)**: 재화 파밍 (Gold/Diamond)으로 각 티어 타워를 레벨업
*   **강력한 보안**: JWT 기반의 안전한 로그인 및 어뷰징 방지 트랜잭션 처리
*   **자체 제작 툴**: 브라우저 내장형 **맵 에디터(Map Editor)**를 통한 빠른 레벨 디자인

---

## 