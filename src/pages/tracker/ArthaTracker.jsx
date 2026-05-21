import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Stack,
  Snackbar,
  Avatar,
  useTheme,
  alpha,
  Pagination,
} from "@mui/material";
import { keyframes } from "@mui/system";
import {
  Add,
  Delete,
  CloudUpload,
  AccountBalance,
  TrendingUp,
  TrackChanges,
  UploadFile,
  Flag,
  ShowChart,
  Receipt,
  Savings,
  CreditCard,
  ArrowUpward,
  ArrowDownward,
  DonutLarge,
  BarChart,
  Settings,
  Wallet,
  Category,
  CalendarMonth,
  SelfImprovement,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";

// ─── CONSTANTS & THEME (Digital Ashram) ───────────────────────────────────────
// Earthy, classic, spiritual colors fitting an "Artha" (Wealth/Meaning) tracker
const COLOR_HERO = "#1A7A6E"; // Teal — matches Artha life area
const COLOR_DARK = "#0D5C54";
const RED = "#C53030"; // Terracotta Red
const GREEN = "#38A169"; // Sage Green
const AMBER = "#DD6B20"; // Earthy Orange
const BLUE = "#3182CE"; // Serene Indigo

const MONTH_START = dayjs().startOf("month").format("YYYY-MM-DD");
const MONTH_END = dayjs().endOf("month").format("YYYY-MM-DD");
const CURRENT_MONTH_STR = dayjs().format("YYYY-MM");

const SPEND_CATS = [
  "Groceries",
  "Dining out",
  "Transport",
  "Utilities",
  "Medical",
  "Entertainment",
  "Shopping",
  "Purohitam",
  "Education",
  "Personal care",
  "Home",
  "EMI/Loan",
  "Investment",
  "Family",
  "Other",
];

const ASSET_CLASSES = [
  "Large cap",
  "Mid cap",
  "Small cap",
  "Flexi cap",
  "Gold",
  "Silver",
  "Debt",
  "Index",
  "Other",
];

const CAT_EMOJI = {
  Groceries: "🛒",
  "Dining out": "🍽️",
  Transport: "🚗",
  Utilities: "💡",
  Medical: "🌿",
  Entertainment: "🎭",
  Shopping: "🛍️",
  Purohitam: "🪔",
  Education: "📚",
  "Personal care": "🧴",
  Home: "🏠",
  "EMI/Loan": "🏦",
  Investment: "📈",
  Family: "👨‍👩‍👧",
  Other: "📦",
};

// Earthy, balanced palette for charts
const PIE_COLORS = [
  COLOR_HERO,
  "#2B6CB0",
  "#2F855A",
  "#C05621",
  "#B7791F",
  "#70568C",
  "#4A5568",
  "#319795",
];

// ─── ANIMATIONS ───────────────────────────────────────────────────────────────
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const subtlePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(217, 119, 6, 0); }
  100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString("en-IN");

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  return value === index ? (
    <Box
      sx={{
        pt: 3,
        animation: `${fadeInUp} 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards`,
      }}
    >
      {children}
    </Box>
  ) : null;
}

