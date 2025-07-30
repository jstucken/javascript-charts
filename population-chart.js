// population-chart.js
document.addEventListener("DOMContentLoaded", async () => {
  const csvUrl = 'https://raw.githubusercontent.com/jstucken/javascript-charts/refs/heads/main/population-data.csv';
  const canvas = document.getElementById('populationChart');
  const lgaSelect = document.getElementById('lgaSelect');

  if (!canvas || !lgaSelect) return;

  let chart;
  let allGroupedData = {};

  async function fetchCSVData(url) {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.trim().split('\n');
    const dataLines = lines.slice(1);

    const data = dataLines.map(line => {
      const match = line.match(/^([^,]+),(\d{4}),"(.*?)"$/);
      if (!match) return null;
      const [, LGA, Period, Number] = match;
      return {
        LGA,
        Period: parseInt(Period),
        Number: parseInt(Number.replace(/,/g, ''))
      };
    }).filter(Boolean);

    return data;
  }

  function groupDataByLGA(data) {
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.LGA]) grouped[row.LGA] = [];
      grouped[row.LGA].push({ x: row.Period, y: row.Number });
    });
    return grouped;
  }

  function getChartData(groupedData, filterLGA = null) {
    const colors = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'brown', 'darkcyan', 'indigo', 'olive', 'coral'];
    const entries = Object.entries(groupedData);
    const filtered = filterLGA && filterLGA !== 'All'
      ? entries.filter(([lga]) => lga === filterLGA)
      : entries;

    return filtered.map(([LGA, values], i) => ({
      label: LGA,
      data: values.sort((a, b) => a.x - b.x),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length],
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: false,
      tension: 0.2
    }));
  }

  function populateDropdown(lgaList) {
    lgaList.sort().forEach(lga => {
      const option = document.createElement('option');
      option.value = lga;
      option.textContent = lga;
      lgaSelect.appendChild(option);
    });
  }

  async function drawChart(filterLGA = null) {
    const datasets = getChartData(allGroupedData, filterLGA);
    const ctx = canvas.getContext('2d');

    if (chart) {
      chart.data.datasets = datasets;
      chart.update();
      return;
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Year' },
            ticks: { precision: 0 }
          },
          y: {
            title: { display: true, text: 'Population' }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Population by LGA Over Time'
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 10 },
            formatter: val => val.y.toLocaleString()
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  const rawData = await fetchCSVData(csvUrl);
  allGroupedData = groupDataByLGA(rawData);
  populateDropdown(Object.keys(allGroupedData));
  drawChart();

  lgaSelect.addEventListener('change', e => {
    drawChart(e.target.value);
  });
});
