"use client";

import { useMemo, useState } from "react";

function thumbnailUrl(video) {
  return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
}

export function StudentLibrary({ library }) {
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState("newest");

  const videos = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return library.videos
      .filter((video) => video.title.toLowerCase().includes(lowered) || video.id.toLowerCase().includes(lowered))
      .sort((a, b) => (sortDirection === "newest" ? a.order - b.order : b.order - a.order));
  }, [library.videos, query, sortDirection]);

  async function copyLink(url, event) {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(url);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      button.textContent = "Copy link";
    }, 1300);
  }

  return (
    <>
      <header className="site-header hero-header">
        <div className="brand-lockup">
          <img src="/tier-seven-logo.png" alt="Tier Seven Trading" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Engineered for mastery</p>
          <h1>Tier Seven Trading Library</h1>
          <p className="subhead">
            Private student access to class recordings, model lessons, live trade breakdowns, and weekly market outlooks.
          </p>
          <div className="hero-actions">
            <a className="watch-link" href="#library">Enter library</a>
            <a className="admin-link" href="/admin">Admin</a>
          </div>
        </div>
        <div className="stats-panel" aria-label="Library stats">
          <div>
            <span>{library.unlockedCount}</span>
            <small>available lessons</small>
          </div>
          <div>
            <span>{library.totalCount - library.unlockedCount}</span>
            <small>held back</small>
          </div>
        </div>
      </header>

      <main id="library">
        <section className="section-heading">
          <div>
            <p className="eyebrow">Training archive</p>
            <h2>Unlocked videos</h2>
          </div>
          <p>{videos.length} of {library.unlockedCount} lessons visible</p>
        </section>

        <section className="toolbar" aria-label="Video filters">
          <label className="search-box">
            <span>Search videos</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search title, market, class, date..."
              autoComplete="off"
            />
          </label>
          <div className="toolbar-actions">
            <button
              className={sortDirection === "newest" ? "is-active" : ""}
              onClick={() => setSortDirection("newest")}
              type="button"
            >
              Newest first
            </button>
            <button
              className={sortDirection === "oldest" ? "is-active" : ""}
              onClick={() => setSortDirection("oldest")}
              type="button"
            >
              Oldest first
            </button>
          </div>
        </section>

        <section className="results-meta" aria-live="polite">
          <p>{videos.length} of {library.unlockedCount} unlocked videos shown</p>
        </section>

        <section className="video-grid" aria-label="YouTube video links">
          {videos.map((video) => (
            <article className="video-card" key={video.id}>
              <a className="thumb-link" href={video.url} target="_blank" rel="noopener noreferrer">
                <img className="thumb" src={thumbnailUrl(video)} alt={`${video.title} thumbnail`} loading="lazy" />
                <span className="play-mark">Watch</span>
              </a>
              <div className="card-body">
                <p className="card-meta">Lesson {String(video.order).padStart(2, "0")}</p>
                <h2>{video.title}</h2>
                <div className="card-actions">
                  <a className="watch-link" href={video.url} target="_blank" rel="noopener noreferrer">Open video</a>
                  <button type="button" onClick={(event) => copyLink(video.url, event)}>Copy link</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {videos.length === 0 ? <p className="empty-state">No matching unlocked videos found.</p> : null}
      </main>
    </>
  );
}
