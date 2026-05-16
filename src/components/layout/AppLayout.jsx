import { useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
  GlobalStyles,
} from "@mui/material";
import {
  Today,
  Dashboard,
  LocalFireDepartment,
  MusicNote,
  FitnessCenter,
  Work,
  AccountBalance,
  MenuBook,
  DarkMode,
  LightMode,
  Menu as MenuIcon,
  ChevronRight,
  FlashOn,
  SettingsOutlined,
  BoltOutlined,
  Spa,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";

const DRAWER_WIDTH = 240; // Slightly wider for a more breathable layout
const COLLAPSED_WIDTH = 72;

const NAV_ITEMS = [
  { label: "Today", icon: <Today />, path: "/svadhyaya", color: "#C07830" },
  {
    label: "Dashboard",
    icon: <Dashboard />,
    path: "/svadhyaya/dashboard",
    color: "#C07830",
  },
  {
    label: "Disruption",
    icon: <BoltOutlined />,
    path: "/svadhyaya/disruption",
    color: "#C07830",
  },
  { divider: true, label: "Life Areas" },
  {
    label: "Anushthanam",
    icon: <Spa />,
    path: "/svadhyaya/anushthanam",
    color: "#C07830",
  },
  {
    label: "Nādam",
    icon: <MusicNote />,
    path: "/svadhyaya/nadam",
    color: "#7C4DAB",
  },
  {
    label: "Sharīram",
    icon: <FitnessCenter />,
    path: "/svadhyaya/shariram",
    color: "#2D7A4F",
  },
  {
    label: "Vṛtti",
    icon: <Work />,
    path: "/svadhyaya/vrutti",
    color: "#1A5FB0",
  },
  {
    label: "Artha",
    icon: <AccountBalance />,
    path: "/svadhyaya/artha",
    color: "#1A7A6E",
  },
  {
    label: "Vidyā",
    icon: <MenuBook />,
    path: "/svadhyaya/vidya",
    color: "#A0522D",
  },
  { divider: true, label: "Trackers" },
  { label: "Trackers", icon: <FlashOn />, path: "/tracker", color: "#1A5FB0" },
  { divider: true, label: "Account" },
  {
    label: "Settings",
    icon: <SettingsOutlined />,
    path: "/svadhyaya/settings",
    color: "#7C4DAB",
  },
];

const BOTTOM_NAV = [
  { label: "Today", icon: <Today fontSize="small" />, path: "/svadhyaya" },
  { label: "Dashboard", icon: <Dashboard fontSize="small" />, path: "/svadhyaya/dashboard" },
  { label: "Track", icon: <FlashOn fontSize="small" />, path: "/tracker" },
  { label: "Settings", icon: <SettingsOutlined fontSize="small" />, path: "/svadhyaya/settings" },
];

// ── SVG TEXTURES & COMPONENTS ────────────────────────────────────────────────

// Generates a subtle noise/parchment texture for the background
const TextureOverlay = ({ isDark }) => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      zIndex: 9999, // High z-index but no pointer events
      opacity: isDark ? 0.04 : 0.06,
      mixBlendMode: isDark ? "overlay" : "multiply",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);

function MandalaSVG({ size = 22, color = "#A65D2E", spinning = false }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      sx={{
        animation: spinning ? "spin 20s linear infinite" : "none",
        "@keyframes spin": { "100%": { transform: "rotate(360deg)" } },
      }}
    >
      <path
        d="M32 4 L60 32 L32 60 L4 32 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <circle
        cx="32"
        cy="32"
        r="16"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M20 32 Q32 20 44 32 Q32 44 20 32"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M32 20 Q44 32 32 44 Q20 32 32 20"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <circle cx="32" cy="32" r="3" fill={color} />
      <circle cx="32" cy="4" r="1.5" fill={color} opacity="0.6" />
      <circle cx="60" cy="32" r="1.5" fill={color} opacity="0.6" />
      <circle cx="32" cy="60" r="1.5" fill={color} opacity="0.6" />
      <circle cx="4" cy="32" r="1.5" fill={color} opacity="0.6" />
    </Box>
  );
}

