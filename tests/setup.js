// React 18의 act(...) 경고를 없애기 위한 테스트 환경 표시
import { beforeEach } from "vitest";
import { _resetCache } from "../src/storage.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Node 22.4+/26은 전역 localStorage를 기본 제공하는데(저장 파일 옵션이 없으면 쓸 수 없는 빈 껍데기),
// 이게 jsdom의 localStorage를 가려서 setItem 등이 undefined가 된다.
// → vitest jsdom 환경이 노출하는 globalThis.jsdom의 Storage를 전역에 다시 걸어 준다.
// (옛 Node에는 이 문제가 없고 jsdom 것이 이미 전역이라 아래 코드는 사실상 아무 일도 안 한다.
//  NODE_OPTIONS에 플래그를 넣는 방식은 모르는 플래그가 있는 옛 Node에서 에러라 쓰지 않는다.)
const jsdomWindow = globalThis.jsdom && globalThis.jsdom.window;
if (jsdomWindow) {
  for (const name of ["localStorage", "sessionStorage"]) {
    try {
      const storage = jsdomWindow[name];
      if (storage && globalThis[name] !== storage) {
        Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
      }
    } catch (e) {}
  }
}

// 검사마다 저장된 설정을 비워 항상 같은 상태에서 시작하게 한다.
// (설정 영속 기능이 생긴 뒤로는 이걸 안 하면 앞 검사가 뒤 검사에 영향을 준다.)
beforeEach(() => {
  try { localStorage.clear(); } catch (e) {}
  _resetCache();
});
