(function () {
  var ENDPOINT = "https://hook.us2.make.com/183lc2uovmf2dgmm8ntozq4rlvytpb11";
  var plans = {
    christmas: "Christmas / Holiday Party",
    truck: "Truck at Your Event",
    trays: "Sandwich Trays",
    boards: "Charcuterie Boards",
    corporate: "Corporate Catering",
    private: "Private Party / Wedding / Festival",
    custom: "Custom"
  };
  var dayparts = { lunch: "Lunch", evening: "Evening", late: "Late-night" };
  var sizes = { smaller: "Smaller spread", larger: "Larger spread", help: "Not sure? Help me choose." };
  var state = {
    step: 1, plan: "", date: "", daypart: "", time: "", duration: "",
    guests: 20, serve: "", fulfill: "", venue: "", drop: "",
    level: false, clear: false, room: false, ok: false,
    sandwiches: [], size: "", diet: "", help: false,
    extras: [], cutlery: "", staff: "", budget: "", notes: "",
    name: "", phone: "", email: "", company: "", heard: ""
  };

  var steps = Array.prototype.slice.call(document.querySelectorAll("[data-step]"));
  var progress = Array.prototype.slice.call(document.querySelectorAll("[data-goto]"));
  var error = document.getElementById("book-error");
  var nextBtn = document.getElementById("sticky-next");
  var backBtn = document.getElementById("sticky-back");
  var mailLink = document.getElementById("inquire-mailto");
  var fallback = document.getElementById("mail-fallback");
  var done = document.getElementById("inquire-done");
  var sending = false;

  function params() {
    var q = new URLSearchParams(window.location.search).get("plan");
    if (q && plans[q]) state.plan = q;
  }

  function truckish() {
    if (state.plan === "truck") return true;
    if (state.plan === "trays" || state.plan === "boards") return false;
    return state.serve === "truck";
  }
  function dropish() {
    if (state.plan === "trays" || state.plan === "boards") return true;
    if (state.plan === "truck") return false;
    return state.serve === "dropoff";
  }
  function mixed() {
    return state.plan !== "truck" && state.plan !== "trays" && state.plan !== "boards";
  }

  function showError(message) {
    error.textContent = message || "";
  }

  function paint() {
    document.querySelectorAll("[data-plan]").forEach(function (btn) {
      var on = btn.getAttribute("data-plan") === state.plan;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-daypart]").forEach(function (btn) {
      var on = btn.getAttribute("data-daypart") === state.daypart;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-serve]").forEach(function (btn) {
      var on = btn.getAttribute("data-serve") === state.serve;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-fulfill]").forEach(function (btn) {
      var on = btn.getAttribute("data-fulfill") === state.fulfill;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-size]").forEach(function (btn) {
      var on = btn.getAttribute("data-size") === state.size;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-cutlery]").forEach(function (btn) {
      var on = btn.getAttribute("data-cutlery") === state.cutlery;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-staff]").forEach(function (btn) {
      var on = btn.getAttribute("data-staff") === state.staff;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll("[data-guests]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(state.guests) === btn.getAttribute("data-guests") ? "true" : "false");
    });
  }

  function readFields() {
    state.date = document.getElementById("event-date").value;
    state.time = document.getElementById("event-time").value;
    state.duration = document.getElementById("event-duration").value.trim();
    state.guests = Number(document.getElementById("guest-count").value) || 0;
    state.venue = document.getElementById("venue").value.trim();
    state.drop = document.getElementById("drop-address").value.trim();
    state.level = document.getElementById("park-level").checked;
    state.clear = document.getElementById("park-clear").checked;
    state.room = document.getElementById("park-room").checked;
    state.ok = document.getElementById("park-ok").checked;
    state.diet = document.getElementById("diet").value.trim();
    state.help = document.getElementById("help-choose").checked;
    state.budget = document.getElementById("budget").value.trim();
    state.notes = document.getElementById("event-notes").value.trim();
    state.name = document.getElementById("guest-name").value.trim();
    state.phone = document.getElementById("guest-phone").value.trim();
    state.email = document.getElementById("guest-email").value.trim();
    state.company = document.getElementById("guest-company").value.trim();
    state.heard = document.getElementById("guest-heard").value.trim();
    state.sandwiches = Array.prototype.map.call(
      document.querySelectorAll("#sandwich-picks input:checked"),
      function (box) { return box.value; }
    );
    state.extras = Array.prototype.map.call(
      document.querySelectorAll("#extra-picks input:checked"),
      function (box) { return box.value; }
    );
  }

  function emailOk(value) {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function branch() {
    document.getElementById("duration-field").hidden = state.plan === "trays" || state.plan === "boards";
    document.getElementById("serve-field").hidden = !mixed();
    document.getElementById("truck-where").hidden = !truckish();
    document.getElementById("drop-where").hidden = !dropish();
    document.getElementById("tray-sizes").hidden = !dropish();
    document.getElementById("truck-menu").hidden = dropish();
  }

  function validate(step) {
    readFields();
    if (step === 1 && !state.plan) return "Pick what you’re planning.";
    if (step === 2) {
      if (!state.date) return "Add a date.";
      if (!state.daypart) return "Pick lunch, evening, or late-night.";
      if (!state.time) return "Add a start time.";
    }
    if (step === 3) {
      if (!state.guests || state.guests < 1) return "Add a guest count.";
      if (mixed() && !state.serve) return "Pick truck, drop-off, or not sure.";
      if (truckish() && !state.venue) return "Add a venue address.";
      if (dropish() && !state.fulfill) return "Pick pickup or delivery.";
      if (dropish() && state.fulfill === "delivery" && !state.drop) return "Add an address or postal code.";
    }
    if (step === 4) {
      var needsMenu = truckish() || !dropish();
      if (needsMenu && !state.sandwiches.length && !state.help && state.size !== "help") return "Pick sandwiches, or choose help me choose.";
      if (dropish() && !state.size && !state.help) return "Pick a size, or help me choose.";
    }
    if (step === 6) {
      if (!state.name) return "Add a name.";
      if (!state.phone) return "Add a phone number.";
      if (!emailOk(state.email)) return "Add an email that looks complete.";
    }
    return "";
  }

  function lines() {
    var park = [];
    if (state.level) park.push("Level spot");
    if (state.clear) park.push("Overhead clearance is OK");
    if (state.room) park.push("Room at the service window");
    if (state.ok) park.push("OK to park");
    var serveLabels = { truck: "Truck on site", dropoff: "Drop-off", unsure: "Not sure" };
    var fulfillLabels = { pickup: "Pickup", delivery: "Delivery" };
    var showUp = serveLabels[state.serve] || "";
    if (!showUp && state.plan === "truck") showUp = "Truck on site";
    if (!showUp && (state.plan === "trays" || state.plan === "boards")) showUp = "Drop-off or pickup";
    return [
      ["Plan", plans[state.plan] || ""],
      ["Date", state.date || ""],
      ["Daypart", dayparts[state.daypart] || ""],
      ["Start", state.time || ""],
      ["Duration", truckish() ? state.duration : ""],
      ["Guests", state.guests ? String(state.guests) + (state.guests >= 200 ? "+" : "") : ""],
      ["Show up", showUp || ""],
      ["Venue", state.venue || ""],
      ["Parking", park.join(", ")],
      ["Pickup / delivery", fulfillLabels[state.fulfill] || ""],
      ["Address", state.drop || ""],
      ["Sandwiches", state.sandwiches.join(", ")],
      ["Size", sizes[state.size] || ""],
      ["Help me choose", state.help || state.size === "help" ? "Yes" : ""],
      ["Dietary", state.diet || ""],
      ["Extras", state.extras.join(", ")],
      ["Cutlery", state.cutlery || ""],
      ["Serving help", state.staff || ""],
      ["Budget", state.budget || ""],
      ["Notes", state.notes || ""],
      ["Name", state.name || ""],
      ["Phone", state.phone || ""],
      ["Email", state.email || ""],
      ["Company", state.company || ""],
      ["Heard about us", state.heard || ""]
    ];
  }

  function fill(id) {
    var box = document.getElementById(id);
    box.innerHTML = "";
    lines().forEach(function (pair) {
      if (!pair[1]) return;
      var article = document.createElement("article");
      var div = document.createElement("div");
      var strong = document.createElement("strong");
      strong.textContent = pair[0];
      var value = document.createElement("div");
      value.textContent = pair[1];
      div.appendChild(strong);
      div.appendChild(value);
      article.appendChild(div);
      box.appendChild(article);
    });
  }

  function subjectLine() {
    var subject = "Crust 2 Crumb event inquiry";
    if (plans[state.plan]) subject += " — " + plans[state.plan];
    return subject;
  }

  function bodyText() {
    return lines().filter(function (pair) { return pair[1]; }).map(function (pair) {
      return pair[0] + ": " + pair[1];
    }).join("\n");
  }

  function mailHref(subject, body) {
    return "mailto:Crust2crumbft@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function showFailure(subject, body) {
    sending = false;
    if (nextBtn) nextBtn.disabled = false;
    showError("The message was not sent. Email Crust2crumbft@gmail.com instead.");
    if (mailLink) mailLink.href = mailHref(subject, body);
    if (fallback) fallback.hidden = false;
  }

  function sendInquiry() {
    var trap = document.getElementById("company-website");
    if (trap && trap.value.trim()) return;
    if (sending) return;
    var subject = subjectLine();
    var body = bodyText();
    var when = [state.date, dayparts[state.daypart] || "", state.time].filter(Boolean).join(", ");
    sending = true;
    if (nextBtn) nextBtn.disabled = true;
    if (fallback) fallback.hidden = true;
    showError("");
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: "inquire",
        subject: subject,
        name: state.name,
        phone: state.phone,
        email: state.email,
        details: state.notes || "",
        location: state.venue || state.drop || "",
        when: when,
        allergies: state.diet || "",
        body: body,
        company_website: ""
      })
    }).then(function (response) {
      return response.json().then(function (data) {
        return { status: response.status, data: data };
      }).catch(function () {
        return { status: response.status, data: null };
      });
    }).then(function (result) {
      if (result.status === 200 && result.data && result.data.ok === true) {
        sending = false;
        if (state.step !== 7) return;
        if (done) {
          done.hidden = false;
          done.scrollIntoView({ block: "start" });
        }
        if (nextBtn) nextBtn.hidden = true;
        if (fallback) fallback.hidden = true;
        showError("");
        return;
      }
      showFailure(subject, body);
    }).catch(function () {
      showFailure(subject, body);
    });
  }

  function go(step) {
    state.step = step;
    branch();
    steps.forEach(function (panel) {
      panel.hidden = Number(panel.getAttribute("data-step")) !== step;
    });
    progress.forEach(function (btn) {
      var n = Number(btn.getAttribute("data-goto"));
      btn.setAttribute("aria-current", n === step ? "step" : "false");
      btn.classList.toggle("done", n < step);
    });
    showError("");
    backBtn.hidden = step <= 1;
    nextBtn.textContent = step === 7 ? "Send message" : "Next";
    nextBtn.hidden = false;
    nextBtn.disabled = false;
    var heading = document.querySelector('[data-step="' + step + '"] h2');
    if (heading) heading.focus();
    if (step === 7) fill("review-summary");
  }

  document.body.addEventListener("click", function (event) {
    var plan = event.target.closest("[data-plan]");
    if (plan) { state.plan = plan.getAttribute("data-plan"); paint(); branch(); showError(""); }
    var day = event.target.closest("[data-daypart]");
    if (day) { state.daypart = day.getAttribute("data-daypart"); paint(); showError(""); }
    var serve = event.target.closest("[data-serve]");
    if (serve) { state.serve = serve.getAttribute("data-serve"); paint(); branch(); showError(""); }
    var fulfill = event.target.closest("[data-fulfill]");
    if (fulfill) { state.fulfill = fulfill.getAttribute("data-fulfill"); paint(); showError(""); }
    var size = event.target.closest("[data-size]");
    if (size) { state.size = size.getAttribute("data-size"); paint(); showError(""); }
    var cutlery = event.target.closest("[data-cutlery]");
    if (cutlery) { state.cutlery = cutlery.getAttribute("data-cutlery"); paint(); }
    var staff = event.target.closest("[data-staff]");
    if (staff) { state.staff = staff.getAttribute("data-staff"); paint(); }
    var guests = event.target.closest("[data-guests]");
    if (guests) {
      state.guests = Number(guests.getAttribute("data-guests"));
      document.getElementById("guest-count").value = String(state.guests);
      paint();
    }
    if (event.target.id === "guest-minus") {
      var less = Math.max(1, (Number(document.getElementById("guest-count").value) || 1) - 1);
      document.getElementById("guest-count").value = String(less);
      state.guests = less;
      paint();
    }
    if (event.target.id === "guest-plus") {
      var more = (Number(document.getElementById("guest-count").value) || 0) + 1;
      document.getElementById("guest-count").value = String(more);
      state.guests = more;
      paint();
    }
    if (event.target.closest("[data-next]")) {
      var problem = validate(state.step);
      if (problem) { showError(problem); return; }
      if (state.step === 7) {
        sendInquiry();
        return;
      }
      go(state.step + 1);
    }
    if (event.target.closest("[data-back]")) go(Math.max(1, state.step - 1));
    var goto = event.target.closest(".progress [data-goto]");
    if (goto) {
      var target = Number(goto.getAttribute("data-goto"));
      if (target < state.step) go(target);
    }
  });

  params();
  paint();
  var date = document.getElementById("event-date");
  var today = new Date();
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var day = String(today.getDate()).padStart(2, "0");
  date.min = today.getFullYear() + "-" + month + "-" + day;
  go(1);
})();
