import React from "react";
import { C } from "./theme.js";
import { JamProvider } from "./jam/JamProvider.jsx";
import JamBar from "./jam/JamBar.jsx";
import TabBar from "./components/TabBar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import CoachMarks from "./components/CoachMarks.jsx";
import Decoder from "./screens/Decoder.jsx";
import ChordDictionary from "./screens/ChordDictionary.jsx";
import Scales from "./screens/Scales.jsx";
import { useStored, oneOf } from "./storage.js";

const TAB_LABEL = { decoder: "디코더", chords: "코드 사전", scales: "스케일" };

export default function App() {
  const [tab, setTab] = useStored("ui.tab", "decoder", oneOf(["decoder", "chords", "scales"]));
  return (
    <JamProvider>
      <style>{`.hwheel::-webkit-scrollbar{display:none}`}</style>
      <div style={{ position: "relative", minHeight: "100%", background: C.bg }}>
        <div style={{ paddingBottom: 112 }} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {/* 탭 단위 안전망: 한 화면이 멈춰도 탭 바와 잼은 계속 살아 있다.
              key={tab}을 주면 다른 탭에 갔다 오는 것만으로도 다시 시도된다. */}
          <ErrorBoundary key={tab} label={TAB_LABEL[tab]}>
            {tab === "decoder" && <Decoder />}
            {tab === "chords" && <ChordDictionary />}
            {tab === "scales" && <Scales />}
          </ErrorBoundary>
        </div>
        <ErrorBoundary label="잼">
          <JamBar />
        </ErrorBoundary>
        <TabBar tab={tab} setTab={setTab} />
        {/* 처음 켠 사람에게만 한 번 뜨는 안내 (디코더 화면일 때만 — 다이얼을 가리켜야 하므로) */}
        {tab === "decoder" && <CoachMarks />}
      </div>
    </JamProvider>
  );
}
