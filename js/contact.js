(function () {
  var ENDPOINT = "https://hook.us2.make.com/183lc2uovmf2dgmm8ntozq4rlvytpb11";
  var form = document.getElementById("contact-form");
  var error = document.getElementById("contact-error");
  var done = document.getElementById("contact-done");
  var fallback = document.getElementById("contact-fallback");
  var mailLink = document.getElementById("contact-mailto");
  var sendBtn = document.getElementById("contact-send");
  if (!form) return;

  var dateInput = document.getElementById("contact-date");
  if (dateInput) {
    var today = new Date();
    var month = String(today.getMonth() + 1).padStart(2, "0");
    var day = String(today.getDate()).padStart(2, "0");
    dateInput.min = today.getFullYear() + "-" + month + "-" + day;
  }

  function mailtoHref(subject, body) {
    return "mailto:Crust2crumbft@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function showFailure(subject, body) {
    error.textContent = "The message was not sent. Email Crust2crumbft@gmail.com instead.";
    if (mailLink) mailLink.href = mailtoHref(subject, body);
    if (fallback) fallback.hidden = false;
    if (sendBtn) sendBtn.disabled = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = document.getElementById("contact-name").value.trim();
    var phone = document.getElementById("contact-phone").value.trim();
    var email = document.getElementById("contact-email").value.trim();
    var details = document.getElementById("contact-details").value.trim();
    var location = document.getElementById("contact-location").value.trim();
    var date = document.getElementById("contact-date").value.trim();
    var time = document.getElementById("contact-time").value.trim();
    if (time.length > 5) time = time.slice(0, 5);
    var when = date && time ? date + ", " + time : "";
    var allergies = document.getElementById("contact-allergies").value.trim();
    var trap = document.getElementById("company-website");
    if (!name || !phone || !email || !details || !location || !date || !time) {
      error.textContent = "Add your name, phone number, email, event details, location, date, and start time.";
      if (fallback) fallback.hidden = true;
      return;
    }
    if (email.indexOf("@") < 1) {
      error.textContent = "That email needs an @.";
      if (fallback) fallback.hidden = true;
      return;
    }
    if (trap && trap.value.trim()) return;
    error.textContent = "";
    if (fallback) fallback.hidden = true;
    var subject = "Crust 2 Crumb inquiry";
    var body = [
      "Name: " + name,
      "Phone: " + phone,
      "Email: " + email,
      "Details of event: " + details,
      "Location of event: " + location,
      "Date and start time: " + when,
      "Allergies or dietary concerns: " + allergies
    ].join("\n");
    if (sendBtn) sendBtn.disabled = true;
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: "contact",
        subject: subject,
        name: name,
        phone: phone,
        email: email,
        details: details,
        location: location,
        when: when,
        allergies: allergies,
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
        form.hidden = true;
        if (done) {
          done.hidden = false;
          done.scrollIntoView({ block: "start" });
        }
        return;
      }
      showFailure(subject, body);
    }).catch(function () {
      showFailure(subject, body);
    });
  });
})();
