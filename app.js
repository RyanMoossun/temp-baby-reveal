(function () {
  "use strict";

  var config = window.REVEAL_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  var GENDERS = {
    boy:  { headline: "Boy!",  className: "reveal-boy",  colors: ["#5aa9e6", "#2f7fc1", "#9fd0f5", "#dcefff", "#ffffff"] },
    girl: { headline: "Girl!", className: "reveal-girl", colors: ["#f28fb4", "#d9578a", "#f9bcd3", "#ffe3ee", "#ffffff"] },
  };

  // ---------- Setup ----------

  $("title").textContent = config.title || "Baby is on the way!";
  $("subtitle").textContent = config.subtitle || "";
  document.title = config.title || "Gender Reveal";

  function showError(message) {
    $("countdown").hidden = true;
    $("error").hidden = false;
    $("error").textContent = message;
  }

  function decodeGender(encoded) {
    try {
      var value = atob(String(encoded)).trim().toLowerCase();
      return GENDERS[value] ? value : null;
    } catch (e) {
      return null;
    }
  }

  var gender = decodeGender(config.gender);
  if (!gender) {
    showError('The gender in config.js isn\'t valid. Use "Ym95" for boy or "Z2lybA==" for girl.');
    return;
  }

  var target = Date.parse(config.revealAt);
  if (isNaN(target)) {
    showError('The reveal date in config.js isn\'t valid. Use the format "YYYY-MM-DDTHH:MM:SS", e.g. "2026-12-01T18:00:00".');
    return;
  }

  // ?preview=1 runs a 10 second countdown so the reveal can be tested.
  var preview = new URLSearchParams(window.location.search).has("preview");
  if (preview) target = Date.now() + 10000;

  $("when").textContent = preview
    ? "Preview mode: revealing in 10 seconds"
    : "Reveal on " + new Date(target).toLocaleString(undefined, {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "numeric", minute: "2-digit",
      });

  // ---------- Countdown ----------

  var els = { days: $("days"), hours: $("hours"), minutes: $("minutes"), seconds: $("seconds") };
  var last = {};
  var timer = null;

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function render(key, value) {
    if (last[key] === value) return;
    last[key] = value;
    var el = els[key];
    el.textContent = value;
    el.classList.remove("tick");
    void el.offsetWidth; // restart the animation
    el.classList.add("tick");
  }

  function tick() {
    var remaining = target - Date.now();
    if (remaining <= 0) {
      reveal();
      return;
    }
    var total = Math.ceil(remaining / 1000);
    render("days", pad(Math.floor(total / 86400)));
    render("hours", pad(Math.floor((total % 86400) / 3600)));
    render("minutes", pad(Math.floor((total % 3600) / 60)));
    render("seconds", pad(total % 60));
    $("countdown").classList.toggle("final", total <= 10);
  }

  // ---------- Reveal ----------

  function reveal() {
    if (timer) clearInterval(timer);
    var g = GENDERS[gender];

    $("countdown").hidden = true;
    $("reveal-headline").textContent = g.headline;
    if (config.babyName) {
      $("reveal-name").textContent = "Welcome, " + config.babyName + "!";
      $("reveal-name").hidden = false;
    }
    $("reveal").hidden = false;
    document.body.classList.add(g.className);
    document.title = "It's a " + g.headline;

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      launchConfetti(g.colors);
    }

    closeVoting();
  }

  // ---------- Voting ----------

  // Votes are kept by a free counter service. Preview mode uses its own
  // tally so testing doesn't add to the real one.
  var VOTE_API = "https://abacus.jasoncameron.dev";
  var voteNs = config.voteNamespace ? config.voteNamespace + (preview ? "-preview" : "") : "";
  var VOTE_KEY = "reveal-vote:" + voteNs;
  var votes = { boy: 0, girl: 0 };
  var myVote = null;
  var votingOpen = true;
  var voteTimer = null;
  var voteButtons = document.querySelectorAll(".vote-btn");

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function fetchCount(key, action) {
    return fetch(VOTE_API + "/" + action + "/" + encodeURIComponent(voteNs) + "/" + key)
      .then(function (res) {
        if (res.status === 404) return { value: 0 }; // no votes yet
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) { votes[key] = data.value || 0; });
  }

  function loadVotes() {
    return Promise.all([fetchCount("boy", "get"), fetchCount("girl", "get")]).then(renderVotes);
  }

  function plural(n) { return n + (n === 1 ? " vote" : " votes"); }

  function renderVotes() {
    var total = votes.boy + votes.girl;
    var boyPct = total ? Math.round((votes.boy / total) * 100) : 50;
    $("bar-boy").style.width = boyPct + "%";
    $("bar-girl").style.width = (100 - boyPct) + "%";
    $("count-boy").textContent = "Boy " + boyPct + "% · " + plural(votes.boy);
    $("count-girl").textContent = plural(votes.girl) + " · " + (100 - boyPct) + "% Girl";
    $("vote-results").hidden = false;

    if (!votingOpen) {
      if (!total) { $("vote").hidden = true; return; }
      $("vote-status").textContent = votes[gender] + " of " + total + " guessed right!" +
        (myVote ? (myVote === gender ? " Including you 🎉" : " Better luck next time!") : "");
    } else if (myVote) {
      $("vote-status").textContent = "You're on Team " + GENDERS[myVote].headline.replace("!", "") + ".";
    }
  }

  function markChosen() {
    for (var i = 0; i < voteButtons.length; i++) {
      voteButtons[i].disabled = true;
      voteButtons[i].classList.toggle("chosen", voteButtons[i].getAttribute("data-vote") === myVote);
    }
  }

  function castVote(choice) {
    if (myVote || !votingOpen) return;
    for (var i = 0; i < voteButtons.length; i++) voteButtons[i].disabled = true;
    $("vote-status").textContent = "Saving your vote…";
    fetchCount(choice, "hit")
      .then(function () {
        myVote = choice;
        storageSet(VOTE_KEY, choice);
        markChosen();
        return loadVotes();
      })
      .catch(function () {
        if (!myVote) {
          for (var i = 0; i < voteButtons.length; i++) voteButtons[i].disabled = false;
          $("vote-status").textContent = "Couldn't save your vote. Please try again.";
        }
      });
  }

  function startVoting() {
    if (!voteNs) return;
    $("vote").hidden = false;
    var saved = storageGet(VOTE_KEY);
    if (GENDERS[saved]) {
      myVote = saved;
      markChosen();
      loadVotes().catch(function () {});
    } else {
      $("vote-status").textContent = "Pick a side to see how everyone else voted.";
    }
    for (var i = 0; i < voteButtons.length; i++) {
      voteButtons[i].addEventListener("click", function () {
        castVote(this.getAttribute("data-vote"));
      });
    }
    // Keep the tally fresh for people who have voted.
    voteTimer = setInterval(function () {
      if (myVote && votingOpen) loadVotes().catch(function () {});
    }, 20000);
  }

  function closeVoting() {
    votingOpen = false;
    if (voteTimer) clearInterval(voteTimer);
    if (!voteNs) return;
    $("vote-buttons").hidden = true;
    $("vote").querySelector(".vote-title").textContent = "How everyone guessed";
    $("vote-status").textContent = "";
    loadVotes().catch(function () {
      $("vote").hidden = true;
    });
  }

  // ---------- Confetti ----------

  function launchConfetti(colors) {
    var canvas = $("confetti");
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var pieces = [];
    var start = performance.now();
    var DURATION = 7000;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function burst(count, x, y) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 4 + Math.random() * 9;
        pieces.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          size: 6 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          round: Math.random() < 0.3,
        });
      }
    }

    var w = window.innerWidth, h = window.innerHeight;
    burst(160, w / 2, h * 0.45);
    setTimeout(function () { burst(90, w * 0.2, h * 0.6); }, 600);
    setTimeout(function () { burst(90, w * 0.8, h * 0.6); }, 1100);
    setTimeout(function () { burst(120, w / 2, h * 0.3); }, 1900);

    function frame(now) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = pieces.length - 1; i >= 0; i--) {
        var p = pieces[i];
        p.vy += 0.22;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y > window.innerHeight + 40) { pieces.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      if (pieces.length || now - start < DURATION) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        window.removeEventListener("resize", resize);
      }
    }
    requestAnimationFrame(frame);
  }

  // ---------- Start ----------

  startVoting();
  tick();
  if (target > Date.now()) timer = setInterval(tick, 250);
})();
