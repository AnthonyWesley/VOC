import { createContext, useContext, useState, type ReactNode } from "react";

type TempAuth = {
  email: string;
  currentPassword: string;
};

const TempAuthContext = createContext<{
  tempAuth: TempAuth | null;
  setTempAuth: (auth: TempAuth | null) => void;
} | null>(null);

export function TempAuthProvider({ children }: { children: ReactNode }) {
  const [tempAuth, setTempAuth] = useState<TempAuth | null>(null);
  return (
    <TempAuthContext.Provider value={{ tempAuth, setTempAuth }}>
      {children}
    </TempAuthContext.Provider>
  );
}

export function useTempAuth() {
  const ctx = useContext(TempAuthContext);
  if (!ctx) throw new Error("useTempAuth must be used within TempAuthProvider");
  return ctx;
}
