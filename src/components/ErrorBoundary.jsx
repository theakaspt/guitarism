import React from "react";
import { C } from "../theme.js";
import { clearAll } from "../storage.js";

// 화면 그리다가 문제가 생기면 앱 전체가 하얗게 죽는 대신 이 안내가 뜬다.
// 최상위(main.jsx)와 탭 단위(App.jsx) 두 곳에 걸어 둔다.
// 탭 하나가 터져도 탭 바와 잼은 계속 살아 있게 하는 것이 목적이다.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null, tries: 0 };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    // 무슨 일이 있었는지 콘솔에 자세히 남긴다 (사파리 개발자 도구에서 확인 가능)
    console.error(`[Guitarism] ${this.props.label || "화면"}에서 오류가 났습니다.`, err, info && info.componentStack);
  }

  restart = () => {
    // 상태를 비우고 자식을 새로 마운트한다 (tries가 바뀌면 key가 바뀜)
    this.setState((s) => ({ err: null, tries: s.tries + 1 }));
  };

  restartClean = () => {
    clearAll();
    this.setState((s) => ({ err: null, tries: s.tries + 1 }));
  };

  render() {
    if (!this.state.err) {
      return <React.Fragment key={this.state.tries}>{this.props.children}</React.Fragment>;
    }
    const btn = (main) => ({
      padding: "8px 20px", borderRadius: 999, cursor: "pointer", fontSize: 13,
      fontWeight: main ? 800 : 600,
      background: main ? C.brass : "transparent",
      color: main ? C.bg : C.muted,
      border: main ? "none" : `1px solid ${C.ring}`,
    });
    return (
      <div style={{
        background: C.bg, color: C.text, minHeight: 260, padding: "40px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, textAlign: "center", boxSizing: "border-box",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ fontSize: 19, fontWeight: 800 }}>문제가 생겼어요</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 300 }}>
          {this.props.label ? `${this.props.label} 화면을 그리다가 멈췄습니다.` : "화면을 그리다가 멈췄습니다."}
          <br />다시 시작하면 대부분 정상으로 돌아옵니다.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
          <button onClick={this.restart} style={btn(true)}>다시 시작</button>
          <button onClick={this.restartClean} style={btn(false)}>설정까지 초기화</button>
        </div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 8, maxWidth: 300, lineHeight: 1.5 }}>
          계속 같은 자리에서 멈추면 "설정까지 초기화"를 눌러 보세요.
          저장된 값이 꼬였을 때 해결됩니다.
        </div>
      </div>
    );
  }
}
