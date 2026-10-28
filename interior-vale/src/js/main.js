/*
Template Name: interiorvale-html5-interior-design-website-template
File Name: main.js
Author Name: ThemeVault
Author URI: https://www.themevault.net/
Version: 2.0

Dependency-free. Bootstrap's own bundle drives the navbar, tabs, carousel,
accordion and scrollspy; everything below replaces what jQuery and its plugins
used to do.
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* BS3 marked the active tab on the <li>; BS5 marks the <a>. Templates key CSS on li.active (flowerspetal, wrap-d-style) — keep both in step */
    /* BS3's tab plugin worked from any trigger; BS5's needs a .nav / .list-group / [role=tablist] ancestor or it silently does nothing
       (homeapart: eight grid columns switch the portfolio panes). Give such triggers their nearest .row as the tablist. */
    document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]').forEach(function (t) {
        if (t.closest('.nav, .list-group, [role="tablist"]')) return;
        var host = t.closest(".row") || t.parentElement.parentElement; if (host && !host.getAttribute("role")) host.setAttribute("role", "tablist");
    });
    /* BS5's scrollspy marks the <a>.active and colours it at (0,3,0) — above a template's ".navbar-default .navbar-nav > li > a" (0,2,2), so
       the spied item went grey (homeapart's "About" on the tablet). BS3 marked the <li>; do the same and take the class off the <a>. */
    document.addEventListener("activate.bs.scrollspy", function (e) {
        var a = e.relatedTarget; if (!a || !a.closest) return;
        var ul = a.closest(".navbar-nav, .nav, ul"); if (ul) ul.querySelectorAll("li.active").forEach(function (li) { li.classList.remove("active"); });
        var li = a.closest("li"); if (li) li.classList.add("active");
        a.classList.remove("active");
    });
    document.addEventListener("shown.bs.tab", function (e) { var a = e.target, ul = a.closest('.nav, [role="tablist"]'); if (!ul) return; ul.querySelectorAll("li").forEach(function (li) { li.classList.remove("active"); }); ul.querySelectorAll("[data-bs-toggle]").forEach(function (t) { if (t !== a) t.classList.remove("active"); }); var li = a.closest("li"); if (li) li.classList.add("active"); });
    /* BS3 marked an open dropdown's parent with .open; BS5 uses .show. Templates
       key CSS on .open (wrap-d-style slides its cart panel in on it) — mirror it. */
    document.addEventListener("shown.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.add("open"); });
    document.addEventListener("hidden.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.remove("open"); });

    /* Lightbox — replaces magnific-popup. Arrows and the keyboard step through
       the set; focus is trapped and restored. */
    var popupLinks = Array.prototype.slice.call(document.querySelectorAll("[data-image-popup], [data-lightbox], [data-fancybox]")); /* the port keeps v1's own lightbox attribute (lightbox.js data-lightbox, fancybox) — sojournion */
    if (popupLinks.length) {
        var box = document.createElement("div");
        box.className = "tv-lightbox";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        box.setAttribute("aria-label", "Image viewer");
        box.innerHTML =
            '<button type="button" class="tv-lb-close" aria-label="Close">&times;</button>' +
            '<button type="button" class="tv-lb-prev" aria-label="Previous image">&#10094;</button>' +
            '<img alt="">' +
            '<button type="button" class="tv-lb-next" aria-label="Next image">&#10095;</button>';
        document.body.appendChild(box);
        var lbImg = box.querySelector("img"), current = 0, lastFocus = null;
        var show = function (i) {
            current = (i + popupLinks.length) % popupLinks.length;
            var link = popupLinks[current];
            lbImg.src = link.getAttribute("href");
            var inner = link.querySelector("img");
            lbImg.alt = (inner && inner.getAttribute("alt")) || "Gallery image";
        };
        var open = function (i) {
            lastFocus = document.activeElement; show(i);
            box.classList.add("is-open"); document.body.style.overflow = "hidden";
            box.querySelector(".tv-lb-close").focus();
        };
        var close = function () {
            box.classList.remove("is-open"); document.body.style.overflow = "";
            lbImg.removeAttribute("src"); if (lastFocus) lastFocus.focus();
        };
        /* ONE delegated listener: the carousel runs after this and clones its slides with cloneNode, which drops per-link
           listeners — a tap on a looped (cloned) gallery slide opened nothing (barbeard's works carousel). A clone maps back
           to its original by href, so the arrows still step through the real set only. */
        document.addEventListener("click", function (e) {
            var link = e.target.closest && e.target.closest("[data-image-popup], [data-lightbox], [data-fancybox]");
            if (!link) return;
            var i = popupLinks.indexOf(link), href = link.getAttribute("href");
            if (i < 0) for (var k = 0; k < popupLinks.length; k++) if (popupLinks[k].getAttribute("href") === href) { i = k; break; }
            if (i < 0) return;
            e.preventDefault(); open(i);
        });
        box.querySelector(".tv-lb-close").addEventListener("click", close);
        box.querySelector(".tv-lb-prev").addEventListener("click", function () { show(current - 1); });
        box.querySelector(".tv-lb-next").addEventListener("click", function () { show(current + 1); });
        box.addEventListener("click", function (e) { if (e.target === box) close(); });
        document.addEventListener("keydown", function (e) {
            if (!box.classList.contains("is-open")) return;
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") show(current - 1);
            if (e.key === "ArrowRight") show(current + 1);
        });
    }
    /* ------------------------------------------------------------------
       Carousels — replaces Owl Carousel (and jQuery with it). Shared block
       from web/scripts/upgrade-qa2/lib/js/carousel.js.

       Config travels on data-owl, lifted from v1's inline $.owlCarousel()
       call, e.g. data-owl='{"items":1,"dots":true,"loop":true,"autoplay":4000}':
         items / responsive   how many show at each MIN width ({"0":1,"768":2})
         nav, dots            arrows (navHtml for custom markup) / pager
         loop                 wrap around — with CLONES, as Owl does
         speed                transition in ms (Owl's 250 default)
         autoplay             interval in ms, or falsy for none
       The plugin's STYLESHEET (owl.carousel.css / owl.theme.default.css) is
       kept verbatim because it IS the slider's design — Owl built the
       stage/item DOM at runtime; this builds the same DOM.
       ------------------------------------------------------------------ */
    document.querySelectorAll("[data-owl]").forEach(function (root) {
        var cfg;
        try { cfg = JSON.parse(root.getAttribute("data-owl")); } catch (e) { return; }
        var slides = Array.prototype.filter.call(root.children, function (c) { return c.nodeType === 1; });
        if (!slides.length) return;
        var speed = reduceMotion ? 0 : (cfg.speed || 250);
        var loop = !!cfg.loop && slides.length > 1;

        var stage = document.createElement("div");
        stage.className = "owl-stage";
        var outer = document.createElement("div");
        outer.className = "owl-stage-outer";
        outer.appendChild(stage);

        var wrap = function (el, cloned) {
            /* a template that hand-wrote <div class="owl-item"> around each slide (wrap-d-style's thumbnails) is not wrapped twice */
            if (el.classList && el.classList.contains("owl-item")) { if (cloned) { el.classList.add("cloned"); el.setAttribute("aria-hidden", "true"); } return el; }
            var item = document.createElement("div");
            item.className = "owl-item" + (cloned ? " cloned" : "");
            if (cloned) item.setAttribute("aria-hidden", "true");
            item.appendChild(el);
            return item;
        };
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });
        slides.forEach(function (el) { stage.appendChild(wrap(el, false)); });
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });

        root.textContent = "";
        root.appendChild(outer);
        root.classList.add("owl-loaded", "owl-drag");

        var items = Array.prototype.slice.call(stage.children);
        var count = slides.length;
        var index = loop ? count : 0;
        var timer = null, animating = false;

        var nav = document.createElement("div"), navBtn = {};
        nav.className = "owl-nav" + (cfg.nav ? "" : " disabled");
        /* Owl 2 rendered the arrows as <div class="owl-prev"> (a template's CSS
           keys on `.owl-nav > div`, wrap-d-style on `div.owl2-prev`) and let
           navClass / navText rename and fill them. Same here: a <div
           role=button> when the template's CSS wants a div, its own class
           names, its own text — a11y kept with tabindex + Enter/Space. */
        ["prev", "next"].forEach(function (dir, i) {
            var b = document.createElement(cfg.navTag || "div");
            if (b.tagName === "BUTTON") b.type = "button"; else { b.setAttribute("role", "button"); b.tabIndex = 0; }
            b.className = (cfg.navClass && cfg.navClass[i]) || "owl-" + dir;
            b.setAttribute("aria-label", dir === "prev" ? "Previous slide" : "Next slide");
            var text = cfg.navText && cfg.navText[i];
            b.innerHTML = (cfg.navHtml && cfg.navHtml[dir]) || (typeof text === "string" ? text : '<i class="fas fa-angle-' + (dir === "prev" ? "left" : "right") + '" aria-hidden="true"></i>');
            var fire = function () { go(dir === "next" ? 1 : -1); restartAutoplay(); };
            b.addEventListener("click", function () { fire(); if (b.tagName !== "BUTTON") b.blur(); }); /* a focusable div keeps a template's :focus (hover) look after a mouse click — v1's divs were not focusable */
            b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
            nav.appendChild(b); navBtn[dir] = b;
        });
        root.appendChild(nav);

        var dots = document.createElement("div");
        dots.className = (cfg.dotsClass || "owl-dots") + (cfg.dots ? "" : " disabled");
        if (cfg.dots) root.appendChild(dots); /* Owl built no pager at dots:false; a custom dotsClass would otherwise miss owl.theme's .owl-dots.disabled and show two stray dashes (wrap-d-style) */

        var perView = function () {
            var w = window.innerWidth, n = cfg.items || 1;
            Object.keys(cfg.responsive || {})
                .map(Number).sort(function (a, b) { return a - b; })
                .forEach(function (bp) { if (w >= bp) n = cfg.responsive[bp]; });
            return Math.max(1, Math.min(n, count));
        };
        var itemWidth = function () {
            var n = perView(), gap = cfg.margin || 0;
            return (root.clientWidth - gap * (n - 1)) / n;
        };
        var step = function () { return loop ? 1 : perView(); };
        var lastIndex = function () { return loop ? items.length - 1 : Math.max(0, count - perView()); };

        var setTransform = function (withTransition) {
            var gap = cfg.margin || 0;
            stage.style.transition = withTransition && speed ? "transform " + speed + "ms ease" : "none";
            stage.style.transform = "translateX(" + (-index * (itemWidth() + gap)) + "px)";
            var real = loop ? ((index - count) % count + count) % count : index;
            Array.prototype.forEach.call(dots.children, function (d, i) {
                d.classList.toggle("active", i === Math.floor(real / step()));
            });
            items.forEach(function (it, i) { it.classList.toggle("active", i >= index && i < index + perView()); });
            /* Owl marked the arrow that can go no further .disabled (owl.carousel.css fades it); a template's own CSS keys on it too */
            if (!loop) { if (navBtn.prev) navBtn.prev.classList.toggle("disabled", index <= 0); if (navBtn.next) navBtn.next.classList.toggle("disabled", index >= lastIndex()); }
        };

        var guard = null;
        var go = function (d) {
            if (animating) return;
            var target = index + d * step();
            if (!loop) target = Math.max(0, Math.min(lastIndex(), target));
            if (target === index) return;
            index = target;
            animating = speed > 0;
            setTransform(true);
            if (!animating) { settleLoop(); return; }
            clearTimeout(guard);
            guard = setTimeout(settleLoop, speed + 100);
        };
        var settleLoop = function () {
            clearTimeout(guard);
            animating = false;
            if (!loop) return;
            if (index >= 2 * count) { index -= count; setTransform(false); }
            else if (index < count) { index += count; setTransform(false); }
        };
        stage.addEventListener("transitionend", function (e) { if (e.target === stage) settleLoop(); });

        var layout = function () {
            if (!root.clientWidth) return;
            var width = itemWidth(), gap = cfg.margin || 0;
            items.forEach(function (it) {
                it.style.width = width + "px";
                it.style.marginRight = gap + "px";
            });
            stage.style.width = (width + gap) * items.length + "px";
            if (!loop && index > lastIndex()) index = lastIndex();
            nav.classList.toggle("disabled", !cfg.nav || count <= perView());
            dots.textContent = "";
            var pages = Math.max(1, Math.ceil(count / step()));
            for (var i = 0; i < pages; i++) {
                (function (i) {
                    var d = document.createElement("button");
                    d.type = "button";
                    d.className = cfg.dotClass || "owl-dot";
                    d.setAttribute("aria-label", "Go to slide " + (i + 1));
                    d.appendChild(document.createElement("span"));
                    d.addEventListener("click", function () { index = (loop ? count : 0) + i * step(); setTransform(true); restartAutoplay(); });
                    dots.appendChild(d);
                })(i);
            }
            setTransform(false);
        };

        var restartAutoplay = function () {
            if (!cfg.autoplay || reduceMotion) return;
            clearInterval(timer);
            timer = setInterval(function () { go(1); }, cfg.autoplay);
        };
        root.addEventListener("mouseenter", function () { clearInterval(timer); });
        root.addEventListener("mouseleave", restartAutoplay);
        restartAutoplay();

        var startX = null;
        var onDown = function (x) { startX = x; };
        var onUp = function (x) {
            if (startX === null) return;
            var dx = x - startX;
            startX = null;
            if (Math.abs(dx) < 40) return;
            go(dx < 0 ? 1 : -1);
            restartAutoplay();
        };
        root.addEventListener("touchstart", function (e) { onDown(e.touches[0].clientX); }, { passive: true });
        root.addEventListener("touchend", function (e) { onUp(e.changedTouches[0].clientX); }, { passive: true });

        layout();
        if ("ResizeObserver" in window) {
            var lastW = root.clientWidth;
            new ResizeObserver(function () {
                if (root.clientWidth === lastW) return;
                lastW = root.clientWidth;
                layout();
            }).observe(root);
        } else {
            var t;
            window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 150); }, { passive: true });
        }
    });

    /* A static template posts nowhere, so rather than pretend, validate and
       say so plainly. */
    var form = document.querySelector(".tv-contact-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
            var note = form.querySelector(".tv-form-note");
            if (note) { note.hidden = false; note.focus(); }
            form.reset(); form.classList.remove("was-validated");
        });
    }
})();

