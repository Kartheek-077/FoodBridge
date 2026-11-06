import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  HandHeart,
  Hotel,
  PartyPopper,
  School,
  Soup,
  Truck,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { adminApi } from "@/lib/api";
import heroImg from "@/assets/hero-food-sharing.jpg";
import biryaniImg from "@/assets/food-biryani.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodBridge — Rescue surplus food, feed people in need" },
      {
        name: "description",
        content:
          "Restaurants, hotels, marriage halls and hostels post surplus food. Verified NGOs claim and collect it before it expires.",
      },
      { property: "og:title", content: "FoodBridge — Rescue surplus food, feed people in need" },
      {
        property: "og:description",
        content: "Connecting food donors with verified NGOs so good food reaches people, not landfills.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FALLBACK_STATS = { mealsSaved: 12480, activeDonors: 320, verifiedNgos: 66 };

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Counter({ value, label, icon: Icon }: { value: number | null; label: string; icon: typeof Users }) {
  const n = useCountUp(value ?? 0);
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-card">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="size-6" />
      </span>
      <div>
        {value === null ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        ) : (
          <p className="font-display text-3xl font-semibold tabular-nums text-primary-deep sm:text-4xl">
            {n.toLocaleString("en-IN")}
            <span className="text-warm">+</span>
          </p>
        )}
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Donors post surplus",
    text: "A restaurant, hotel or hall lists extra food with quantity, photo, pickup window and expiry.",
  },
  {
    icon: HandHeart,
    title: "Verified NGOs claim",
    text: "Nearby NGOs get an instant alert, check the details and claim it with a pickup time.",
  },
  {
    icon: Truck,
    title: "Food reaches people",
    text: "The NGO collects the food and both sides track it until it's marked collected.",
  },
];

const DONORS = [
  { icon: Soup, label: "Restaurants" },
  { icon: Hotel, label: "Hotels" },
  { icon: Building2, label: "Marriage halls" },
  { icon: School, label: "Hostels" },
  { icon: PartyPopper, label: "Event organizers" },
];

function Landing() {
  const { data, isError } = useQuery({ queryKey: ["impact"], queryFn: adminApi.stats, retry: 1 });
  const stats = data ?? (isError ? FALLBACK_STATS : null);

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Volunteers packing surplus food into containers in a community kitchen"
          width={1600}
          height={1104}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="container-page py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <BadgeCheck className="size-3.5" /> Every NGO on FoodBridge is verified
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Good food belongs on plates, <em className="text-warm not-italic">not in bins.</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
              FoodBridge connects kitchens with surplus food to verified NGOs who collect it before it expires — so
              tonight's leftovers become tomorrow's meals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="hero" asChild>
                <Link to="/register" search={{ role: "donor" }}>
                  Donate food <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="heroOutline" asChild>
                <Link to="/register" search={{ role: "ngo" }}>
                  Join as NGO
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="container-page -mt-10 relative z-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Counter value={stats?.mealsSaved ?? null} label="Meals saved" icon={Soup} />
          <Counter value={stats?.activeDonors ?? null} label="Active donors" icon={Users} />
          <Counter value={stats?.verifiedNgos ?? null} label="Verified NGOs" icon={BadgeCheck} />
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warm">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From kitchen to community in three steps</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl border bg-card p-7 shadow-card">
              <span className="absolute right-6 top-5 font-display text-5xl font-semibold text-primary-soft">{i + 1}</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
                <s.icon className="size-6" />
              </span>
              <h3 className="mt-5 font-sans text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who donates */}
      <section className="bg-dotted py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warm">For donors</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Post surplus in under a minute</h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Whether it's a buffet that over-delivered or a wedding with 200 extra plates, FoodBridge finds a verified
              NGO nearby and keeps you updated until the food is collected.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {DONORS.map((d) => (
                <span key={d.label} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-soft">
                  <d.icon className="size-4 text-primary" /> {d.label}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src={biryaniImg}
              alt="Trays of surplus biryani, paneer curry and naan"
              width={1024}
              height={768}
              loading="lazy"
              className="rounded-3xl shadow-lift"
            />
            <div className="absolute -bottom-6 left-6 rounded-2xl border bg-card p-4 shadow-lift">
              <p className="text-xs font-semibold text-muted-foreground">Claimed in</p>
              <p className="font-display text-2xl font-semibold text-primary-deep">12 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-semibold sm:text-4xl">Ready to bridge the gap?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/85">
            Join kitchens and NGOs already turning surplus into meals across the city.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="hero" asChild>
              <Link to="/register" search={{ role: "donor" }}>
                Donate food
              </Link>
            </Button>
            <Button size="lg" variant="heroOutline" asChild>
              <Link to="/register" search={{ role: "ngo" }}>
                Join as NGO
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
