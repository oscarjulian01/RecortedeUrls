const token = getToken();

if (!token) {
  window.location.replace("/login.html");
}

const user = getUser();
document.getElementById("welcome").textContent = `Hola, ${user?.name ?? ""}`;
document.getElementById("email").textContent = user?.email ?? "";

document.getElementById("logout-btn").addEventListener("click", () => {
  clearSession();
  window.location.href = "/login.html";
});

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function renderStats(dashboard) {
  document.getElementById("stat-account-clicks").textContent = dashboard.totals.accountClicks;
  document.getElementById("stat-url-count").textContent = dashboard.totals.urls.length;
  document.getElementById("trend-range").textContent = dashboard.trend.rangeDays;

  const chart = document.getElementById("trend-chart");
  chart.innerHTML = "";

  const maxClicks = Math.max(1, ...dashboard.trend.points.map((point) => point.clicks));
  for (const point of dashboard.trend.points) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(3, (point.clicks / maxClicks) * 100)}%`;
    bar.title = `${point.date}: ${point.clicks} clicks`;
    chart.appendChild(bar);
  }
}

function renderUrls(urls) {
  const list = document.getElementById("urls-list");
  const empty = document.getElementById("urls-empty");
  list.innerHTML = "";

  if (urls.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const url of urls) {
    const shortLink = `${window.location.origin}/${url.code}`;

    const item = document.createElement("li");
    item.className = "url-item";

    const info = document.createElement("div");
    info.className = "url-info";

    const link = document.createElement("a");
    link.href = shortLink;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = shortLink;

    const original = document.createElement("span");
    original.className = "url-original";
    original.textContent = url.originalUrl;

    info.append(link, original);

    const clicks = document.createElement("span");
    clicks.className = "url-clicks";
    clicks.textContent = `${url.totalClicks} clicks`;

    item.append(info, clicks);
    list.appendChild(item);
  }
}

async function loadDashboard() {
  try {
    const dashboard = await apiRequest("/dashboard", { headers: authHeaders() });
    renderStats(dashboard);
    renderUrls(dashboard.totals.urls);
  } catch (err) {
    if (err.status === 401) {
      clearSession();
      window.location.href = "/login.html";
      return;
    }
    console.error(err);
  }
}

const createForm = document.getElementById("create-form");
const createError = document.getElementById("create-error");
const createSuccess = document.getElementById("create-success");
const createBtn = document.getElementById("create-btn");

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  createError.textContent = "";
  createSuccess.textContent = "";
  createBtn.disabled = true;

  const url = document.getElementById("original-url").value.trim();

  try {
    const created = await apiRequest("/urls", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    });

    createSuccess.textContent = `Creada: ${window.location.origin}/${created.code}`;
    createForm.reset();
    await loadDashboard();
  } catch (err) {
    if (err.status === 401) {
      clearSession();
      window.location.href = "/login.html";
      return;
    }
    createError.textContent = err.message;
  } finally {
    createBtn.disabled = false;
  }
});

loadDashboard();