/* Back to top (the shell's #back-to-top): shown past 100px, smooth scroll up. */
(function () {
    var toTop = document.getElementById("back-to-top");
    if (!toTop) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var toggle = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
    toggle(); window.addEventListener("scroll", toggle, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
})();

/* Footer year */
(function () { var y = document.getElementById("tv-year"); if (y) y.textContent = String(new Date().getFullYear()); })();

/* No transitions on first paint, and no :hover-driven menus until the visitor moves: a browser can paint the new page with the cursor
   already resting on a nav item, so a hover-opened mega menu or cart panel shows for a moment and then animates shut
   (wrap-d-style, owner note 16). tv-preload drops transitions; tv-nohover keeps hover menus closed until the first real input. */
(function () {
    var body = document.body; body.classList.add("tv-nohover");
    var go = function () { requestAnimationFrame(function () { body.classList.remove("tv-preload"); }); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    var release = function () { body.classList.remove("tv-nohover"); ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.removeEventListener(t, release); }); };
    ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.addEventListener(t, release, { passive: true }); });
})();

/* == interiorvale == */
/* v1 custom.js: the menu button slides .nav-inner in from the left over a dimming .tv-nav-overlay; the button, the overlay or Esc
   close it. Closed, the panel is inert (off-screen links are not tabbable). */
