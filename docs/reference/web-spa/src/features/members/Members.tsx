import { useRef, useState } from "react";
import { AppShell, FootA, PanelA } from "../../shell/AppShell";
import { Amt } from "../../ui/bits";
import { Avatar, Badge, Button, IconButton, Input } from "../../ui/primitives";
import { I } from "../../ui/icons";
import { useStore } from "../../state/store";
import { useUi } from "../../shell/ui-context";
import { lendingBalance } from "../../state/selectors";
import { ROLES } from "../../data/seed";
import type { Role } from "../../data/types";

function RolePill({ role, onSelect, disabled }: { role: Role; onSelect?: (r: Role) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      className="wa-rolepill"
      disabled={disabled}
      onClick={() => onSelect && setOpen((v) => !v)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      style={disabled ? { opacity: 0.6, cursor: "default" } : undefined}
    >
      {role} <I.chevD size={11} style={{ color: "var(--ink-4)" }} />
      {open && onSelect && (
        <span className="w-menu">
          {ROLES.filter((r) => r !== "Owner").map((r) => (
            <span key={r} className="w-menu-it" onMouseDown={() => { onSelect(r); setOpen(false); }}>
              {r === role && <I.check size={12} />}{r}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

const ROLE_DESC: Record<Role, string> = {
  Owner: "Full access",
  Admin: "Manages members",
  Editor: "Can add and edit",
  Viewer: "Read only",
};

export function Members() {
  const { state, dispatch } = useStore();
  const { showToast, openAdd } = useUi();
  const [invite, setInvite] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Editor");

  function sendInvite() {
    const email = invite.trim();
    if (!email) return;
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    dispatch({ type: "INVITE_MEMBER", name, role: inviteRole });
    showToast(`Invite sent to ${email}`);
    setInvite("");
  }

  const lending = state.contacts.map((c) => ({ ...c, balance: lendingBalance(state, c.name) }));

  return (
    <AppShell
      actions={<Button variant="primary" size="sm" onClick={() => document.getElementById("mfw-invite")?.focus()}>Invite</Button>}
      footer={<FootA left={`${state.members.length} members · shared book`} right={<span>Owner manages roles</span>} />}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <PanelA title="Members" right={<Badge tone="positive" dot>Sharing on</Badge>}>
          {state.members.map((m) => (
            <div key={m.id} className="wa-tr" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto", height: 52 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <Avatar name={m.name} size="sm" />
                <span>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 13 }}>
                    {m.name}{m.you ? " (you)" : ""}{m.pending ? <span style={{ fontWeight: 400, color: "var(--ink-3)" }}> · invited</span> : ""}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)" }}>{ROLE_DESC[m.role]}</span>
                </span>
              </span>
              <RolePill
                role={m.role}
                disabled={m.you}
                onSelect={m.you ? undefined : (r) => dispatch({ type: "SET_MEMBER_ROLE", id: m.id, role: r })}
              />
              {m.you
                ? <span style={{ width: 36 }} />
                : <IconButton label="Remove" size="sm" onClick={() => { dispatch({ type: "REMOVE_MEMBER", id: m.id }); showToast(`Removed ${m.name}`); }}><I.minus size={14} /></IconButton>}
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 14px 16px" }}>
            <div style={{ flex: 1 }}>
              <Input
                id="mfw-invite"
                placeholder="name@email.com"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
              />
            </div>
            <RolePill role={inviteRole} onSelect={setInviteRole} />
            <Button variant="secondary" size="sm" disabled={!invite.trim()} onClick={sendInvite}>Send invite</Button>
          </div>
        </PanelA>

        <PanelA
          title="Contacts · lending"
          right={
            <button
              style={{ fontSize: 12, fontWeight: 600, border: 0, background: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit" }}
              onClick={() => openAdd("debt")}
            >
              New contact
            </button>
          }
        >
          {lending.map((c) => (
            <div key={c.id} className="wa-tr" style={{ gridTemplateColumns: "minmax(0,1fr) auto", height: 56 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <Avatar name={c.name} size="sm" />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.note}</span>
                </span>
              </span>
              <span style={{ textAlign: "right" }}>
                <Amt v={c.balance} tone={c.balance > 0 ? "pos" : c.balance < 0 ? "neg" : ""} size={13} />
                <span style={{ display: "block", fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {c.balance > 0 ? "owes you" : c.balance < 0 ? "you owe" : "settled"}
                </span>
              </span>
            </div>
          ))}
          <button className="wa-ghostrow" style={{ borderBottom: "none" }} onClick={() => openAdd("debt")}>
            <I.handCoins size={14} />
            <span>Track money you lend or borrow — outside your budget.</span>
          </button>
        </PanelA>
      </div>
    </AppShell>
  );
}
