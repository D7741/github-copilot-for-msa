import { useEffect, useState } from "react";
import {
  ArrowClockwise20Regular,
  ArrowUpRight20Regular,
  Briefcase20Filled,
  Building20Regular,
  CalendarLtr20Regular,
  ChevronRight20Regular,
  ErrorCircle20Regular,
  Location20Regular,
  Search20Regular,
} from "@fluentui/react-icons";
import { Button, Spinner } from "@fluentui/react-components";

import { getLatestRun, getListings, startCollection } from "./api";
import type { CollectionRun, Listing, ListingSort } from "./types";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Never";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRelativeDate(value: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  if (days === 0) return "Added today";
  if (days === 1) return "Added yesterday";
  return `Added ${days} days ago`;
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [run, setRun] = useState<CollectionRun | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ListingSort>("recent");
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getListings(), getLatestRun()])
      .then(([nextListings, latestRun]) => {
        if (!active) return;
        setListings(nextListings);
        setRun(latestRun);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load data.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (run?.status !== "running") return;

    const timer = window.setInterval(() => {
      getLatestRun()
        .then((latestRun) => {
          setRun(latestRun);
          if (latestRun?.status !== "running") {
            setCollecting(false);
            void getListings().then((nextListings) => {
              setListings(nextListings);
              setSelectedListing(null);
            });
          }
        })
        .catch((pollError: unknown) => {
          setError(
            pollError instanceof Error
              ? pollError.message
              : "Unable to refresh collection status.",
          );
          setCollecting(false);
        });
    }, 750);

    return () => window.clearInterval(timer);
  }, [run?.status]);

  async function handleCollection(): Promise<void> {
    setError(null);
    setCollecting(true);
    try {
      setRun(await startCollection());
    } catch (collectionError) {
      setError(
        collectionError instanceof Error
          ? collectionError.message
          : "Unable to start collection.",
      );
      setCollecting(false);
    }
  }

  async function handleSearch(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    try {
      setListings(await getListings(search.trim(), sort));
      setSelectedListing(null);
    } catch (searchError) {
      setError(
        searchError instanceof Error ? searchError.message : "Search failed.",
      );
    }
  }

  async function handleSortChange(nextSort: ListingSort): Promise<void> {
    setSort(nextSort);
    setError(null);
    try {
      setListings(await getListings(search.trim(), nextSort));
      setSelectedListing(null);
    } catch (sortError) {
      setError(
        sortError instanceof Error ? sortError.message : "Unable to sort roles.",
      );
    }
  }

  const activeListing = selectedListing ?? listings[0] ?? null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Job Finder home">
          <span className="brand-mark"><Briefcase20Filled /></span>
          Job<span>Finder</span>
        </a>
        <div className="refresh-control">
          <span className="refresh-timestamp">
            Updated {formatTimestamp(run?.completedAt ?? null)}
          </span>
          <Button
            appearance="subtle"
            disabled={collecting || run?.status === "running"}
            icon={<ArrowClockwise20Regular />}
            onClick={() => void handleCollection()}
          >
            {collecting || run?.status === "running" ? "Refreshing" : "Refresh jobs"}
          </Button>
        </div>
      </header>

      <main>
        <section className="search-hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">New Zealand tech</p>
            <h1 id="page-title">Find work that fits.</h1>
          </div>
          <form className="search-form" onSubmit={(event) => void handleSearch(event)}>
            <Search20Regular aria-hidden="true" />
            <label className="sr-only" htmlFor="job-search">Search roles</label>
            <input
              id="job-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Job title, skill or company"
              type="search"
              value={search}
            />
            <Button appearance="primary" type="submit">Find jobs</Button>
          </form>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <ErrorCircle20Regular aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="results-bar">
          <div>
            <strong>{listings.length} software roles</strong>
            <span> across New Zealand</span>
          </div>
          <label htmlFor="job-sort">Sort by</label>
          <select
            id="job-sort"
            onChange={(event) => void handleSortChange(event.target.value as ListingSort)}
            value={sort}
          >
            <option value="recent">Most recent</option>
            <option value="title">Title A-Z</option>
            <option value="company">Company A-Z</option>
            <option value="location">Location A-Z</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state" aria-live="polite">
            <Spinner label="Loading current roles" />
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><Search20Regular /></span>
            <h2>No matching jobs yet</h2>
            <p>Try another search or refresh to check the latest vacancies.</p>
            <Button appearance="primary" onClick={() => void handleCollection()}>
              Refresh jobs
            </Button>
          </div>
        ) : (
          <div className="job-workspace">
            <section className="job-list" aria-label="Job results">
              {listings.map((listing) => (
                <button
                  aria-pressed={activeListing?.id === listing.id}
                  className={`job-card${activeListing?.id === listing.id ? " selected" : ""}`}
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  type="button"
                >
                  <span className="company-avatar" aria-hidden="true">
                    {listing.companyName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="job-card-copy">
                    <strong>{listing.title}</strong>
                    <span className="company-name">{listing.companyName}</span>
                    <span className="job-meta">
                      <span><Location20Regular />{listing.location ?? "Location flexible"}</span>
                      <span>{formatRelativeDate(listing.firstSeenAt)}</span>
                    </span>
                  </span>
                  <ChevronRight20Regular className="card-arrow" aria-hidden="true" />
                </button>
              ))}
            </section>

            {activeListing && (
              <aside className="job-detail" aria-labelledby="listing-detail-title">
                <div className="detail-accent" />
                <div className="detail-heading">
                  <span className="company-avatar large" aria-hidden="true">
                    {activeListing.companyName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className={`status-pill ${activeListing.status}`}>
                    {activeListing.status}
                  </span>
                </div>
                <h2 id="listing-detail-title">{activeListing.title}</h2>
                <p className="detail-company">{activeListing.companyName}</p>
                <div className="detail-facts">
                  <span><Location20Regular />{activeListing.location ?? "Location flexible"}</span>
                  <span><CalendarLtr20Regular />Collected {formatTimestamp(activeListing.lastSeenAt)}</span>
                  <span><Building20Regular />Source: {activeListing.companyName}</span>
                </div>
                <Button
                  appearance="primary"
                  as="a"
                  href={activeListing.sourceUrl}
                  icon={<ArrowUpRight20Regular />}
                  iconPosition="after"
                  target="_blank"
                >
                  View original job
                </Button>
                <div className="detail-body">
                  <h3>About this role</h3>
                  <p>{activeListing.summary ?? "The source has not provided a summary. Open the original listing to review the complete role, requirements and application details."}</p>
                </div>
              </aside>
            )}
          </div>
        )}
      </main>

      <footer>
        <span>Job Finder</span>
        <span>Local-first job discovery for New Zealand</span>
      </footer>
    </div>
  );
}
