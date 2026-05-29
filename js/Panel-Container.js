
// =========================================================
// PANEL CLASS — each panel has its own state + UI + chart
// =========================================================

class Panel {
  constructor(id) {
    this.id = id;

    // State for this panel
    this.state = {
      data: null,
      columns: [],
      xAxis: null,
      yAxis: null,
      transform: null,
      chartType: "Bar Chart",
      filters: []
    };

    // Root DOM element (assigned in render)
    this.el = null;
  }

  renderFilters() {
    const container = this.el.querySelector(".active-filters");
    container.innerHTML = "";

    this.state.filters.forEach((f, i) => {
      container.insertAdjacentHTML("beforeend", `
      <div class="badge bg-secondary me-2">
        ${f.column} ${this.describeOperator(f.operator)} ${f.values.join(", ")}
        <span class="ms-2 text-warning remove-filter" data-index="${i}" style="cursor:pointer;">✕</span>
      </div>
    `);
    });

    container.querySelectorAll(".remove-filter").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = +e.target.dataset.index;
        this.state.filters.splice(index, 1);
        this.renderFilters();
        this.renderChart();
      });
    });
  }

  describeOperator(op) {
    const map = {
      eq: "=",
      neq: "≠",
      gt: ">",
      gte: ">=",
      lt: "<",
      lte: "<=",
      contains: "contains",
      starts: "starts with",
      ends: "ends with",
      null: "is null",
      notnull: "is not null"
    };
    return map[op] || op;
  }

  // ---------------------------------------------
  // Render panel HTML into #panel-container
  // ---------------------------------------------
  render() {
    const container = document.getElementById("panel-container");

    const panelHTML = `
      <div class="chart-panel card shadow-sm mb-4" data-panel-id="${this.id}">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Panel ${this.id}</span>
          <button class="btn btn-sm btn-danger remove-panel">Remove</button>
        </div>

        <div class="card-body">

          <!-- ACCORDION CONTAINER -->
          <div class="accordion mb-3" id="accordion-${this.id}">

            <!-- CHART SETTINGS ACCORDION -->
            <div class="accordion-item">
              <h2 class="accordion-header" id="heading-settings-${this.id}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                  data-bs-target="#collapse-settings-${this.id}">
                  Chart Settings
                </button>
              </h2>

              <div id="collapse-settings-${this.id}" class="accordion-collapse collapse"
                data-bs-parent="#accordion-${this.id}">
                <div class="accordion-body">

                  <input type="file" class="file-input form-control mb-3" accept=".csv">

                  <div class="d-flex flex-wrap gap-2">

                    <div class="dropdown">
                      <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        X-Axis
                      </button>
                      <div class="dropdown-menu x-axis-menu"></div>
                    </div>

                    <div class="dropdown">
                      <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        Y-Axis
                      </button>
                      <div class="dropdown-menu y-axis-menu"></div>
                    </div>

                    <div class="dropdown">
                      <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        Transform
                      </button>
                      <div class="dropdown-menu transform-menu">
                        <a class="dropdown-item" data-value="Count">Count</a>
                        <a class="dropdown-item" data-value="Sum">Sum</a>
                        <a class="dropdown-item" data-value="Average">Average</a>
                      </div>
                    </div>

                    <div class="dropdown">
                      <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                        Chart Type
                      </button>
                      <div class="dropdown-menu chart-type-menu">
                        <a class="dropdown-item">Bar Chart</a>
                        <a class="dropdown-item">Line Chart</a>
                        <a class="dropdown-item">Pie Chart</a>
                        <a class="dropdown-item">Table Chart</a>
                        <a class="dropdown-item">Stacked Bar Chart</a>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            <!-- FILTER ACCORDION -->
            <div class="accordion-item">
              <h2 class="accordion-header" id="heading-filters-${this.id}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                  data-bs-target="#collapse-filters-${this.id}">
                  Filters
                </button>
              </h2>

              <div id="collapse-filters-${this.id}" class="accordion-collapse collapse"
                data-bs-parent="#accordion-${this.id}">
                <div class="accordion-body">

                  <div class="d-flex gap-2 mb-2">
                    <select class="form-select filter-column"></select>
                    <select class="form-select filter-operator">
                      <option value="eq">= Equals</option>
                      <option value="neq">≠ Not Equal</option>

                      <option value="gt">&gt; Greater Than</option>
                      <option value="gte">&gt;= Greater or Equal</option>
                      <option value="lt">&lt; Less Than</option>
                      <option value="lte">&lt;= Less or Equal</option>

                      <option value="contains">Contains</option>
                      <option value="starts">Starts With</option>
                      <option value="ends">Ends With</option>

                      <option value="null">Is Null</option>
                      <option value="notnull">Is Not Null</option>
                    </select>
                    <select class="form-select filter-value" multiple size="4"></select>
                    <button class="btn btn-primary add-filter-btn">Add</button>
                  </div>

                </div>
              </div>
            </div>

          </div>

          <!-- ACTIVE FILTER TAGS (ALWAYS VISIBLE) -->
          <div class="active-filters mb-3"></div>

          <!-- CHART AREA -->
          <div class="chart-container" id="chart-${this.id}"></div>

        </div>
      </div>
    `;


    container.insertAdjacentHTML("beforeend", panelHTML);
    this.el = container.querySelector(`[data-panel-id="${this.id}"]`);

    this.attachEvents();
  }

  // ---------------------------------------------
  // Attach event listeners for this panel
  // ---------------------------------------------
  attachEvents() {
    const fileInput = this.el.querySelector(".file-input");
    const removeBtn = this.el.querySelector(".remove-panel");

    fileInput.addEventListener("change", e => this.loadCSV(e));
    removeBtn.addEventListener("click", () => PanelManager.removePanel(this.id));

    // Dropdowns
    this.el.querySelector(".x-axis-menu").addEventListener("click", e => {
      if (e.target.classList.contains("dropdown-item")) {
        this.state.xAxis = e.target.textContent;
        this.renderChart();
      }
    });

    this.el.querySelector(".y-axis-menu").addEventListener("click", e => {
      if (e.target.classList.contains("dropdown-item")) {
        this.state.yAxis = e.target.textContent;
        this.renderChart();
      }
    });

    this.el.querySelector(".transform-menu").addEventListener("click", e => {
      if (e.target.classList.contains("dropdown-item")) {
        this.state.transform = e.target.dataset.value;
        this.renderChart();
      }
    });

    this.el.querySelector(".chart-type-menu").addEventListener("click", e => {
      if (e.target.classList.contains("dropdown-item")) {
        this.state.chartType = e.target.textContent;
        this.renderChart();
      }
    });

    this.el.querySelector(".filter-column").addEventListener("change", e => {
      const col = e.target.value;
      const filterValue = this.el.querySelector(".filter-value");

      filterValue.innerHTML = "";

      if (this.state.data) {
        const uniqueValues = [...new Set(this.state.data.map(d => d[col]))];

        uniqueValues.forEach(v => {
          filterValue.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
        });
      }
    });

    this.el.querySelector(".add-filter-btn").addEventListener("click", () => {
      const col = this.el.querySelector(".filter-column").value;
      const op = this.el.querySelector(".filter-operator").value;
      const valueSelect = this.el.querySelector(".filter-value");
      const selectedValues = Array.from(valueSelect.selectedOptions).map(opt => opt.value);


      if (!col || !selectedValues) return;

      this.state.filters.push({
        column: col,
        operator: op,
        values: selectedValues,
        logic: "AND"   // default for now
      });

      this.renderFilters();
      this.renderChart();
    });
  }

  // ---------------------------------------------
  // Load CSV → parse → update dropdowns
  // ---------------------------------------------
  loadCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    d3.csv(URL.createObjectURL(file)).then(data => {
      this.state.data = data;
      this.state.columns = data.columns;

      this.populateDropdowns();
    });
  }

  applyFilters(data, filters) {
    if (!filters || filters.length === 0) return data;

    return data.filter(row => {

      return filters.every(f => {
        const cell = row[f.column];

        switch (f.operator) {

          case "eq":
            return f.values.includes(cell);

          case "neq":
            return !f.values.includes(cell);

          case "gt":
            return Number(cell) > Number(f.values[0]);

          case "gte":
            return Number(cell) >= Number(f.values[0]);

          case "lt":
            return Number(cell) < Number(f.values[0]);

          case "lte":
            return Number(cell) <= Number(f.values[0]);

          case "contains":
            return String(cell).toLowerCase().includes(String(f.values[0]).toLowerCase());

          case "starts":
            return String(cell).toLowerCase().startsWith(String(f.values[0]).toLowerCase());

          case "ends":
            return String(cell).toLowerCase().endsWith(String(f.values[0]).toLowerCase());

          case "null":
            return cell === null || cell === "" || cell === undefined;

          case "notnull":
            return !(cell === null || cell === "" || cell === undefined);

          default:
            return true;
        }
      });

    });
  }


  // ---------------------------------------------
  // Populate X/Y axis dropdowns
  // ---------------------------------------------
  populateDropdowns() {
    const xMenu = this.el.querySelector(".x-axis-menu");
    const yMenu = this.el.querySelector(".y-axis-menu");

    xMenu.innerHTML = "";
    yMenu.innerHTML = "";

    this.state.columns.forEach(col => {
      xMenu.insertAdjacentHTML("beforeend", `<a class="dropdown-item">${col}</a>`);
      yMenu.insertAdjacentHTML("beforeend", `<a class="dropdown-item">${col}</a>`);
    });

    const filterCol = this.el.querySelector(".filter-column");
    filterCol.innerHTML = "";
    this.state.columns.forEach(col => {
      filterCol.insertAdjacentHTML("beforeend", `<option>${col}</option>`);
    });

    const filterValue = this.el.querySelector(".filter-value");
    filterValue.innerHTML = "";

    if (this.state.data) {
      const uniqueValues = [...new Set(this.state.data.map(d => d[this.state.yAxis]))];

      uniqueValues.forEach(v => {
        filterValue.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
      });
    }
  }

  // ---------------------------------------------
  // Remove panel from DOM
  // ---------------------------------------------
  destroy() {
    this.el.remove();
  }

  // ---------------------------------------------
  // Render chart using your existing chart modules
  // ---------------------------------------------
  renderChart() {
    const s = this.state;

    if (!s.data || !s.xAxis || !s.yAxis || !s.chartType) {
      updateGlobalStateDisplay(s);
      return;
    }

    // Apply filters
    const filtered = this.applyFilters(s.data, s.filters);

    const container = this.el.querySelector(`#chart-${this.id}`);
    container.innerHTML = "";

    switchChart(container, {
      ...s,
      data: filtered
    });

    updateGlobalStateDisplay(s);
  }
}

