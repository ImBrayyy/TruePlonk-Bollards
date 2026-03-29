const STORAGE_KEY = "bollardCountryStats";

const statsList = document.getElementById("stats-list");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const emptyMessage = document.getElementById("empty-message");

let bollards = [];
let groupedBollards = {};
let countryStats = {};

async function startPage() {
  try {
    const response = await fetch("data/bollards.json");
    bollards = await response.json();
    groupedBollards = groupByCountry(bollards);
    countryStats = loadCountryStats();
    renderCountries();
  } catch (error) {
    emptyMessage.textContent = "Could not load bollards.json. Make sure you are using a local server.";
    console.error(error);
  }
}

function groupByCountry(items) {
  const grouped = {};

  items.forEach((item) => {
    if (!grouped[item.country]) {
      grouped[item.country] = [];
    }
    grouped[item.country].push(item);
  });

  return grouped;
}

function loadCountryStats() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    return JSON.parse(saved);
  }

  return {};
}

function getCountryAccuracy(country) {
  const stat = countryStats[country];

  if (!stat || stat.total === 0) {
    return 0;
  }

  return Math.round((stat.correct / stat.total) * 100);
}

function renderCountries() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const countries = Object.keys(groupedBollards).filter((country) =>
    country.toLowerCase().includes(searchValue)
  );

  sortCountries(countries);
  statsList.innerHTML = "";

  if (countries.length === 0) {
    emptyMessage.textContent = "No countries matched your search.";
    return;
  }

  emptyMessage.textContent = "";

  countries.forEach((country) => {
    const images = groupedBollards[country];
    const stat = countryStats[country] || { correct: 0, total: 0 };
    const accuracy = getCountryAccuracy(country);

    const block = document.createElement("section");
    block.className = "country-block";

    const header = document.createElement("div");
    header.className = "country-header";

    const title = document.createElement("h2");
    title.textContent = country;

    const info = document.createElement("div");
    info.className = "country-info";
    info.textContent =
      "Accuracy: " + accuracy + "% | Correct: " + stat.correct +
      " | Attempts: " + stat.total + " | Images: " + images.length;

    header.appendChild(title);
    header.appendChild(info);
    block.appendChild(header);

    const imageGrid = document.createElement("div");
    imageGrid.className = "country-images";

    images.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = country + " bollard";
      imageGrid.appendChild(img);
    });

    block.appendChild(imageGrid);
    statsList.appendChild(block);
  });
}

function sortCountries(countries) {
  const mode = sortSelect.value;

  if (mode === "worst") {
    countries.sort((a, b) => getCountryAccuracy(a) - getCountryAccuracy(b));
  } else if (mode === "best") {
    countries.sort((a, b) => getCountryAccuracy(b) - getCountryAccuracy(a));
  } else {
    countries.sort((a, b) => a.localeCompare(b));
  }
}

searchInput.addEventListener("input", renderCountries);
sortSelect.addEventListener("change", renderCountries);

startPage();
