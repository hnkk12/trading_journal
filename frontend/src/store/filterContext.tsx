import { createContext, ReactNode, useContext, useState } from "react";

interface FilterState {
  accountId: string; // "" = all
  month: string; // "" = all, else YYYY-MM
  week: string; // "" = all, else ISO date of week start
}

interface FilterContextValue extends FilterState {
  setAccountId: (v: string) => void;
  setMonth: (v: string) => void;
  setWeek: (v: string) => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");

  return (
    <FilterContext.Provider value={{ accountId, month, week, setAccountId, setMonth, setWeek }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
