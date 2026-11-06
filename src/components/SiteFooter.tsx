import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-card/60">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Surplus food, rescued and shared — connecting kitchens with verified NGOs before good food goes to waste.
          </p>
        </div>
        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/register" search={{ role: "donor" }} className="hover:text-foreground">
            Donate food
          </Link>
          <Link to="/register" search={{ role: "ngo" }} className="hover:text-foreground">
            Join as NGO
          </Link>
          <Link to="/login" className="hover:text-foreground">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  );
}
