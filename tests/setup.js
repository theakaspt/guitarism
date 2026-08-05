// React 18의 act(...) 경고를 없애기 위한 테스트 환경 표시
import { beforeEach } from "vitest";
import { _resetCache } from "../src/storage.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// 검사마다 저장된 설정을 비워 항상 같은 상태에서 시작하게 한다.
// (설정 영속 기능이 생긴 뒤로는 이걸 안 하면 앞 검사가 뒤 검사에 영향을 준다.)
beforeEach(() => {
  try { localStorage.clear(); } catch (e) {}
  _resetCache();
});
