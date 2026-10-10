"use client";

import { useState } from "react";

type Trip = {
  from: string;
  destination: string;
  days: string;
  budget: string;
  travellers: string;
  style: string;
};

type Activity = {
  time: string;
  name: string;
  description: string;
  estimatedCost: number;
  travelNote: string;
};

type ItineraryDay = {
  day: number;
  title: string;
  description: string;
  activities: Activity[];
};

type BudgetBreakdown = {
  transportation: number;
  accommodation: number;
  food: number;
  localTransport: number;
  activities: number;
  emergencyReserve: number;
};

type TripPlan = {
  tripTitle: string;
  introduction: string;
  destination: string;
  estimatedBudget: number;
  budgetBreakdown: BudgetBreakdown;
  budgetAdvice: string;
  itinerary: ItineraryDay[];
  practicalTips: string[];
  importantDisclaimer: string;
};

function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 4C10 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-7 11-16Z" />
      <path d="M3 21c3-6 7-9 12-12" />
    </svg>
  );
}

const destinationCards = [
  {
    number: "01",
    name: "Darjeeling",
    region: "WEST BENGAL",
    description: "Tea gardens & mountain air",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85",
  },
  {
    number: "02",
    name: "Kerala",
    region: "SOUTH INDIA",
    description: "Backwaters & slower days",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=85",
  },
  {
    number: "03",
    name: "Meghalaya",
    region: "NORTHEAST INDIA",
    description: "Waterfalls & misty trails",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85",
  },
];

const budgetLabels: Record<keyof BudgetBreakdown, string> = {
  transportation: "Intercity travel",
  accommodation: "Accommodation",
  food: "Food & dining",
  localTransport: "Local transport",
  activities: "Activities",
  emergencyReserve: "Emergency reserve",
};

