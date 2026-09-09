"use client";

const blackGoldCss = `
:root{
  color-scheme:dark;
  --accent:#d4af37;
  --panel:#11100d;
  --border:rgba(212,175,55,.22);
  --mq-bg:#070706;
  --mq-panel:#11100d;
  --mq-panel-2:#16130c;
  --mq-gold:#d4af37;
  --mq-gold-light:#f0d77a;
  --mq-gold-soft:#b99635;
  --mq-text:#fffaf0;
  --mq-muted:#aaa38f;
  --mq-border:rgba(212,175,55,.22);
}
html,body{min-height:100%;background-color:var(--mq-bg)!important;color:var(--mq-text)!important}
body{
  position:relative;
  background-image:
    radial-gradient(circle at 12% -6%,rgba(212,175,55,.16),transparent 29rem),
    radial-gradient(circle at 90% 10%,rgba(212,175,55,.09),transparent 27rem),
    linear-gradient(rgba(212,175,55,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(212,175,55,.035) 1px,transparent 1px),
    repeating-linear-gradient(135deg,rgba(212,175,55,.018) 0 1px,transparent 1px 18px)!important;
  background-size:auto,auto,48px 48px,48px 48px,auto!important;
  background-attachment:fixed!important;
}
body::before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  z-index:0;
  opacity:.55;
  background-image:
    radial-gradient(circle,rgba(240,215,122,.11) 1px,transparent 1.2px),
    linear-gradient(45deg,transparent 48%,rgba(212,175,55,.022) 49%,rgba(212,175,55,.022) 51%,transparent 52%);
  background-size:24px 24px,96px 96px;
  mask-image:linear-gradient(to bottom,rgba(0,0,0,.95),rgba(0,0,0,.42) 65%,transparent 100%);
}
body::after{
  content:"";
  position:fixed;
  width:520px;
  height:520px;
  right:-180px;
  bottom:-220px;
  pointer-events:none;
  border:1px solid rgba(212,175,55,.08);
  transform:rotate(45deg);
  box-shadow:0 0 0 70px rgba(212,175,55,.015),0 0 0 140px rgba(212,175,55,.01);
  z-index:0;
}
body>*,main,.authPage,.pricingPage,.ownerPage{position:relative;z-index:1}
main,.authPage,.pricingPage,.ownerPage{background:transparent!important;color:var(--mq-text)!important}
.nav{
  background:rgba(7,7,6,.91)!important;
  border-color:rgba(212,175,55,.22)!important;
  color:var(--mq-text)!important;
  backdrop-filter:blur(16px);
  box-shadow:0 8px 30px rgba(0,0,0,.28)!important;
}
.brand,.authLogo{color:var(--mq-text)!important}
.spark,.authLogo span,.eyebrow,.hero h1 span,.pricingHero h1 span{color:var(--mq-gold)!important}
.hero h1,.pricingHero h1,.ownerTop h1{color:#fffaf0!important;text-shadow:0 10px 35px rgba(0,0,0,.30)}
.subtitle,.authSub,.step small,.qMeta,.ownerTable td small,.price span,.usdPrice,.pricingFine,.pricingHero>p:last-child{color:var(--mq-muted)!important}
.panel,.authCard,.priceCard,.ownerStats div,.ownerDenied{
  background:linear-gradient(180deg,rgba(20,18,13,.96),rgba(13,13,11,.96))!important;
  color:var(--mq-text)!important;
  border-color:var(--mq-border)!important;
  box-shadow:0 14px 42px rgba(0,0,0,.30),inset 0 1px 0 rgba(240,215,122,.035)!important;
}
.tabs{background:rgba(212,175,55,.07)!important;border:1px solid rgba(212,175,55,.14)!important;box-shadow:inset 0 1px 0 rgba(240,215,122,.025)!important}
.tabs button{color:#aaa38f!important}
.tabs button:hover{color:var(--mq-gold-light)!important;background:rgba(212,175,55,.06)!important}
.tabs button.active{
  background:linear-gradient(180deg,rgba(212,175,55,.19),rgba(212,175,55,.11))!important;
  color:var(--mq-gold-light)!important;
  box-shadow:inset 0 0 0 1px rgba(212,175,55,.32),0 5px 16px rgba(0,0,0,.18)!important;
}
.badge,.ownerTag,.saveBadge,.planPill{
  background:rgba(212,175,55,.10)!important;
  border-color:rgba(212,175,55,.24)!important;
  color:var(--mq-gold-light)!important;
}
.topic,.settingRow select,.counter button,.questionTools button,.paperActions button,.accountButton,.ownerToolbar input,.ownerToolbar button,.ownerActions select,.ownerActions button,.bankTop input,.authForm input{
  background:#14130f!important;
  color:#eee6cf!important;
  border-color:rgba(212,175,55,.22)!important;
}
.topic:hover,.questionTools button:hover,.paperActions button:hover,.accountButton:hover{border-color:rgba(212,175,55,.55)!important;color:var(--mq-gold-light)!important;background:rgba(212,175,55,.07)!important}
.topic.selected{
  background:rgba(212,175,55,.15)!important;
  border-color:rgba(212,175,55,.58)!important;
  color:var(--mq-gold-light)!important;
  box-shadow:inset 0 0 0 1px rgba(212,175,55,.10)!important;
}
.counter{background:rgba(212,175,55,.07)!important}
.step>span,.qNumber{
  background:rgba(212,175,55,.14)!important;
  color:var(--mq-gold-light)!important;
  border:1px solid rgba(212,175,55,.18)!important;
}
.generate,.paperActions .print,.paperActions .word,.bankActions button,.priceCard button,.ownerDenied button{
  background:linear-gradient(135deg,#e8c653,#ad8520)!important;
  color:#090806!important;
  border-color:#d4af37!important;
  box-shadow:0 9px 24px rgba(212,175,55,.17),inset 0 1px 0 rgba(255,255,255,.18)!important;
}
.generate:hover,.paperActions .print:hover,.paperActions .word:hover,.bankActions button:hover,.priceCard button:hover{background:linear-gradient(135deg,#f3dc86,#c59b29)!important;color:#090806!important}
.previewHead>span{
  background:rgba(212,175,55,.11)!important;
  color:var(--mq-gold-light)!important;
  border:1px solid rgba(212,175,55,.18)!important;
}
.editorHint{
  background:rgba(212,175,55,.07)!important;
  border-color:rgba(212,175,55,.20)!important;
}
.editorHint>span,.empty>div{color:var(--mq-gold)!important}
.empty,.empty p{color:var(--mq-muted)!important}
.empty h3,.marks,.priceLabel{color:#f6eed9!important}
.tags span{background:rgba(212,175,55,.08)!important;color:#c9bd98!important;border:1px solid rgba(212,175,55,.09)!important}
.divider,.question,.previewHead,.bankResults,.bankCard,.paperActions,.ownerTable th,.ownerTable td{border-color:rgba(212,175,55,.13)!important}
.question:hover,.bankCard:hover{background:rgba(212,175,55,.025)!important}
.authTabs{background:rgba(212,175,55,.07)!important}
.authTabs button{color:#9e9785!important}
.authTabs button.active{background:rgba(212,175,55,.14)!important;color:var(--mq-gold-light)!important}
.authForm label{color:#e7dfc9!important}
.authForm input:focus,.bankTop input:focus,.ownerToolbar input:focus{border-color:rgba(212,175,55,.65)!important;box-shadow:0 0 0 3px rgba(212,175,55,.10)!important;outline:none!important}
.authMessage,.ownerMessage{background:rgba(212,175,55,.09)!important;color:#ead686!important}
input,select{color-scheme:dark!important}
input::placeholder{color:#777164!important}
.priceCard.featured{border-color:#d4af37!important;box-shadow:0 18px 52px rgba(212,175,55,.12)!important}
.ownerPanel{background:rgba(17,16,13,.94)!important}
.ownerTable th{color:#a69e87!important}
.ownerToolbar button,.ownerActions button{cursor:pointer}
.ownerActions .ban{color:#ef9b9b!important;background:rgba(180,45,45,.10)!important;border-color:rgba(220,80,80,.22)!important}
.ownerActions .unban{color:#9ed9ad!important;background:rgba(45,150,80,.09)!important;border-color:rgba(80,180,110,.20)!important}
.statusPill.active{background:rgba(45,160,85,.12)!important;color:#8dd8a5!important}
.statusPill.banned{background:rgba(190,50,60,.12)!important;color:#ef9aa2!important}
[style*="rgba(108,76,255"],[style*="rgba(109,74,255"],[style*="#6c4cff"],[style*="#6d4aff"]{background-color:rgba(212,175,55,.10)!important;border-color:rgba(212,175,55,.20)!important}
button[style*="#6d4aff"],button[style*="#6c4cff"]{background:#d4af37!important;color:#090806!important}
[style*="var(--panel,#fff)"],[style*="var(--panel, #fff)"]{--panel:#15130e!important}
progress,[role="progressbar"]{accent-color:var(--mq-gold)!important}
input[type="checkbox"]{accent-color:var(--mq-gold)!important}
::selection{background:rgba(212,175,55,.35);color:#fffaf0}
@media(max-width:700px){
  body::after{width:320px;height:320px;right:-160px;bottom:-160px}
}
@media print{
  body{background:#fff!important;color:#111!important}
  body::before,body::after{display:none!important}
  main{background:#fff!important;color:#111!important}
  .panel{background:#fff!important;color:#111!important;border-color:#ddd!important;box-shadow:none!important}
}
`;

export default function ThemeToggle() {
  return <style id="mq-black-gold-theme">{blackGoldCss}</style>;
}
