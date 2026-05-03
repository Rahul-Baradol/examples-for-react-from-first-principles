// @ts-ignore
import { useState, useEffect } from 'rffp';

const PRICE_SERIES = [100, 115, 95, 120, 105, 85, 130, 110, 90, 125];
const logLines: string[] = [];

let tickCount = 0;
let setStateCalls = 0;
let effectRuns = 0;
let frameCount = 0;

export function AppContent() {
    const priceState   = useState("price-val");
    const changeState  = useState("change-val");
    const holdingsState = useState("holdings-val");
    const portfolioState = useState("portfolio-val");
    const statusState  = useState("status-msg");
    const logState     = useState("log-list");

    // ── Effect 1: price → recompute portfolio ─────────────────────────────
    // Reads price-val and holdings-val from the DOM — but setState only
    // queues the update; the DOM still shows the OLD value at this point.
    useEffect(() => {
        effectRuns++;
        const price    = parseFloat(document.getElementById("price-val")?.textContent ?? "0");
        const holdings = parseInt(document.getElementById("holdings-val")?.textContent ?? "0");
        const result   = (price * holdings).toFixed(2);
        console.log(`[Effect 1] price→portfolio | DOM price=${price} (STALE) → $${result}`);
        setStateCalls++;
        portfolioState.setState(result);
    }, [priceState.stateId]);

    // ── Effect 2: holdings → recompute portfolio ──────────────────────────
    // Same stale-DOM problem: holdings-val hasn't been updated yet either.
    useEffect(() => {
        effectRuns++;
        const price    = parseFloat(document.getElementById("price-val")?.textContent ?? "0");
        const holdings = parseInt(document.getElementById("holdings-val")?.textContent ?? "0");
        const result   = (price * holdings).toFixed(2);
        console.log(`[Effect 2] holdings→portfolio | DOM price=${price} (STALE), holdings=${holdings} (STALE) → $${result}`);
        setStateCalls++;
        portfolioState.setState(result);
    }, [holdingsState.stateId]);

    // ── Effect 3: portfolio → update status (chained from Effect 1/2) ─────
    // Also reads stale DOM: portfolio-val still shows the previous value.
    useEffect(() => {
        effectRuns++;
        const val = parseFloat(document.getElementById("portfolio-val")?.textContent ?? "0");
        console.log(`[Effect 3] portfolio→status | DOM portfolio=${val} (STALE)`);
        setStateCalls++;
        const msg = val > 800
            ? `⚠️  High exposure! Portfolio = $${val.toFixed(2)}  (reading stale DOM)`
            : `Portfolio nominal: $${val.toFixed(2)}  (reading stale DOM)`;
        statusState.setState(msg);
    }, [portfolioState.stateId]);

    // ── Effect 4: price → append to log ──────────────────────────────────
    // The price in the log entry is read from DOM — still the old price.
    useEffect(() => {
        effectRuns++;
        const stalePrice = document.getElementById("price-val")?.textContent ?? "?";
        const entry = `Tick ${tickCount}: effect sees DOM price="${stalePrice}" — new price not rendered yet`;
        logLines.unshift(entry);
        if (logLines.length > 8) logLines.pop();
        console.log(`[Effect 4] price→log | ${entry}`);
        setStateCalls++;
        logState.setState(logLines.map(l => `<li>${l}</li>`).join(""));
    }, [priceState.stateId]);

    // ── Price ticker: fires every 2 seconds ───────────────────────────────
    setInterval(() => {
        tickCount++;
        const newPrice  = PRICE_SERIES[tickCount % PRICE_SERIES.length];
        const prevPrice = PRICE_SERIES[(tickCount - 1) % PRICE_SERIES.length];
        const delta     = newPrice - prevPrice;
        console.log(`\n▶ Tick ${tickCount} (t=${tickCount * 2}s) — setState(price="${newPrice}"), DOM won't update for ≤1s`);
        setStateCalls++; priceState.setState(String(newPrice));
        setStateCalls++; changeState.setState((delta >= 0 ? "+" : "") + delta);
    }, 2000);

    // ── t=8s: user increases holdings ────────────────────────────────────
    // setTimeout(() => {
    //     console.log("\n▶ t=8s — User action: setState(holdings='10')");
    //     setStateCalls++;
    //     holdingsState.setState("10");
    // }, 8000);

    // ── t=12s: rapid-fire (no batching!) ─────────────────────────────────
    // 3 setState calls → effects run 3× each → 3× the DOM writes queued.
    // All for a result that could be computed once.
    // setTimeout(() => {
    //     console.log("\n▶ t=12s — Rapid-fire: 3× setState(price) with NO batching — watch effect count");
    //     [200, 300, 999].forEach(p => {
    //         setStateCalls++;
    //         priceState.setState(String(p));
    //     });
    // }, 12000);

    // ── t=18s: user reduces holdings ─────────────────────────────────────
    // setTimeout(() => {
    //     console.log("\n▶ t=18s — User action: setState(holdings='2')");
    //     setStateCalls++;
    //     holdingsState.setState("2");
    // }, 18000);

    // ── Stats panel: direct DOM writes, bypasses rffp entirely ───────────
    // Compare: these update immediately, every second, with zero lag.
    setInterval(() => {
        frameCount++;
        const set = (id: string, v: string | number) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(v);
        };
        set("stat-frames",   frameCount);
        set("stat-setstate", setStateCalls);
        set("stat-effects",  effectRuns);
    }, 1000);

    return `
        <div class="dashboard">
            <header>
                <h1>Stock Ticker</h1>
                <p class="subtitle">Built with <code>rffp</code> — open DevTools Console to follow along</p>
            </header>

            <section class="stats-bar">
                <div class="stat">
                    <span class="stat-label">Render-loop frames (1 s each)</span>
                    <span class="stat-num" id="stat-frames">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">setState() calls (total)</span>
                    <span class="stat-num" id="stat-setstate">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Effect runs (total)</span>
                    <span class="stat-num" id="stat-effects">0</span>
                </div>
                <div class="stat-note">
                    Stats update every 1 s via direct DOM writes (not rffp) — no lag here
                </div>
            </section>

            <section class="cards">
                <div class="card">
                    <div class="card-label">BTC Price ($)</div>
                    <div class="card-value" id="price-val">100</div>
                </div>
                <div class="card">
                    <div class="card-label">Change</div>
                    <div class="card-value" id="change-val">—</div>
                </div>
                <div class="card">
                    <div class="card-label">Holdings (units)</div>
                    <div class="card-value" id="holdings-val">5</div>
                </div>
                <div class="card card--hi">
                    <div class="card-label">Portfolio Value ($)</div>
                    <div class="card-value" id="portfolio-val">500.00</div>
                </div>
            </section>

            <div id="status-msg" class="status-bar">Waiting for first tick…</div>

            <section class="log-panel">
                <h3>
                    Price Change Log
                    <small>effects read stale DOM — always one tick behind</small>
                </h3>
                <ul id="log-list"></ul>
            </section>

            <section class="explainer">
                <h3>What to watch for</h3>
                <ol>
                    <li><strong>Polling lag (≤1 s)</strong> — price changes in console before the card updates on screen</li>
                    <li><strong>Stale DOM reads</strong> — the log says <em>the old price</em>, not the new one; portfolio is always one tick behind</li>
                    <li><strong>Effect chains</strong> — one setState triggers Effect 1 → portfolioState.setState → Effect 3 → statusState.setState; three DOM writes for one price tick</li>
                    <li><strong>No batching (t=12 s)</strong> — 3 rapid price changes trigger all effects 3× each; effect-run counter jumps by 9</li>
                    <li><strong>Render loop spam</strong> — frames counter increments every second whether anything changed or not</li>
                </ol>
            </section>
        </div>
    `;
}
