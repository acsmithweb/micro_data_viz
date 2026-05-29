// =========================
// Global State
// =========================
let rows = [];
let xAxis = "";
let yAxis = "";1
let originalBarData = [];
let chart = null;

// =========================
// Utility Functions
// =========================

// Parse CSV file into rows
// async function loadCSV(file) {
//   const text = await file.text();
//   return d3.csvParse(text);
// }
// =========================================================
// PANEL MANAGER — handles creation, deletion, and registry
// =========================================================

const PanelManager = {
  panels: {},        // panelId → Panel instance
  nextId: 1,

  createPanel() {
    const id = this.nextId++;
    const panel = new Panel(id);
    this.panels[id] = panel;
    panel.render();
    return panel;
  },

  removePanel(id) {
    if (this.panels[id]) {
      this.panels[id].destroy();
      delete this.panels[id];
    }
  },

  getPanel(id) {
    return this.panels[id];
  }
};

function getAggregateFunction(type, rows, xKey, yKey) {
        switch (type) {
            case "Count":
                return Object.values(
                    rows.reduce((acc, d) => {
                        const key = d[yKey];
                        acc[key] = acc[key] || { [yKey]: key, [xKey]: 0 };
                        acc[key][xKey]++;
                        return acc;
                    }, {})
                );

            case "Sum":
                return rows.map(d => ({
                    [yKey]: d[yKey],
                    [xKey]: +d[xKey] || 0
                }));

            case "Average":
                const grouped = rows.reduce((acc, d) => {
                    const key = d[yKey];
                    acc[key] = acc[key] || { sum: 0, count: 0 };
                    acc[key].sum += +d[xKey] || 0;
                    acc[key].count++;
                    return acc;
                }, {});

                return Object.entries(grouped).map(([key, obj]) => ({
                    [yKey]: key,
                    [xKey]: obj.sum / obj.count
                }));

            default:
                return rows;
        }
    }

document.getElementById("add-panel-btn").addEventListener("click", () => {
  PanelManager.createPanel();
});