(function () {
    var btn = document.querySelector(".tv-nav-button"), nh = document.querySelector(".nav-inner"), ov = document.querySelector(".tv-nav-overlay");
    if (!btn || !nh) return;
    var t = 0;
    var show = function () {
        clearTimeout(t); t = setTimeout(function () { nh.classList.add("visible"); }, 120);
        btn.classList.add("closemenu"); nh.classList.remove("isDown"); if (ov) ov.classList.add("visibleover");
        btn.setAttribute("aria-expanded", "true"); nh.inert = false;
    };
    var hide = function () {
        clearTimeout(t); nh.classList.add("isDown"); btn.classList.remove("closemenu"); nh.classList.remove("visible");
        if (ov) ov.classList.remove("visibleover"); btn.setAttribute("aria-expanded", "false"); nh.inert = true;
    };
    nh.inert = true;
    btn.addEventListener("click", function (e) { e.preventDefault(); if (nh.classList.contains("isDown")) show(); else hide(); });
    if (ov) ov.addEventListener("click", hide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !nh.classList.contains("isDown")) { hide(); btn.focus(); } });
})();
/* v1 custom.js: the .tv-filter-button tab grows into the filter bar (.full-filter-button), then the bar's buttons drop in
   (.tv-full-height-wrap) 400ms later; a second tap reverses it */