function updateGlobalStateDisplay(panelState) {
  if (!panelState) {
    document.getElementById("state-xAxis").textContent = "(none)";
    document.getElementById("state-yAxis").textContent = "(none)";
    document.getElementById("state-agg").textContent = "(none)";
    document.getElementById("state-chart").textContent = "(none)";
    document.getElementById("state-rows").textContent = "0";
    document.getElementById("state-cols").textContent = "0";
    return;
  }

  document.getElementById("state-xAxis").textContent =
    panelState.xAxis || "(none)";

  document.getElementById("state-yAxis").textContent =
    panelState.yAxis || "(none)";

  document.getElementById("state-agg").textContent =
    panelState.transform || "(none)";

  document.getElementById("state-chart").textContent =
    panelState.chartType || "(none)";

  document.getElementById("state-rows").textContent =
    panelState.data ? panelState.data.length : 0;

  document.getElementById("state-cols").textContent =
    panelState.columns ? panelState.columns.length : 0;
}

function switchChart(container, data) {
  console.log(data);
  if (data.chartType === "Bar Chart") {
    renderBarChart(container, data);
  }
  else if (data.chartType === "Line Chart") {
    renderLineChart(container, data);
  }
  else if (data.chartType === "Pie Chart") {
    renderPieChart(container, data);
  }
  else if (data.chartType === "Table Chart") {
    renderTableChart(container, data);
  }
  else if (data.chartType === "Stacked Bar Chart") {
    renderStackedChart(container, data);
  }
}

