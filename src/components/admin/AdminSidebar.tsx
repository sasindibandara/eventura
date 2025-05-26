import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
  Package,
  Calendar,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

interface SidebarCategory {
  title: string;
  items: SidebarItem[];
}

const sidebarCategories: SidebarCategory[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin",
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        title: "Users",
        icon: Users,
        href: "/admin/users",
      },
      {
        title: "Providers",
        icon: Building2,
        href: "/admin/providers",
      },
      {
        title: "Verification",
        icon: Shield,
        href: "/admin/verification",
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        title: "Requests",
        icon: ClipboardList,
        href: "/admin/requests",
      },
      {
        title: "Packages",
        icon: Package,
        href: "/admin/packages",
      },
      {
        title: "Calendar",
        icon: Calendar,
        href: "/admin/calendar",
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        title: "Messages",
        icon: MessageSquare,
        href: "/admin/messages",
      },
      {
        title: "Reports",
        icon: FileText,
        href: "/admin/reports",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Statistics",
        icon: BarChart3,
        href: "/admin/analytics",
      },
    ],
  },
];

export function AdminSidebar({ isCollapsed, onCollapse }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-all duration-300",
        isCollapsed && "w-20"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <span
          className={cn(
            "text-lg font-semibold transition-opacity duration-300",
            isCollapsed && "opacity-0"
          )}
        >
          Eventura Admin
        </span>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)] flex-col justify-between">
        <nav className="space-y-4 p-2">
          {sidebarCategories.map((category) => (
            <div key={category.title} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-2 text-xs font-semibold text-muted-foreground">
                  {category.title}
                </h4>
              )}
              {category.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-2">{item.title}</span>}
                  </Button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => navigate("/admin/settings")}
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Settings</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => navigate("/admin/support")}
          >
            <HelpCircle className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Support</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
} 