(function () {
    var fb = document.querySelector(".tv-filter-button"), fw = document.querySelector(".tv-filter-wrapper");
    if (!fb || !fw) return;
    var t = 0;
    var open = function () { clearTimeout(t); fb.classList.add("full-filter-button"); fb.classList.remove("back-full-filter-button"); t = setTimeout(function () { fw.classList.add("tv-full-height-wrap"); }, 400); fb.setAttribute("aria-expanded", "true"); };
    var shut = function () { clearTimeout(t); fw.classList.remove("tv-full-height-wrap"); fb.classList.add("back-full-filter-button"); t = setTimeout(function () { fb.classList.remove("full-filter-button"); }, 400); fb.setAttribute("aria-expanded", "false"); };
    var toggle = function () { if (fb.classList.contains("back-full-filter-button")) open(); else shut(); };
    fb.addEventListener("click", toggle);
    fb.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
})();
/* v1 shuffle.custom.js (exclusive mode): a .filter-options button shows its data-group's projects; tapping the active one again,
   or "all", shows everything. Returning projects fade and scale in, as Shuffle animated them. */
(function () {
    var opts = document.querySelector(".filter-options"), grid = document.getElementById("grid");
    if (!opts || !grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll(".grid-item"));
    var buttons = Array.prototype.slice.call(opts.children);
    var apply = function (g) {
        items.forEach(function (it) {
            var groups = []; try { groups = JSON.parse(it.getAttribute("data-groups") || "[]"); } catch (e) { groups = []; }
            var on = g === "all" || groups.indexOf(g) > -1;
            if (on && it.hidden) {
                it.classList.add("tv-shuffle-in"); it.hidden = false;
                requestAnimationFrame(function () { requestAnimationFrame(function () { it.classList.remove("tv-shuffle-in"); }); });
            } else if (!on) it.hidden = true;
        });
    };
    buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.classList.contains("active") ? "true" : "false");
        b.addEventListener("click", function () {
            var was = b.classList.contains("active");
            buttons.forEach(function (c) { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
            if (was) { apply("all"); return; }
            b.classList.add("active"); b.setAttribute("aria-pressed", "true"); apply(b.getAttribute("data-group"));
        });
    });
})();
/* == /interiorvale == */