// Build bar chart instance
function renderBarChart(container, data) {
  console.log(data);
  chart = new BarChart(container, {
    width: 800,
    height: 650,
    yKey: data.yAxis,
    xKey: data.xAxis,
    margin: { top: 20, right: 20, bottom: 40, left: 150 }
  });

  let aggregated = getAggregateFunction(
    data.transform,
    data.data,
    data.xAxis,
    data.yAxis);

  console.log(aggregated);

  chart.update({ data: aggregated, xAxis: data.xAxis, yAxis: data.yAxis });
}

function renderLineChart(container, data) {
  chart = new LineChart(container, {
    width: 800,
    height: 650,
    yKey: data.yAxis,
    xKey: data.xAxis,
    margin: { top: 20, right: 20, bottom: 40, left: 150 }
  });

  let aggregated = getAggregateFunction(
    data.transform,
    data.data,
    data.xAxis,
    data.yAxis);

  chart.update({ data: aggregated, xAxis: data.xAxis, yAxis: data.yAxis });
}

function renderTableChart(container, data) {

  // aggregated results (Count, Sum, Avg)
  const aggregated = getAggregateFunction(
    data.transform,
    data.data,
    data.xAxis,
    data.yAxis
  );

  chart = new TableChart(container, {
    height: 650,
    xKey: data.xAxis,
    yKey: data.yAxis
  });

  chart.update({
    rawData: data.data,          // <-- original rows
    aggregatedData: aggregated,  // <-- aggregated rows
    xAxis: data.xAxis,
    yAxis: data.yAxis,
    transform: data.transform
  });
}

