/* Tech Paradise Hub — site scripts */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero: goal -> query -> courses ---------- */
  var codeEl = document.getElementById("query-code");
  var resultEl = document.getElementById("query-results");
  var goalBtns = document.querySelectorAll(".goal");

  var GOALS = {
    analyst: {
      where: "career_goal = 'data analyst'",
      rows: [
        ["Excel: Basic to Advanced", "6 weeks", "courses.html#excel"],
        ["SQL", "6 weeks", "courses.html#sql"],
        ["Power BI", "6 weeks", "courses.html#power-bi"],
        ["Tableau", "6 weeks", "courses.html#tableau"]
      ]
    },
    scientist: {
      where: "career_goal = 'data scientist'",
      rows: [
        ["Python Basic", "5 weeks", "courses.html#python-basic"],
        ["Python Intermediate", "6 weeks", "courses.html#python-intermediate"],
        ["Data Science", "16 weeks", "courses.html#data-science"]
      ]
    },
    fast: {
      where: "available_days = 5",
      rows: [
        ["Crash course: SQL", "5 days", "crash-courses.html#crash-sql"],
        ["Crash course: Excel", "5 days", "crash-courses.html#crash-excel"],
        ["Crash course: Power BI", "5 days", "crash-courses.html#crash-power-bi"],
        ["All 8 crash courses", "5 days each", "crash-courses.html"]
      ]
    }
  };

  var typingTimer = null;

  function renderResults(goal) {
    resultEl.innerHTML = "";
    var h = document.createElement("h2");
    h.textContent = goal.rows.length + " courses found";
    var ul = document.createElement("ul");
    goal.rows.forEach(function (r) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = r[2];
      a.textContent = r[0];
      var s = document.createElement("span");
      s.textContent = r[1];
      li.appendChild(a);
      li.appendChild(s);
      ul.appendChild(li);
    });
    resultEl.appendChild(h);
    resultEl.appendChild(ul);
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function paint(whereText, withCaret) {
    codeEl.innerHTML =
      '<span class="kw">SELECT</span> course, duration\n' +
      '<span class="kw">FROM</span> tech_paradise_hub\n' +
      '<span class="kw">WHERE</span> ' +
      esc(whereText).replace(/'([^']*)'?/, function (m) { return '<span class="str">' + m + "</span>"; }) +
      (withCaret ? '<span class="caret" aria-hidden="true"></span>' : ";");
  }

  function runGoal(key) {
    var goal = GOALS[key];
    if (!goal || !codeEl) return;
    clearTimeout(typingTimer);
    resultEl.innerHTML = "";

    if (reduceMotion) {
      paint(goal.where, false);
      renderResults(goal);
      return;
    }

    var i = 0;
    (function step() {
      paint(goal.where.slice(0, i), true);
      if (i < goal.where.length) {
        i++;
        typingTimer = setTimeout(step, 28);
      } else {
        typingTimer = setTimeout(function () {
          paint(goal.where, false);
          renderResults(goal);
        }, 250);
      }
    })();
  }

  if (codeEl && goalBtns.length) {
    goalBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        goalBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        runGoal(btn.dataset.goal);
      });
    });
    runGoal("analyst");
  }

  /* ---------- Courses page: filter by track ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var details = document.querySelectorAll(".course-detail");
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        var f = chip.dataset.filter;
        details.forEach(function (d) {
          d.hidden = !(f === "all" || d.dataset.track === f);
        });
      });
    });
  }

  /* Open a crash-course accordion when linked by hash */
  function openHashDetails() {
    if (!location.hash) return;
    var el = document.querySelector(location.hash);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      el.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", openHashDetails);
  openHashDetails();

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  // Pre-select course from ?course=slug
  var params = new URLSearchParams(location.search);
  var pre = params.get("course");
  if (pre) {
    var sel = form.elements["course"];
    for (var k = 0; k < sel.options.length; k++) {
      if (sel.options[k].value === pre) { sel.selectedIndex = k; break; }
    }
  }

  function setError(field, msg) {
    var wrap = field.closest(".field");
    var out = wrap.querySelector(".error-msg");
    wrap.classList.toggle("has-error", !!msg);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (out) out.textContent = msg || "";
  }

  function validate() {
    var ok = true;
    var name = form.elements["name"];
    var email = form.elements["email"];
    var phone = form.elements["phone"];
    var course = form.elements["course"];
    var message = form.elements["message"];
    var consent = form.elements["consent"];

    setError(name, name.value.trim().length < 2 ? "Enter your full name." : "");
    if (name.value.trim().length < 2) ok = false;

    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    setError(email, emailOk ? "" : "Enter a valid email address, like name@example.com.");
    if (!emailOk) ok = false;

    var ph = phone.value.replace(/[\s()+-]/g, "");
    var phoneOk = ph === "" || /^\d{10,13}$/.test(ph);
    setError(phone, phoneOk ? "" : "Enter a phone number with 10 to 13 digits, or leave it blank.");
    if (!phoneOk) ok = false;

    setError(course, course.value ? "" : "Choose the course you are asking about.");
    if (!course.value) ok = false;

    var msgOk = message.value.trim().length >= 10;
    setError(message, msgOk ? "" : "Write at least 10 characters so we can answer properly.");
    if (!msgOk) ok = false;

    setError(consent, consent.checked ? "" : "Tick this box so we can reply to you.");
    if (!consent.checked) ok = false;

    return ok;
  }

  function showStatus(kind, text) {
    statusEl.className = "form-status " + kind;
    statusEl.textContent = text;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.className = "form-status";
    if (!validate()) {
      showStatus("is-err", "Fix the highlighted fields and send again.");
      var firstBad = form.querySelector(".has-error input, .has-error select, .has-error textarea");
      if (firstBad) firstBad.focus();
      return;
    }
    // Honeypot: bots fill this field
    if (form.elements["botcheck"] && form.elements["botcheck"].checked) return;

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, body: j }; }); })
      .then(function (r) {
        if (r.ok && r.body.success) {
          form.reset();
          showStatus("is-ok", "Message sent. We will reply to your email within one working day.");
        } else {
          throw new Error(r.body.message || "Request failed");
        }
      })
      .catch(function () {
        showStatus("is-err", "Your message was not sent. Check your connection and try again, or email us directly at the address on this page.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      });
  });
})();