/* == interiorvale blog == */
/* v1 custom.js openNav()/closeNav(): the search icon widens #search_nav to the full screen; the close button or Esc shut it,
   focus goes to the field and back to the icon */
(function () {
    var ov = document.getElementById("search_nav"), btn = document.querySelector(".tv-search-button");
    if (!ov || !btn) return;
    var input = ov.querySelector("input"), close = ov.querySelector(".closebtn");
    var openNav = function () { ov.style.width = "100%"; ov.inert = false; btn.setAttribute("aria-expanded", "true"); setTimeout(function () { input.focus(); }, 350); };
    var closeNav = function () { ov.style.width = "0%"; ov.inert = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); };
    btn.addEventListener("click", openNav);
    close.addEventListener("click", closeNav);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.style.width === "100%") closeNav(); });
    ov.querySelector("form").addEventListener("submit", function (e) { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });
})();
/* every form (contact, comments, booking): a static template posts nowhere — validate, mark the bad fields, say so plainly */
(function () {
    document.querySelectorAll("form.tv-form").forEach(function (form) {
        var note = form.querySelector(".tv-form-note");
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            form.querySelectorAll(".form-control").forEach(function (c) { c.classList.toggle("is-invalid", !c.checkValidity()); c.setAttribute("aria-invalid", c.checkValidity() ? "false" : "true"); });
            if (!form.checkValidity()) { var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
            if (note) { note.hidden = false; note.focus(); }
            form.reset();
        });
        form.addEventListener("input", function (e) { if (e.target.classList.contains("is-invalid") && e.target.checkValidity()) { e.target.classList.remove("is-invalid"); e.target.setAttribute("aria-invalid", "false"); } if (note) note.hidden = true; });
    });
})();
/* no dates in the past on a booking date field */
(function () {
    var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    document.querySelectorAll('input[type="date"][data-tv-future]').forEach(function (d) { d.min = t.toISOString().slice(0, 10); });
})();
/* the post's share links: the network's share address for the page being read */
(function () {
    document.querySelectorAll("a[data-share]").forEach(function (a) { a.href = a.href.split("=")[0] + "=" + encodeURIComponent(location.href); });
})();
/* blog cards (v1: three "#" links): Likes toggles, Share opens the device's share sheet or copies the post's link */
(function () {
    document.querySelectorAll("button.tv-blog-like").forEach(function (b) {
        b.addEventListener("click", function () { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on ? "true" : "false"); b.classList.toggle("is-liked", on); });
    });
    document.querySelectorAll("button.tv-blog-share").forEach(function (b) {
        b.addEventListener("click", function () {
            var url = new URL(b.getAttribute("data-share-url"), location.href).href, title = b.getAttribute("data-share-title");
            if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
            var done = function () { var t = b.lastChild; var was = t.textContent; t.textContent = "Link copied"; setTimeout(function () { t.textContent = was; }, 1800); };
            if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { location.href = url; }); else location.href = url;
        });
    });
})();
/* blog.html?q=…: only the posts whose title or excerpt match, with a line saying so and a way back */
(function () {
    var wrap = document.querySelector(".tv-blog-masonry"); if (!wrap) return;
    var q = (new URLSearchParams(location.search).get("q") || "").trim(); if (!q) return;
    var words = q.toLowerCase().split(/\s+/), posts = Array.prototype.slice.call(wrap.querySelectorAll(".tv-blog-list")), shown = 0;
    posts.forEach(function (p) {
        var t = p.textContent.toLowerCase(), hit = words.every(function (w) { return t.indexOf(w) > -1; });
        p.hidden = !hit; if (hit) shown++;
    });
    var note = document.createElement("p"); note.className = "tv-search-note"; note.setAttribute("role", "status");
    note.textContent = shown ? shown + " post" + (shown > 1 ? "s" : "") + " matching \u201c" + q + "\u201d. " : "No posts match \u201c" + q + "\u201d. ";
    var all = document.createElement("a"); all.href = "blog.html"; all.textContent = "Show all posts"; note.appendChild(all);
    wrap.parentNode.insertBefore(note, wrap);
    var field = document.getElementById("tv-search-q"); if (field) field.value = q;
})();
/* v1's Masonry (itemSelector .tv-blog-list, percentPosition): each post goes into the shortest column; the column count comes from
   the posts' own CSS width (3 / 2 / 1 as v1's style.css and responsive.css say), re-laid on resize and as photos load */
