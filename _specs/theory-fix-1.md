# 명세: 이론 오류 수정 1차 (음이름 철자 · 코드별 스케일)

작업 폴더: `/Users/seulkeeyi/Documents/개발/기타리즘/guitarism` (Vite + React, JS)
먼저 읽을 것: `CLAUDE.md`(절대 규칙), 이 명세. 운영자 승인 완료된 범위다. **범위 밖은 건드리지 않는다.**

## 지켜야 할 규칙 (CLAUDE.md에서 옮김)
- git 명령 실행 금지, 커밋·푸시 금지, 파일 삭제 금지, 이 명세 범위 밖 파일 수정 금지
- `src/theory/`·`src/audio/`는 React 무의존 유지
- 음악 데이터·로직을 바꾸면 전수 검증 재실행. 테스트 스냅샷 숫자(414·1,872·756·106)를 의도적으로 바꾸면 숫자와 내역 주석을 함께 갱신
- `theory/jam.js` 계산을 바꾸면 소리 불변 대조(`tests/sound-unchanged.test.js`, 1,728건) 통과 필수. 이번 작업은 **소리(타임라인·보이싱)를 바꾸지 않는다** — `jamChordScale`만 바뀐다
- 디자인 값은 `src/theme.js`의 `FS`·`SP`에서. 금색은 선택 상태·루트음 전용. 11px 미만 글자 금지
- 앱이 말하는 이론은 테스트로 앱 데이터에 대고 검산
- localStorage는 `src/storage.js`만 접근 (테스트 setup 제외)

---

## 1단계 — 테스트 환경 (Node 26)
**증상:** Node 26은 전역 `localStorage`를 기본 제공하는데(`--localstorage-file` 없으면 쓸 수 없음) 이게 jsdom 것을 가려서 35개 테스트가 `Cannot read properties of undefined (reading 'setItem')`로 실패한다. `NODE_OPTIONS=--no-experimental-webstorage`를 주면 149 통과 / 6 건너뜀.
**할 일:** `tests/setup.js`(또는 `vite.config.js`의 test 설정)만 고쳐서, 플래그 없이 `npx vitest run`이 통과하게 한다. jsdom의 Storage를 전역에 다시 걸어 주는 방식 권장(vitest jsdom 환경은 `globalThis.jsdom`을 노출한다). Node 18~22에서도 깨지지 않아야 한다(NODE_OPTIONS에 모르는 플래그를 넣는 방식은 옛 Node에서 에러 — 피할 것).
**끝 기준:** 플래그 없이 `npx vitest run` → 실패 0.

---

## 2단계 — 음이름 철자 (도수 기반)
**문제:** `noteName(rootPC, pc)`가 루트만 보고 ♯/♭ 배열을 고른다. C 내추럴 마이너가 `C D D♯ F G G♯ A♯`, C7이 `C E G A♯`로 나온다(7음 스케일 108개 중 45개, 코드 156개 중 51개 오류).

**새 함수 (`src/theory/notes.js`에 추가, `noteName`·`ROOTS`는 그대로 둔다):**
- 원리: 음 글자 = 루트 글자 + (도수 번호 − 1). 변화표 = 실제 음높이 − 그 글자의 자연음 높이(−2..+2 → 𝄫 ♭ (없음) ♯ 𝄪).
- 도수 번호는 스케일이면 `scale.notes[i].deg`(예 "R","2","♭3","♯4","♭5")의 숫자 부분, R=1.
- `spellScale(rootPC, scale)` → `{ rootName, names: [...] }` (names는 scale.notes 순서와 같음).
  - 루트 이름은 `ROOTS[rootPC]`. 결과에 겹변화표(𝄫/𝄪)가 하나라도 생기고, 이명동음 루트(D♭↔C♯, E♭↔D♯, F♯↔G♭, A♭↔G♯, B♭↔A♯)로 철자하면 겹변화표가 없으면 → 이명동음 루트로 철자한 결과를 쓴다. (운영자 결정. 현재 데이터에서 10건: D♭ 내추럴/하모닉 마이너·마이너 블루스·프리지안·로크리안, E♭ 마이너 블루스·로크리안, A♭ 마이너 블루스·프리지안·로크리안)
- `spellChord(rootName, typeId)` → FORMULA[typeId] 순서의 이름 배열. 코드 도수 번호: 0→1, 2→2(sus2), 3·4→3, 5→4(sus4), 6·7·8→5, 9→6(6·m6) 단 dim7의 9는 7(𝄫7), 10·11→7.
- 잼 코드 루트 이름: `jamRootName(keyPC, deg)` — 키 이름(`KEYS[ki].short`에 해당하는 이름, F♯ 키는 F♯) 글자 + 장음계 도수(deg 반음 → `MAJ_DEG` 인덱스) 로 철자. 예: F♯ 키 마이너 251 = E♯m7♭5 · A♯7 · D♯m7. 잼 폼의 deg는 전부 장음계 도수(0,2,4,5,7,9,11)다.
- 필요하면 pc→이름 조회용 작은 헬퍼를 함께 만들어도 된다.

