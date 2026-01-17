const loginForm = document.getElementById("loginForm");
const loginHint = document.getElementById("loginHint");
const guestBtn = document.getElementById("guestBtn");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const city = String(formData.get("city") || "").trim();

  if (!city) {
    loginHint.textContent = "Please select a city.";
    return;
  }

  localStorage.setItem("rnm_authed", "1");
  localStorage.setItem("rnm_user", username || "User");
  localStorage.setItem("rnm_city", city);
  window.location.href = "/";
});

guestBtn.addEventListener("click", () => {
  const city = String(loginForm.elements.city.value || "").trim();
  if (!city) {
    loginHint.textContent = "Please select a city.";
    return;
  }
  localStorage.setItem("rnm_authed", "1");
  localStorage.setItem("rnm_user", "Guest");
  localStorage.setItem("rnm_city", city);
  window.location.href = "/";
});
