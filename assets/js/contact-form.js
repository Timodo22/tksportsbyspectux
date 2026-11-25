// Contact form -> TK Sports API (/contact). The Discord webhook lives on the server as a secret.
(function () {
  var API_URL = "https://tk-sports-api.timosteen22.workers.dev";
  var form = document.getElementById("contactForm");
  if (!form) return;
  var startedAt = Date.now();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Simpele HTML5 validatie check
    if (!form.checkValidity()) {
      alert("Vul alstublieft alle velden correct in.");
      return;
    }

    // Controleer cooldown 10 minuten
    var lastSent = localStorage.getItem("lastFormSent");
    var now = Date.now();
    if (lastSent && now - parseInt(lastSent, 10) < 10 * 60 * 1000) {
      alert("Je kunt dit formulier maar één keer per 10 minuten indienen.");
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

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
        localStorage.setItem("lastFormSent", now.toString());
        alert("Bericht succesvol verzonden!");
        form.reset();
      } else {
        alert(result.error || "Er ging iets mis. Probeer het later opnieuw.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Fout bij verzenden.");
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