function MandalaWatermark({ color }) {
  return (
    <svg
      width="240"
      height="240"
      viewBox="0 0 180 180"
      fill="none"
      style={{
        position: "absolute",
        bottom: -40,
        left: -40,
        pointerEvents: "none",
        transition: "all 0.5s ease",
      }}
    >
      <circle
        cx="90"
        cy="90"
        r="80"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.08"
      />
      <circle
        cx="90"
        cy="90"
        r="60"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.06"
      />
      <circle
        cx="90"
        cy="90"
        r="40"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.06"
      />
      <circle
        cx="90"
        cy="90"
        r="20"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.08"
      />
      {[...Array(12)].map((_, i) => {
        const r = (Math.PI * (i * 30)) / 180;
        return (
          <line
            key={i}
            x1={90 + 22 * Math.cos(r)}
            y1={90 + 22 * Math.sin(r)}
            x2={90 + 78 * Math.cos(r)}
            y2={90 + 78 * Math.sin(r)}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.05"
          />
        );
      })}
    </svg>
  );
}

// ── TOP BAR (desktop) ──────────────────────────────────────────────────────────

function TopBar({ user, heroColor, mode, toggleTheme, isDark }) {
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name || "Subbu";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarSrc = useMemo(() => localStorage.getItem("sv_avatar"), []);

  const divider = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#9C9A94" : "#7A6E62";

  return (
    <Box
      sx={{
        height: 64, // Increased touch target size
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        px: 4,
        gap: 2,
        borderBottom: `1px solid ${divider}`,
        // Glassmorphism effect
        background: isDark
          ? "rgba(18, 17, 16, 0.75)"
          : "rgba(250, 249, 246, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        flexShrink: 0,
      }}
    >
      <Tooltip title={mode === "dark" ? "Awaken the Sun" : "Invoke the Moon"}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            color: textS,
            border: `1px solid ${divider}`,
            "&:hover": {
              color: heroColor,
              background: `${heroColor}10`,
              transform: "rotate(15deg)",
            },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {mode === "dark" ? (
            <LightMode sx={{ fontSize: 20 }} />
          ) : (
            <DarkMode sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Tooltip>

      <Box
        onClick={() => navigate("/svadhyaya/settings")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          cursor: "pointer",
          borderRadius: 3,
          px: 1.5,
          py: 0.75,
          border: `1px solid ${divider}`,
          background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          "&:hover": {
            borderColor: `${heroColor}50`,
            background: `${heroColor}08`,
            boxShadow: `0 4px 12px ${heroColor}15`,
          },
          transition: "all 0.2s ease",
        }}
      >
        <Avatar
          src={avatarSrc || undefined}
          sx={{
            width: 32,
            height: 32,
            fontSize: 12,
            fontWeight: 600,
            bgcolor: heroColor,
            color: isDark ? "#000" : "#fff",
            flexShrink: 0,
          }}
        >
          {!avatarSrc && initials}
        </Avatar>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: textP,
              lineHeight: 1.2,
            }}
          >
            {name}
          </Typography>
          <Typography sx={{ fontSize: 10, color: textS, letterSpacing: 0.5 }}>
            Sādhaka
          </Typography>
        </Box>
        <SettingsOutlined sx={{ fontSize: 16, color: textS, ml: 0.5 }} />
      </Box>
    </Box>
  );
}

