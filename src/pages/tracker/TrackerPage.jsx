import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  alpha,
} from "@mui/material";
import {
  AccountBalance,
  FitnessCenter,
  MenuBook,
  Flight,
  AutoAwesome,
  ChevronRight,
  Restaurant,
  WorkHistory,
} from "@mui/icons-material";
import { useThemeMode } from "../../hooks/useTheme";

// Adjusted colors slightly to feel more "Ashram" / Earthy & Classic
const TRACKERS = [
  {
    path: "/tracker/finance",
    icon: <AccountBalance sx={{ fontSize: 24 }} />,
    title: "Artha Tracker",
    subtitle: "Spending · Debt snowball · Corpus · Budgets",
    color: "#2C6E63", // Deep Teal
    chips: ["Daily spend", "Loan snowball", "SIP corpus"],
    chartData: "M0,25 C15,20 25,28 40,15 C55,2 65,22 80,10 C90,0 95,15 100,5",
  },
  {
    path: "/tracker/health",
    icon: <FitnessCenter sx={{ fontSize: 24 }} />,
    title: "Sharīram Tracker",
    subtitle: "Weight log · Measurements · Body composition",
    color: "#3A7352", // Forest Green
    chips: ["Weight log", "Belly girth", "Visceral fat"],
    chartData: "M0,10 C15,25 25,5 40,20 C55,30 65,10 80,15 C90,18 95,5 100,10",
  },
  {
    path: "/tracker/diet",
    icon: <Restaurant sx={{ fontSize: 24 }} />,
    title: "Anna Tracker",
    subtitle: "High-protein vegetarian meal plans · Nutrition",
    color: "#A94442", // Earthy Red
    chips: ["Protein intake", "Veg meals"],
    chartData: "M0,20 C20,15 30,25 50,10 C60,2 75,20 85,15 C95,10 98,25 100,12",
  },
  {
    path: "/tracker/reading",
    icon: <MenuBook sx={{ fontSize: 24 }} />,
    title: "Pathanam Tracker",
    subtitle: "Book tracker · Progress · Notes · 500-book library",
    color: "#8C5839", // Clay / Sienna
    chips: ["Book log", "Progress", "One-liners"],
    chartData: "M0,30 C10,30 20,10 40,15 C50,18 70,2 85,10 C95,15 98,5 100,5",
  },
  {
    path: "/tracker/career",
    icon: <WorkHistory sx={{ fontSize: 24 }} />,
    title: "Vṛtti Tracker",
    subtitle: "Professional goals · Task tracking · Career OS",
    color: "#5B538C", // Muted Indigo
    chips: ["Milestones", "Job tasks"],
    chartData: "M0,28 C20,25 30,15 45,20 C60,25 70,5 85,10 C95,12 98,2 100,0",
  },
  {
    path: "/tracker/sacred",
    icon: <AutoAwesome sx={{ fontSize: 24 }} />,
    title: "Purohitam Tracker",
    subtitle: "Daily sequence · Gayatri counter · Ritual record",
    color: "#B37A32", // Bronze / Mustard
    chips: ["Daily checklist", "Gayatri count", "Dakshina log"],
    chartData: "M0,15 C20,10 30,28 50,15 C60,8 70,20 85,10 C95,4 98,15 100,8",
  },
  {
    path: "/tracker/journey",
    icon: <Flight sx={{ fontSize: 24 }} />,
    title: "Yatra Tracker",
    subtitle: "Trip archive · Cost capture · Ratings · Memories",
    color: "#2C5B8E", // Ocean Blue
    chips: ["Trip log", "Cost breakdown", "History"],
    chartData: "M0,25 C15,20 30,5 45,15 C60,25 75,10 85,15 C95,18 98,5 100,10",
  },
];

