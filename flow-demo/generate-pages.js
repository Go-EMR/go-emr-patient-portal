#!/usr/bin/env node
/**
 * Generates individual flow-*.html pages from app.js flow data
 */
const fs = require('fs');
const path = require('path');

// Import flow data
const { FLOWS, STEP_COLORS } = require('./app.js');

const dir = __dirname;

FLOWS.forEach(flow => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${flow.title} — GoHealth Flow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    .flow-page { padding: 80px 2rem 3rem; max-width: 900px; margin: 0 auto; }
    .flow-page-header { margin-bottom: 2.5rem; }
    .flow-page-num { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--maroon); margin-bottom: 0.4rem; }
    .flow-page-title { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 800; color: var(--black); margin-bottom: 0.75rem; line-height: 1.2; }
    .flow-page-desc { font-size: 1.05rem; color: var(--text-light); line-height: 1.7; margin-bottom: 1.5rem; }
    .flow-page-features { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 2rem; }
    .flow-page-features .feature-pill { font-size: 0.75rem; font-weight: 600; padding: 5px 14px; border-radius: 999px; border: 1px solid var(--stone); color: var(--text-light); background: var(--white); }

    /* Stage cards */
    .stage { background: var(--white); border: 1px solid var(--stone-light); border-radius: var(--radius); margin-bottom: 1.5rem; overflow: hidden; transition: var(--transition); }
    .stage:hover { box-shadow: var(--shadow-md); border-color: var(--orange); }
    .stage-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; cursor: pointer; }
    .stage-num { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: white; flex-shrink: 0; }
    .stage-header-text { flex: 1; }
    .stage-title { font-size: 1.05rem; font-weight: 700; color: var(--black); }
    .stage-module { display: inline-block; font-size: 0.65rem; font-weight: 600; color: var(--maroon); background: rgba(120,41,15,0.1); padding: 2px 8px; border-radius: 4px; margin-top: 0.2rem; }
    .stage-chevron { font-size: 1.2rem; color: var(--stone-dark); transition: transform 0.3s ease; }
    .stage.open .stage-chevron { transform: rotate(180deg); }
    .stage-body { padding: 0 1.5rem 1.5rem; display: none; }
    .stage.open .stage-body { display: block; }
    .stage-text { font-size: 0.9rem; color: var(--text-light); line-height: 1.7; margin-bottom: 1rem; padding-left: 56px; }
    .stage-benefits-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--maroon); margin-bottom: 0.6rem; padding-left: 56px; }
    .stage-benefits { list-style: none; padding-left: 56px; }
    .stage-benefits li { position: relative; padding: 0.5rem 0 0.5rem 1.5rem; font-size: 0.85rem; color: var(--text); line-height: 1.5; border-bottom: 1px solid rgba(21,97,109,0.1); }
    .stage-benefits li:last-child { border-bottom: none; }
    .stage-benefits li::before { content: '\\2713'; position: absolute; left: 0; color: var(--orange); font-weight: 700; }

    /* Connector between stages */
    .stage-connector { display: flex; justify-content: center; padding: 0.25rem 0; }
    .stage-connector-line { width: 2px; height: 20px; background: var(--stone-light); }

    /* Business value summary */
    .bv-summary { margin-top: 2.5rem; }
    .bv-summary-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--charcoal); margin-bottom: 1rem; }
    .bv-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
    .bv-summary-item { background: var(--charcoal); border-radius: var(--radius-sm); padding: 1.25rem; text-align: center; }
    .bv-summary-icon { font-size: 1.5rem; margin-bottom: 0.3rem; }
    .bv-summary-metric { font-size: 1.4rem; font-weight: 800; color: var(--orange); }
    .bv-summary-desc { font-size: 0.78rem; color: var(--stone); margin-top: 0.15rem; }

    /* Back link */
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--text-light); text-decoration: none; font-size: 0.85rem; font-weight: 500; padding: 8px 0; transition: var(--transition); margin-bottom: 1rem; }
    .back-link:hover { color: var(--orange); }

    /* Nav/Footer tweaks for flow pages */
    .flow-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--stone-light); }
    .flow-nav a { text-decoration: none; color: var(--text-light); font-size: 0.85rem; font-weight: 500; transition: var(--transition); padding: 8px 16px; border-radius: 8px; border: 1px solid var(--stone-light); }
    .flow-nav a:hover { color: var(--orange); border-color: var(--orange); }

    @media (max-width: 600px) {
      .stage-text, .stage-benefits-label, .stage-benefits { padding-left: 0; }
      .bv-summary-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-brand">
        <div class="nav-brand-icon">G</div>
        <span>GoHealth</span>
      </a>
      <div class="nav-links">
        <a href="index.html#mindmap">Mind Map</a>
        <a href="index.html#flows">All Flows</a>
        <a href="index.html#benefits">Benefits</a>
        <a href="index.html#features">Features</a>
      </div>
      <button class="nav-toggle" aria-label="Toggle menu">&#9776;</button>
    </div>
  </nav>

  <div class="flow-page">
    <a href="index.html#flows" class="back-link">&larr; Back to all flows</a>

    <div class="flow-page-header">
      <div class="flow-page-num">Flow ${flow.num} of ${FLOWS.length}</div>
      <h1 class="flow-page-title">${flow.title}</h1>
      <p class="flow-page-desc">${flow.desc}</p>
      <div class="flow-page-features">
        ${flow.features.map(f => `<span class="feature-pill">${f}</span>`).join('\n        ')}
      </div>
    </div>

    <!-- Stages -->
${flow.steps.map((step, i) => {
  const color = STEP_COLORS[i % STEP_COLORS.length];
  const isFirst = i === 0;
  const connector = i < flow.steps.length - 1 ? `\n    <div class="stage-connector"><div class="stage-connector-line"></div></div>` : '';
  return `    <div class="stage${isFirst ? ' open' : ''}" data-stage="${i}">
      <div class="stage-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="stage-num" style="background: ${color}">${i + 1}</div>
        <div class="stage-header-text">
          <div class="stage-title">${step.title}</div>
          <span class="stage-module">${step.module}</span>
        </div>
        <span class="stage-chevron">&#9662;</span>
      </div>
      <div class="stage-body">
        <p class="stage-text">${step.text}</p>
        <div class="stage-benefits-label">How This Helps</div>
        <ul class="stage-benefits">
          ${step.benefits.map(b => `<li>${b}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>${connector}`;
}).join('\n')}

    <!-- Business Value Summary -->
    <div class="bv-summary">
      <div class="bv-summary-title">Overall Business Impact</div>
      <div class="bv-summary-grid">
        ${flow.businessValue.map(bv => `<div class="bv-summary-item">
          <div class="bv-summary-icon">${bv.icon}</div>
          <div class="bv-summary-metric">${bv.metric}</div>
          <div class="bv-summary-desc">${bv.desc}</div>
        </div>`).join('\n        ')}
      </div>
    </div>

    <!-- Nav between flows -->
    <div class="flow-nav">
      ${getPrevLink(flow)}
      ${getNextLink(flow)}
    </div>
  </div>

  <footer class="footer">
    <p>GoHealth &mdash; Your Health, Connected &middot; by Aura Global Corporation</p>
  </footer>

  <script>
    // Nav scroll effect
    window.addEventListener('scroll', () => {
      document.querySelector('.nav').classList.toggle('scrolled', window.scrollY > 20);
    });
    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle) toggle.addEventListener('click', () => links.classList.toggle('open'));
  </script>
</body>
</html>`;

  const filePath = path.join(dir, `flow-${flow.id}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`  Generated: flow-${flow.id}.html`);
});

function getPrevLink(flow) {
  const idx = FLOWS.findIndex(f => f.id === flow.id);
  if (idx <= 0) return '<span></span>';
  const prev = FLOWS[idx - 1];
  return `<a href="flow-${prev.id}.html">&larr; ${prev.title}</a>`;
}

function getNextLink(flow) {
  const idx = FLOWS.findIndex(f => f.id === flow.id);
  if (idx >= FLOWS.length - 1) return '<span></span>';
  const next = FLOWS[idx + 1];
  return `<a href="flow-${next.id}.html">${next.title} &rarr;</a>`;
}

console.log(`\nGenerated ${FLOWS.length} flow pages.`);
