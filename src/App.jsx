import React, { useState } from "react";
import { C } from "./theme.js";
import { JamProvider } from "./jam/JamProvider.jsx";
import JamBar from "./jam/JamBar.jsx";
import TabBar from "./components/TabBar.jsx";
import Decoder from "./screens/Decoder.jsx";
import ChordDictionary from "./screens/ChordDictionary.jsx";
import Scales from "./screens/Scales.jsx";


export default function App() {
  const [tab, setTab] = useState("decoder");
  return (
    <JamProvider>
      <style>{`.hwheel::-webkit-scrollbar{display:none}`}</style>
      <div style={{ position: "relative", minHeight: "100%", background: C.bg }}>
        <div style={{ paddingBottom: 112 }}>
          {tab === "decoder" && <Decoder />}
          {tab === "chords" && <ChordDictionary />}
          {tab === "scales" && <Scales />}
        </div>
        <JamBar />
        <TabBar tab={tab} setTab={setTab} />
      </div>
    </JamProvider>
  );
}

