const form = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");
const submitBtn = document.getElementById("submit-btn");

if (getToken()) {
  window.location.replace("/app.html");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.textContent = "";
  submitBtn.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveSession(data.token, data.user);
    window.location.href = "/app.html";
  } catch (err) {
    errorMessage.textContent = err.message;
    submitBtn.disabled = false;
  }
});
