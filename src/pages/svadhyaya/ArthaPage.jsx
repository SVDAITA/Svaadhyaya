import { Box, Grid, CircularProgress } from "@mui/material";
import {
  AreaBanner,
  StatCard,
  LakshyaSection,
  AreaJournal,
  WeeklyGoals,
  AreaLog,
  InsightCard,
} from "../../components/shared/AreaComponents";
import { useAreaData, useWeekCompletion } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";

const COLOR = "#1A7A6E";
const AREA = "finance";

const LOG_TYPES = [
  {
    id: "spend",
    label: "Daily spend",
    hasValue: true,
    valueLabel: "Amount",
    unit: "₹",
  },
  {
    id: "loan_payment",
    label: "Loan prepayment",
    hasValue: true,
    valueLabel: "Amount",
    unit: "₹",
  },
  {
    id: "corpus_update",
    label: "MF corpus update",
    hasValue: true,
    valueLabel: "Total corpus",
    unit: "₹",
  },
  {
    id: "sip_done",
    label: "SIP invested this month",
    hasValue: true,
    valueLabel: "Amount",
    unit: "₹",
  },
  {
    id: "income",
    label: "Extra income received",
    hasValue: true,
    valueLabel: "Amount + source",
    unit: "₹",
  },
  { id: "note", label: "Financial note", hasValue: true, valueLabel: "Note" },
];

// Sri Yantra — interlocking upward/downward triangles
function ArthaBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
  const cx = 340,
    cy = 150,
    R = 80;
  // 4 upward triangles, 5 downward = Sri Yantra approximation
  const triangles = [
    // upward
    [
      [cx, cy - R],
      [cx - R * 0.87, cy + R * 0.5],
      [cx + R * 0.87, cy + R * 0.5],
    ],
    [
      [cx, cy - R * 0.65],
      [cx - R * 0.56, cy + R * 0.32],
      [cx + R * 0.56, cy + R * 0.32],
    ],
    // downward
    [
      [cx, cy + R],
      [cx - R * 0.87, cy - R * 0.5],
      [cx + R * 0.87, cy - R * 0.5],
    ],
    [
      [cx, cy + R * 0.65],
      [cx - R * 0.56, cy - R * 0.32],
      [cx + R * 0.56, cy - R * 0.32],
    ],
  ];
  return (
    <svg
      width="400"
      height="300"
      viewBox="0 0 400 300"
      fill="none"
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        pointerEvents: "none",
        opacity: op,
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={R + 12}
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r={R + 24}
        stroke={COLOR}
        strokeWidth="0.5"
        fill="none"
      />
      {triangles.map((pts, i) => (
        <polygon
          key={i}
          points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
          stroke={COLOR}
          strokeWidth="0.75"
          fill="none"
        />
      ))}
      <circle cx={cx} cy={cy} r="6" fill={COLOR} opacity="0.4" />
      {/* Coin/money circles bottom left */}
      {[0, 1, 2].map((i) => (
        <circle
          key={`c${i}`}
          cx={50 + i * 36}
          cy={250}
          r={14 - i * 2}
          stroke={COLOR}
          strokeWidth="0.75"
          fill="none"
        />
      ))}
    </svg>
  );
}

export default function ArthaPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const weekPct = useWeekCompletion(["finance_log"]);

  const activeLakshyas = lakshyas.filter((l) => l.status === "active").length;
  const totalSiddhis = lakshyas.reduce(
    (acc, l) => acc + (l.siddhis?.length || 0),
    0,
  );

  const bg = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${COLOR}08 0%, #0D0C0A 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${COLOR}10 0%, #FAF5EE 65%)`;

  if (loading)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
        }}
      >
        <CircularProgress sx={{ color: COLOR }} />
      </Box>
    );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 900,
        mx: "auto",
        minHeight: "100vh",
        background: bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ArthaBg isDark={isDark} />

      <AreaBanner
        color={COLOR}
        emoji="💰"
        title="Artha"
        subtitle="Debt-free May 2028 · ₹70L+ corpus by 2031 · Conscious Wealth"
        quote="I respect money. I eliminate debt first, invest consistently, and build wealth without anxiety."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <StatCard
            value={activeLakshyas}
            label="Active Visions"
            color={COLOR}
            sub="Lakshyas"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            value={totalSiddhis}
            label="Milestones Set"
            color={COLOR}
            sub="Siddhis"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            value={`${weekPct}%`}
            label="Logging"
            color={weekPct >= 80 ? "#2D7A4F" : COLOR}
          />
        </Grid>
      </Grid>

      <LakshyaSection
        area={AREA}
        color={COLOR}
        lakshyas={lakshyas}
        onUpdate={reload}
      />
      <AreaJournal area={AREA} color={COLOR} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <WeeklyGoals area={AREA} color={COLOR} />
        </Grid>
        <Grid item xs={12} md={6}>
          <InsightCard
            color={COLOR}
            insight="The snowball is moving. NewBazaar closes Oct 2026, Axis Small closes Feb 2027. Every win adds leverage to the Axis Large Loan attack. May 2028 is the finish line."
          />
          <AreaLog area={AREA} color={COLOR} logTypes={LOG_TYPES} />
        </Grid>
      </Grid>
    </Box>
  );
}