function renderPieChart(container, data) {
  chart = new PieChart(container, {
    width: 500,
    height: 500
  });

  let aggregated = getAggregateFunction(
    data.transform,
    data.data,
    data.xAxis,
    data.yAxis
  );

  chart.update({
    data: aggregated,
    xAxis: data.xAxis,
    yAxis: data.yAxis,
    transform: data.transform
  });
}

function renderStackedChart(container, data) {
  const xKey = data.xAxis;
  const yKey = data.yAxis;

  // 1. Group rows by X-axis value
  const grouped = d3.group(data.data, d => d[xKey]);

  // 2. Determine stack keys (unique Y-axis values)
  const stackKeys = Array.from(new Set(data.data.map(d => d[yKey])));

  // 3. Build stacked rows
  const stackedData = Array.from(grouped, ([xValue, rows]) => {
    const row = { [xKey]: xValue };

    // Initialize all stack keys to 0
    stackKeys.forEach(k => row[k] = 0);

    // Count occurrences
    rows.forEach(r => {
      const key = r[yKey];
      if (row[key] !== undefined) {
        row[key] += 1;
      }
    });

    return row;
  });

  // 4. Create chart
  chart = new StackedBarChart(container, {
    width: 800,
    height: 650,
    xKey: xKey,
    stackKeys: stackKeys,
    margin: { top: 20, right: 20, bottom: 40, left: 150 }
  });

  // 5. Update chart with processed data
  chart.update({
    data: stackedData,
    xAxis: xKey,
    stackKeys: stackKeys
  });
}
