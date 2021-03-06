const urlCovid = "https://corona-api.com/countries";
const urlCountries = "https://restcountries.herokuapp.com/api/v1/region/";
const proxyForCors = "https://api.allorigins.win/raw?url=";
const loading = document.querySelector(".loading");
const displayStatistics = document.querySelector(".container-display");
const singleCountyInfo = document.querySelector(".container-info-countries");
const chart = document.querySelector(".container-chart-container");
const countriesBtn = document.querySelector(".countries");

function createDataOfChart({ label, dataNumbers, countriesNames }) {
  chart.innerHTML = `<canvas id="myChart"></canvas>`;
  const data = {
    labels: countriesNames,
    datasets: [
      {
        label: label,
        backgroundColor: "red",
        borderColor: "black",
        borderWidth: 0.6,
        hoverBackgroundColor: "white",
        hoverBorderColor: "red",
        data: dataNumbers,
      },
    ],
  };

  let optionTable = {
    maintainAspectRatio: false,
    scales: {
      yAxes: [
        {
          stacked: true,
          gridLines: {
            display: true,
            color: "black",
          },
        },
      ],
      xAxes: [
        {
          gridLines: {
            display: true,
          },
        },
      ],
    },
  };

  Chart.Bar("myChart", {
    options: optionTable,
    data: data,
  });
}

async function getCovidData() {
  const data = await checkStatusOfResponse(urlCovid);
  return data;
}

async function checkStatusOfResponse(url) {
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      const response = await res.json();
      return response;
    }
  } catch (error) {
    console.log(error);
  }
}

async function getCovidCountryCode(code) {
  const codeData = await checkStatusOfResponse(urlCovid + "/" + code);
  return codeData;
}

async function getFromRestCountriesCca2(region) {
  const arrayOfCountries = await checkStatusOfResponse(
    `${proxyForCors}${urlCountries}${region}`
  );

  const covidCode = await Promise.all(
    arrayOfCountries.map((country) => {
      if (country.cca2) {
        return getCovidCountryCode(country.cca2);
      }
    })
  );

  return covidCode;
}

function arraysOfCovidData(covidData) {
  const namesOfCoutries = [];
  const cases = [];
  const deaths = [];
  const recovered = [];
  const critical = [];

  covidData.forEach((element) => {
    if (element) {
      if (!element.name) {
        element = element.data;
      }

      if (element.name.length > 10) {
        element.name = element.name.slice(0, 12);
      }
      namesOfCoutries.push(element.name);
      cases.push(element.latest_data.confirmed);
      deaths.push(element.latest_data.deaths);
      recovered.push(element.latest_data.recovered);
      critical.push(element.latest_data.critical);
    }
  });

  return {
    namesOfCoutries: namesOfCoutries,
    cases: cases,
    deaths: deaths,
    recovered: recovered,
    critical: critical,
  };
}
const obj = {
  allData: [],
  loading: true,
  currentType: null,
  currentRegion: "global",
};

const showLoadingPage = () => {
  obj.loading = true;
  loading.removeAttribute("hidden");
  displayStatistics.setAttribute("hidden", null);
};

const reomoveLoadingPage = () => {
  obj.loading = false;
  displayStatistics.removeAttribute("hidden");
  loading.setAttribute("hidden", null);
};

const displaySingleCountry = () => {
  singleCountyInfo.removeAttribute("hidden");
  chart.setAttribute("hidden", null);
};

const displayMultiCountry = () => {
  singleCountyInfo.setAttribute("hidden", null);
  chart.removeAttribute("hidden");
};

function craeteBtnOfCountries() {
  const btns = obj.allData.map((element, i) => {
    return `<button data-index="${i}">${element.name}</button>`;
  });

  countriesBtn.innerHTML = btns.join("");
  document.querySelectorAll(".countries button").forEach((btn) => {
    btn.addEventListener("click", clickOnCountry);
    btn.addEventListener("click", topFunction);
  });
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

async function updateOfChart({ region, type }) {
  try {
    showLoadingPage();
    let temp;
    let arraysOfData;

    switch (region) {
      case "global":
        temp = await getCovidData();
        obj.allData = temp.data;
        arraysOfData = arraysOfCovidData(temp.data);
        craeteBtnOfCountries();
        break;

      default:
        temp = await getFromRestCountriesCca2(region);
        arraysOfData = arraysOfCovidData(temp);
        break;
    }

    createDataOfChart({
      label: `${region}-${type}`,
      dataNumbers: arraysOfData[type],
      countriesNames: arraysOfData.namesOfCoutries,
    });
  } catch (e) {
    console.log(e);
  } finally {
    reomoveLoadingPage();
  }
}

function clickOnCountry(event) {
  const index = event.target.dataset.index;
  const numIndexOfBtn = obj.allData[index];
  singleCountyInfo.innerHTML = `
  <h2> ${numIndexOfBtn.name} </h2>
    <span> Total Cases: ${numIndexOfBtn.latest_data.confirmed}, </span>
    <span> New Cases: ${numIndexOfBtn.today.confirmed}, </span>
    <span> Total Death: ${numIndexOfBtn.latest_data.deaths}, </span>
    <span> New Deaths: ${numIndexOfBtn.today.deaths}, </span>
    <span> Total Recovered: ${numIndexOfBtn.latest_data.recovered}, </span>
    <span> In critical condition: ${numIndexOfBtn.latest_data.critical} </span>

  `;
  displaySingleCountry();
  showLoadingPage();
  setTimeout(() => {
      reomoveLoadingPage();
  }, 1000);
  
  obj.loading = false;
}

function clickOnRegion(event) {
  const region = event.target.dataset.region || obj.currentRegion || "global";
  const type = event.target.dataset.type || obj.currentType || "cases";
  obj.currentRegion = region;
  obj.currentType = type;
  updateOfChart({ region: region, type: type });

  displayMultiCountry();
}

document.querySelectorAll(".options button").forEach((btn) => {
  btn.addEventListener("click", clickOnRegion);
  btn.addEventListener("click", topFunction);
  
});
updateOfChart({ region: "global", type: "cases" });