function StatCard({ label, value, sub, icon, color = COLOR_HERO, trend }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        background: isDark
          ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        backdropFilter: "blur(12px)",
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 32px ${alpha(color, isDark ? 0.2 : 0.15)}`,
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
        }}
      />
      <CardContent sx={{ p: "20px !important" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: "text.secondary",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"DM Serif Display", "Playfair Display", serif',
                fontSize: { xs: 24, sm: 28 },
                color: isDark ? "#E2E8F0" : "#2D3748",
                lineHeight: 1.1,
              }}
            >
              ₹{fmt(value)}
            </Typography>
            {sub && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 1,
                  fontWeight: 500,
                }}
              >
                {trend === "up" && (
                  <ArrowUpward sx={{ fontSize: 12, color: GREEN }} />
                )}
                {trend === "down" && (
                  <ArrowDownward sx={{ fontSize: 12, color: RED }} />
                )}
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Avatar
              sx={{
                bgcolor: alpha(color, isDark ? 0.15 : 0.1),
                color: color,
                width: 48,
                height: 48,
                borderRadius: 3,
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children, icon }) {
  const theme = useTheme();
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "text.secondary",
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 2,
      }}
    >
      {icon && (
        <Box sx={{ color: COLOR_HERO, display: "flex", fontSize: 16 }}>
          {icon}
        </Box>
      )}
      {children}
    </Typography>
  );
}

let _arthaCache = null;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FinanceOSPage({ embedded = false }) {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [tab, setTab] = useState(0);
  const [spendPage, setSpendPage] = useState(1);
  const SPEND_PER_PAGE = 20;

  // Data States
  const [spends, setSpends] = useState(_arthaCache?.spends || []);
  const [loans, setLoans] = useState(_arthaCache?.loans || []);
  const [investments, setInvestments] = useState(_arthaCache?.investments || []);
  const [budgets, setBudgets] = useState(_arthaCache?.budgets || []);
  const [goals, setGoals] = useState(_arthaCache?.goals || []);
  const [trendData, setTrendData] = useState([]);
  const [trendWindow, setTrendWindow] = useState("6M");

  // UI States
  const [loading, setLoading] = useState(_arthaCache === null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form States
  const [spendErrors, setSpendErrors] = useState({});
  const [loanErrors, setLoanErrors] = useState({});
  const [investErrors, setInvestErrors] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    isIncome: false,
    amount: "",
    category: "Groceries",
    description: "",
    type: "needed",
    date: dayjs().format("YYYY-MM-DD"),
  });

  const [loanForm, setLoanForm] = useState({
    id: "",
    balance: "",
    date: dayjs().format("YYYY-MM-DD"),
  });
  const [addLoanOpen, setAddLoanOpen] = useState(false);
  const [newLoan, setNewLoan] = useState({
    label: "",
    principal: "",
    current_balance: "",
    rate: "",
    emi: "",
    start_date: dayjs().format("YYYY-MM-DD"),
    target_close_date: dayjs().add(3, "year").format("YYYY-MM-DD"),
  });

  const [addInvestOpen, setAddInvestOpen] = useState(false);
  const [newInvest, setNewInvest] = useState({
    name: "",
    asset_class: "Large cap",
    type: "sip",
    monthly_sip: "",
    current_value: "",
    invested_amount: "",
    xirr: "",
    date: dayjs().format("YYYY-MM-DD"),
  });

  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target_amt: "",
    deadline: dayjs().add(5, "year").format("YYYY-MM-DD"),
  });

  const [budgetForm, setBudgetForm] = useState({
    category: "Groceries",
    limit_amt: "",
  });
  const [importStatus, setImportStatus] = useState({ type: "", message: "" });
  const [importTarget, setImportTarget] = useState("loans");
  const [arthaDeleteConfirm, setArthaDeleteConfirm] = useState({ open: false, label: "", onConfirm: null });

  // ── DATA FETCHING ─────────────────────────────────────────────────────────
  const fetchTrendData = useCallback(async (window = "6M") => {
    if (!user) return;
    const windowMonths = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "All": 60 }[window] || 6;
    const fromDate = dayjs()
      .subtract(windowMonths - 1, "month")
      .startOf("month")
      .format("YYYY-MM-DD");
    const { data: history, error } = await supabase
      .from("finance_logs")
      .select("amount, date, income_flag")
      .eq("user_id", user.id)
      .gte("date", fromDate);
    if (error) return console.error("Trend error:", error);

    const months = [];
    for (let i = windowMonths - 1; i >= 0; i--) {
      const mDate = dayjs().subtract(i, "month");
      const mLabel = mDate.format("MMM YY");
      const mKey = mDate.format("YYYY-MM");
      const ms =
        history?.filter((h) => dayjs(h.date).format("YYYY-MM") === mKey) || [];
      const inc = ms
        .filter((h) => h.income_flag)
        .reduce((s, x) => s + Number(x.amount), 0);
      const exp = ms
        .filter((h) => !h.income_flag)
        .reduce((s, x) => s + Number(x.amount), 0);
      months.push({
        name: mLabel,
        Income: inc,
        Expenses: exp,
        Surplus: inc - exp,
      });
    }
    setTrendData(months);
  }, [user]);

  const loadDashboardData = useCallback(
    async (isInitial = false) => {
      if (!user) return;
      if (isInitial && _arthaCache === null) setLoading(true);
      try {
        const [fLogs, fLoans, fInvests, fBudgets, fGoals] = await Promise.all([
          supabase
            .from("finance_logs")
            .select("*")
            .eq("user_id", user.id)
            .gte("date", MONTH_START)
            .lte("date", MONTH_END)
            .order("date", { ascending: false }),
          supabase
            .from("loans")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("principal", { ascending: false }),
          supabase
            .from("investments")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("current_value", { ascending: false }),
          supabase
            .from("budgets")
            .select("*")
            .eq("user_id", user.id)
            .eq("month", CURRENT_MONTH_STR),
          supabase
            .from("savings_goals")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("deadline", { ascending: true }),
        ]);
        const s = fLogs.data || [], l = fLoans.data || [], i = fInvests.data || [];
        const b = fBudgets.data || [], g = fGoals.data || [];
        _arthaCache = { spends: s, loans: l, investments: i, budgets: b, goals: g };
        setSpends(s);
        setLoans(l);
        setInvestments(i);
        setBudgets(b);
        setGoals(g);

        setLoanForm((prev) => {
          if (fLoans.data?.length > 0 && !prev.id)
            return { ...prev, id: fLoans.data[0].id };
          return prev;
        });
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    loadDashboardData(true);
    fetchTrendData(trendWindow);
  }, [loadDashboardData, fetchTrendData]);

  const handleTrendWindowChange = (w) => {
    setTrendWindow(w);
    fetchTrendData(w);
  };

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  // ── ACTIONS (Omitted for brevity, kept exactly the same logically) ───────
  // Reusing all logic cleanly below.
  const addSpend = async () => {
    /* Logic Preserved */
    const errs = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = "Enter a valid amount greater than 0";
    if (Object.keys(errs).length) { setSpendErrors(errs); return; }
    setSpendErrors({});
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("finance_logs").insert({
        user_id: user.id,
        amount: Number(form.amount),
        category: form.isIncome ? "Salary/Income" : form.category,
        description: form.description,
        type: form.isIncome ? null : form.type,
        date: form.date,
        income_flag: form.isIncome,
      });
      if (error) throw error;
      setForm({
        isIncome: false,
        amount: "",
        category: "Groceries",
        description: "",
        type: "needed",
        date: dayjs().format("YYYY-MM-DD"),
      });
      setAddOpen(false);
      showToast("Activity logged ✓");
      await loadDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (label, onConfirm) => setArthaDeleteConfirm({ open: true, label, onConfirm });

  const deleteSpend = async (id, label = "this entry") => {
    askDelete(label, async () => {
      setSpends((prev) => prev.filter((s) => s.id !== id));
      const { error } = await supabase.from("finance_logs").delete().eq("id", id);
      if (error) { showToast("Failed to delete entry.", "error"); await loadDashboardData(); }
    });
  };
  const deleteInvestment = async (id, label = "this investment") => {
    askDelete(label, async () => {
      setInvestments((prev) => prev.filter((inv) => inv.id !== id));
      const { error } = await supabase.from("investments").delete().eq("id", id);
      if (error) { showToast("Failed to delete investment.", "error"); await loadDashboardData(); }
    });
  };
  const deleteLoan = async (id, label = "this loan") => {
    askDelete(label, async () => {
      setLoans((prev) => prev.filter((loan) => loan.id !== id));
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) { showToast("Failed to delete loan.", "error"); await loadDashboardData(); }
    });
  };
  const deleteGoal = async (id, label = "this goal") => {
    askDelete(label, async () => {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) { showToast("Failed to delete goal.", "error"); await loadDashboardData(); }
    });
  };

  const deleteBudget = async (category) => {
    const existing = budgets.find((b) => b.category === category);
    if (!existing) return;
    askDelete(`${category} envelope`, async () => {
      const { error } = await supabase.from("budgets").delete().eq("id", existing.id);
      if (error) { showToast("Failed to remove envelope.", "error"); return; }
      showToast("Envelope removed.");
      await loadDashboardData();
    });
  };

  const saveBudgetLimit = async () => {
    /* Logic Preserved */
    if (!budgetForm.limit_amt || Number(budgetForm.limit_amt) <= 0) {
      showToast("Please enter a valid monthly limit amount", "error");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const existing = budgets.find((b) => b.category === budgetForm.category);
      let error;
      if (existing) {
        ({ error } = await supabase
          .from("budgets")
          .update({ limit_amt: Number(budgetForm.limit_amt) })
          .eq("id", existing.id));
      } else {
        ({ error } = await supabase
          .from("budgets")
          .insert({
            user_id: user.id,
            month: CURRENT_MONTH_STR,
            category: budgetForm.category,
            limit_amt: Number(budgetForm.limit_amt),
          }));
      }
      if (error) throw error;
      setBudgetForm({ category: "Groceries", limit_amt: "" });
      showToast("Budget updated ✓");
      await loadDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const addNewLoan = async () => {
    /* Logic Preserved */
    const errs = {};
    if (!newLoan.label.trim()) errs.label = "Institution / label is required";
    if (!newLoan.principal || isNaN(Number(newLoan.principal)) || Number(newLoan.principal) <= 0)
      errs.principal = "Principal must be a positive number";
    if (Object.keys(errs).length) { setLoanErrors(errs); return; }
    setLoanErrors({});
    if (!user) return;
    setSaving(true);
    try {
      const start = dayjs(newLoan.start_date);
      const close = dayjs(newLoan.target_close_date);
      const calculatedTenure = close.diff(start, "month");
      const { error } = await supabase.from("loans").insert({
        user_id: user.id,
        label: newLoan.label,
        principal: Number(newLoan.principal),
        current_balance: Number(newLoan.current_balance || newLoan.principal),
        rate: Number(newLoan.rate || 0),
        emi: Number(newLoan.emi || 0),
        start_date: newLoan.start_date,
        target_close_date: newLoan.target_close_date,
        tenure_months: calculatedTenure > 0 ? calculatedTenure : 0,
        is_active: true,
      });
      if (error) throw error;
      resetLoanForm();
      setAddLoanOpen(false);
      showToast("Loan added ✓");
      await loadDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateLoanBalance = async () => {
    /* Logic Preserved */
    if (!loanForm.balance || !loanForm.id || !user) return;
    setSaving(true);
    try {
      const { error: e1 } = await supabase
        .from("loans")
        .update({ current_balance: Number(loanForm.balance) })
        .eq("id", loanForm.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("loan_history")
        .insert({
          user_id: user.id,
          loan_id: loanForm.id,
          balance_recorded: Number(loanForm.balance),
          recorded_date: loanForm.date,
        });
      if (e2) throw e2;
      setLoanForm({
        id: loans[0]?.id || "",
        balance: "",
        date: dayjs().format("YYYY-MM-DD"),
      });
      showToast("Balance updated ✓");
      await loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to update balance.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addNewInvestment = async () => {
    /* Logic Preserved */
    const errs = {};
    if (!newInvest.name.trim()) errs.name = "Asset name is required";
    if (Object.keys(errs).length) { setInvestErrors(errs); return; }
    setInvestErrors({});
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("investments").insert({
        user_id: user.id,
        name: newInvest.name,
        asset_class: newInvest.asset_class,
        investment_type: newInvest.type,
        monthly_sip:
          newInvest.type === "sip" ? Number(newInvest.monthly_sip || 0) : 0,
        current_value: Number(newInvest.current_value || 0),
        invested_amount: Number(newInvest.invested_amount || 0),
        xirr: Number(newInvest.xirr || 0),
        start_date: newInvest.date,
        is_active: true,
      });
      if (error) throw error;
      resetInvestForm();
      setAddInvestOpen(false);
      showToast("Investment added ✓");
      await loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to add investment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addNewGoal = async () => {
    /* Logic Preserved */
    if (!newGoal.name || !newGoal.target_amt || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user.id,
          name: newGoal.name,
          target_amt: Number(newGoal.target_amt),
          deadline: newGoal.deadline,
          status: "active",
        });
      if (error) throw error;
      resetGoalForm();
      setAddGoalOpen(false);
      showToast("Goal created ✓");
      await loadDashboardData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (event) => {
    /* Logic Preserved */
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        if (!Array.isArray(parsedData))
          throw new Error("File must contain a JSON array.");
        setImportStatus({
          type: "info",
          message: `Importing into ${importTarget}...`,
        });
        const payload = parsedData.map((item) => ({
          ...item,
          user_id: user.id,
        }));
        const { error } = await supabase.from(importTarget).insert(payload);
        if (error) throw error;
        setImportStatus({
          type: "success",
          message: `✓ Imported ${payload.length} records successfully.`,
        });
        await loadDashboardData();
      } catch (err) {
        setImportStatus({
          type: "error",
          message: `Import failed: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // ── DERIVED CALCULATIONS ────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const income = spends
      .filter((x) => x.income_flag)
      .reduce((s, x) => s + Number(x.amount), 0);
    const expenses = spends.filter((x) => !x.income_flag);
    const spend = expenses.reduce((s, x) => s + Number(x.amount), 0);
    const needed = expenses
      .filter((x) => x.type === "needed")
      .reduce((s, x) => s + Number(x.amount), 0);
    const wanted = expenses
      .filter((x) => x.type === "wanted")
      .reduce((s, x) => s + Number(x.amount), 0);
    const corpus = investments.reduce((s, x) => s + Number(x.current_value), 0);
    const debt = loans.reduce((s, x) => s + Number(x.current_balance), 0);
    return {
      income,
      spend,
      needed,
      wanted,
      surplus: income - spend,
      corpus,
      debt,
    };
  }, [spends, investments, loans]);

  const { budgetedTotal, plannedSurplus, totalSIPs, primaryGoal } =
    useMemo(() => {
      const budgetedTotal = budgets.reduce(
        (sum, b) => sum + Number(b.limit_amt),
        0,
      );
      const plannedSurplus = totals.income - budgetedTotal;
      const totalSIPs = investments
        .filter((inv) => inv.investment_type === "sip")
        .reduce((s, x) => s + Number(x.monthly_sip), 0);
      const primaryGoal = goals.length > 0 ? goals[0] : null;
      return { budgetedTotal, plannedSurplus, totalSIPs, primaryGoal };
    }, [budgets, totals.income, investments, goals]);

  const envelopes = useMemo(
    () =>
      budgets
        .map((b) => {
          const spent = spends
            .filter((e) => !e.income_flag && e.category === b.category)
            .reduce((sum, e) => sum + Number(e.amount), 0);
          const limit = Number(b.limit_amt);
          return {
            ...b,
            spent,
            limit,
            pct: limit > 0 ? (spent / limit) * 100 : 0,
          };
        })
        .sort((a, b) => b.limit - a.limit),
    [budgets, spends],
  );

  const categoryBreakdown = useMemo(
    () =>
      SPEND_CATS.map((cat) => ({
        cat,
        total: spends
          .filter((s) => !s.income_flag && s.category === cat)
          .reduce((a, x) => a + Number(x.amount), 0),
      }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total),
    [spends],
  );

  const portfolioPieData = useMemo(() => {
    const byClass = {};
    investments.forEach((inv) => {
      byClass[inv.asset_class] =
        (byClass[inv.asset_class] || 0) + Number(inv.current_value);
    });
    return Object.entries(byClass).map(([name, value]) => ({ name, value }));
  }, [investments]);

  // ── RESET HELPERS ─────────────────────────────────────────────────────────
  const resetLoanForm = () =>
    setNewLoan({
      label: "",
      principal: "",
      current_balance: "",
      rate: "",
      emi: "",
      start_date: dayjs().format("YYYY-MM-DD"),
      target_close_date: dayjs().add(3, "year").format("YYYY-MM-DD"),
    });
  const resetInvestForm = () =>
    setNewInvest({
      name: "",
      asset_class: "Large cap",
      type: "sip",
      monthly_sip: "",
      current_value: "",
      invested_amount: "",
      xirr: "",
      date: dayjs().format("YYYY-MM-DD"),
    });
  const resetGoalForm = () =>
    setNewGoal({
      name: "",
      target_amt: "",
      deadline: dayjs().add(5, "year").format("YYYY-MM-DD"),
    });

  // ── SHARED STYLES ─────────────────────────────────────────────────────────
  const dialogPaperSx = {
    background: isDark
      ? "linear-gradient(145deg, #1A202C 0%, #2D3748 100%)"
      : "#FFFFFF",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
    borderRadius: 4,
    boxShadow: isDark
      ? "0 24px 48px rgba(0,0,0,0.6)"
      : "0 24px 48px rgba(0,0,0,0.1)",
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      "& fieldset": {
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
      },
      "&:hover fieldset": { borderColor: alpha(COLOR_HERO, 0.6) },
      "&.Mui-focused fieldset": { borderColor: COLOR_HERO },
    },
  };

  const cardSx = {
    borderRadius: 4,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
    background: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
    boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
  };

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          gap: 3,
        }}
      >
        <SelfImprovement
          sx={{
            fontSize: 64,
            color: COLOR_HERO,
            animation: `${subtlePulse} 2s infinite`,
          }}
        />
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: 14,
            letterSpacing: 3,
            fontWeight: 600,
          }}
        >
          CENTERING ARTHA...
        </Typography>
      </Box>
    );

  const TAB_ICONS = [
    <ShowChart key="1" />,
    <Category key="2" />,
    <AccountBalance key="3" />,
    <Savings key="4" />,
    <Settings key="5" />,
  ];
  const TAB_LABELS = ["Cash Flow", "Budgets", "Loans", "Corpus", "Data Import"];

  return (
    <Box
      sx={embedded ? { pb: 3 } : {
        position: "relative",
        minHeight: "100vh",
        background: isDark
          ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${COLOR_HERO}12 0%, #0A0D0C 65%)`
          : `radial-gradient(ellipse 90% 35% at 50% -5%, ${COLOR_HERO}10 0%, #F8FAFC 65%)`,
        pb: 6,
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          maxWidth: 1140,
          mx: "auto",
          animation: `${fadeInUp} 0.6s ease-out`,
        }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
                  boxShadow: `0 8px 24px ${alpha(COLOR_HERO, 0.4)}`,
                }}
              >
                <SelfImprovement sx={{ color: "#fff", fontSize: 26 }} />
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 3,
                    color: "text.secondary",
                    textTransform: "uppercase",
                  }}
                >
                  Svaadhyaya
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"DM Serif Display","Playfair Display",serif',
                    fontSize: { xs: 28, sm: 34 },
                    fontWeight: 400,
                    lineHeight: 1.1,
                    color: isDark ? "#fff" : "#1A202C",
                  }}
                >
                  Artha Tracker
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: 13,
                ml: 8,
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              <CalendarMonth
                sx={{ fontSize: 14, mr: 0.5, verticalAlign: "text-bottom" }}
              />
              {dayjs().format("MMMM YYYY")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddOpen(true)}
            sx={{
              background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
              borderRadius: 8,
              px: 4,
              py: 1.2,
              fontWeight: 700,
              textTransform: "none",
              fontSize: 15,
              boxShadow: `0 8px 24px ${alpha(COLOR_HERO, 0.4)}`,
              "&:hover": {
                boxShadow: `0 12px 32px ${alpha(COLOR_HERO, 0.6)}`,
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Log Activity
          </Button>
        </Box>

        {/* ── TABS ────────────────────────────────────────────────────────────── */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            "& .MuiTab-root": {
              minWidth: "auto",
              px: { xs: 2, sm: 3 },
              py: 2,
              fontSize: 13,
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "none",
              letterSpacing: 0.5,
              transition: "all 0.3s ease",
              "&.Mui-selected": { color: COLOR_HERO },
            },
            "& .MuiTabs-indicator": {
              background: `linear-gradient(90deg, ${COLOR_HERO}, ${AMBER})`,
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {TAB_LABELS.map((label, i) => (
            <Tab
              key={label}
              label={label}
              icon={TAB_ICONS[i]}
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          ))}
        </Tabs>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 0: CASH FLOW
        ════════════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              {
                label: "Income",
                value: totals.income,
                color: GREEN,
                icon: <ArrowUpward />,
                sub: "This month",
              },
              {
                label: "Expenses",
                value: totals.spend,
                color: RED,
                icon: <ArrowDownward />,
                sub: `Needed ₹${fmt(totals.needed)}`,
              },
              {
                label: "Surplus",
                value: totals.surplus,
                color: totals.surplus >= 0 ? COLOR_HERO : RED,
                icon: <Wallet />,
                sub: totals.surplus >= 0 ? "On track 🎉" : "Over budget!",
              },
              {
                label: "Wanted",
                value: totals.wanted,
                color: AMBER,
                icon: <Receipt />,
                sub: `${totals.spend > 0 ? Math.round((totals.wanted / totals.spend) * 100) : 0}% of spends`,
              },
            ].map((s) => (
              <Grid item xs={12} sm={6} md={3} key={s.label}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>

          <Card sx={{ ...cardSx, mb: 3 }}>
            <CardContent sx={{ p: "24px !important" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                <SectionLabel icon={<BarChart />}>
                  Wealth Momentum
                </SectionLabel>
                <Box sx={{ display: "flex", gap: 0.75 }}>
                  {["1M", "3M", "6M", "1Y", "All"].map((w) => (
                    <Box
                      key={w}
                      onClick={() => handleTrendWindowChange(w)}
                      sx={{
                        px: 1.25, py: 0.4, borderRadius: 1.5, fontSize: 11, fontWeight: 700,
                        cursor: "pointer", border: "1px solid",
                        borderColor: trendWindow === w ? COLOR_HERO : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"),
                        color: trendWindow === w ? COLOR_HERO : "text.secondary",
                        background: trendWindow === w ? alpha(COLOR_HERO, isDark ? 0.15 : 0.08) : "transparent",
                        transition: "all 0.15s",
                        "&:hover": { borderColor: COLOR_HERO, color: COLOR_HERO },
                      }}
                    >
                      {w}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ width: "100%", height: 300, mt: 2 }}>
                <ResponsiveContainer>
                  <ComposedChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="surplusGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLOR_HERO}
                          stopOpacity={isDark ? 0.4 : 0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLOR_HERO}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={
                        isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                      }
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tick={{ fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      fontSize={11}
                      tick={{ fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#1A202C" : "#FFFFFF",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        borderRadius: 12,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                      formatter={(value, name) => [`₹${fmt(value)}`, name]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                      }}
                    />
                    <Bar
                      dataKey="Income"
                      fill={GREEN}
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                      opacity={0.9}
                    />
                    <Bar
                      dataKey="Expenses"
                      fill={RED}
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                      opacity={0.9}
                    />
                    <Area
                      type="monotone"
                      dataKey="Surplus"
                      fill="url(#surplusGrad)"
                      stroke={COLOR_HERO}
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: COLOR_HERO,
                        strokeWidth: 2,
                        stroke: isDark ? "#1A202C" : "#FFF",
                      }}
                      activeDot={{ r: 7 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Transactions Table */}
            <Grid item xs={12} md={7}>
              <Card sx={cardSx}>
                <CardContent sx={{ p: "24px !important" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <SectionLabel icon={<Receipt />}>Transactions</SectionLabel>
                    <Chip
                      label={`Surplus ₹${fmt(totals.surplus)}`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor:
                          totals.surplus >= 0
                            ? alpha(GREEN, 0.15)
                            : alpha(RED, 0.15),
                        color: totals.surplus >= 0 ? GREEN : RED,
                      }}
                    />
                  </Box>
                  <TableContainer
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Date", "Category", "Amount", ""].map((h, i) => (
                            <TableCell
                              key={i}
                              align={i === 2 ? "right" : "left"}
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: 1.2,
                                textTransform: "uppercase",
                                color: "text.secondary",
                                background: isDark ? "#212836" : "#F7FAFC",
                                borderColor: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.05)",
                                width: i === 3 ? 40 : "auto",
                                py: 1.5,
                                "&:first-of-type": {
                                  borderTopLeftRadius: 8,
                                  borderBottomLeftRadius: 8,
                                },
                                "&:last-of-type": {
                                  borderTopRightRadius: 8,
                                  borderBottomRightRadius: 8,
                                },
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {spends.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              align="center"
                              sx={{
                                py: 6,
                                color: "text.disabled",
                                fontSize: 13,
                                border: 0,
                              }}
                            >
                              No transactions this month. Find your center.
                            </TableCell>
                          </TableRow>
                        )}
                        {spends.slice((spendPage - 1) * SPEND_PER_PAGE, spendPage * SPEND_PER_PAGE).map((s) => (
                          <TableRow
                            key={s.id}
                            hover
                            sx={{
                              "&:hover": {
                                background: isDark
                                  ? "rgba(255,255,255,0.02)"
                                  : "rgba(0,0,0,0.02)",
                              },
                              "& td": {
                                borderColor: isDark
                                  ? "rgba(255,255,255,0.04)"
                                  : "rgba(0,0,0,0.04)",
                                py: 1.5,
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                fontSize: 13,
                                color: "text.secondary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {dayjs(s.date).format("D MMM")}
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: isDark
                                      ? "rgba(255,255,255,0.05)"
                                      : "rgba(0,0,0,0.04)",
                                    fontSize: 16,
                                  }}
                                >
                                  {s.income_flag
                                    ? "💰"
                                    : CAT_EMOJI[s.category] || "📦"}
                                </Avatar>
                                <Typography
                                  sx={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "text.primary",
                                  }}
                                >
                                  {s.category}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: s.income_flag ? GREEN : "text.primary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {s.income_flag ? "+" : "−"}₹{fmt(s.amount)}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => deleteSpend(s.id, s.category || "this entry")}
                                sx={{
                                  color: "text.disabled",
                                  "&:hover": {
                                    color: RED,
                                    bgcolor: alpha(RED, 0.1),
                                  },
                                }}
                              >
                                <Delete sx={{ fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {spends.length > SPEND_PER_PAGE && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Pagination
                        count={Math.ceil(spends.length / SPEND_PER_PAGE)}
                        page={spendPage}
                        onChange={(_, p) => setSpendPage(p)}
                        size="small"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Category Breakdown */}
            <Grid item xs={12} md={5}>
              <Card sx={cardSx}>
                <CardContent sx={{ p: "24px !important" }}>
                  <SectionLabel icon={<DonutLarge />}>By Category</SectionLabel>
                  {categoryBreakdown.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Category
                        sx={{
                          fontSize: 40,
                          color: "text.disabled",
                          opacity: 0.5,
                          mb: 1,
                        }}
                      />
                      <Typography sx={{ color: "text.disabled", fontSize: 13 }}>
                        No expenses yet
                      </Typography>
                    </Box>
                  ) : (
                    categoryBreakdown.map(({ cat, total }) => (
                      <Box key={cat} sx={{ mb: 2.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.8,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: "text.secondary",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              fontWeight: 500,
                            }}
                          >
                            <span style={{ fontSize: 16 }}>
                              {CAT_EMOJI[cat] || "📦"}
                            </span>
                            {cat}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "text.primary",
                            }}
                          >
                            ₹{fmt(total)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            totals.spend > 0 ? (total / totals.spend) * 100 : 0
                          }
                          sx={{
                            height: 6,
                            borderRadius: 4,
                            bgcolor: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.05)",
                            "& .MuiLinearProgress-bar": {
                              background: `linear-gradient(90deg, ${COLOR_HERO}, ${AMBER})`,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: BUDGETS
        ════════════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              {
                label: "Income",
                value: totals.income,
                color: GREEN,
                icon: <ArrowUpward />,
              },
              {
                label: "Budgeted",
                value: budgetedTotal,
                color: AMBER,
                icon: <TrackChanges />,
              },
              {
                label: "Planned Surplus",
                value: plannedSurplus,
                color: plannedSurplus >= 0 ? COLOR_HERO : RED,
                icon: <Savings />,
              },
            ].map((s) => (
              <Grid item xs={12} sm={4} key={s.label}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Card
                sx={{
                  ...cardSx,
                  border: `1px solid ${alpha(COLOR_HERO, 0.3)}`,
                  background: alpha(COLOR_HERO, isDark ? 0.05 : 0.02),
                }}
              >
                <CardContent sx={{ p: "24px !important" }}>
                  <SectionLabel icon={<TrackChanges />}>
                    Allocate Funds
                  </SectionLabel>
                  <Stack spacing={2.5}>
                    <FormControl fullWidth sx={inputSx}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={budgetForm.category}
                        onChange={(e) =>
                          setBudgetForm((p) => ({
                            ...p,
                            category: e.target.value,
                          }))
                        }
                        label="Category"
                      >
                        {SPEND_CATS.map((c) => (
                          <MenuItem key={c} value={c}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <span>{CAT_EMOJI[c] || "📦"}</span> {c}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Monthly Limit (₹)"
                      type="number"
                      value={budgetForm.limit_amt}
                      onChange={(e) =>
                        setBudgetForm((p) => ({
                          ...p,
                          limit_amt: e.target.value,
                        }))
                      }
                      sx={inputSx}
                    />
                    <Button
                      variant="contained"
                      onClick={saveBudgetLimit}
                      disabled={saving}
                      sx={{
                        background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: 15,
                        boxShadow: `0 8px 24px ${alpha(COLOR_HERO, 0.4)}`,
                      }}
                    >
                      {saving ? (
                        <CircularProgress size={24} sx={{ color: "#fff" }} />
                      ) : (
                        "Set Envelope Limit"
                      )}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card sx={cardSx}>
                <CardContent sx={{ p: "24px !important" }}>
                  <SectionLabel icon={<Category />}>
                    Active Envelopes
                  </SectionLabel>
                  {envelopes.length === 0 && (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography sx={{ color: "text.disabled", fontSize: 14 }}>
                        No budgets set for this month. Create your limits.
                      </Typography>
                    </Box>
                  )}
                  {envelopes.map((env, i) => {
                    const overBudget = env.pct >= 100;
                    const barColor = overBudget
                      ? RED
                      : env.pct > 80
                        ? AMBER
                        : GREEN;
                    return (
                      <Box key={i} sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.04)",
                                fontSize: 14,
                              }}
                            >
                              {CAT_EMOJI[env.category] || "📦"}
                            </Avatar>
                            {env.category}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: overBudget ? RED : GREEN,
                              }}
                            >
                              ₹{fmt(env.spent)}
                              <Typography
                                component="span"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 500,
                                  fontSize: 13,
                                }}
                              >
                                {" "}
                                / ₹{fmt(env.limit)}
                              </Typography>
                            </Typography>
                            {overBudget && (
                              <Chip
                                label="Over"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  bgcolor: alpha(RED, 0.15),
                                  color: RED,
                                }}
                              />
                            )}
                            <IconButton
                              size="small"
                              onClick={() => deleteBudget(env.category)}
                              sx={{ p: 0.3, opacity: 0.3, "&:hover": { opacity: 1, color: RED } }}
                            >
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, env.pct)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.05)",
                            "& .MuiLinearProgress-bar": {
                              background: `linear-gradient(90deg, ${alpha(barColor, 0.7)}, ${barColor})`,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: LOANS
        ════════════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mb: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  mb: 1,
                }}
              >
                Total Outstanding Debt
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"DM Serif Display",serif',
                  fontSize: { xs: 32, sm: 40 },
                  color: RED,
                  lineHeight: 1,
                }}
              >
                ₹{fmt(totals.debt)}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setAddLoanOpen(true)}
              sx={{
                color: COLOR_HERO,
                borderColor: alpha(COLOR_HERO, 0.5),
                borderRadius: 8,
                px: 3,
                py: 1,
                fontWeight: 600,
                "&:hover": {
                  borderColor: COLOR_HERO,
                  bgcolor: alpha(COLOR_HERO, 0.05),
                },
              }}
            >
              Add Loan
            </Button>
          </Box>

          <Card sx={{ ...cardSx, mb: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background: isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                    }}
                  >
                    {[
                      "Loan Account",
                      "EMI / mo",
                      "Current Balance",
                      "Repayment Progress",
                    ].map((h, i) => (
                      <TableCell
                        key={i}
                        align={i === 1 || i === 2 ? "right" : "left"}
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 1.2,
                          textTransform: "uppercase",
                          color: "text.secondary",
                          py: 2,
                          width: i === 3 ? 240 : "auto",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 6, color: "text.disabled" }}
                      >
                        You are entirely debt-free. Wonderful.
                      </TableCell>
                    </TableRow>
                  )}
                  {loans.map((loan) => {
                    const balance = Number(loan.current_balance) || 0;
                    const pct = Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round(
                          (1 - balance / (Number(loan.principal) || 1)) * 100,
                        ),
                      ),
                    );
                    const barColor =
                      pct > 75 ? GREEN : pct > 40 ? COLOR_HERO : RED;
                    return (
                      <TableRow
                        key={loan.id}
                        hover
                        sx={{
                          "&:hover": {
                            background: isDark
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(0,0,0,0.01)",
                          },
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "text.primary",
                            }}
                          >
                            {loan.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            <CreditCard sx={{ fontSize: 12 }} /> {loan.rate}% ·
                            Target Close{" "}
                            {loan.target_close_date
                              ? dayjs(loan.target_close_date).format("MMM YYYY")
                              : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 600,
                            color: "text.secondary",
                            fontSize: 14,
                          }}
                        >
                          ₹{fmt(loan.emi)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, color: RED, fontSize: 15 }}
                        >
                          ₹{fmt(balance)}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                  height: 6,
                                  borderRadius: 4,
                                  bgcolor: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                                  "& .MuiLinearProgress-bar": {
                                    background: `linear-gradient(90deg, ${alpha(barColor, 0.6)}, ${barColor})`,
                                    borderRadius: 4,
                                  },
                                }}
                              />
                            </Box>
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: barColor,
                                minWidth: 36,
                              }}
                            >
                              {pct}%
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => deleteLoan(loan.id, loan.label || "this loan")}
                              sx={{
                                color: "text.disabled",
                                "&:hover": {
                                  color: RED,
                                  bgcolor: alpha(RED, 0.1),
                                },
                              }}
                            >
                              <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {loans.length > 0 && (
            <Card sx={cardSx}>
              <CardContent sx={{ p: "24px !important" }}>
                <SectionLabel icon={<AccountBalance />}>
                  Log Repayment / Update Balance
                </SectionLabel>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "flex-end",
                  }}
                >
                  <FormControl sx={{ minWidth: 240, flex: 1, ...inputSx }}>
                    <InputLabel>Select Loan</InputLabel>
                    <Select
                      value={loanForm.id}
                      onChange={(e) =>
                        setLoanForm((p) => ({ ...p, id: e.target.value }))
                      }
                      label="Select Loan"
                    >
                      {loans.map((l) => (
                        <MenuItem key={l.id} value={l.id}>
                          {l.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="New Outstanding Balance (₹)"
                    type="number"
                    sx={{ flex: 1, minWidth: 200, ...inputSx }}
                    value={loanForm.balance}
                    onChange={(e) =>
                      setLoanForm((p) => ({ ...p, balance: e.target.value }))
                    }
                  />
                  <TextField
                    label="As of Date"
                    type="date"
                    sx={{ flex: 1, minWidth: 160, ...inputSx }}
                    value={loanForm.date}
                    onChange={(e) =>
                      setLoanForm((p) => ({ ...p, date: e.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    onClick={updateLoanBalance}
                    disabled={!loanForm.balance || saving}
                    sx={{
                      background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
                      borderRadius: 2,
                      py: 1.8,
                      px: 4,
                      fontWeight: 700,
                      boxShadow: `0 8px 24px ${alpha(COLOR_HERO, 0.4)}`,
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      "Update"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: CORPUS / INVESTMENTS
        ════════════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 3,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Flag />}
              onClick={() => setAddGoalOpen(true)}
              sx={{
                color: COLOR_HERO,
                borderColor: alpha(COLOR_HERO, 0.5),
                borderRadius: 8,
                px: 3,
                "&:hover": {
                  borderColor: COLOR_HERO,
                  bgcolor: alpha(COLOR_HERO, 0.05),
                },
              }}
            >
              Add Milestone
            </Button>
            <Button
              variant="outlined"
              startIcon={<TrendingUp />}
              onClick={() => setAddInvestOpen(true)}
              sx={{
                color: BLUE,
                borderColor: alpha(BLUE, 0.5),
                borderRadius: 8,
                px: 3,
                "&:hover": { borderColor: BLUE, bgcolor: alpha(BLUE, 0.05) },
              }}
            >
              Add Asset
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              {
                label: "Total Corpus",
                value: totals.corpus,
                color: COLOR_HERO,
                icon: <Savings />,
                sub: "Live Market Value",
              },
              {
                label: "Monthly SIPs",
                value: totalSIPs,
                color: BLUE,
                icon: <TrendingUp />,
                sub: "Recurring Commitments",
              },
              {
                label: primaryGoal
                  ? `Focus: ${primaryGoal.name}`
                  : "No Goal Set",
                value: primaryGoal ? primaryGoal.target_amt : 0,
                color: GREEN,
                icon: <Flag />,
                sub: primaryGoal
                  ? `Target: ${dayjs(primaryGoal.deadline).format("YYYY")}`
                  : "Set a milestone",
              },
            ].map((s) => (
              <Grid item xs={12} sm={4} key={s.label}>
                <StatCard {...s} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {goals.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ ...cardSx, height: "100%" }}>
                  <CardContent sx={{ p: "24px !important" }}>
                    <SectionLabel icon={<Flag />}>
                      Active Milestones
                    </SectionLabel>
                    {goals.map((g, i) => {
                      const pct = Math.min(
                        100,
                        Math.round(
                          (totals.corpus / Number(g.target_amt)) * 100,
                        ),
                      );
                      const barColor = pct === 100 ? GREEN : COLOR_HERO;
                      return (
                        <Box key={g.id || i} sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: "text.primary",
                                }}
                              >
                                🎯 {g.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "text.secondary",
                                  mt: 0.5,
                                }}
                              >
                                Target ₹{fmt(g.target_amt)} ·{" "}
                                {dayjs(g.deadline).format("MMM YYYY")}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Chip
                                label={`${pct}%`}
                                sx={{
                                  height: 24,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  bgcolor: alpha(barColor, 0.15),
                                  color: barColor,
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => deleteGoal(g.id, g.name || "this goal")}
                                sx={{
                                  "&:hover": {
                                    color: RED,
                                    bgcolor: alpha(RED, 0.1),
                                  },
                                }}
                              >
                                <Delete sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.06)",
                              "& .MuiLinearProgress-bar": {
                                background: `linear-gradient(90deg, ${alpha(barColor, 0.7)}, ${barColor})`,
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {portfolioPieData.length > 0 && (
              <Grid item xs={12} md={goals.length > 0 ? 6 : 5}>
                <Card sx={{ ...cardSx, height: "100%" }}>
                  <CardContent sx={{ p: "24px !important" }}>
                    <SectionLabel icon={<DonutLarge />}>
                      Asset Allocation
                    </SectionLabel>
                    <Box sx={{ height: 240, mt: 2 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={portfolioPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {portfolioPieData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: isDark ? "#1A202C" : "#FFF",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                              borderRadius: 12,
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            }}
                            formatter={(value) => [`₹${fmt(value)}`, ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mt: 2,
                        justifyContent: "center",
                      }}
                    >
                      {portfolioPieData.map((d, i) => (
                        <Chip
                          key={d.name}
                          label={`${d.name}`}
                          size="small"
                          sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: alpha(
                              PIE_COLORS[i % PIE_COLORS.length],
                              0.15,
                            ),
                            color: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid
              item
              xs={12}
              md={goals.length > 0 || portfolioPieData.length > 0 ? 12 : 7}
            >
              <Card sx={cardSx}>
                <CardContent sx={{ p: "24px !important" }}>
                  <SectionLabel icon={<TrendingUp />}>
                    Portfolio Composition
                  </SectionLabel>
                  {investments.length === 0 && (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography sx={{ color: "text.disabled" }}>
                        No assets logged yet.
                      </Typography>
                    </Box>
                  )}
                  {investments.map((f, i) => {
                    const xirrVal = Number(f.xirr);
                    const pct =
                      f.invested_amount > 0
                        ? Math.round(
                            ((Number(f.current_value) -
                              Number(f.invested_amount)) /
                              Number(f.invested_amount)) *
                              100,
                          )
                        : 0;
                    return (
                      <Box
                        key={f.id || i}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          py: 2,
                          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                          "&:last-child": { borderBottom: "none", pb: 0 },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            fontSize: 14,
                            fontWeight: 700,
                            bgcolor: alpha(
                              PIE_COLORS[i % PIE_COLORS.length],
                              0.15,
                            ),
                            color: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        >
                          {f.name?.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "text.secondary",
                              mt: 0.3,
                            }}
                          >
                            {f.asset_class} ·{" "}
                            {f.investment_type?.toUpperCase() || "SIP"}{" "}
                            {f.investment_type === "sip" &&
                              `(₹${fmt(f.monthly_sip)}/mo)`}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "text.primary",
                            }}
                          >
                            ₹{fmt(f.current_value)}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: xirrVal >= 0 ? GREEN : RED,
                              mt: 0.3,
                            }}
                          >
                            XIRR {xirrVal >= 0 ? "+" : ""}
                            {xirrVal}%
                            {pct !== 0 && (
                              <span
                                style={{
                                  color: theme.palette.text.secondary,
                                  fontWeight: 500,
                                  marginLeft: 6,
                                }}
                              >
                                ({pct >= 0 ? "+" : ""}
                                {pct}%)
                              </span>
                            )}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => deleteInvestment(f.id, f.name || "this investment")}
                          sx={{
                            ml: 1,
                            color: "text.disabled",
                            "&:hover": { color: RED, bgcolor: alpha(RED, 0.1) },
                          }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: SETTINGS
        ════════════════════════════════════════════════════════════════════ */}
        <TabPanel value={tab} index={4}>
          <Card
            sx={{
              borderRadius: 4,
              border: `2px dashed ${alpha(COLOR_HERO, 0.4)}`,
              background: isDark
                ? alpha(COLOR_HERO, 0.03)
                : alpha(COLOR_HERO, 0.01),
            }}
          >
            <CardContent sx={{ p: "32px !important" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(COLOR_HERO, 0.15),
                    width: 56,
                    height: 56,
                  }}
                >
                  <CloudUpload sx={{ color: COLOR_HERO, fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"DM Serif Display",serif',
                      fontSize: 24,
                      color: isDark ? "#fff" : "#1A202C",
                    }}
                  >
                    Data Import
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}
                  >
                    Bulk insert records via JSON for advanced setup.
                  </Typography>
                </Box>
              </Box>

              {importStatus.message &&
                ["success", "error", "warning", "info"].includes(
                  importStatus.type,
                ) && (
                  <Alert
                    severity={importStatus.type}
                    sx={{ mb: 4, borderRadius: 2 }}
                  >
                    {importStatus.message}
                  </Alert>
                )}

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 3,
                  alignItems: "center",
                }}
              >
                <FormControl sx={{ minWidth: 240, ...inputSx }}>
                  <InputLabel>Select Target Entity</InputLabel>
                  <Select
                    value={importTarget}
                    onChange={(e) => setImportTarget(e.target.value)}
                    label="Select Target Entity"
                  >
                    <MenuItem value="loans">🏦 Loans Database</MenuItem>
                    <MenuItem value="investments">
                      📈 Investments Database
                    </MenuItem>
                    <MenuItem value="savings_goals">🎯 Goals Database</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFile />}
                  sx={{
                    background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
                    borderRadius: 2,
                    py: 1.8,
                    px: 4,
                    fontWeight: 700,
                    boxShadow: `0 8px 24px ${alpha(COLOR_HERO, 0.4)}`,
                  }}
                >
                  Upload JSON File
                  <input
                    type="file"
                    hidden
                    accept=".json"
                    onChange={handleFileUpload}
                  />
                </Button>
              </Box>

              <Box
                sx={{
                  mt: 5,
                  p: 3,
                  borderRadius: 3,
                  bgcolor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "text.secondary",
                    fontFamily: "monospace",
                    lineHeight: 2,
                  }}
                >
                  <strong style={{ color: COLOR_HERO }}>
                    Format Expected:
                  </strong>{" "}
                  Top-level JSON Array of Objects.
                  <br />
                  Keys must match Supabase schema columns precisely.
                  <br />
                  <strong>Note:</strong>{" "}
                  <span style={{ color: RED }}>user_id</span> is inferred and
                  securely appended by Artha Tracker.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* ══════════════════════════════════════════════════════════════════
          DIALOGS
      ══════════════════════════════════════════════════════════════════ */}
      {/* ── Log Activity Dialog ── */}
      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setSpendErrors({});
          setForm({
            isIncome: false,
            amount: "",
            category: "Groceries",
            description: "",
            type: "needed",
            date: dayjs().format("YYYY-MM-DD"),
          });
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle
          sx={{ fontFamily: '"DM Serif Display",serif', fontSize: 24, pt: 3 }}
        >
          Log Activity
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box
              sx={{
                display: "flex",
                borderRadius: 2,
                overflow: "hidden",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              }}
            >
              {[
                { label: "Expense", val: false, color: RED },
                { label: "Income", val: true, color: GREEN },
              ].map(({ label, val, color }) => (
                <Button
                  key={label}
                  fullWidth
                  onClick={() => setForm((p) => ({ ...p, isIncome: val }))}
                  sx={{
                    borderRadius: 0,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: 14,
                    background:
                      form.isIncome === val
                        ? alpha(color, 0.15)
                        : "transparent",
                    color: form.isIncome === val ? color : "text.secondary",
                    borderBottom:
                      form.isIncome === val
                        ? `3px solid ${color}`
                        : "3px solid transparent",
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              autoFocus
              value={form.amount}
              onChange={(e) => {
                setForm((p) => ({ ...p, amount: e.target.value }));
                if (spendErrors.amount) setSpendErrors((p) => ({ ...p, amount: undefined }));
              }}
              error={!!spendErrors.amount}
              helperText={spendErrors.amount}
              sx={inputSx}
            />
            {!form.isIncome && (
              <>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    label="Category"
                  >
                    {SPEND_CATS.map((c) => (
                      <MenuItem key={c} value={c}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <span>{CAT_EMOJI[c] || "📦"}</span>
                          {c}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Nature of Spend</InputLabel>
                  <Select
                    value={form.type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, type: e.target.value }))
                    }
                    label="Nature of Spend"
                  >
                    <MenuItem value="needed">✅ Essential Need</MenuItem>
                    <MenuItem value="wanted">💸 Desire / Want</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            <TextField
              fullWidth
              label={form.isIncome ? "Source" : "Description"}
              sx={inputSx}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
            <TextField
              fullWidth
              type="date"
              label="Date"
              sx={inputSx}
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setAddOpen(false)}
            sx={{ color: "text.secondary", borderRadius: 2 }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addSpend}
            disabled={saving}
            sx={{
              background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
            }}
          >
            {saving ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              "Save to Ledger"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Loan Dialog ── */}
      <Dialog
        open={addLoanOpen}
        onClose={() => {
          setAddLoanOpen(false);
          setLoanErrors({});
          resetLoanForm();
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle
          sx={{ fontFamily: '"DM Serif Display",serif', fontSize: 24, pt: 3 }}
        >
          🏦 Add Loan Account
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Institution / Label"
              placeholder="e.g. Home Loan – SBI"
              value={newLoan.label}
              onChange={(e) => {
                setNewLoan((p) => ({ ...p, label: e.target.value }));
                if (loanErrors.label) setLoanErrors((p) => ({ ...p, label: undefined }));
              }}
              error={!!loanErrors.label}
              helperText={loanErrors.label}
              sx={inputSx}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Principal (₹)"
                type="number"
                value={newLoan.principal}
                onChange={(e) => {
                  setNewLoan((p) => ({ ...p, principal: e.target.value }));
                  if (loanErrors.principal) setLoanErrors((p) => ({ ...p, principal: undefined }));
                }}
                error={!!loanErrors.principal}
                helperText={loanErrors.principal}
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Balance (₹)"
                type="number"
                placeholder="If different"
                value={newLoan.current_balance}
                onChange={(e) =>
                  setNewLoan((p) => ({ ...p, current_balance: e.target.value }))
                }
                sx={inputSx}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Interest (%)"
                type="number"
                value={newLoan.rate}
                onChange={(e) =>
                  setNewLoan((p) => ({ ...p, rate: e.target.value }))
                }
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="EMI (₹/mo)"
                type="number"
                value={newLoan.emi}
                onChange={(e) =>
                  setNewLoan((p) => ({ ...p, emi: e.target.value }))
                }
                sx={inputSx}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newLoan.start_date}
                onChange={(e) =>
                  setNewLoan((p) => ({ ...p, start_date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Close Date"
                type="date"
                value={newLoan.target_close_date}
                onChange={(e) =>
                  setNewLoan((p) => ({
                    ...p,
                    target_close_date: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                sx={inputSx}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setAddLoanOpen(false);
              setLoanErrors({});
              resetLoanForm();
            }}
            sx={{ color: "text.secondary", borderRadius: 2 }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addNewLoan}
            disabled={saving}
            sx={{
              background: `linear-gradient(135deg, ${COLOR_HERO}, ${COLOR_DARK})`,
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
            }}
          >
            {saving ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              "Register Loan"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Investment Dialog ── */}
      <Dialog
        open={addInvestOpen}
        onClose={() => {
          setAddInvestOpen(false);
          setInvestErrors({});
          resetInvestForm();
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle
          sx={{ fontFamily: '"DM Serif Display",serif', fontSize: 24, pt: 3 }}
        >
          📈 Add Asset
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box
              sx={{
                display: "flex",
                borderRadius: 2,
                overflow: "hidden",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              }}
            >
              {[
                { label: "SIP (Recurring)", val: "sip" },
                { label: "Lump Sum", val: "lump_sum" },
              ].map(({ label, val }) => (
                <Button
                  key={val}
                  fullWidth
                  onClick={() => setNewInvest((p) => ({ ...p, type: val }))}
                  sx={{
                    borderRadius: 0,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      newInvest.type === val
                        ? alpha(BLUE, 0.15)
                        : "transparent",
                    color: newInvest.type === val ? BLUE : "text.secondary",
                    borderBottom:
                      newInvest.type === val
                        ? `3px solid ${BLUE}`
                        : "3px solid transparent",
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
            <TextField
              fullWidth
              label="Asset Name"
              value={newInvest.name}
              onChange={(e) => {
                setNewInvest((p) => ({ ...p, name: e.target.value }));
                if (investErrors.name) setInvestErrors((p) => ({ ...p, name: undefined }));
              }}
              error={!!investErrors.name}
              helperText={investErrors.name}
              sx={inputSx}
            />
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>Asset Class</InputLabel>
              <Select
                value={newInvest.asset_class}
                onChange={(e) =>
                  setNewInvest((p) => ({ ...p, asset_class: e.target.value }))
                }
                label="Asset Class"
              >
                {ASSET_CLASSES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {newInvest.type === "sip" && (
              <TextField
                fullWidth
                label="Monthly Commitment (₹)"
                type="number"
                value={newInvest.monthly_sip}
                onChange={(e) =>
                  setNewInvest((p) => ({ ...p, monthly_sip: e.target.value }))
                }
                sx={inputSx}
              />
            )}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Invested (₹)"
                type="number"
                value={newInvest.invested_amount}
                onChange={(e) =>
                  setNewInvest((p) => ({
                    ...p,
                    invested_amount: e.target.value,
                  }))
                }
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Current (₹)"
                type="number"
                value={newInvest.current_value}
                onChange={(e) =>
                  setNewInvest((p) => ({ ...p, current_value: e.target.value }))
                }
                sx={inputSx}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="XIRR (%)"
                type="number"
                value={newInvest.xirr}
                onChange={(e) =>
                  setNewInvest((p) => ({ ...p, xirr: e.target.value }))
                }
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newInvest.date}
                onChange={(e) =>
                  setNewInvest((p) => ({ ...p, date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                sx={inputSx}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setAddInvestOpen(false);
              resetInvestForm();
            }}
            sx={{ color: "text.secondary", borderRadius: 2 }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addNewInvestment}
            disabled={saving}
            sx={{
              background: `linear-gradient(135deg, ${BLUE}, #2B6CB0)`,
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
            }}
          >
            {saving ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              "Register Asset"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Goal Dialog ── */}
      <Dialog
        open={addGoalOpen}
        onClose={() => {
          setAddGoalOpen(false);
          resetGoalForm();
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle
          sx={{ fontFamily: '"DM Serif Display",serif', fontSize: 24, pt: 3 }}
        >
          🎯 Define Milestone
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Milestone Name"
              placeholder="e.g. Nirvana Fund 2040"
              value={newGoal.name}
              onChange={(e) =>
                setNewGoal((p) => ({ ...p, name: e.target.value }))
              }
              sx={inputSx}
            />
            <TextField
              fullWidth
              label="Target Corpus (₹)"
              type="number"
              value={newGoal.target_amt}
              onChange={(e) =>
                setNewGoal((p) => ({ ...p, target_amt: e.target.value }))
              }
              sx={inputSx}
            />
            <TextField
              fullWidth
              label="Target Date"
              type="date"
              value={newGoal.deadline}
              onChange={(e) =>
                setNewGoal((p) => ({ ...p, deadline: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setAddGoalOpen(false);
              resetGoalForm();
            }}
            sx={{ color: "text.secondary", borderRadius: 2 }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addNewGoal}
            disabled={saving}
            sx={{
              background: `linear-gradient(135deg, ${GREEN}, #276749)`,
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
            }}
          >
            {saving ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              "Set Focus"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE CONFIRM ── */}
      <Dialog
        open={arthaDeleteConfirm.open}
        onClose={() => setArthaDeleteConfirm({ open: false, label: "", onConfirm: null })}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 18 }}>Delete?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Remove <strong>"{arthaDeleteConfirm.label}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setArthaDeleteConfirm({ open: false, label: "", onConfirm: null })}
            sx={{ color: "text.secondary", textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const fn = arthaDeleteConfirm.onConfirm;
              setArthaDeleteConfirm({ open: false, label: "", onConfirm: null });
              if (fn) fn();
            }}
            sx={{ bgcolor: RED, color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#b91c1c" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