// ── MAIN LAYOUT ────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const { user } = useAuth();
  const { mode, toggleTheme, heroColor } = useThemeMode();
  const isDark = mode === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const name = user?.user_metadata?.full_name || "Subbu";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarSrc = useMemo(() => localStorage.getItem("sv_avatar"), []);

  // Theme Constants
  const appBg = isDark ? "#121110" : "#FAF9F6"; // Slightly warmer dark mode base
  const drawerBg = isDark ? "#0A0908" : "#F4F1EC";
  const dividerClr = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#8C8881" : "#7A6E62";

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: drawerBg,
        borderRight: `1px solid ${dividerClr}`,
        boxShadow: isDark
          ? `inset -10px 0 20px -10px rgba(0,0,0,0.5)`
          : `inset -10px 0 20px -10px rgba(0,0,0,0.05)`,
        position: "relative",
      }}
    >
      <MandalaWatermark color={heroColor} />

      {/* Brand Header */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          minHeight: 76,
          position: "relative",
          background: `linear-gradient(180deg, ${heroColor}${isDark ? "15" : "10"} 0%, transparent 100%)`,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: `${heroColor}15`,
            border: `1px solid ${heroColor}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 15px ${heroColor}25`,
            mx: collapsed ? "auto" : 0,
          }}
        >
          <MandalaSVG size={24} color={heroColor} spinning={true} />
        </Box>

        {!collapsed && (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <Typography
              sx={{
                fontFamily: '"Fraunces","Lora",serif',
                fontWeight: 700,
                fontSize: 19,
                lineHeight: 1.1,
                color: textP,
                letterSpacing: 0.5,
              }}
            >
              Svaadhyaya
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: 11,
                letterSpacing: 3,
                color: heroColor,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              स्वाध्याय
            </Typography>
          </Box>
        )}

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <Box
            onClick={() => setCollapsed((p) => !p)}
            sx={{
              position: "absolute",
              right: -12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 24,
              height: 24,
              background: appBg,
              border: `1px solid ${dividerClr}`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
              "&:hover": { background: `${heroColor}20`, color: heroColor },
              transition: "all 0.2s ease",
            }}
          >
            <ChevronRight
              sx={{
                fontSize: 16,
                color: textS,
                transform: collapsed ? "none" : "rotate(180deg)",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Nav List */}
      <List
        sx={{
          flex: 1,
          py: 1,
          px: collapsed ? 1 : 2,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        {NAV_ITEMS.map((item, i) => {
          if (item.divider)
            return (
              <Box key={i} sx={{ pt: 3, pb: 1, px: collapsed ? 0 : 1 }}>
                {!collapsed ? (
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: textS,
                      opacity: 0.7,
                    }}
                  >
                    {item.label}
                  </Typography>
                ) : (
                  <Divider sx={{ borderColor: dividerClr, mx: 1 }} />
                )}
              </Box>
            );

          // Fixed active path logic
          const active =
            item.path === "/svadhyaya"
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          const itemColor = item.color || heroColor;

          return (
            <Tooltip
              key={item.path}
              title={collapsed ? item.label : ""}
              placement="right"
              arrow
              disableInteractive
            >
              <ListItemButton
                selected={active}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  minHeight: 44,
                  mb: 0.5,
                  borderRadius: 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 0 : 1.5,
                  // Gorgeous active states
                  ...(active
                    ? {
                        background: isDark
                          ? `linear-gradient(90deg, ${itemColor}25 0%, ${itemColor}05 100%)`
                          : `linear-gradient(90deg, ${itemColor}15 0%, ${itemColor}05 100%)`,
                        boxShadow: `inset 3px 0 0 ${itemColor}`,
                      }
                    : {}),
                  "&:hover": {
                    background: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                    transform: "translateX(4px)", // Subtle hover indent
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 36,
                    color: active ? itemColor : textS,
                    "& svg": {
                      fontSize: 20,
                      filter: active
                        ? `drop-shadow(0 0 6px ${itemColor}50)`
                        : "none",
                    },
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      color: active ? textP : textS,
                      letterSpacing: 0.3,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  const currentBottomNav = BOTTOM_NAV.findIndex((i) =>
    i.path === "/svadhyaya"
      ? location.pathname === i.path
      : location.pathname.startsWith(i.path),
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: appBg,
        position: "relative",
      }}
    >
      {/* Global CSS for Page Animations */}
      <GlobalStyles
        styles={{
          "@keyframes pageEnter": {
            "0%": { opacity: 0, transform: "translateY(15px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
        }}
      />

      <TextureOverlay isDark={isDark} />

      {isMobile ? (
        <>
          {/* Mobile App Bar */}
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              background: isDark
                ? "rgba(10, 9, 8, 0.85)"
                : "rgba(244, 241, 236, 0.9)",
              backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${dividerClr}`,
              zIndex: 1200,
            }}
          >
            <Toolbar sx={{ minHeight: "60px !important", gap: 1, px: 2 }}>
              <IconButton
                size="small"
                onClick={() => setMobileOpen(true)}
                sx={{ color: textP, mr: 1 }}
              >
                <MenuIcon sx={{ fontSize: 24 }} />
              </IconButton>

              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <MandalaSVG size={20} color={heroColor} spinning={true} />
                <Typography
                  sx={{
                    fontFamily: '"Fraunces","Lora",serif',
                    fontWeight: 600,
                    fontSize: 18,
                    color: textP,
                  }}
                >
                  Svaadhyaya
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={toggleTheme}
                sx={{ color: textS }}
              >
                {mode === "dark" ? (
                  <LightMode sx={{ fontSize: 20 }} />
                ) : (
                  <DarkMode sx={{ fontSize: 20 }} />
                )}
              </IconButton>

              <Avatar
                src={avatarSrc || undefined}
                onClick={() => navigate("/svadhyaya/settings")}
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: 11,
                  bgcolor: heroColor,
                  color: isDark ? "#000" : "#fff",
                  ml: 1,
                  cursor: "pointer",
                  border: `2px solid transparent`,
                  "&:hover": { borderColor: heroColor },
                }}
              >
                {!avatarSrc && initials}
              </Avatar>
            </Toolbar>
          </AppBar>

          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                border: "none",
              },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Mobile Main Content */}
          <Box
            component="main"
            sx={{
              flex: 1,
              pt: "60px",
              pb: "65px",
              minHeight: "100vh",
              overflowX: "hidden",
            }}
          >
            {/* Keyed Box forces the animation to re-run on route change */}
            <Box
              key={location.pathname}
              sx={{
                animation: "pageEnter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both",
                height: "100%",
              }}
            >
              <Outlet />
            </Box>
          </Box>

          {/* Mobile Bottom Navigation */}
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1200,
            }}
          >
            <BottomNavigation
              value={currentBottomNav !== -1 ? currentBottomNav : 0}
              onChange={(_, v) => navigate(BOTTOM_NAV[v].path)}
              sx={{
                borderTop: `1px solid ${dividerClr}`,
                height: 65,
                background: isDark
                  ? "rgba(10, 9, 8, 0.9)"
                  : "rgba(244, 241, 236, 0.95)",
                backdropFilter: "blur(10px)",
                pb: 1, // Safe area padding
              }}
            >
              {BOTTOM_NAV.map((item, i) => (
                <BottomNavigationAction
                  key={i}
                  label={item.label}
                  icon={item.icon}
                  sx={{
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: "11px !important",
                      fontWeight: 500,
                      mt: 0.5,
                    },
                    color: textS,
                    "&.Mui-selected": { color: heroColor },
                  }}
                />
              ))}
            </BottomNavigation>
          </Box>
        </>
      ) : (
        <>
          {/* Desktop permanent drawer */}
          <Drawer
            variant="permanent"
            sx={{
              width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
              flexShrink: 0,
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "& .MuiDrawer-paper": {
                width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                boxSizing: "border-box",
                border: "none",
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                overflowX: "hidden",
                background: "transparent", // Background handled by inner box
              },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Main content with top bar */}
          <Box
            component="main"
            sx={{
              flex: 1,
              minHeight: "100vh",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 1,
            }}
          >
            <TopBar
              user={user}
              heroColor={heroColor}
              mode={mode}
              toggleTheme={toggleTheme}
              isDark={isDark}
            />

            {/* Animated Router Outlet Wrapper */}
            <Box
              key={location.pathname}
              sx={{
                flex: 1,
                p: { xs: 2, md: 4 }, // Built-in padding scaling for the main area
                animation: "pageEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
              }}
            >
              <Outlet />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