(function () {
    var wrap = document.querySelector(".tv-blog-masonry"); if (!wrap) return;
    var lay = function () {
        var items = Array.prototype.filter.call(wrap.querySelectorAll(".tv-blog-list"), function (it) { return !it.hidden; });
        wrap.classList.remove("tv-masonry"); items.forEach(function (it) { it.style.left = it.style.top = ""; });
        if (!items.length) { wrap.style.height = ""; return; }
        var W = wrap.clientWidth, w = items[0].offsetWidth, cols = Math.max(1, Math.round(W / w));
        if (cols === 1) { wrap.style.height = ""; return; }
        var hs = []; for (var i = 0; i < cols; i++) hs.push(0);
        var gap = parseFloat(getComputedStyle(items[0]).marginBottom) || 0;
        var tops = items.map(function (it) {
            var c = hs.indexOf(Math.min.apply(null, hs)), top = hs[c];
            hs[c] += it.offsetHeight + gap; return [c, top];
        });
        wrap.classList.add("tv-masonry");
        items.forEach(function (it, n) { it.style.left = (tops[n][0] * 100 / cols) + "%"; it.style.top = tops[n][1] + "px"; });
        wrap.style.height = Math.max.apply(null, hs) + "px";
    };
    var t = 0, soon = function () { clearTimeout(t); t = setTimeout(lay, 60); };
    wrap.querySelectorAll("img").forEach(function (img) { if (!img.complete) img.addEventListener("load", soon); });
    window.addEventListener("resize", soon); window.addEventListener("load", lay); lay();
})();
/* == /interiorvale blog == */

/* == interiorvale improve == */
(function () {
    var h = document.querySelector(".tv-header"); if (!h) return;
    var set = function () { h.classList.toggle("tv-scrolled", window.scrollY > 10); };
    window.addEventListener("scroll", set, { passive: true }); set();
})();
(function () {
    var opts = document.querySelector(".filter-options"), grid = document.getElementById("grid");
    if (!opts || !grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll(".grid-item"));
    Array.prototype.forEach.call(opts.children, function (b) {
        var g = b.getAttribute("data-group"), n = g === "all" ? items.length : items.filter(function (it) {
            try { return JSON.parse(it.getAttribute("data-groups") || "[]").indexOf(g) > -1; } catch (e) { return false; }
        }).length;
        var c = document.createElement("span"); c.className = "tv-count"; c.setAttribute("aria-hidden", "true"); c.textContent = n;
        b.appendChild(c);
    });
})();
/* == /interiorvale improve == */
