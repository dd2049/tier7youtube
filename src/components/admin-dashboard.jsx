"use client";

import { useEffect, useMemo, useState } from "react";

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState("Checking admin session...");
  const [query, setQuery] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [busyId, setBusyId] = useState("");

  async function loadVideos() {
    const response = await fetch("/api/admin/videos", { cache: "no-store" });
    if (response.status === 401) {
      setIsAuthed(false);
      setStatus("Enter the admin password to manage video locks.");
      return;
    }

    const data = await response.json();
    setVideos(data.videos);
    setIsAuthed(true);
    setStatus(`${data.totalCount} videos loaded. ${data.lockedCount} locked.`);
  }

  useEffect(() => {
    loadVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return videos.filter((video) => video.title.toLowerCase().includes(lowered) || video.id.toLowerCase().includes(lowered));
  }, [videos, query]);

  async function login(event) {
    event.preventDefault();
    setStatus("Signing in...");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setStatus("Password did not work.");
      return;
    }

    setPassword("");
    await loadVideos();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setVideos([]);
    setIsAuthed(false);
    setStatus("Signed out.");
  }

  async function toggleLock(video) {
    setBusyId(video.id);
    const response = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: video.id, locked: !video.locked })
    });

    if (!response.ok) {
      setStatus("Could not update that video.");
      setBusyId("");
      return;
    }

    await loadVideos();
    setBusyId("");
  }

  async function importVideos() {
    setStatus("Checking YouTube for uploads...");
    const response = await fetch("/api/admin/import", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Import failed.");
      return;
    }

    await loadVideos();
    setStatus(`Import complete. ${data.added} new videos added as locked.`);
  }

  return (
    <>
      <header className="site-header admin-header">
        <div className="brand-lockup compact">
          <img src="/tier-seven-logo.png" alt="Tier Seven Trading" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Tier Seven command</p>
          <h1>Library Control</h1>
          <p className="subhead">Release lessons when they are ready. Locked videos stay out of the student library.</p>
        </div>
        <div className="stats-panel" aria-label="Admin stats">
          <div>
            <span>{videos.length || "--"}</span>
            <small>total lessons</small>
          </div>
          <div>
            <span>{videos.filter((video) => video.locked).length}</span>
            <small>locked</small>
          </div>
        </div>
      </header>

      <main>
        {!isAuthed ? (
          <form className="login-panel" onSubmit={login}>
            <label className="field">
              <span>Admin password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
              />
            </label>
            <div className="admin-actions" style={{ marginTop: 14 }}>
              <button className="primary-button" type="submit">Sign in</button>
              <a className="admin-link" href="/">Back to library</a>
            </div>
          </form>
        ) : (
          <section className="admin-panel">
            <div className="toolbar" style={{ position: "static", boxShadow: "none" }}>
              <label className="search-box">
                <span>Find video</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search title or ID"
                />
              </label>
              <div className="admin-actions">
                <button className="primary-button" onClick={importVideos} type="button">Import uploads</button>
                <a className="admin-link" href="/">View library</a>
                <button onClick={logout} type="button">Sign out</button>
              </div>
            </div>

            <p className="status-note">{status}</p>

            <div className="admin-grid">
              {filteredVideos.map((video) => (
                <article className="admin-row" key={video.id}>
                  <div>
                    <p className={video.locked ? "admin-meta locked" : "admin-meta unlocked"}>
                      {video.locked ? "Locked" : "Live"} · {video.source}
                    </p>
                    <h2>{video.title}</h2>
                    <p className="subhead" style={{ marginTop: 6 }}>{video.url}</p>
                  </div>
                  <button
                    className={video.locked ? "primary-button" : ""}
                    disabled={busyId === video.id}
                    onClick={() => toggleLock(video)}
                    type="button"
                  >
                    {video.locked ? "Release" : "Lock"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <p className="results-meta">{status}</p>
      </main>
    </>
  );
}
