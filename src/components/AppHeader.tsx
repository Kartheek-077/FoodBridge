import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, PackagePlus, Settings, ShieldCheck, Bell, Search } from "lucide-react";
import { useState } from "react";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import type { Role } from "@/lib/types";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; search?: Record<string, unknown> };

function navFor(role: Role | null): NavItem[] {
  if (role === "donor")
    return [
      { to: "/donor", label: "Dashboard", icon: LayoutDashboard },
      { to: "/donor/donations/new", label: "Donate food", icon: PackagePlus },
    ];
  if (role === "ngo")
    return [
      { to: "/ngo", label: "Browse food", icon: Search, search: { tab: "browse" } },
      { to: "/ngo", label: "My claims", icon: LayoutDashboard, search: { tab: "claims" } },
    ];
  if (role === "admin") return [{ to: "/admin", label: "Admin", icon: ShieldCheck }];
  return [];
}

const linkCls =
  "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeCls = "bg-primary-soft text-primary-deep hover:bg-primary-soft";

export function AppHeader() {
  const { user, role, status, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = navFor(role);

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login", replace: true });
  };

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo to={homePathForRole(role)} />

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search as never}
              className={linkCls}
              activeProps={{ className: activeCls }}
              activeOptions={{ exact: true, includeSearch: !!item.search }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ) : status === "authenticated" && user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm font-medium shadow-soft hover:bg-muted md:flex">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <span className="max-w-32 truncate">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>
                    <p className="truncate">{user.name}</p>
                    <p className="truncate text-xs font-normal capitalize text-muted-foreground">{user.role} account</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate({ to: homePathForRole(role) })}>
                    <LayoutDashboard /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/notifications" })}>
                    <Bell /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
                    <Settings /> Profile & settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 px-4" onClick={() => setOpen(false)}>
                {user ? (
                  <>
                    {items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        search={item.search as never}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium hover:bg-muted"
                      >
                        <item.icon className="size-4 text-primary" /> {item.label}
                      </Link>
                    ))}
                    <Link to="/notifications" className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium hover:bg-muted">
                      <Bell className="size-4 text-primary" /> Notifications
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium hover:bg-muted">
                      <Settings className="size-4 text-primary" /> Profile & settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-destructive hover:bg-destructive-soft"
                    >
                      <LogOut className="size-4" /> Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="rounded-xl px-3 py-2.5 font-medium hover:bg-muted">
                      Log in
                    </Link>
                    <Link to="/register" className="rounded-xl px-3 py-2.5 font-medium hover:bg-muted">
                      Create an account
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
