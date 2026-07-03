import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { StoreProvider, SESSION_KEY } from "./state/store";
import { UiProvider } from "./shell/ui-context";
import { Login } from "./features/auth/Login";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Transactions } from "./features/transactions/Transactions";
import { Accounts } from "./features/accounts/Accounts";
import { Categories } from "./features/categories/Categories";
import { Reports } from "./features/reports/Reports";
import { Members } from "./features/members/Members";

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!localStorage.getItem(SESSION_KEY)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <UiProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
            <Route path="/accounts" element={<RequireAuth><Accounts /></RequireAuth>} />
            <Route path="/categories" element={<RequireAuth><Categories /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path="/members" element={<RequireAuth><Members /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UiProvider>
      </HashRouter>
    </StoreProvider>
  );
}