**화면에 적용할 곳 (이외의 `noteName` 사용처는 그대로):**
1. `src/screens/Scales.jsx` `ScaleBoard`: `labelMode === "note"`일 때 라벨 = `spellScale`의 이름(iv로 찾아서).
2. `Scales.jsx` 스케일 화면 제목(`ROOTS[root]` + `scale.name`, 220~300줄 부근): 이명동음 루트로 철자됐으면 제목 옆에 작게 `= C♯ 표기`(FS.small, muted 색)를 붙인다. 휠과 큰 루트 글자는 그대로.
3. `Scales.jsx` 대각선 위치 라벨(`noteName(root, d.pc)`): spellScale 이름으로.
4. `Scales.jsx` `JamScaleLink`: 코드 이름(`noteName(keyPC, cr)`) → `jamRootName`. "○○ 없음" 경고의 음 → 그 코드의 `spellChord` 이름. "코드별 스케일 보기" 목록의 `ROOTS[c.root]`는 그대로 둔다.
5. `Scales.jsx` 81줄 부근 `noteName(keyPc, (keyPc + ch.deg) % 12)` → `jamRootName`.
6. `src/jam/JamBar.jsx` 코드 이름 → `jamRootName`.
7. `src/jam/JamVoicing.jsx` 음 라벨(`note:`) → 지금 코드의 `spellChord`(루트 이름은 `jamRootName`, keyPC 없으면 ROOTS[rootPC]) 기준. 컴포넌트에 deg가 안 넘어오면 rootPC와 keyPC로 deg를 계산.

**테스트 (`tests/spelling.test.js` 새로):**
- 7음 스케일 전부 × 12루트: 글자 7개가 모두 다름, 각 이름의 음높이 = 실제 pc, 겹변화표 없음
- 5·6음 스케일 × 12루트: 음높이 일치, 겹변화표 없음
- FORMULA 13종 × 12루트(루트 이름 ROOTS): 각 음 글자가 도수대로 쌓임, 음높이 일치 (dim7의 𝄫7은 허용)
- 6폼 × 12키 `jamRootName`: 글자 = 키 글자 + 도수, 음높이 일치
- 회귀 예시 고정: C 내추럴 마이너 `C D E♭ F G A♭ B♭` / C7 `C E G B♭` / D 하모닉 마이너 끝음 `C♯` / F♯ 메이저 7번째 `E♯` / D♭ 내추럴 마이너 → rootName `C♯`, `C♯ D♯ E F♯ G♯ A B` / C 마이너 블루스 `C E♭ F G♭ G B♭`
- 렌더 테스트 1개: 스케일 화면에서 음이름 보기로 C 내추럴 마이너를 띄우면 `E♭`이 보이고 `D♯`이 없다 (접힌 UI 규칙 참고: 기존 mount 테스트 방식 따라)

**끝 기준:** 새 테스트 + 기존 전체 통과.

---

## 3단계 — 코드별 스케일 (`jamChordScale`)
**문제:** m7이면 무조건 도리안, maj7이면 무조건 메이저라 코드 역할을 무시한다. C키 기준: 턴어라운드 Am7 → 도리안(F♯ 키 밖), iii-VI7의 Em7 → 도리안(F♯), 마이너 턴어라운드 Fmaj7 → 메이저(B♭), VI7(A7) → 믹솔리디안(F♯).

**할 일:**
1. `src/theory/scales.js` `SCALES` **맨 끝에** 추가 (저장된 scale.index 번호가 안 바뀌게):
   `{ name: "믹솔리디안 ♭13", notes: R 2 3 4 5 ♭6 ♭7 (iv 0 2 4 5 7 8 10) }`
2. `src/theory/jam.js` `jamChordScale` 규칙 교체:
   - 마이너 폼의 `"7"`(V7) 분기는 **지금 그대로** (하모닉 마이너 + note 문구. 꿀팁 `jam.minor251`과 맞물려 있음)
   - VI7(메이저 폼, deg 9, type "7")의 `note` 문구는 그대로 유지
   - 그 외: 코드 루트에서 시작하는 7음 스케일 중 코드 구성음을 모두 포함하고, `_keySet(form, keyPC)` 밖 음 개수가 가장 적은 것. 동점이면 SCALES 인덱스가 작은 것.
   - 미리 돌려 본 결과(운영자에게 보고함): 6폼×12키 264건 중 60건이 바뀌고 전부 키 밖 0개. C키: Am7(턴어라운드)→내추럴 마이너, Em7→프리지안, Fmaj7(마이너 턴어라운드)→리디안, A7→믹솔리디안 ♭13. 나머지(Dm7 도리안, G7 믹솔리디안, Cmaj7 메이저, m7♭5 로크리안, 마이너 i m7 내추럴 마이너)는 그대로.
   - 파일 상단 주석의 SCALES 인덱스 목록도 갱신
3. `tests/theory-scales.test.js`의 756 → 840 (7음 스케일 10개 × 12 × 7) 숫자와 주석 갱신. 다른 스냅샷 숫자가 바뀌면 이유를 보고.
4. 새 테스트(`tests/chord-scale.test.js`): 6폼×12키 모든 코드에 대해 — 결과 스케일이 코드 구성음 전부 포함 / 마이너 V7 외에는 루트 = 코드 루트 / 마이너 V7 외에는 `_keySet` 밖 음 0개 / 위 C키 예시 4건 고정.
5. `tests/sound-unchanged.test.js`, `tests/tips.test.jsx` 통과 확인 (안 고침).
6. `jamForScale`(역방향)이 새 스케일에서도 죽지 않는지만 확인.

**끝 기준:** 새 테스트 + 기존 전체 + `npm run build` 통과.

---

## 보고 형식 (메인 세션에게)
- 단계별: 바꾼 파일과 바꾼 내용 한두 줄, 테스트 결과 숫자(통과/건너뜀/실패)
- 스냅샷 숫자 변화와 이유
- 명세와 다르게 한 것, 판단이 필요했던 것, 못 한 것 — 숨기지 말 것
