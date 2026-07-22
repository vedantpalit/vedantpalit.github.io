/* Renders content from js/data.js into the section containers, revealing
   items in batches as the visitor scrolls (IntersectionObserver on #sentinel). */

(function () {
  const BATCH_SIZE = 5;
  const LOOKAHEAD_PX = 500;

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function renderHeader() {
    if (Array.isArray(SITE.current) && SITE.current.length) {
      const current = document.getElementById("current");
      current.appendChild(el("div", "current-label", "Currently"));
      SITE.current.forEach(pos => {
        const row = el("div", "current-row");
        row.appendChild(el("span", "role", pos.role));
        const a = el("a", null, pos.org);
        a.href = pos.url;
        if (pos.title) a.title = pos.title;
        row.appendChild(a);
        current.appendChild(row);
      });
      current.hidden = false;
    }

    const bio = document.getElementById("bio");
    SITE.bio.forEach(p => bio.appendChild(el("p", null, p)));

    const links = document.getElementById("profile-links");
    SITE.links.forEach(l => {
      if (l.options) {
        links.appendChild(dropdownLink(l));
      } else {
        const a = el("a", null, l.label);
        a.href = l.url;
        links.appendChild(a);
      }
    });
  }

  /* A profile link with multiple choices, shown in a small popover on click */
  function dropdownLink(l) {
    const wrap = el("span", "dropdown");
    const trigger = el("a", null, l.label + ' <span class="caret">▾</span>');
    trigger.href = "#";
    const menu = el("span", "dropdown-menu");
    l.options.forEach(o => {
      const a = el("a", null, o.label);
      a.href = o.url;
      menu.appendChild(a);
    });
    trigger.addEventListener("click", e => {
      e.preventDefault();
      wrap.classList.toggle("open");
    });
    document.addEventListener("click", e => {
      if (!wrap.contains(e.target)) wrap.classList.remove("open");
    });
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    return wrap;
  }

  function updateNode(u) {
    const row = el("div", "tl-item t-" + (u.type || "milestone"));
    row.appendChild(el("span", "date", u.date.replace(/\s*'\d\d$/, "")));
    row.appendChild(el("span", "text", u.text));
    return row;
  }


  function entryNode(item) {
    const row = el("div", "entry");
    if (item.image) {
      const thumb = el("div", "thumb");
      const img = el("img");
      img.src = item.image;
      img.alt = item.title;
      img.loading = "lazy";
      thumb.appendChild(img);
      row.appendChild(thumb);
    }

    const meta = el("div", "meta");
    meta.appendChild(el("div", "title", item.title));
    meta.appendChild(el("div", "authors", item.authors));
    if (item.badges) {
      const badges = el("div", "badges");
      item.badges.forEach(b => badges.appendChild(el("span", "pill pill-" + b.tone, b.label)));
      meta.appendChild(badges);
    } else if (item.venue) {
      meta.appendChild(el("div", "venue", item.venue));
    }
    const links = el("div", "links");
    item.links.forEach(l => {
      const a = el("a", null, l.label);
      a.href = l.url;
      links.appendChild(a);
    });
    meta.appendChild(links);
    row.appendChild(meta);
    return row;
  }

  /* Compact project row: no thumbnail, linked title + context + one-liner */
  function projectNode(p) {
    const row = el("div", "project-row");
    const title = el("div", "title");
    const a = el("a", null, p.title);
    a.href = p.links[0].url;
    title.appendChild(a);
    title.insertAdjacentHTML("beforeend", ' <span class="context">— ' + p.context + "</span>");
    row.appendChild(title);
    if (p.description) row.appendChild(el("div", "description", p.description));
    return row;
  }

  function serviceNode(s) {
    const row = el("div", "update service-row");
    row.appendChild(el("span", "date", s.role));
    row.appendChild(el("span", "text", s.venues.join('<span class="sep"> · </span>')));
    return row;
  }

  function blogNode(b) {
    const row = el("div", "update service-row");
    row.appendChild(el("span", "date", b.source));
    const posts = b.posts
      .map(p => '<a href="' + p.url + '">' + p.title + "</a>")
      .join('<span class="sep"> · </span>');
    row.appendChild(el("span", "text", posts));
    return row;
  }

  const visible = arr => arr.filter(x => !x.hidden);

  // One flat queue of items in page order; each knows its target container.
  // (Updates render separately as collapsible year groups, see setupUpdates.)
  const queue = [];
  visible(PAPERS).forEach(p => queue.push({ target: "papers-list", node: () => entryNode(p) }));
  visible(PROJECTS).forEach(p => queue.push({ target: "projects-list", node: () => projectNode(p) }));
  visible(SERVICE).forEach(s => queue.push({ target: "service-list", node: () => serviceNode(s) }));
  visible(BLOGS).forEach(b => queue.push({ target: "blogs-list", node: () => blogNode(b) }));

  function renderBatch() {
    const batch = queue.splice(0, BATCH_SIZE);
    batch.forEach(item => {
      const node = item.node();
      node.classList.add("reveal");
      document.getElementById(item.target).appendChild(node);
      requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add("visible")));
    });
    return batch.length > 0;
  }

  const sentinel = document.getElementById("sentinel");

  function sentinelNear() {
    return sentinel.getBoundingClientRect().top < window.innerHeight + LOOKAHEAD_PX;
  }

  // Keep draining while the sentinel remains within the lookahead zone —
  // the observer alone won't refire if the sentinel stays intersecting.
  function drainWhileNear() {
    if (!queue.length) return;
    if (sentinelNear()) {
      renderBatch();
      setTimeout(drainWhileNear, 120);
    }
  }

  // Queue is in page order, so draining until a section has no pending
  // items also renders everything above it.
  function drainThrough(targetId) {
    while (queue.some(q => q.target === targetId)) renderBatch();
  }

  function setupObserver() {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) drainWhileNear();
    }, { rootMargin: LOOKAHEAD_PX + "px 0px" });
    observer.observe(sentinel);
  }

  // Nav: jumping to a section must force-render its items first,
  // since anchors below the fold may not be populated yet.
  function setupNav() {
    document.querySelectorAll("nav a[href^='#']").forEach(a => {
      a.addEventListener("click", () => {
        const section = document.querySelector(a.getAttribute("href"));
        if (!section) return;
        const listId = section.querySelector("[data-list]");
        if (listId) drainThrough(listId.id);
      });
    });

    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        document.querySelectorAll("nav a").forEach(a =>
          a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("section[id]").forEach(s => spy.observe(s));
  }

  /* Collaborator graph under the portrait: Vedant at the center, coauthors
     around him, edges for shared papers. Coauthors who also share papers with
     each other are linked too, so research groups cluster together. Laid out
     by a small seeded force simulation; hover to explore, click to visit. */
  function buildCollabWidget() {
    const host = document.getElementById("widget");
    if (!host) return;
    host.className = "collab-widget";
    const NS = "http://www.w3.org/2000/svg";
    const W = 220, H = 210;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    let seed = 7;
    const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

    // n = shared papers with Vedant; cluster links coauthors on the same papers
    const people = [
      { name: "Vedant", me: true },
      { name: "Jin", full: "Zhijing Jin", n: 2, cluster: "mpi", url: "https://zhijing-jin.com/home/" },
      { name: "Schölkopf", full: "Bernhard Schölkopf", n: 2, cluster: "mpi", url: "https://is.mpg.de/~bs" },
      { name: "Draye", full: "Florent Draye", n: 2, cluster: "mpi" },
      { name: "Zhang", full: "Terry Jingchen Zhang", n: 2, cluster: "mpi" },
      { name: "Basu", full: "Debabrota Basu", n: 1, cluster: "lille", url: "https://debabrota-basu.github.io/" },
      { name: "Rudman", full: "William Rudman", n: 2, cluster: "brown" },
      { name: "Golovanesky", full: "Michal Golovanesky", n: 2, cluster: "brown" },
      { name: "Singh", full: "Ritambhara Singh", n: 2, cluster: "brown", url: "https://ritambharasingh.com/" },
      { name: "Eickhoff", full: "Carsten Eickhoff", n: 2, cluster: "brown", url: "https://health-nlp.com/people/carsten" },
      { name: "Roy", full: "Kaushik Roy", n: 2, cluster: "aiisc", url: "https://kauroy1994.github.io/home/" },
      { name: "Gaur", full: "Manas Gaur", n: 1, cluster: "aiisc", url: "https://manasgaur.github.io/" },
      { name: "Liang", full: "Paul Pu Liang", n: 1, cluster: "cmu", url: "https://pliang279.github.io/" }
    ];

    const me = people[0];
    me.x = W / 2; me.y = H / 2 - 4;
    people.forEach(p => {
      if (p.me) return;
      const a = rand() * Math.PI * 2;
      p.x = me.x + Math.cos(a) * 60;
      p.y = me.y + Math.sin(a) * 60;
    });

    const edges = [];
    people.forEach(p => { if (!p.me) edges.push({ a: me, b: p, w: p.n }); });
    for (let i = 1; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        if (people[i].cluster === people[j].cluster) {
          edges.push({ a: people[i], b: people[j], w: 1, intra: true });
        }
      }
    }

    // Force layout: pairwise repulsion + springs, run to convergence up front
    for (let it = 0; it < 300; it++) {
      people.forEach(p => { p.fx = 0; p.fy = 0; });
      for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < people.length; j++) {
          const a = people[i], b = people[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy || 1;
          const f = 550 / d2;
          const d = Math.sqrt(d2);
          a.fx += (dx / d) * f; a.fy += (dy / d) * f;
          b.fx -= (dx / d) * f; b.fy -= (dy / d) * f;
        }
      }
      edges.forEach(e => {
        const rest = e.intra ? 34 : 62;
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = 0.03 * (d - rest);
        e.a.fx += (dx / d) * f; e.a.fy += (dy / d) * f;
        e.b.fx -= (dx / d) * f; e.b.fy -= (dy / d) * f;
      });
      people.forEach(p => {
        if (p.me) return;
        p.x = Math.min(W - 26, Math.max(26, p.x + p.fx * 0.55));
        p.y = Math.min(H - 16, Math.max(14, p.y + p.fy * 0.55));
      });
    }

    edges.forEach(e => {
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", e.a.x); line.setAttribute("y1", e.a.y);
      line.setAttribute("x2", e.b.x); line.setAttribute("y2", e.b.y);
      line.setAttribute("class", "e" + (e.w > 1 ? " thick" : ""));
      e.el = line;
      svg.appendChild(line);
    });

    const HINT = "my collaborator graph — hover to explore, click to visit";
    const hint = el("div", "hint", HINT);

    people.forEach(p => {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
      dot.setAttribute("r", p.me ? 7 : 4.5);
      dot.setAttribute("class", "n" + (p.me ? " me" : "") + (p.url ? " linked" : ""));
      p.el = dot;

      const lbl = document.createElementNS(NS, "text");
      lbl.setAttribute("x", p.x);
      lbl.setAttribute("y", p.y + (p.me ? 16 : 13));
      lbl.setAttribute("class", "lbl");
      lbl.textContent = p.name;
      p.lblEl = lbl;

      dot.addEventListener("mouseenter", () => {
        p.el.classList.add("lit");
        p.lblEl.classList.add("lit");
        edges.forEach(e => {
          if (e.a === p || e.b === p) {
            e.el.classList.add("lit");
            (e.a === p ? e.b : e.a).el.classList.add("lit");
          }
        });
        if (!p.me) hint.textContent = p.full + " · " + p.n + (p.n > 1 ? " papers" : " paper") + " together";
      });
      dot.addEventListener("mouseleave", () => {
        people.forEach(q => { q.el.classList.remove("lit"); q.lblEl.classList.remove("lit"); });
        edges.forEach(e => e.el.classList.remove("lit"));
        hint.textContent = HINT;
      });
      if (p.url) dot.addEventListener("click", () => window.open(p.url, "_blank"));

      svg.appendChild(dot);
      svg.appendChild(lbl);
    });

    host.appendChild(svg);
    host.appendChild(hint);
  }

  /* Attention-arcs toy: hover/tap a word to see which words it attends to.
     The sentence is editable (input below), so the three heads are computed
     procedurally: previous-token, induction (needs a repeated word), and
     attention-sink (everything attends to the first token). */
  function buildAttentionWidget() {
    const host = document.getElementById("widget");
    if (!host) return;
    host.className = "attn-widget";
    const NS = "http://www.w3.org/2000/svg";
    const W = 220, H = 108, BASE = 80, GAP = 7, MAX_TOKENS = 7;

    const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

    const heads = [
      {
        label: "previous token",
        compute: norms => {
          const attn = {};
          for (let i = 1; i < norms.length; i++) attn[i] = [[i - 1, 1]];
          return { attn, focus: Math.min(2, norms.length - 1),
                   caption: "each word attends one step back" };
        }
      },
      {
        label: "induction",
        compute: norms => {
          const attn = {};
          let focus = null;
          norms.forEach((n, i) => {
            if (!n) return;
            for (let j = i - 1; j >= 0; j--) {
              if (norms[j] === n && j + 1 < i) {
                attn[i] = [[j + 1, 0.9], [j, 0.3]];
                if (focus === null) focus = i;
                break;
              }
            }
          });
          return {
            attn,
            focus: focus === null ? norms.length - 1 : focus,
            caption: focus === null
              ? "no repeats — repeat a word to trigger induction"
              : "a repeated word attends to what followed it last time"
          };
        }
      },
      {
        label: "attention sink",
        compute: norms => {
          const attn = {};
          for (let i = 1; i < norms.length; i++) attn[i] = [[0, 0.75]];
          return { attn, focus: norms.length - 1,
                   caption: "many heads just park attention on the first token" };
        }
      }
    ];

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const arcLayer = document.createElementNS(NS, "g");
    const tokLayer = document.createElementNS(NS, "g");
    svg.appendChild(arcLayer);
    svg.appendChild(tokLayer);

    const chips = el("div", "attn-heads");
    const hint = el("div", "hint");
    const input = el("input", "attn-input");
    input.type = "text";
    input.maxLength = 60;
    input.placeholder = "type your own sentence…";

    let head = heads[1];          // start on induction, the fun one
    let toks = [], result = null, active = 0;

    function drawArcs() {
      arcLayer.innerHTML = "";
      toks.forEach((t, i) => {
        t.box.classList.toggle("active", i === active);
        t.txt.classList.toggle("active", i === active);
      });
      (result.attn[active] || []).forEach(([target, wgt]) => {
        const a = toks[active], b = toks[target];
        const rise = Math.min(22 + Math.abs(a.cx - b.cx) * 0.28, 64);
        const arc = document.createElementNS(NS, "path");
        arc.setAttribute("d",
          `M ${a.cx} ${BASE - 4} Q ${(a.cx + b.cx) / 2} ${BASE - 4 - rise} ${b.cx} ${BASE - 4}`);
        arc.setAttribute("class", "arc");
        arc.setAttribute("stroke-width", (0.8 + wgt * 1.8).toFixed(2));
        arc.setAttribute("stroke-opacity", (0.35 + wgt * 0.65).toFixed(2));
        arcLayer.appendChild(arc);
      });
      hint.textContent = result.caption;
    }

    function render(text) {
      const words = text.trim().split(/\s+/).filter(Boolean).slice(0, MAX_TOKENS);
      if (!words.length) return;

      // Shrink glyphs if the sentence would overflow the column
      let charW = 5.4, fs = 9;
      const width = cw => words.reduce((a, w) => a + 8 + w.length * cw, 0) + GAP * (words.length - 1);
      if (width(charW) > W - 6) {
        const scale = Math.max(0.66, (W - 6 - 8 * words.length - GAP * (words.length - 1)) /
                                     (words.join("").length * charW));
        charW *= scale; fs = Math.max(6.2, fs * scale);
      }

      tokLayer.innerHTML = "";
      let cursor = Math.max(3, (W - width(charW)) / 2);
      toks = words.map((word, i) => {
        const w = 8 + word.length * charW;
        const t = { word, x: cursor, w, cx: cursor + w / 2 };
        cursor += w + GAP;

        const box = document.createElementNS(NS, "rect");
        box.setAttribute("x", t.x); box.setAttribute("y", BASE - 2);
        box.setAttribute("width", t.w); box.setAttribute("height", 17);
        box.setAttribute("rx", 4);
        box.setAttribute("class", "tok");
        const txt = document.createElementNS(NS, "text");
        txt.setAttribute("x", t.cx); txt.setAttribute("y", BASE + 10);
        txt.setAttribute("font-size", fs);
        txt.setAttribute("class", "tok-word");
        txt.textContent = word;
        t.box = box; t.txt = txt;
        [box, txt].forEach(elm => {
          elm.addEventListener("mouseenter", () => { active = i; drawArcs(); });
          elm.addEventListener("click", () => { active = i; drawArcs(); });
        });
        tokLayer.appendChild(box);
        tokLayer.appendChild(txt);
        return t;
      });

      result = head.compute(toks.map(t => norm(t.word)));
      active = result.focus;
      drawArcs();
    }

    heads.forEach(h => {
      const chip = el("button", "attn-chip", h.label);
      h.chip = chip;
      chip.addEventListener("click", () => {
        head = h;
        heads.forEach(x => x.chip.classList.toggle("on", x === h));
        render(input.value || SITE.sentence);
      });
      chips.appendChild(chip);
    });
    head.chip.classList.add("on");

    input.addEventListener("input", () => render(input.value || SITE.sentence));

    host.appendChild(chips);
    host.appendChild(svg);
    host.appendChild(hint);
    host.appendChild(input);
    render(SITE.sentence);
  }

  // Timeline grouped by year; the newest year starts open, the rest collapsed
  function setupUpdates() {
    const list = document.getElementById("updates-list");
    const groups = [];
    visible(UPDATES).forEach(u => {
      const y = "20" + u.date.slice(-2);
      if (!groups.length || groups[groups.length - 1].year !== y) {
        groups.push({ year: y, items: [] });
      }
      groups[groups.length - 1].items.push(u);
    });
    groups.forEach((g, gi) => {
      const dots = g.items
        .map(u => '<i class="tl-mini t-' + (u.type || "milestone") + '"></i>')
        .join("");
      const head = el("div", "tl-year",
        g.year + ' <span class="tl-preview">' + dots + "</span>" +
        ' <span class="tl-caret">▾</span>');
      const body = el("div", "tl-group");
      g.items.forEach(u => body.appendChild(updateNode(u)));
      if (gi > 0) {
        head.classList.add("closed");
        body.classList.add("closed");
      }
      head.addEventListener("click", () => {
        head.classList.toggle("closed");
        body.classList.toggle("closed");
      });
      list.appendChild(head);
      list.appendChild(body);
    });
  }

  /* Horizontal axis: dots placed by real date, year ticks, and a fixed
     detail line that fills on hover/tap. Height stays constant forever. */
  function setupUpdatesAxis() {
    const list = document.getElementById("updates-list");
    list.classList.remove("timeline");
    const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, June: 5,
                     Jul: 6, July: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11 };
    const items = visible(UPDATES).map(u => {
      const m = u.date.match(/^(\w+)\s+'(\d\d)/);
      return { u, t: new Date(2000 + Number(m[2]), MONTHS[m[1]] || 0, 1).getTime() };
    });
    const tMin = Math.min(...items.map(i => i.t));
    const tMax = Math.max(...items.map(i => i.t));
    const toX = t => 3 + 94 * (t - tMin) / (tMax - tMin);
    items.forEach(i => { i.x = toX(i.t); });

    // Nudge near-coincident dots apart so every one stays hoverable
    const GAP = 2.4;
    const sorted = [...items].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].x < sorted[i - 1].x + GAP) sorted[i].x = sorted[i - 1].x + GAP;
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].x > 97) sorted[i].x = 97;
      if (i < sorted.length - 1 && sorted[i].x > sorted[i + 1].x - GAP) {
        sorted[i].x = sorted[i + 1].x - GAP;
      }
    }

    const track = el("div", "ax-track");
    const detail = el("div", "ax-detail");
    const prev = el("button", "ax-arrow", "‹");
    const next = el("button", "ax-arrow", "›");
    prev.setAttribute("aria-label", "earlier update");
    next.setAttribute("aria-label", "later update");
    let current = 0;

    for (let y = new Date(tMin).getFullYear(); y <= new Date(tMax).getFullYear(); y++) {
      const t = new Date(y, 0, 1).getTime();
      if (t < tMin || t > tMax) continue;
      const tick = el("span", "ax-tick", "’" + String(y).slice(-2));
      tick.style.left = toX(t) + "%";
      track.appendChild(tick);
    }

    function select(i) {
      current = sorted.indexOf(i);
      items.forEach(j => j.el.classList.toggle("active", j === i));
      detail.innerHTML = '<span class="ax-date">' + i.u.date + "</span> — " + i.u.text;
      prev.disabled = current === 0;
      next.disabled = current === sorted.length - 1;
    }

    const step = d => { if (sorted[current + d]) select(sorted[current + d]); };
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    document.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });

    items.forEach(i => {
      const dot = el("button", "ax-dot t-" + (i.u.type || "milestone"));
      dot.style.left = i.x + "%";
      dot.setAttribute("aria-label", i.u.date);
      dot.addEventListener("mouseenter", () => select(i));
      dot.addEventListener("click", () => select(i));
      i.el = dot;
      track.appendChild(dot);
    });

    list.appendChild(track);
    const row = el("div", "ax-detail-row");
    row.appendChild(detail);
    const nav = el("div", "ax-nav");
    nav.appendChild(prev);
    nav.appendChild(next);
    row.appendChild(nav);
    list.appendChild(row);
    select(items[0]);
  }

  /* Path patching on the IOI circuit (Wang et al. 2022). Click a head to
     patch it out; P(Mary) vs P(John) react per the paper's story:
     duplicate-token heads feed S-inhibition, S-inhibition steers the name
     movers away from "John", and a backup name mover compensates when a
     primary one is ablated. */
  function buildIOIWidget() {
    const host = document.getElementById("widget");
    if (!host) return;
    host.className = "ioi-widget";
    const NS = "http://www.w3.org/2000/svg";

    const sent = el("div", "ioi-sent",
      'When <span class="io">Mary</span> and <span class="s">John</span> went to the store, ' +
      '<span class="s">John</span> gave a drink to <span class="blank">___</span>');

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 220 132");
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = '<marker id="ioi-arr" viewBox="0 0 6 6" refX="5" refY="3"' +
      ' markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L6 3L0 6z"/></marker>';
    svg.appendChild(defs);

    // Real head names from the paper; three groups plus one backup name mover
    const groups = {
      dt: { label: "dup. tokens", y: 106, heads: [] },
      si: { label: "s-inhibition", y: 70, heads: [] },
      nm: { label: "name movers", y: 34, heads: [] }
    };
    const HEADS = [
      { id: "0.1", type: "dt", x: 78 }, { id: "3.0", type: "dt", x: 140 },
      { id: "7.9", type: "si", x: 78 }, { id: "8.6", type: "si", x: 140 },
      { id: "9.9", type: "nm", x: 66 }, { id: "9.6", type: "nm", x: 122 },
      { id: "10.10", type: "nm", x: 178, backup: true }
    ];
    HEADS.forEach(h => { h.dead = false; groups[h.type].heads.push(h); });

    const edges = [];
    const pairs = [["dt", "si"], ["si", "nm"]];
    pairs.forEach(([a, b]) => {
      groups[a].heads.forEach(ha => groups[b].heads.forEach(hb =>
        edges.push({ a: ha, b: hb })));
    });
    edges.forEach(e => {
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", e.a.x); line.setAttribute("y1", groups[e.a.type].y - 8);
      line.setAttribute("x2", e.b.x); line.setAttribute("y2", groups[e.b.type].y + 8);
      line.setAttribute("class", "ioi-e");
      line.setAttribute("marker-end", "url(#ioi-arr)");
      e.el = line;
      svg.appendChild(line);
    });

    // The prediction slot the name movers write into
    groups.nm.heads.forEach(h => {
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", h.x); line.setAttribute("y1", groups.nm.y - 8);
      line.setAttribute("x2", 110 + (h.x - 110) * 0.12); line.setAttribute("y2", 16);
      line.setAttribute("class", "ioi-e");
      line.setAttribute("marker-end", "url(#ioi-arr)");
      edges.push({ a: h, b: h, el: line });
      svg.appendChild(line);
    });
    const outText = document.createElementNS(NS, "text");
    outText.setAttribute("x", 110); outText.setAttribute("y", 11);
    svg.appendChild(outText);

    Object.values(groups).forEach(g => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", 2); t.setAttribute("y", g.y + 3);
      t.setAttribute("class", "ioi-lbl");
      t.textContent = g.label;
      svg.appendChild(t);
    });

    const DEFAULT_HINT = "the IOI circuit (Wang et al. ’22) — tap a head to path-patch it";
    let lastMsg = DEFAULT_HINT;
    const hint = el("div", "hint", DEFAULT_HINT);

    const bars = el("div", "ioi-bars");
    const mkBar = (name, cls) => {
      const row = el("div", "ioi-bar-row");
      row.appendChild(el("span", "ioi-name", name));
      const track = el("div", "ioi-track");
      const fill = el("div", "ioi-fill " + cls);
      track.appendChild(fill);
      row.appendChild(track);
      const pct = el("span", "ioi-pct");
      row.appendChild(pct);
      bars.appendChild(row);
      return { fill, pct };
    };
    const maryBar = mkBar("Mary", "mary");
    const johnBar = mkBar("John", "john");

    const alive = arr => arr.filter(h => !h.dead).length / arr.length;

    function recompute(message) {
      const dt = alive(groups.dt.heads);
      const primaries = groups.nm.heads.filter(h => !h.backup);
      const backup = groups.nm.heads.find(h => h.backup);
      // Induction heads (not drawn) redundantly carry the duplication signal,
      // so losing the duplicate-token heads only partly weakens S-inhibition;
      // and without S-inhibition the model favors "John" mildly, not totally.
      const sih = alive(groups.si.heads) * (0.45 + 0.55 * dt);
      const nmP = alive(primaries);
      const nm = nmP + (backup.dead ? 0 : 0.85 * (1 - nmP));
      const margin = nm * (1.35 * sih - 0.35);
      const pMary = Math.round(50 + 44 * margin);

      outText.textContent = pMary >= 55 ? "Mary" : pMary <= 45 ? "John" : "?";
      outText.setAttribute("class", "ioi-out " +
        (pMary >= 55 ? "om" : pMary <= 45 ? "oj" : "ou"));

      maryBar.fill.style.width = pMary + "%";
      maryBar.pct.textContent = pMary + "%";
      johnBar.fill.style.width = (100 - pMary) + "%";
      johnBar.pct.textContent = (100 - pMary) + "%";

      HEADS.forEach(h => h.el.classList.toggle("dead", h.dead));
      edges.forEach(e => e.el.classList.toggle("dead", e.a.dead || e.b.dead));
      if (message) { hint.textContent = message; lastMsg = message; }
      reset.hidden = !HEADS.some(h => h.dead);
    }

    function messageFor(h) {
      if (!h.dead) return "head " + h.id + " restored";
      const primaries = groups.nm.heads.filter(x => !x.backup);
      const backup = groups.nm.heads.find(x => x.backup);
      if (h.type === "nm" && !h.backup && !backup.dead)
        return "name mover " + h.id + " patched — backup 10.10 picks up the slack";
      if (groups.nm.heads.every(x => x.dead))
        return "no name movers left — nothing copies “Mary” to the output";
      if (h.backup && primaries.every(x => x.dead))
        return "backup gone too — the prediction collapses";
      if (h.type === "si")
        return "S-inhibition weakened — less stops the model repeating “John”";
      if (h.type === "dt")
        return "duplicate-token head gone — induction heads (not shown) still spot the repeat";
      return "head " + h.id + " patched";
    }

    const ROLES = {
      dt: "notices “John” appears twice",
      si: "tells the name movers to steer away from “John”",
      nm: "copies “Mary” into the prediction",
      bk: "backup — wakes up if a name mover is patched"
    };

    HEADS.forEach(h => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "ioi-head" + (h.backup ? " backup" : ""));
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", h.x - 15); r.setAttribute("y", groups[h.type].y - 8);
      r.setAttribute("width", 30); r.setAttribute("height", 16);
      r.setAttribute("rx", 4);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", h.x); t.setAttribute("y", groups[h.type].y + 3);
      t.textContent = h.id;
      g.appendChild(r); g.appendChild(t);
      g.addEventListener("click", () => {
        h.dead = !h.dead;
        recompute(messageFor(h));
      });
      g.addEventListener("mouseenter", () => {
        hint.textContent = h.id + " · " + (h.backup ? ROLES.bk : ROLES[h.type]);
      });
      g.addEventListener("mouseleave", () => { hint.textContent = lastMsg; });
      h.el = g;
      svg.appendChild(g);
    });

    const reset = el("button", "ioi-reset", "restore all heads");
    reset.hidden = true;
    reset.addEventListener("click", () => {
      HEADS.forEach(h => { h.dead = false; });
      recompute("circuit restored");
    });

    host.appendChild(sent);
    host.appendChild(svg);
    host.appendChild(bars);
    host.appendChild(hint);
    host.appendChild(reset);
    recompute();
  }

  /* Luma: the site's original day/night pixel familiar, perched on the nav.
     Awake (blinking, bobbing) in light mode; asleep with zzz's in dark.
     Drawn from a pixel map; both themes recolor her via CSS variables. */
  function buildCritter() {
    const host = document.getElementById("critter");
    if (!host) return;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 13");
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("aria-hidden", "true");

    const px = (x, y, cls, parent) => {
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", x); r.setAttribute("y", y);
      r.setAttribute("width", 1); r.setAttribute("height", 1);
      r.setAttribute("class", cls);
      (parent || svg).appendChild(r);
    };

    // o outline · b body · l belly/inner ear · a sun/moon mark · k blush
    const ROWS = [
      "...oo......oo...",
      "..obbo....obbo..",
      "..oblbo..oblbo..",
      "..obbbbbbbbbbo..",
      ".obbbbbaabbbbbo.",
      ".obbbbbaabbbbbo.",
      ".obbbbbbbbbbbbo.",
      ".obkbbboobbbkbo.",
      ".obblllllllbbbo.",
      ".obblllllllbbbo.",
      ".obbblllllbbbbo.",
      "..obbbbbbbbbbo..",
      "...oooooooooo..."
    ];
    ROWS.forEach((row, y) => {
      [...row].forEach((ch, x) => { if (ch !== ".") px(x, y, "cr-" + ch); });
    });

    // Closed lids sit under the open eyes: blinking just hides the open pair
    const closed = document.createElementNS(NS, "g");
    closed.setAttribute("class", "cr-eyes-closed");
    [[4, 6], [5, 6], [10, 6], [11, 6]].forEach(([x, y]) => px(x, y, "cr-e", closed));
    svg.appendChild(closed);

    const open = document.createElementNS(NS, "g");
    open.setAttribute("class", "cr-eyes-open");
    [[4, 5, "w"], [5, 5, "e"], [4, 6, "e"], [5, 6, "e"],
     [10, 5, "w"], [11, 5, "e"], [10, 6, "e"], [11, 6, "e"]]
      .forEach(([x, y, c]) => px(x, y, "cr-" + c, open));
    svg.appendChild(open);

    for (let i = 0; i < 3; i++) {
      const z = document.createElementNS(NS, "text");
      z.setAttribute("x", 13.2); z.setAttribute("y", 3.2);
      z.setAttribute("class", "cr-z cr-z" + i);
      z.textContent = "z";
      svg.appendChild(z);
    }

    host.appendChild(svg);
    host.title = "Luma";
    host.addEventListener("click", () => {
      host.classList.remove("hop");
      void host.offsetWidth;   // restart the animation on rapid clicks
      host.classList.add("hop");
    });
  }

  /* Logit-lens name reveal: the name starts as shifting glyphs and settles
     left to right, like a prediction converging across layers. */
  function nameReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const h1 = document.querySelector(".intro h1");
    if (!h1) return;
    const target = h1.textContent;
    const glyphs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const DURATION = 900;
    const start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / DURATION);
      const settled = Math.floor(p * target.length);
      let out = target.slice(0, settled);
      for (let i = settled; i < target.length; i++) {
        out += target[i] === " " ? " "
          : glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      h1.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else h1.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  function setupThemeToggle() {
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  /* External links (and the CV pdf) open in a new tab so the site stays
     put. Delegated on click, so batch-rendered content is covered too. */
  function setupExternalLinks() {
    document.addEventListener("click", e => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (/^https?:\/\//.test(href) || href.endsWith(".pdf")) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    }, true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupExternalLinks();
    setupThemeToggle();
    renderHeader();
    nameReveal();
    buildCritter();
    (SITE.updates === "timeline" ? setupUpdates : setupUpdatesAxis)();
    ({ collab: buildCollabWidget, attention: buildAttentionWidget, ioi: buildIOIWidget }[SITE.widget] || buildIOIWidget)();
    renderBatch();          // first batch immediately, no waiting for scroll
    drainWhileNear();       // fill the initial viewport
    setupObserver();
    setupNav();
  });
})();
