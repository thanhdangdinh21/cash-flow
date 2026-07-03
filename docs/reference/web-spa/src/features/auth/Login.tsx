import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../ui/primitives";
import { Logo } from "../../ui/bits";
import { SESSION_KEY } from "../../state/store";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function enter() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: email || "maya@email.com", at: Date.now() }));
    navigate("/");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (!typing && e.key.toLowerCase() === "d") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-app">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px" }}>
        <Logo size={28} wordSize={18} />
        <div>
          <div className="wb-display" style={{ fontSize: 64, maxWidth: 560 }}>Know where your money flows.</div>
          <div style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 20, maxWidth: 420, lineHeight: 1.55 }}>
            Every dollar in, every dollar out — one calm place. Budgets that nudge, never nag.
          </div>
        </div>
        <div className="w-eyebrow">Personal finance · light + dark · USD and more</div>
      </div>
      <div style={{ width: 480, flex: "none", borderLeft: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", padding: "0 64px" }}>
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>Welcome back</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 5, marginBottom: 24 }}>Log in to your book.</div>
          <form
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
            onSubmit={(e) => { e.preventDefault(); enter(); }}
          >
            <Input label="Email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button variant="primary" block type="submit" onClick={enter}>Log in</Button>
            <Button variant="secondary" block onClick={enter}>Explore with sample data</Button>
          </form>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)", marginTop: 12 }}>
            <span>Press</span> <kbd className="w-kbd">D</kbd> <span>· sample data, no account needed</span>
          </div>
          <div style={{ fontSize: 13, marginTop: 24, color: "var(--ink-2)" }}>
            New here? <span style={{ fontWeight: 650, color: "var(--ink)", cursor: "pointer" }} onClick={enter}>Create an account</span>
          </div>
        </div>
      </div>
    </div>
  );
}