function formatINR(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export default function Home() {
  const [trip, setTrip] = useState<Trip>({
    from: "Ranchi",
    destination: "",
    days: "3",
    budget: "10000",
    travellers: "2",
    style: "Balanced",
  });

  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateTrip(field: keyof Trip, value: string) {
    setTrip((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    if (!trip.from.trim() || !trip.destination.trim()) {
      setError("Add your starting city and destination to get started.");
      return;
    }

    if (
      !Number.isFinite(Number(trip.days)) ||
      Number(trip.days) < 1 ||
      !Number.isFinite(Number(trip.budget)) ||
      Number(trip.budget) <= 0
    ) {
      setError("Please enter a valid trip duration and budget.");
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trip),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "We couldn't plan your trip. Please try again.",
        );
      }

      if (
        !data.plan ||
        !Array.isArray(data.plan.itinerary) ||
        typeof data.plan.tripTitle !== "string" ||
        !data.plan.budgetBreakdown
      ) {
        throw new Error("The AI returned an incomplete itinerary.");
      }

      setPlan(data.plan);

      window.setTimeout(() => {
        document
          .getElementById("itinerary")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectDestination(destination: string) {
    updateTrip("destination", destination);

    document
      .getElementById("planner")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      {/* Navigation */}

      <header className="navbar">
        <a className="brand" href="#" aria-label="Elsewhere home">
          <span className="brand-mark">
            <CompassIcon />
          </span>

          <span>elsewhere</span>
          <span className="brand-period">.</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#inspiration">Find inspiration</a>
        </nav>

        <a className="nav-cta" href="#planner">
          Plan a trip <ArrowIcon size={15} />
        </a>
      </header>

      {/* Hero */}

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            A little help finding your way
          </div>

          <h1>
            Less planning.
            <br />
            <span>More being there.</span>
          </h1>

          <p className="hero-description">
            Tell us what you have in mind. We&apos;ll help you find the
            places, routes, and little moments that make a trip yours.
          </p>

          <div className="hero-actions">
            <a className="button-primary" href="#planner">
              Plan your escape <ArrowIcon />
            </a>

            <a className="text-link" href="#inspiration">
              Get inspired <span>↓</span>
            </a>
          </div>

          <div className="hero-note">
            <div className="avatar-stack" aria-hidden="true">
              <span>✳</span>
              <span>↗</span>
              <span>⌁</span>
            </div>

            <p>
              Your pace. Your budget.
              <br />
              <strong>A trip that feels like yours.</strong>
            </p>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image">
            <div className="image-caption">
              <span>01 / FIND YOUR SOMEWHERE</span>
              <span>YOUR NEXT ADVENTURE</span>
            </div>
          </div>

          <div className="floating-note">
            <span className="note-icon">
              <LeafIcon />
            </span>

            <div>
              <p className="note-label">A gentle reminder</p>
              <p className="note-title">
                The best plans
                <br />
                leave a little room.
              </p>
            </div>
          </div>

          <span className="visual-decoration" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>

      {/* Trip planner */}

      <section className="planner-section" id="planner">
        <div className="section-heading">
          <div>
            <span className="section-kicker">YOUR NEXT CHAPTER</span>
            <h2>Where to, daydreamer?</h2>
            <p>A few details are all we need to get you started.</p>
          </div>

          <span className="step-indicator">01 — 04</span>
        </div>

        <form className="planner-card" onSubmit={handleSubmit}>
          <div className="planner-grid">
            <div className="field">
              <label htmlFor="from">STARTING FROM</label>

              <div className="input-wrap">
                <PinIcon />

                <input
                  id="from"
                  value={trip.from}
                  onChange={(event) =>
                    updateTrip("from", event.target.value)
                  }
                  placeholder="Your city"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="destination">I WANT TO GO TO</label>

              <div className="input-wrap">
                <CompassIcon />

                <input
                  id="destination"
                  value={trip.destination}
                  onChange={(event) =>
                    updateTrip("destination", event.target.value)
                  }
                  placeholder="A place on your mind..."
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="days">HOW LONG?</label>

              <div className="input-wrap">
                <ClockIcon />

                <select
                  id="days"
                  value={trip.days}
                  onChange={(event) =>
                    updateTrip("days", event.target.value)
                  }
                >
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="7">1 week</option>
                  <option value="10">10 days</option>
                  <option value="14">2 weeks</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="budget">YOUR TOTAL BUDGET (INR)</label>

              <div className="input-wrap">
                <span className="currency-symbol">₹</span>

                <input
                  id="budget"
                  type="number"
                  min="1"
                  max="100000000"
                  value={trip.budget}
                  onChange={(event) =>
                    updateTrip("budget", event.target.value)
                  }
                  placeholder="10000"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="travellers">WHO&apos;S COMING?</label>

              <div className="input-wrap">
                <span className="field-emoji" aria-hidden="true">
                  ♧
                </span>

                <select
                  id="travellers"
                  value={trip.travellers}
                  onChange={(event) =>
                    updateTrip("travellers", event.target.value)
                  }
                >
                  <option value="1">Just me</option>
                  <option value="2">2 travellers</option>
                  <option value="3">3 travellers</option>
                  <option value="4">4 travellers</option>
                  <option value="5">5 travellers</option>
                  <option value="6">6 travellers</option>
                  <option value="7">7 travellers</option>
                  <option value="8">8+ travellers</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="style">YOUR TRAVEL STYLE</label>

              <div className="input-wrap">
                <LeafIcon />

                <select
                  id="style"
                  value={trip.style}
                  onChange={(event) =>
                    updateTrip("style", event.target.value)
                  }
                >
                  <option value="Budget">Keep it affordable</option>
                  <option value="Balanced">A little of everything</option>
                  <option value="Comfort">Comfort comes first</option>
                  <option value="Adventure">Outdoors & adventure</option>
                  <option value="Slow">Slow & unhurried</option>
                </select>
              </div>
            </div>
          </div>

          <div className="planner-footer">
            <div className="privacy-note">
              <span>✳</span>
              Made around you, never the other way around.
            </div>

            <button
              className="button-primary submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Planning your trip..." : "Build my itinerary"}

              {!loading && <ArrowIcon />}
            </button>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {loading && (
            <div className="loading-panel" role="status" aria-live="polite">
              <span className="loading-spinner" />

              <div>
                <strong>Putting your trip together.</strong>
                <p>
                  Thinking through places, activities, and your budget...
                </p>
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Destination inspiration */}

      <section className="inspiration-section" id="inspiration">
        <div className="section-heading inspiration-heading">
          <div>
            <span className="section-kicker">A PLACE TO BEGIN</span>
            <h2>Somewhere feels right.</h2>
            <p>A few places worth getting out of bed for.</p>
          </div>

          <span className="inspiration-aside">
            A little inspiration, India.
          </span>
        </div>

        <div className="destination-grid">
          {destinationCards.map((destination) => (
            <button
              className="destination-card"
              key={destination.name}
              style={{
                backgroundImage: `url("${destination.image}")`,
              }}
              onClick={() => selectDestination(destination.name)}
              type="button"
              aria-label={`Plan a trip to ${destination.name}`}
            >
              <span className="destination-number">
                {destination.number}
              </span>

              <span className="destination-info">
                <span className="destination-country">
                  {destination.region}
                </span>

                <span className="destination-name">
                  {destination.name}
                </span>

                <span className="destination-description">
                  {destination.description}
                </span>
              </span>

              <span className="destination-arrow">
                <ArrowIcon />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}

      <section className="philosophy-section" id="how-it-works">
        <span className="section-kicker">A BETTER WAY TO GET AWAY</span>

        <h2>
          The plan is important.
          <br />
          <span>The feeling is everything.</span>
        </h2>

        <div className="philosophy-grid">
          <article>
            <span className="philosophy-number">01</span>

            <h3>Tell us what matters.</h3>

            <p>
              Your budget, your people, your pace. Start with what you
              actually want from a trip.
            </p>
          </article>

          <article>
            <span className="philosophy-number">02</span>

            <h3>Find your own way.</h3>

            <p>
              Explore thoughtful itineraries, possible routes, and
              recommendations that fit your plans.
            </p>
          </article>

          <article>
            <span className="philosophy-number">03</span>

            <h3>Leave room for life.</h3>

            <p>
              Adjust your plans when things change. The best adventures
              aren&apos;t always the ones you expected.
            </p>
          </article>
        </div>
      </section>

      {/* Actual AI itinerary */}

      {plan && (
        <section className="itinerary-section" id="itinerary">
          <div className="itinerary-top">
            <div>
              <span className="section-kicker">
                YOUR TRIP, TAKING SHAPE
              </span>

              <h2>{plan.tripTitle}</h2>

              <p className="itinerary-subtitle">
                {trip.from} → {plan.destination} · {trip.days} days ·{" "}
                {trip.travellers} traveller(s)
              </p>

              <p className="itinerary-introduction">
                {plan.introduction}
              </p>
            </div>

            <button
              className="text-link"
              type="button"
              onClick={() => {
                document
                  .getElementById("planner")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Adjust your trip ↗
            </button>
          </div>

          <div className="itinerary-notice">
            <span>i</span>

            <p>
              <strong>Before you go.</strong>{" "}
              {plan.importantDisclaimer}
            </p>
          </div>

          <div className="itinerary-layout">
            <div className="day-list">
              {plan.itinerary.map((day) => (
                <article className="day-card" key={day.day}>
                  <div className="day-marker">
                    <span>DAY</span>

                    <strong>
                      {String(day.day).padStart(2, "0")}
                    </strong>
                  </div>

                  <div className="day-content">
                    <span className="section-kicker">
                      DAY {day.day}
                    </span>

                    <h3>{day.title}</h3>

                    <p>{day.description}</p>

                    <div className="activity-list">
                      {day.activities.map((activity, index) => (
                        <div
                          className="activity-item"
                          key={`${day.day}-${index}`}
                        >
                          <span className="activity-time">
                            {activity.time}
                          </span>

                          <strong>{activity.name}</strong>

                          <p>{activity.description}</p>

                          <small>
                            Estimated cost:{" "}
                            {formatINR(activity.estimatedCost)}
                          </small>

                          {activity.travelNote && (
                            <p className="activity-travel-note">
                              {activity.travelNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="budget-card">
              <span className="section-kicker">YOUR BUDGET</span>

              <p className="budget-label">Estimated trip expenses</p>

              <h3>{formatINR(plan.estimatedBudget)}</h3>

              <p className="budget-disclaimer">
                Your entered budget: {formatINR(Number(trip.budget))}
              </p>

              <div className="budget-divider" />

              {(
                Object.entries(plan.budgetBreakdown) as [
                  keyof BudgetBreakdown,
                  number,
                ][]
              ).map(([category, amount]) => (
                <div className="budget-detail" key={category}>
                  <span>{budgetLabels[category]}</span>

                  <strong>{formatINR(amount)}</strong>
                </div>
              ))}

              <div className="budget-divider" />

              <p className="budget-advice">{plan.budgetAdvice}</p>

              <p className="budget-disclaimer">
                These are AI-generated estimates, not live travel prices.
                Verify costs and availability before booking.
              </p>
            </aside>
          </div>

          <section className="practical-tips">
            <span className="section-kicker">BEFORE YOU GO</span>

            <h3>A few useful things to know.</h3>

            <ul>
              {plan.practicalTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </section>
        </section>
      )}

      {/* Footer */}

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">
            <CompassIcon />
          </span>

          <span>elsewhere</span>
          <span className="brand-period">.</span>
        </a>

        <p>A little less planning. A little more living.</p>

        <span className="footer-credit">
          MADE FOR THE WAY YOU TRAVEL.
        </span>
      </footer>
    </main>
  );
}