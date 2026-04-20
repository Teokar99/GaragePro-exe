import {
  Car,
  Database,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserCog,
  Users,
  Wrench,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darkMode");
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Handle dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const allNavigation = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      page: "dashboard",
      requiresPermission: "canViewDashboard",
    },
    {
      name: "Customers",
      icon: Users,
      page: "customers",
      requiresPermission: "canViewCustomers",
    },
    {
      name: "Vehicles",
      icon: Car,
      page: "vehicles",
      requiresPermission: "canViewCustomers",
    },
    {
      name: "Services",
      icon: Wrench,
      page: "services",
      requiresPermission: "canViewServices",
    },
    {
      name: "Users",
      icon: UserCog,
      page: "users",
      requiresPermission: "canManageUsers",
    },
    {
      name: "Database Tools",
      icon: Database,
      page: "database",
      requiresPermission: "canManageUsers",
    },
    {
      name: "revenue",
      icon: DollarSign,
      page: "revenue",
      requiresPermission: "canViewFinancials",
    },
    {
      name: "Settings",
      icon: Settings,
      page: "settings",
      requiresPermission: "canManageUsers",
    },
  ];

  const navigation = allNavigation.filter((item) => {
    const permissionKey = item.requiresPermission as keyof typeof permissions;
    return permissions[permissionKey];
  });

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors overflow-x-hidden">
      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-white dark:bg-slate-800
          border-r border-gray-200 dark:border-slate-700
          transform transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              AutoShop Pro
            </h1>
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-gray-300"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onNavigate(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium
                    transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Filler */}
          <div className="flex-1"></div>

          {/* DARK MODE */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center px-4 py-3 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5 mr-3" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 mr-3" />
                  Dark Mode
                </>
              )}
            </button>
          </div>

          {/* USER + SIGN OUT */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-slate-700">
            <div className="mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    {(
                      user?.full_name?.charAt(0) ??
                      user?.email?.charAt(0) ??
                      "A"
                    ).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.email ?? user?.full_name ?? "User"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* =============================== */}
      {/* MAIN CONTENT */}
      {/* =============================== */}
      <div className="relative min-h-screen w-full lg:ml-64 lg:w-[calc(100vw-16rem)]">
        {/* MOBILE TOP BAR */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4 lg:hidden">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <main className="p-6 w-full min-h-screen">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
