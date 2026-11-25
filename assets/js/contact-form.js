// Contact form -> TK Sports API (/contact). Feedback is shown inside the form, no browser popups.
(function () {
  var API_URL = "https://tk-sports-api.timosteen22.workers.dev";
  var COOLDOWN_MS = 10 * 60 * 1000;
  var form = document.getElementById("contactForm");
  if (!form) return;
  var startedAt = Date.now();

  // ---- styles (once) ----
  var css =
    "#contactForm .contact-status{display:none;margin-top:18px;padding:14px 18px;border-radius:6px;" +
    "font-size:.95rem;line-height:1.5;border-left:4px solid;animation:contactFade .3s ease}" +
    "#contactForm .contact-status.is-visible{display:block}" +
    "#contactForm .contact-status.is-success{background:rgba(255,107,0,.15);border-color:#ff6b00;color:#fff}" +
    "#contactForm .contact-status.is-error{background:rgba(220,53,69,.18);border-color:#dc3545;color:#fff}" +
    "#contactForm .contact-status a{color:#ff6b00;text-decoration:underline}" +
    "#contactForm .form-control.is-invalid{border-color:#dc3545 !important}" +
    "#contactForm button[disabled]{opacity:.7;cursor:wait}" +
    "@keyframes contactFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- status box under the button ----
  var status = document.createElement("div");
  status.className = "contact-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  var button = form.querySelector('button[type="submit"]');
  (button ? button.parentNode : form).appendChild(status);

  function show(type, html) {
    status.className = "contact-status is-visible is-" + type;
    status.innerHTML = html;
  }
  function hide() {
    status.className = "contact-status";
    status.textContent = "";
  }

  // clear the red border as soon as someone fixes a field
  form.addEventListener("input", function (e) {
    if (e.target.classList) e.target.classList.remove("is-invalid");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hide();

    var fields = ["name", "email", "subject", "message"].map(function (n) { return form.elements[n]; });
    var invalid = fields.filter(function (f) { return f && !f.checkValidity(); });
    fields.forEach(function (f) { if (f) f.classList.remove("is-invalid"); });
    if (invalid.length) {
      invalid.forEach(function (f) { f.classList.add("is-invalid"); });
      invalid[0].focus();
      show("error", "Please fill in all fields correctly.");
      return;
    }

    var lastSent = parseInt(localStorage.getItem("lastFormSent") || "0", 10);
    var now = Date.now();
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      var minutes = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 60000);
      show("error", "You have just sent a message. You can send another one in " + minutes +
        " minute" + (minutes === 1 ? "" : "s") + ".");
      return;
    }

    var originalLabel = button ? button.textContent : "";
    if (button) { button.disabled = true; button.textContent = "Sending..."; }

    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim(),
      website: form.elements.website ? form.elements.website.value : "",
      started_at: startedAt
    };

    try {
      var response = await fetch(API_URL + "/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      var result = await response.json().catch(function () { return {}; });

      if (response.ok && result.success) {
        localStorage.setItem("lastFormSent", String(now));
        form.reset();
        show("success", "<strong>Thank you for your message!</strong> We will get back to you as soon as possible. " +
          "You will also receive a confirmation email.");
      } else if (response.status === 400 && result.error) {
        show("error", escapeHtml(result.error));
      } else if (response.status === 429) {
        show("error", "Too many attempts. Please wait a minute and try again.");
      } else {
        show("error", fallbackMessage());
      }
    } catch (error) {
      console.error("Error sending message:", error);
      show("error", fallbackMessage());
    } finally {
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });

  function fallbackMessage() {
    return "Something went wrong while sending your message. Please try again later, or email us directly at " +
      '<a href="mailto:info@tksportsacademy.nl">info@tksportsacademy.nl</a>.';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
