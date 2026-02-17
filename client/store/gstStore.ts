import { create } from "zustand";

/**
 * Zustand store for GST module
 * Manages client data, filings, invoices, and reconciliation state
 */

export interface GSTClient {
  id: string;
  clientName: string;
  gstin: string;
  businessName: string;
  panNumber: string;
  filingFrequency: "monthly" | "quarterly" | "annual";
  status: "active" | "inactive" | "suspended";
  riskScore: number;
  complianceStatus: "good" | "warning" | "critical";
  lastFilingDate?: string;
  overdueFilingsCount: number;
}

export interface GSTFiling {
  id: string;
  clientId: string;
  month: string;
  financialYear: string;
  workflowStatus: "draft" | "prepared" | "validated" | "filed" | "amendment" | "locked" | "archived";
  currentStep: string;
  gstr1: {
    filed: boolean;
    filedDate?: string;
    arn?: string;
    dueDate?: string;
  };
  gstr3b: {
    filed: boolean;
    filedDate?: string;
    arn?: string;
    dueDate?: string;
  };
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GSTInvoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  invoiceType: "purchase" | "sales";
  invoiceDate: string;
  vendor?: string;
  customer?: string;
  taxableAmount: number;
  tax: number;
  totalAmount: number;
  reconciliationStatus: "unreconciled" | "matched" | "mismatch" | "excess";
}

interface GSTStore {
  // Clients
  clients: GSTClient[];
  selectedClientId: string | null;
  loading: boolean;
  error: string | null;

  // Filings
  filings: Record<string, GSTFiling[]>;
  selectedFilingId: string | null;
  filingSteps: Record<string, any[]>; // Filing workflow steps

  // Invoices
  invoices: GSTInvoice[];
  filteredInvoices: GSTInvoice[];
  invoiceFilter: {
    type?: "purchase" | "sales";
    month?: string;
    reconcilationStatus?: string;
  };

  // UI State
  view: "list" | "kanban" | "detail";
  selectedMonth: string;
  selectedFY: string;

  // Actions
  setClients: (clients: GSTClient[]) => void;
  setSelectedClientId: (id: string | null) => void;
  addClient: (client: GSTClient) => void;
  updateClient: (id: string, client: Partial<GSTClient>) => void;

  setFilings: (clientId: string, filings: GSTFiling[]) => void;
  setSelectedFilingId: (id: string | null) => void;
  addFiling: (filing: GSTFiling) => void;
  updateFiling: (id: string, filing: Partial<GSTFiling>) => void;
  setFilingSteps: (filingId: string, steps: any[]) => void;
  addFilingStep: (filingId: string, step: any) => void;

  setInvoices: (invoices: GSTInvoice[]) => void;
  addInvoice: (invoice: GSTInvoice) => void;
  updateInvoice: (id: string, invoice: Partial<GSTInvoice>) => void;
  setInvoiceFilter: (filter: Partial<GSTStore["invoiceFilter"]>) => void;

  setView: (view: "list" | "kanban" | "detail") => void;
  setSelectedMonth: (month: string) => void;
  setSelectedFY: (fy: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  clients: [],
  selectedClientId: null,
  loading: false,
  error: null,
  filings: {},
  selectedFilingId: null,
  filingSteps: {},
  invoices: [],
  filteredInvoices: [],
  invoiceFilter: {},
  view: "list" as const,
  selectedMonth: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
  selectedFY: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
};

export const useGSTStore = create<GSTStore>((set) => ({
  ...initialState,

  // Client actions
  setClients: (clients) => set({ clients }),
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (id, updates) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  // Filing actions
  setFilings: (clientId, filings) =>
    set((state) => ({
      filings: { ...state.filings, [clientId]: filings },
    })),
  setSelectedFilingId: (id) => set({ selectedFilingId: id }),
  addFiling: (filing) =>
    set((state) => ({
      filings: {
        ...state.filings,
        [filing.clientId]: [...(state.filings[filing.clientId] || []), filing],
      },
    })),
  updateFiling: (id, updates) =>
    set((state) => {
      const newFilings = { ...state.filings };
      for (const clientId in newFilings) {
        newFilings[clientId] = newFilings[clientId].map((f) =>
          f.id === id ? { ...f, ...updates } : f
        );
      }
      return { filings: newFilings };
    }),
  setFilingSteps: (filingId, steps) =>
    set((state) => ({
      filingSteps: { ...state.filingSteps, [filingId]: steps },
    })),
  addFilingStep: (filingId, step) =>
    set((state) => ({
      filingSteps: {
        ...state.filingSteps,
        [filingId]: [...(state.filingSteps[filingId] || []), step],
      },
    })),

  // Invoice actions
  setInvoices: (invoices) =>
    set((state) => ({
      invoices,
      filteredInvoices: filterInvoices(invoices, state.invoiceFilter),
    })),
  addInvoice: (invoice) =>
    set((state) => ({
      invoices: [...state.invoices, invoice],
      filteredInvoices: filterInvoices([...state.invoices, invoice], state.invoiceFilter),
    })),
  updateInvoice: (id, updates) =>
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  setInvoiceFilter: (filter) =>
    set((state) => {
      const newFilter = { ...state.invoiceFilter, ...filter };
      return {
        invoiceFilter: newFilter,
        filteredInvoices: filterInvoices(state.invoices, newFilter),
      };
    }),

  // UI actions
  setView: (view) => set({ view }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedFY: (fy) => set({ selectedFY: fy }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

/**
 * Helper function to filter invoices
 */
function filterInvoices(
  invoices: GSTInvoice[],
  filter: Record<string, any>
): GSTInvoice[] {
  return invoices.filter((invoice) => {
    if (filter.type && invoice.invoiceType !== filter.type) return false;
    if (filter.month && invoice.invoiceDate.slice(0, 7) !== filter.month) return false;
    if (
      filter.reconcilationStatus &&
      invoice.reconciliationStatus !== filter.reconcilationStatus
    )
      return false;
    return true;
  });
}

export default useGSTStore;
