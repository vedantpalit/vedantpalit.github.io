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
        const a = el("a", null, linkIcon(l.label) + l.label);
        a.href = l.url;
        links.appendChild(a);
      }
    });
  }

  // Small line icons for the profile links (GitHub mark from Feather Icons, MIT)
  const LINK_ICONS = {
    Email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    CV: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    Scholar: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    Blog: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    GitHub: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'
  };
  function linkIcon(label) {
    const d = LINK_ICONS[label];
    return d ? '<svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>' : "";
  }

  /* A profile link with multiple choices, shown in a small popover on click */
  function dropdownLink(l) {
    const wrap = el("span", "dropdown");
    const trigger = el("a", null, linkIcon(l.label) + l.label + ' <span class="caret">▾</span>');
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


  /* Full-size figure for a paper, in a modal <dialog>.
     Esc closes natively; clicking the backdrop or the × also closes. */
  let lightbox = null;
  function openLightbox(item) {
    if (!lightbox) {
      lightbox = el("dialog", "lightbox");
      lightbox.addEventListener("click", e => { if (e.target === lightbox) lightbox.close(); });
      lightbox.addEventListener("close", () => { lightbox.innerHTML = ""; });
      document.body.appendChild(lightbox);
    }
    const close = el("button", "lightbox-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => lightbox.close());
    const img = el("img");
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    img.src = (dark && item.imageDark) || item.image;
    img.alt = item.title;
    lightbox.append(close, img, el("div", "lightbox-caption", item.title));
    lightbox.showModal();
  }

  function entryNode(item) {
    const row = el("div", "entry");
    if (item.image) {
      const thumb = el("button", "thumb");
      thumb.type = "button";
      thumb.setAttribute("aria-label", "Enlarge figure: " + item.title);
      // with imageDark, light and dark figures swap with the site's theme (see css)
      [[item.image, item.imageDark ? "img-light" : null], [item.imageDark, "img-dark"]].forEach(([src, cls]) => {
        if (!src) return;
        const img = el("img", cls);
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        thumb.appendChild(img);
      });
      thumb.addEventListener("click", () => openLightbox(item));
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

  /* Blog posts written for this site get full cards (with an image if given);
     posts on other platforms are listed compactly under "Older posts" on blogs.html */
  const isExternal = b => /^https?:\/\//.test(b.url);

  function blogNode(b) {
    const card = el("a", "blog-card" + (b.image ? " has-img" : ""));
    card.href = b.url;
    if (b.image) {
      // with imageDark, the two images swap with the site's light/dark theme (see css)
      [[b.image, b.imageDark ? "blog-img blog-img-light" : "blog-img"], [b.imageDark, "blog-img blog-img-dark"]].forEach(([src, cls]) => {
        if (!src) return;
        const img = el("img", cls);
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        card.appendChild(img);
      });
    }
    const text = el("span", "blog-text");
    const head = el("span", "blog-head");
    head.appendChild(el("span", "blog-src", b.date || b.source));
    head.appendChild(el("span", "blog-title", b.title));
    text.appendChild(head);
    if (b.blurb) text.appendChild(el("span", "blog-blurb", b.blurb));
    card.appendChild(text);
    return card;
  }

  function olderNode(b) {
    const row = el("a", "blog-older-row");
    row.href = b.url;
    row.appendChild(el("span", "blog-older-src", b.source));
    row.appendChild(el("span", "blog-older-title", b.title));
    return row;
  }

  const visible = arr => arr.filter(x => !x.hidden);

  // One flat queue of items in page order; each knows its target container.
  // (Updates render separately as collapsible year groups, see setupUpdates.)
  const queue = [];
  visible(PAPERS).filter(p => p.selected).forEach(p => queue.push({ target: "papers-list", node: () => entryNode(p) }));
  visible(PROJECTS).forEach(p => queue.push({ target: "projects-list", node: () => projectNode(p) }));
  visible(BLOGS).filter(b => !isExternal(b)).forEach(b => queue.push({ target: "blogs-list", node: () => blogNode(b) }));
  visible(SERVICE).forEach(s => queue.push({ target: "service-list", node: () => serviceNode(s) }));

  function renderBatch() {
    const batch = queue.splice(0, BATCH_SIZE);
    batch.forEach((item, i) => {
      const node = item.node();
      node.classList.add("reveal");
      node.style.transitionDelay = i * 60 + "ms";   // cascade within the batch
      document.getElementById(item.target).appendChild(node);
      requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add("visible")));
      setTimeout(() => { node.style.transitionDelay = ""; }, i * 60 + 600);
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
    // Position-based scroll spy with a sliding ink bar. A bottom clamp
    // guarantees the last section (Service) activates at page end, even
    // though the final sections are shorter than a viewport.
    const links = [...document.querySelectorAll("nav a[href^='#']")];
    const sections = links.map(a => document.querySelector(a.getAttribute("href")));
    const ink = el("span", "nav-ink");
    document.querySelector("nav .container").appendChild(ink);
    let activeIdx = null;

    // Clicking a nav item pins its highlight until the user scrolls
    // themselves — otherwise short bottom sections (Service) lose the
    // highlight to the bottom clamp the moment the jump lands.
    let lockIdx = null;
    links.forEach((a, i) => {
      a.addEventListener("click", () => {
        const section = sections[i];
        if (!section) return;
        const list = section.querySelector("[data-list]");
        if (list) drainThrough(list.id);
        lockIdx = i;
        setActive(i);
      });
    });
    ["wheel", "touchstart", "keydown"].forEach(ev =>
      window.addEventListener(ev, () => { lockIdx = null; }, { passive: true }));

    function setActive(i) {
      if (i === activeIdx) return;
      activeIdx = i;
      links.forEach((a, j) => a.classList.toggle("active", j === i));
      if (i < 0) { ink.style.opacity = "0"; return; }
      ink.style.opacity = "1";
      ink.style.width = links[i].offsetWidth + "px";
      ink.style.transform = "translateX(" + links[i].offsetLeft + "px)";
    }

    function spy() {
      if (lockIdx !== null) { setActive(lockIdx); return; }
      const doc = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      let idx = -1;
      if (atBottom) {
        idx = sections.length - 1;
      } else {
        const ref = window.scrollY + window.innerHeight * 0.35;
        sections.forEach((s, i) => { if (s && s.offsetTop <= ref) idx = i; });
      }
      setActive(idx);
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { spy(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", () => { activeIdx = null; spy(); });
    spy();
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
  /* 8-bit markers for the updates axis, drawn like the pixel world:
     x = the type colour, l = a cut-out in the page background */
  const GLYPHS = {
    paper:     ["xxxx..", "xxxxx.", "xxxxxx", "xllllx", "xxxxxx", "xllllx", "xxxxxx"],
    position:  ["xxxxx.", "xxxxxx", "xxxxx.", "x.....", "x.....", "x.....", "xx...."],
    award:     ["...x...", "...x...", "xxxxxxx", ".xxxxx.", "..xxx..", ".xx.xx.", "xx...xx"],
    milestone: ["..x..", ".xxx.", "xxxxx", ".xxx.", "..x.."]
  };
  function pixelGlyph(type) {
    const rows = GLYPHS[type] || GLYPHS.milestone;
    let rects = "";
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== ".") rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1"' + (ch === "l" ? ' class="cut"' : "") + "/>";
    }));
    return '<svg viewBox="0 0 ' + rows[0].length + " " + rows.length + '" width="' + rows[0].length * 2 +
      '" height="' + rows.length * 2 + '" shape-rendering="crispEdges" aria-hidden="true">' + rects + "</svg>";
  }

  function setupUpdatesAxis() {
    const WINDOW = 8;   // updates on the axis at once; stepping past either end slides the window
    const list = document.getElementById("updates-list");
    list.classList.remove("timeline");
    const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, June: 5,
                     Jul: 6, July: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11 };
    // UPDATES is newest-first; the axis works oldest → newest
    const all = visible(UPDATES).map(u => {
      const m = u.date.match(/^(\w+)\s+'(\d\d)/);
      return { u, t: new Date(2000 + Number(m[2]), MONTHS[m[1]] || 0, 1).getTime() };
    }).reverse();
    const n = all.length;
    let lo = Math.max(0, n - WINDOW);   // window shows all[lo .. lo + WINDOW - 1]
    let current = n - 1;

    const track = el("div", "ax-track");
    const detail = el("div", "ax-detail");
    const prev = el("button", "ax-arrow", "‹");
    const next = el("button", "ax-arrow", "›");
    prev.setAttribute("aria-label", "earlier update");
    next.setAttribute("aria-label", "later update");

    function layout(dir) {
      track.innerHTML = "";
      all.forEach(i => { i.el = null; });
      const items = all.slice(lo, lo + WINDOW);
      const tMin = items[0].t, tMax = items[items.length - 1].t;
      const toX = t => 3 + 94 * (t - tMin) / Math.max(tMax - tMin, 1);
      items.forEach(i => { i.x = toX(i.t); });

      // Nudge near-coincident markers apart so every one stays hoverable
      const GAP = 3.4;
      for (let i = 1; i < items.length; i++) {
        if (items[i].x < items[i - 1].x + GAP) items[i].x = items[i - 1].x + GAP;
      }
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].x > 97) items[i].x = 97;
        if (i < items.length - 1 && items[i].x > items[i + 1].x - GAP) items[i].x = items[i + 1].x - GAP;
      }

      for (let y = new Date(tMin).getFullYear(); y <= new Date(tMax).getFullYear(); y++) {
        const t = new Date(y, 0, 1).getTime();
        if (t < tMin || t > tMax) continue;
        const tick = el("span", "ax-tick", "’" + String(y).slice(-2));
        tick.style.left = toX(t) + "%";
        track.appendChild(tick);
      }

      items.forEach(i => {
        const k = all.indexOf(i);
        const dot = el("button", "ax-dot t-" + (i.u.type || "milestone"), pixelGlyph(i.u.type));
        dot.style.left = i.x + "%";
        dot.setAttribute("aria-label", i.u.date);
        dot.addEventListener("mouseenter", () => select(k));
        dot.addEventListener("click", () => select(k));
        i.el = dot;
        track.appendChild(dot);
      });

      // Faded rail ends hint that more updates lie beyond the window
      track.classList.toggle("has-earlier", lo > 0);
      track.classList.toggle("has-later", lo + WINDOW < n);
      if (dir) {
        track.classList.remove("slide-back", "slide-fwd");
        void track.offsetWidth;
        track.classList.add(dir < 0 ? "slide-back" : "slide-fwd");
        setTimeout(() => track.classList.remove("slide-back", "slide-fwd"), 400);   // let the active bob resume
      }
    }

    function select(k) {
      // Stepping past the window pages it: back puts k at the right edge, forward at the left
      if (k < lo) { lo = Math.max(0, k - WINDOW + 1); layout(-1); }
      else if (k >= lo + WINDOW) { lo = Math.min(k, n - WINDOW); layout(1); }
      current = k;
      all.forEach(j => { if (j.el) j.el.classList.toggle("active", j === all[k]); });
      const u = all[k].u;
      detail.classList.remove("swap");
      void detail.offsetWidth;                 // restart the crossfade
      detail.innerHTML = '<span class="ax-date t-' + (u.type || "milestone") + '">' + u.date + "</span> — " + u.text;
      detail.classList.add("swap");
      prev.disabled = k === 0;
      next.disabled = k === n - 1;
    }

    const step = d => { if (all[current + d]) select(current + d); };
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    document.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });

    layout(0);
    list.appendChild(track);
    const row = el("div", "ax-detail-row");
    row.appendChild(detail);
    const nav = el("div", "ax-nav");
    nav.appendChild(prev);
    nav.appendChild(next);
    row.appendChild(nav);
    list.appendChild(row);
    select(current);
  }

  /* Path patching on the IOI circuit (Wang et al. 2022). Click a head to
     patch it out; P(Mary) vs P(John) react per the paper's story:
     duplicate-token heads feed S-inhibition, S-inhibition steers the name
     movers away from "John", and a backup name mover compensates when a
     primary one is ablated. */
  /* Pixel Tübingen under the portrait: the Neckarfront (castle hill, gabled
     houses, the Hölderlin tower, the river with a punt) and a riverbank
     promenade where Luma wanders by day and sleeps by night. Drawn per pixel
     on a 73×52 canvas shown at 3×; the sun/moon toggles the site theme, and
     the caption says so. */
  function buildWorldWidget() {
    const host = document.getElementById("widget");
    if (!host) return;
    host.className = "world-widget";

    const W = 73, H = 52, SCALE = 3;
    const canvas = el("canvas");
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * SCALE + "px";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Pixel-art Tübingen riverfront where Luma the cat strolls");
    const cap = el("div", "world-cap");
    host.append(canvas, cap);
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(W, H);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const PAL = {
      day: {
        skyTop: "#a8d3f3", skyBot: "#dcf0fc", sun: "#f7c948", sunHi: "#fde68a", cloud: "#ffffff", cloudSh: "#e3eff9",
        hill: "#6f9f58", hillLo: "#557f44", hillHi: "#88b56c",
        castle: "#e4ddcf", castleLo: "#bdb3a2", roof: "#b04a32", roofLo: "#8c3a28",
        window: "#3b4252", door: "#5a4636", timber: "#6b4a33",
        tower: "#efc75e", towerLo: "#d7a93f", cone: "#5d3b2e",
        wall: "#b9ae9b", mortar: "#958a7a",
        water: "#5b8fb9", waterLo: "#4a7aa3", waterHi: "#9cc6e6",
        hull: "#6b4a2b", poler: "#2f5d8a", skin: "#e0b48a", pole: "#8a6a45",
        bankEdge: "#4f8a3c", grass: "#78b45e", path: "#d9c39b", pathLo: "#c4ab80", pebble: "#a8957a",
        lampPost: "#3f4146", lampOff: "#e8e2c8"
      },
      night: {
        skyTop: "#0c1730", skyBot: "#1d2c50", moon: "#f3efd6", moonLo: "#cfc8a8", star: "#ffffff", starLo: "#8fa3c8",
        hill: "#22392f", hillLo: "#1a2c24", hillHi: "#2b473a",
        castle: "#4a4a55", castleLo: "#3a3a44", roof: "#4d2a24", roofLo: "#3b201c",
        window: "#1c2233", lit: "#ffd36e", litLo: "#e8a948", door: "#2a2220", timber: "#2b211b",
        tower: "#6b5a35", towerLo: "#57492b", cone: "#2a1d18",
        wall: "#4a4640", mortar: "#3a3631",
        water: "#1f3655", waterLo: "#182b45", waterHi: "#36557d",
        hull: "#3a2a1c", poler: "#22344c", skin: "#8a6f58", pole: "#4a3a28",
        bankEdge: "#203a2c", grass: "#2c4a3a", path: "#4f4738", pathLo: "#433c30", pebble: "#5a5245",
        lampPost: "#26282c", lampOn: "#ffe08a", glow: "#7a6a3e"
      }
    };
    // House facades along the Neckar (pastel by day, dimmed by night)
    const FACADES = ["#f4e1a6", "#f2b8a2", "#cfe0e8", "#f6f1e7", "#e9c46a", "#c9dcb3", "#e8b4c4", "#d9c2a5"];
    const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const dim = c => [c[0] * 0.3 + 10, c[1] * 0.3 + 14, c[2] * 0.3 + 30].map(Math.round);
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

    // Deterministic per-pixel noise and a 4×4 Bayer matrix for dithering
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
    const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

    // Layout rows
    const BASE = 29;                  // first row of the river wall (houses stand on it)
    const WATER = 32, BANK = 39;      // river rows WATER..BANK-1, promenade below
    const CAT_TOP = 40;
    const hillTop = x => Math.round(11 + 3.5 * Math.sin(x / 11 + 0.6) + 1.2 * Math.sin(x / 4.1));
    // x, width, top of facade wall, facade colour index, timber-framed?
    const HOUSES = [[0, 7, 18, 0, 0], [7, 6, 20, 1, 1], [13, 8, 16, 2, 0], [21, 6, 19, 3, 1], [27, 7, 17, 4, 0],
                    [34, 6, 20, 5, 0], [40, 8, 16, 6, 1], [48, 7, 18, 7, 0], [64, 9, 19, 3, 1]];
    const TOWER = { x: 56, w: 8, top: 13 };
    const LAMPS = [20, 50];
    const SUN = { x: 9, y: 6 };

    let mode = "day", P = PAL.day, bg = null, skyMask = null, litMask = null, luma = {};

    function lumaColors() {
      const cs = getComputedStyle(document.documentElement);
      ["o", "b", "l", "e", "w", "k"].forEach(k => { luma[k] = rgb(cs.getPropertyValue("--cr-" + k).trim() || "#000000"); });
    }

    function buildBackdrop() {
      bg = new Array(W * H);
      skyMask = new Uint8Array(W * H);
      litMask = new Uint8Array(W * H);
      const C = {};
      Object.keys(P).forEach(k => { C[k] = rgb(P[k]); });
      const night = mode === "night";
      const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) { bg[y * W + x] = c; skyMask[y * W + x] = 0; } };

      // Sky, castle hill, river, promenade
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const n = hash(x, y), ht = hillTop(x);
        let c;
        if (y < ht) {
          const t = (y / ht - 0.3) / 0.45;
          c = bayer(x, y) < t ? C.skyBot : C.skyTop;
          skyMask[y * W + x] = 1;
        } else if (y < BASE) {
          c = y === ht ? C.hillHi : n < 0.25 ? C.hillLo : n > 0.9 ? C.hillHi : C.hill;
        } else if (y < WATER) {
          c = ((x + (y % 2) * 2) % 4 === 0) ? C.mortar : C.wall;
        } else if (y < BANK) {
          c = y > WATER + 6 && bayer(x, y) < 0.5 ? C.waterLo : C.water;
        } else if (y === BANK) {
          c = C.bankEdge;
        } else if (y === BANK + 1) {
          c = n < 0.3 ? C.bankEdge : C.grass;
        } else {
          c = n > 0.94 ? C.pebble : bayer(x, y) < 0.25 ? C.pathLo : C.path;
        }
        bg[y * W + x] = c;
      }

      // Hohentübingen castle on the hill
      const cx = 27;
      for (let y = 8; y <= 12; y++) for (let x = cx; x <= cx + 7; x++) put(x, y, x === cx + 7 ? C.castleLo : C.castle);
      for (let x = cx - 1; x <= cx + 8; x++) put(x, 7, C.roof);
      for (let x = cx + 1; x <= cx + 6; x++) put(x, 6, C.roofLo);
      put(cx + 3, 5, C.roofLo); put(cx + 3, 4, C.roofLo);
      [[cx + 2, 10], [cx + 5, 10]].forEach(([x, y]) => { put(x, y, night ? C.lit : C.window); if (night) litMask[y * W + x] = 1; });

      // Gabled houses: steep roof, window grid, optional timber framing
      HOUSES.forEach(([hx, w, top, fi, timber], hi) => {
        const face = rgb(FACADES[fi]), wall = night ? dim(face) : face, shade = mix(wall, [0, 0, 0], 0.12);
        for (let y = top; y < BASE; y++) for (let x = hx; x < hx + w; x++) put(x, y, x === hx + w - 1 ? shade : wall);
        const rh = Math.ceil(w / 2) + 1;
        for (let k = 0; k < rh; k++) {
          const half = (w / 2) * (k + 1) / rh;
          for (let x = Math.round(hx + w / 2 - half); x < Math.round(hx + w / 2 + half); x++) {
            put(x, top - rh + k, (x + k) % 3 === 0 ? C.roofLo : C.roof);
          }
        }
        if (timber) {
          for (let y = top; y < BASE; y++) { put(hx, y, C.timber); }
          for (let x = hx; x < hx + w; x++) put(x, top + Math.floor((BASE - top) / 2), C.timber);
        }
        for (let y = top + 2; y < BASE - 2; y += 3) {
          for (let x = hx + 1 + (w % 2 ? 0 : 1) * 0; x < hx + w - 1; x += 2) {
            if (timber && y === top + Math.floor((BASE - top) / 2)) continue;
            const on = night && hash(x + hi, y) > 0.55;
            put(x, y, on ? C.lit : C.window);
            if (on) litMask[y * W + x] = 1;
          }
        }
        put(hx + Math.floor(w / 2), BASE - 1, C.door); put(hx + Math.floor(w / 2), BASE - 2, C.door);
      });

      // Hölderlin tower: round yellow tower with a pointed cone roof
      const T = TOWER;
      for (let y = T.top; y < BASE; y++) for (let x = T.x; x < T.x + T.w; x++) {
        put(x, y, x === T.x || x >= T.x + T.w - 2 ? C.towerLo : C.tower);
      }
      for (let k = 0; k < 8; k++) {
        const half = (T.w / 2 + 0.5) * (k + 1) / 8;
        for (let x = Math.round(T.x + T.w / 2 - half); x < Math.round(T.x + T.w / 2 + half); x++) put(x, T.top - 8 + k, C.cone);
      }
      [[T.x + 3, T.top + 3], [T.x + 3, T.top + 8], [T.x + 5, T.top + 8]].forEach(([x, y]) => {
        put(x, y, night ? C.lit : C.window); if (night) litMask[y * W + x] = 1;
      });
    }

    // Luma, 9×7 plus a feet row; E marks the eyes (moved to face the walk direction)
    const BODY = [".o.....o.", "obo...obo", "obbbbbbbo", "EYES", "obkbbbkbo", "obblllbbo", ".ooooooo."];
    const EYES = { left: "oebbbebbo", centre: "obebbbebo", right: "obbebbbeo", shut: "obobbbobo" };
    const FEET = ["..o...o..", ".o...o..."];
    const ZED = ["oooo", "..o.", ".o..", "oooo"];
    const SUN_DISC = ["..sss..", ".shhss.", "shhssss", "shsssss", "sssssss", ".sssss.", "..sss.."];

    const cat = { x: 30, face: "right", target: 40, state: "walk", until: 0, step: 0 };
    const clouds = [{ x: 18, y: 3, w: 9 }, { x: 46, y: 7, w: 7 }];

    function render(t) {
      const buf = bg.slice();
      const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; };
      const get = (x, y) => bg[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
      const sec = t / 1000;
      const night = mode === "night";
      const C = k => rgb(P[k]);

      if (!night) {
        const sun = C("sun"), hi = C("sunHi");
        SUN_DISC.forEach((row, r) => [...row].forEach((ch, c) => {
          if (ch !== ".") set(SUN.x - 3 + c, SUN.y - 3 + r, ch === "h" ? hi : sun);
        }));
        const long = Math.floor(sec * 1.5) % 2;
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
          set(SUN.x + dx * 5, SUN.y + dy * 5, sun);
          if (long) set(SUN.x + dx * 6, SUN.y + dy * 6, hi);
        });
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => set(SUN.x + dx * 4, SUN.y + dy * 4, long ? hi : sun));
        clouds.forEach(cl => {
          const cx = ((cl.x + sec * 1.2) % (W + cl.w)) - cl.w;
          for (let i = 0; i < cl.w; i++) {
            const top = i > 1 && i < cl.w - 2 ? -1 : 0;
            for (let j = top; j <= 1; j++) {
              const x = Math.round(cx + i), y = cl.y + j;
              if (x >= 0 && x < W && skyMask[y * W + x]) set(x, y, j === 1 ? C("cloudSh") : C("cloud"));
            }
          }
        });
      } else {
        for (let i = 0; i < 24; i++) {
          const x = Math.floor(hash(i, 3) * W), y = Math.floor(hash(i, 5) * 12);
          if (skyMask[y * W + x]) set(x, y, Math.sin(sec * 2 + i * 1.3) > 0.2 ? C("star") : C("starLo"));
        }
        const moon = C("moon"), lo = C("moonLo");
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          if (dx * dx + dy * dy > 10) continue;
          if ((dx - 2) * (dx - 2) + (dy + 1) * (dy + 1) <= 6) continue;
          set(SUN.x + dx, SUN.y + dy, dx > 0 || dy > 1 ? lo : moon);
        }
        // A few lit windows flicker off and on
        for (let i = 0; i < W * BASE; i++) {
          if (litMask[i] && Math.sin(sec * 0.7 + i * 2.1) > 0.97) buf[i] = C("litLo");
        }
      }

      // River: rippling reflections of the waterfront on alternate rows
      const water = C("water"), hiW = C("waterHi");
      for (let y = WATER; y < BANK; y++) {
        const d = y - WATER;
        const src = BASE - 1 - Math.round(d * 1.6);
        const shift = Math.round(Math.sin(sec * 1.6 + y * 0.9) * 1.2);
        for (let x = 0; x < W; x++) {
          if (d % 2 === 0 && src > 0) {
            const r = get(x + shift, src);
            set(x, y, mix(buf[y * W + x], r, night ? 0.45 : 0.38));
          }
          if (hash(x, y + Math.floor(sec * 3)) > 0.985) set(x, y, hiW);
        }
      }
      // Moonlight glinting on the water at night
      if (night) {
        for (let y = WATER + 1; y < BANK; y += 2) {
          const w = 1 + Math.round(Math.abs(Math.sin(sec * 2 + y)));
          for (let k = -w; k <= w; k++) set(SUN.x + k + Math.round(Math.sin(sec * 1.3 + y) * 1), y, C("moonLo"));
        }
      }

      // A punt drifting downstream with someone poling it
      const px = ((sec * 2.2 + 30) % (W + 22)) - 16, py = 35;   // starts mid-river
      for (let i = 0; i < 13; i++) {
        set(px + i, py, C("hull"));
        if (i > 0 && i < 12) set(px + i, py + 1, C("hull"));
      }
      set(px + 10, py - 1, C("poler")); set(px + 10, py - 2, C("poler")); set(px + 10, py - 3, C("skin"));
      const lean = Math.round(Math.sin(sec * 1.4));
      for (let k = 0; k < 7; k++) set(px + 12 - Math.round(k * 0.5) + (k > 3 ? lean : 0), py - 5 + k + 1, C("pole"));

      // Street lamps on the promenade, glowing at night
      LAMPS.forEach(lx => {
        for (let y = BANK - 7; y < BANK + 2; y++) set(lx, y, C("lampPost"));
        set(lx - 1, BANK - 8, C("lampPost")); set(lx + 1, BANK - 8, C("lampPost"));
        set(lx, BANK - 8, night ? C("lampOn") : C("lampOff"));
        if (night) {
          [[-1, -7], [1, -7], [-2, -8], [2, -8], [0, -9]].forEach(([dx, dy]) => {
            const x = lx + dx, y = BANK + dy;
            set(x, y, mix(buf[y * W + x] || C("glow"), C("lampOn"), 0.45));
          });
          for (let dx = -3; dx <= 3; dx++) set(lx + dx, BANK + 2, mix(get(lx + dx, BANK + 2), C("lampOn"), 0.35 - Math.abs(dx) * 0.08));
        }
      });

      drawCat(set, sec);

      // Dithered fade at the edges so the scene dissolves into the page
      const F = 3, data = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.min(x, y, W - 1 - x, H - 1 - y);
        const i = (y * W + x) * 4, c = buf[y * W + x];
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
        data[i + 3] = d < F && bayer(x, y) >= (d + 0.5) / F ? 0 : 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    function drawCat(set, sec) {
      const night = mode === "night";
      const hop = !night && cat.state === "hop" ? -1 : 0;
      const top = CAT_TOP + (night ? 1 : 0) + hop;
      const blink = !night && (sec * 1000) % 4000 < 140;
      const eyes = night || blink ? EYES.shut : EYES[cat.state === "walk" ? cat.face : cat.look || "centre"];
      BODY.forEach((row, r) => {
        const line = row === "EYES" ? eyes : row;
        [...line].forEach((ch, c) => { if (ch !== ".") set(cat.x + c, top + r, luma[ch]); });
      });
      if (!night) {
        const feet = cat.state === "walk" ? FEET[cat.step % 2] : FEET[0];
        [...feet].forEach((ch, c) => { if (ch !== ".") set(cat.x + c, top + 7, luma.o); });
      } else {
        for (let k = 0; k < 2; k++) {
          const phase = (sec / 2.4 + k / 2) % 1;
          const zx = cat.x + 8 + Math.round(phase * 3), zy = top - 4 - Math.round(phase * 6);
          ZED.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") set(zx + c, zy + r, luma.w); }));
        }
      }
    }

    // Luma's day: stroll to a spot, pause and look around, sometimes hop
    function think(now) {
      if (mode === "night") return;
      if (cat.state === "walk") {
        if (cat.x === cat.target) { cat.state = "idle"; cat.until = now + 1200 + Math.random() * 2200; cat.look = "centre"; }
        else { cat.x += cat.x < cat.target ? 1 : -1; cat.face = cat.x < cat.target ? "right" : "left"; cat.step++; }
      } else if (cat.state === "hop") {
        if (now > cat.until) { cat.state = "idle"; cat.until = now + 800; }
      } else if (now > cat.until) {
        if (Math.random() < 0.25) { cat.state = "hop"; cat.until = now + 250; }
        else { cat.state = "walk"; cat.target = 3 + Math.floor(Math.random() * 58); }
      } else if (Math.random() < 0.06) {
        cat.look = ["left", "centre", "right"][Math.floor(Math.random() * 3)];
      }
    }

    function setMode() {
      mode = document.documentElement.getAttribute("data-theme") === "dark" ? "night" : "day";
      P = PAL[mode];
      lumaColors();
      buildBackdrop();
      cap.innerHTML = mode === "day"
        ? 'Luma is learning how the world works. Tap the <button type="button" class="world-toggle">sun</button> to make it night.'
        : 'Luma is asleep. Tap the <button type="button" class="world-toggle">moon</button> to wake Luma.';
      cap.querySelector(".world-toggle").addEventListener("click", toggleTheme);
      render(performance.now());
    }

    // Clicking the sun/moon itself also flips the theme
    const overSun = e => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      return Math.abs(x - SUN.x) <= 5 && Math.abs(y - SUN.y) <= 5;
    };
    canvas.addEventListener("click", e => { if (overSun(e)) toggleTheme(); });
    canvas.addEventListener("mousemove", e => { canvas.style.cursor = overSun(e) ? "pointer" : ""; });

    new MutationObserver(setMode).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setMode();
    if (reduce) return;

    // ~10 fps is plenty for pixel art; pause while off-screen or in a hidden tab
    let visible = true, last = 0, lastThink = 0;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < 100) return;
      last = now;
      if (now - lastThink >= 180) { think(now); lastThink = now; }
      render(now);
    })(0);
  }

  function buildIOIWidget() {
    const host = document.getElementById("widget");
    if (!host) return;
    host.className = "ioi-widget";
    const NS = "http://www.w3.org/2000/svg";

    const sent = el("div", "ioi-sent",
      'Vedant loves <span class="io">anime</span> and <span class="s">soccer</span>; ' +
      'after <span class="s">soccer</span>, he unwinds with <span class="blank">___</span>');

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
    const maryBar = mkBar("anime", "mary");
    const johnBar = mkBar("soccer", "john");

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

      outText.textContent = pMary >= 55 ? "anime" : pMary <= 45 ? "soccer" : "?";
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
        return "no name movers left — nothing copies “anime” to the output";
      if (h.backup && primaries.every(x => x.dead))
        return "backup gone too — the prediction collapses";
      if (h.type === "si")
        return "S-inhibition weakened — less stops the model repeating “soccer”";
      if (h.type === "dt")
        return "duplicate-token head gone — induction heads (not shown) still spot the repeat";
      return "head " + h.id + " patched";
    }

    const ROLES = {
      dt: "notices “soccer” appears twice",
      si: "tells the name movers to steer away from “soccer”",
      nm: "copies “anime” into the prediction",
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

  // Flip light/dark with a page-wide crossfade; the pixel world's sun/moon calls this
  function toggleTheme() {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    setTimeout(() => root.classList.remove("theme-fade"), 450);
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

  /* publications.html: every visible paper as a compact list, grouped by year */
  function paperYear(p) {
    if (p.year) return p.year;
    const m = (p.badges || []).map(b => b.label).join(" ").match(/20\d\d/);
    return m ? Number(m[0]) : 0;
  }

  function pubNode(item) {
    const row = el("div", "pub");
    const paper = item.links.find(l => l.label === "Paper" || l.label === "Preprint") || item.links[0];
    const title = el("a", "title", item.title);
    title.href = paper.url;
    row.appendChild(title);
    row.appendChild(el("div", "authors", item.authors));
    const line = el("div", "pub-line");
    (item.badges || []).forEach(b => line.appendChild(el("span", "pill pill-" + b.tone, b.label)));
    const links = el("span", "links");
    item.links.forEach(l => {
      const a = el("a", null, l.label);
      a.href = l.url;
      links.appendChild(a);
    });
    line.appendChild(links);
    row.appendChild(line);
    return row;
  }

  function renderPublications() {
    const list = document.getElementById("pubs-list");
    const scholar = SITE.links.find(l => l.label === "Scholar");
    if (scholar) document.getElementById("scholar-link").href = scholar.url;
    const papers = visible(PAPERS);
    const years = [...new Set(papers.map(paperYear))].sort((a, b) => b - a);
    years.forEach(y => {
      list.appendChild(el("h3", "pub-year", y ? String(y) : "Other"));
      papers.filter(p => paperYear(p) === y).forEach(p => list.appendChild(pubNode(p)));
    });
  }

  /* blogs.html: every visible blog post as a card */
  function renderBlogs() {
    const list = document.getElementById("blogs-all");
    visible(BLOGS).filter(b => !isExternal(b)).forEach(b => list.appendChild(blogNode(b)));
    const older = visible(BLOGS).filter(isExternal);
    if (!older.length) return;
    const box = el("details", "blog-older");
    box.appendChild(el("summary", null, "Older posts <span class=\"blog-older-n\">" + older.length + "</span>"));
    const rows = el("div", "blog-older-list");
    older.forEach(b => rows.appendChild(olderNode(b)));
    box.appendChild(rows);
    list.after(box);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupExternalLinks();
    if (document.body.dataset.page === "blogs") {
      buildCritter();
      renderBlogs();
      return;
    }
    if (document.body.dataset.page === "publications") {
      buildCritter();
      renderPublications();
      return;
    }
    renderHeader();
    nameReveal();
    buildCritter();
    (SITE.updates === "timeline" ? setupUpdates : setupUpdatesAxis)();
    ({ world: buildWorldWidget, collab: buildCollabWidget, attention: buildAttentionWidget, ioi: buildIOIWidget }[SITE.widget] || buildWorldWidget)();
    renderBatch();          // first batch immediately, no waiting for scroll
    drainWhileNear();       // fill the initial viewport
    setupObserver();
    setupNav();
    jumpToHash();
  });

  // Arriving from publications.html (e.g. index.html#blogs): render everything
  // above the target first, or the jump lands short as batches fill in.
  function jumpToHash() {
    let target = null;
    try { target = location.hash && document.querySelector(location.hash); } catch (e) {}
    if (!target || target.tagName !== "SECTION") return;
    const list = target.querySelector("[data-list]");
    if (list) drainThrough(list.id);
    target.scrollIntoView();
  }
})();
