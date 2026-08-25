"use client";

import { useEffect, useState } from "react";

const darkCss = `
html[data-theme="dark"] body{background:#11131a;color:#f3f4f8}
html[data-theme="dark"] .nav,html[data-theme="dark"] .panel,html[data-theme="dark"] .authCard,html[data-theme="dark"] .ownerStats div{background:#181b24;border-color:#2a2e3a;color:#f3f4f8}
html[data-theme="dark"] .tabs,html[data-theme="dark"] .counter,html[data-theme="dark"] .tags span{background:#20242f}
html[data-theme="dark"] .tabs button,html[data-theme="dark"] .subtitle,html[data-theme="dark"] .step small,html[data-theme="dark"] .qMeta,html[data-theme="dark"] .ownerTable td small{color:#aeb4c2}
html[data-theme="dark"] .tabs button.active,html[data-theme="dark"] .topic,html[data-theme="dark"] .settingRow select,html[data-theme="dark"] .counter button,html[data-theme="dark"] .questionTools button,html[data-theme="dark"] .paperActions button,html[data-theme="dark"] .accountButton,html[data-theme="dark"] .ownerToolbar input,html[data-theme="dark"] .ownerToolbar button,html[data-theme="dark"] .ownerActions select,html[data-theme="dark"] .ownerActions button{background:#1f2330;color:#e9ebf2;border-color:#343949}
html[data-theme="dark"] .topic.selected{background:#2a2147;color:#bdafff;border-color:#624ed0}
html[data-theme="dark"] .divider,html[data-theme="dark"] .question,html[data-theme="dark"] .previewHead,html[data-theme="dark"] .bankResults,html[data-theme="dark"] .bankCard,html[data-theme="dark"] .paperActions,html[data-theme="dark"] .ownerTable th,html[data-theme="dark"] .ownerTable td{border-color:#2b303c}
html[data-theme="dark"] .editorHint{background:#211b34;border-color:#342b50}
html[data-theme="dark"] .empty h3,html[data-theme="dark"] .marks,html[data-theme="dark"] .priceLabel{color:#e9ebf2}
html[data-theme="dark"] .badge{background:#251f3a;border-color:#3a3157;color:#d6ccff}
html[data-theme="dark"] .authPage{background:radial-gradient(circle at 50% 0,#211b34 0,transparent 38%),#11131a}
html[data-theme="dark"] input,html[data-theme="dark"] select{color-scheme:dark}
`;

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let style = document.getElementById("mq-dark-theme") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "mq-dark-theme";
      style.textContent = darkCss;
      document.head.appendChild(style);
    }
    const saved = localStorage.getItem("mq-theme");
    const useDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(useDark);
    document.documentElement.dataset.theme = useDark ? "dark" : "light";
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("mq-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      style={{position:"fixed",top:86,right:18,zIndex:40,border:"1px solid #d9dce5",background:dark?"#1f2330":"#fff",color:dark?"#f3f4f8":"#343947",borderRadius:999,padding:"9px 12px",fontWeight:800,cursor:"pointer",boxShadow:"0 6px 20px rgba(0,0,0,.10)"}}
    >
      {dark ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
