import React from "react";
import { C } from "../theme.js";

export function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, letterSpacing: "0.2em", color: C.dim, textTransform: "uppercase" }}>{children}</div>
  );
}

export default SectionLabel;
