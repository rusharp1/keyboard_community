import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// 앱 env(URL/anon)와 테스트 전용 env(service_role)를 모두 로드.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.test.local" });

// 로컬 dev 서버(localhost:3000, webpack)를 재사용한다.
// Next 16은 디렉터리당 dev 서버 1개만 허용하므로 reuseExistingServer로 기존 것을 쓴다.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // 인증 상태가 직렬로 쌓이므로 순차 실행
  retries: 1, // dev(webpack) 첫 라우트 컴파일 지연으로 인한 플레이키 흡수
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    // 자동화 도배 방지 쿨다운 해제(운영은 항상 ON). 직접 dev 기동 시에도 동일 env 필요.
    env: { RATE_LIMIT_OFF: "1" },
  },
});