// A subtle decorative sparkline component to give the "tracker" vibe
const Sparkline = ({ color, pathD }) => (
  <Box
    sx={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "45%",
      pointerEvents: "none",
      zIndex: 0,
      opacity: 0.6,
      transition: "opacity 0.3s ease",
      ".card-hover:hover &": {
        opacity: 1,
      },
    }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        style={{ opacity: 0.2 }}
      />
      <path
        d={`${pathD} L100,30 L0,30 Z`}
        fill={`url(#gradient-${color.replace("#", "")})`}
        style={{ opacity: 0.8 }}
      />
      <defs>
        <linearGradient
          id={`gradient-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={alpha(color, 0.15)} />
          <stop offset="100%" stopColor={alpha(color, 0.0)} />
        </linearGradient>
      </defs>
    </svg>
  </Box>
);

export default function TrackerPage() {
  const navigate = useNavigate();
  const { mode, heroColor } = useThemeMode();
  const isDark = mode === "dark";

  // Classic Digital Ashram aesthetic colors
  const bgBase = isDark ? "#0A0A09" : "#F8F6F0";
  const bgGradient = isDark
    ? `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha(heroColor, 0.15)} 0%, transparent 80%)`
    : `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha(heroColor, 0.12)} 0%, transparent 80%)`;

  // Subtle classic texture (SVG Base64) - dots/mandala feel
  const textureOverlay = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 12A1 1 0 1 0 2 10a1 1 0 0 0 0 2zm10 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10-10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z' fill='${isDark ? "%23ffffff" : "%23000000"}' fill-opacity='${isDark ? "0.03" : "0.04"}' fill-rule='evenodd'/%3E%3C/svg%3E")`;

  const border = isDark ? alpha("#ffffff", 0.08) : alpha("#000000", 0.08);
  const cardBg = isDark ? alpha("#181716", 0.8) : alpha("#ffffff", 0.7);
  const textP = isDark ? "#F2EFEB" : "#282522";
  const textS = isDark ? "#A6A39E" : "#68645E";

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: bgBase,
        backgroundImage: `${bgGradient}, ${textureOverlay}`,
        backgroundAttachment: "fixed",
        overflowX: "hidden",
        "@keyframes fadeInDown": {
          from: { opacity: 0, transform: "translateY(-15px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes fadeInUp": {
          from: { opacity: 0, transform: "translateY(25px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          p: { xs: 3, md: "48px 40px" },
          maxWidth: 960,
          mx: "auto",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            mb: 5,
            textAlign: "center",
            animation:
              "fadeInDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
          }}
        >
          <Box
            sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 1 }}
          >
            <Box
              sx={{
                width: 12,
                height: 1,
                backgroundColor: heroColor,
                opacity: 0.5,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                letterSpacing: 3,
                textTransform: "uppercase",
                fontSize: 11,
                color: heroColor,
                fontWeight: 600,
              }}
            >
              Detailed Tracking
            </Typography>
            <Box
              sx={{
                width: 12,
                height: 1,
                backgroundColor: heroColor,
                opacity: 0.5,
              }}
            />
          </Box>

          <Typography
            sx={{
              fontFamily: '"Fraunces", "Lora", serif',
              fontWeight: 400,
              fontSize: { xs: 32, md: 40 },
              color: textP,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            Digital Ashram Trackers
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: { xs: 14, md: 15 },
              color: textS,
              maxWidth: 500,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Refined OS tools designed for mindful progression across each life
            area. Independent from daily practice — update naturally as your
            journey unfolds.
          </Typography>
        </Box>

        {/* Tracker Cards Grid */}
        <Grid container spacing={2.5}>
          {TRACKERS.map((t, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              key={t.path}
              sx={{
                opacity: 0,
                animation:
                  "fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                animationDelay: `${index * 0.1}s`, // Staggered animation
              }}
            >
              <Card
                className="card-hover"
                onClick={() => navigate(t.path)}
                sx={{
                  position: "relative",
                  cursor: "pointer",
                  border: `1px solid ${border}`,
                  background: cardBg,
                  backdropFilter: "blur(10px)",
                  boxShadow: isDark
                    ? "0 4px 20px rgba(0,0,0,0.3)"
                    : "0 4px 20px rgba(0,0,0,0.03)",
                  borderRadius: 3,
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  "&:hover": {
                    borderColor: alpha(t.color, 0.4),
                    transform: "translateY(-3px)",
                    boxShadow: isDark
                      ? `0 8px 30px ${alpha(t.color, 0.15)}`
                      : `0 8px 30px ${alpha(t.color, 0.1)}`,
                  },
                  "&:hover .chevron": {
                    transform: "translateX(6px)",
                    color: t.color,
                  },
                  "&:hover .icon-box": {
                    background: t.color,
                    color: isDark ? "#000" : "#FFF",
                    transform: "scale(1.05)",
                  },
                }}
              >
                {/* Visual Color Accent Line */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: t.color,
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                  }}
                />

                <Sparkline color={t.color} pathD={t.chartData} />

                <CardContent
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    position: "relative",
                    zIndex: 1,
                    // Fixes the MUI default bottom padding bloat on CardContent
                    "&:last-child": { pb: { xs: 2.5, md: 3 } },
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2.5 }}
                  >
                    {/* Icon Container */}
                    <Box
                      className="icon-box"
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: alpha(t.color, isDark ? 0.15 : 0.08),
                        border: `1px solid ${alpha(t.color, 0.2)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: t.color,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {t.icon}
                    </Box>

                    {/* Text & Content Container */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: '"Fraunces", "Lora", serif',
                            fontWeight: 600,
                            fontSize: 18,
                            color: textP,
                          }}
                        >
                          {t.title}
                        </Typography>
                        <ChevronRight
                          className="chevron"
                          sx={{
                            fontSize: 20,
                            color: textS,
                            transition: "all 0.3s ease",
                            flexShrink: 0,
                          }}
                        />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: 13,
                          color: textS,
                          display: "block",
                          mt: 0.5,
                          mb: 2,
                          lineHeight: 1.5,
                          fontWeight: 400,
                        }}
                      >
                        {t.subtitle}
                      </Typography>

                      {/* Chips Container */}
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {t.chips.map((c) => (
                          <Chip
                            key={c}
                            label={c}
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 500,
                              height: 22,
                              background: isDark
                                ? alpha(t.color, 0.15)
                                : alpha(t.color, 0.08),
                              color: isDark ? alpha(t.color, 0.9) : t.color,
                              border: `1px solid ${alpha(t.color, 0.1)}`,
                              backdropFilter: "blur(4px)",
                              "&:hover": {
                                background: alpha(t.color, 0.2),
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
