import { createContext, ReactNode, useContext, useState } from "react";
import { Trade } from "../types";

interface TradeModalContextValue {
  isOpen: boolean;
  editingTrade: Trade | null;
  openCreate: () => void;
  openEdit: (trade: Trade) => void;
  close: () => void;
}

const TradeModalContext = createContext<TradeModalContextValue | undefined>(undefined);

export function TradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  return (
    <TradeModalContext.Provider
      value={{
        isOpen,
        editingTrade,
        openCreate: () => {
          setEditingTrade(null);
          setIsOpen(true);
        },
        openEdit: (trade) => {
          setEditingTrade(trade);
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </TradeModalContext.Provider>
  );
}

export function useTradeModal() {
  const ctx = useContext(TradeModalContext);
  if (!ctx) throw new Error("useTradeModal must be used within TradeModalProvider");
  return ctx;
}
