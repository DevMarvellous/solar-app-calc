/**
 * Solar & Diesel Generator Life Cycle Cost Analyzer (LCCA)
 * Professional Sizing & Techno-Economic Evaluation Engine (Nigeria)
 */

// Nigerian Meteorological Solar Insolation Database (Wh/m²/day)
const LOCATION_PRESETS = {
  'site-study': [5976, 5380, 5631, 5256, 4740, 3746, 3891, 4329, 4188, 4772, 5048, 5694],
  'lagos': [5850, 5420, 5510, 5180, 4690, 3680, 3820, 4210, 4100, 4710, 5100, 5620],
  'abuja': [6120, 6240, 6080, 5750, 5320, 4850, 4350, 4200, 4680, 5350, 6010, 6150],
  'kano': [6350, 6650, 6720, 6480, 6150, 5820, 5210, 4980, 5450, 6120, 6420, 6280],
  'port-harcourt': [5120, 5210, 4980, 4750, 4320, 3510, 3210, 3350, 3620, 4150, 4650, 5080],
  'enugu': [5620, 5740, 5450, 5120, 4780, 4120, 3750, 3810, 4050, 4620, 5180, 5540],
  'sokoto': [6420, 6780, 6890, 6650, 6310, 5980, 5320, 5050, 5620, 6280, 6540, 6350],
  'jos': [6480, 6620, 6450, 6120, 5650, 5080, 4420, 4280, 4820, 5680, 6380, 6510]
};

// Interactive Simulator State (Defaults to 20 x 600W = 12.0 kW)
const SimulatorState = {
  panels: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, watts: 600 })),
  activeGlobalWattage: 600,
  installedKW: 12.0,
  expectedKW: 9.6
};

let lastCalculatedData = null;

document.addEventListener('DOMContentLoaded', () => {
  initPresetDropdown();
  renderPhotorealisticRack();
  
  // Attach live calculation listener to all inputs
  const allInputs = document.querySelectorAll('input, select');
  allInputs.forEach(elem => {
    elem.addEventListener('input', calculateAll);
    elem.addEventListener('change', calculateAll);
  });

  // Calculate immediately on startup
  calculateAll();
});

/* View Navigation & Mobile Hamburger Controls */
window.switchView = function(viewId) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
  });
  document.querySelectorAll('.mobile-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
  });
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.toggle('active', view.id === viewId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleMobileNav = function() {
  const menu = document.getElementById('mobile-nav-dropdown');
  if (menu) {
    menu.classList.toggle('show');
  }
};

window.switchViewMobile = function(viewId) {
  switchView(viewId);
  const menu = document.getElementById('mobile-nav-dropdown');
  if (menu) {
    menu.classList.remove('show');
  }
};

function initPresetDropdown() {
  const select = document.getElementById('preset-site-select');
  if (!select) return;

  select.addEventListener('change', (e) => {
    const key = e.target.value;
    if (LOCATION_PRESETS[key]) {
      const data = LOCATION_PRESETS[key];
      for (let i = 0; i < 12; i++) {
        const inp = document.getElementById(`m-${i}`);
        if (inp) inp.value = data[i];
      }
      calculateAll();
    }
  });
}

function getMonthlySolarData() {
  const months = [];
  let sumWh = 0;
  for (let i = 0; i < 12; i++) {
    const el = document.getElementById(`m-${i}`);
    const val = el ? (parseFloat(el.value) || 4500) : 4500;
    months.push(val);
    sumWh += val;
  }
  const avgWh = Math.round(sumWh / 12);
  const avgPSH = Number((avgWh / 1000).toFixed(2));
  return { months, avgWh, avgPSH };
}

/* ══════════════════════════════════════════════════════════════
   SMOOTH DRAG-AND-DROP & HORIZONTAL LANDSCAPE PANELS
   ══════════════════════════════════════════════════════════════ */

// Drag from top palette to rack
window.handlePaletteDragStart = function(event, watts) {
  event.dataTransfer.setData('text/plain', String(watts));
  event.dataTransfer.effectAllowed = 'copy';
};

// Rack Dropzone Handlers
window.handleRackDragOver = function(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  const rack = document.getElementById('solar-mounting-rack-board');
  if (rack && !rack.classList.contains('drag-over')) {
    rack.classList.add('drag-over');
  }
};

window.handleRackDragLeave = function(event) {
  const rack = document.getElementById('solar-mounting-rack-board');
  if (rack) rack.classList.remove('drag-over');
};

window.handleRackDrop = function(event) {
  event.preventDefault();
  const rack = document.getElementById('solar-mounting-rack-board');
  if (rack) rack.classList.remove('drag-over');

  const rawWatts = event.dataTransfer.getData('text/plain');
  const watts = parseInt(rawWatts) || SimulatorState.activeGlobalWattage || 600;
  addSinglePanel(watts);
};

function renderPhotorealisticRack() {
  const board = document.getElementById('solar-mounting-rack-board');
  if (!board) return;

  const count = SimulatorState.panels.length;
  let totalWatts = 0;

  // Dynamic Density Class according to panel count:
  // <= 4: Large | 5 - 12: Medium | 13 - 25: Standard | 26+: Compact
  board.className = 'solar-mounting-rack';
  if (count <= 4) {
    board.classList.add('rack-density-large');
  } else if (count <= 12) {
    board.classList.add('rack-density-medium');
  } else if (count <= 25) {
    board.classList.add('rack-density-standard');
  } else {
    board.classList.add('rack-density-compact');
  }

  const modulesHTML = SimulatorState.panels.map((p, idx) => {
    totalWatts += p.watts;
    return `
      <div class="solar-pv-module" data-panel-id="${p.id}" id="panel-card-${p.id}">
        <!-- Top-Right Hover Trash Badge for direct individual deletion -->
        <button class="panel-trash-badge" onclick="deleteIndividualPanel(${p.id})" title="Delete Module #${p.id}">
          🗑️
        </button>

        <!-- Horizontal Landscape Crystalline Silicon Cell Grid (6x2) -->
        <div class="solar-cell-grid">
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
          <div class="solar-cell-unit"></div>
        </div>

        <!-- Clean Horizontal Module Control Bar -->
        <div class="module-bottom-bar">
          <span class="module-id-tag">#${p.id}</span>
          
          <div class="module-wattage-input-row">
            <input type="number" class="module-watt-input" min="50" max="2500" step="10" value="${p.watts}" onchange="updateSinglePanelWattage(${idx}, this.value)" />
            <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">W</span>
          </div>

          <button class="btn-delete-panel" onclick="deleteIndividualPanel(${p.id})" title="Delete Module #${p.id}">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  const addSlotHTML = `
    <div class="add-panel-slot" onclick="addSinglePanel()">
      <span style="font-size: 1.4rem; line-height: 1;">+</span>
      <span>Add Panel</span>
    </div>
  `;

  board.innerHTML = modulesHTML + addSlotHTML;

  // Update badges
  const badgeEl = document.getElementById('metric-active-badge');
  const countEl = document.getElementById('metric-panel-count');
  if (badgeEl) badgeEl.textContent = `${count} Modules`;
  if (countEl) countEl.textContent = `${count} Panels`;

  calculateAll();
}

window.addSinglePanel = function(watts) {
  let w = watts;
  if (!w && w !== 0) {
    const defaultW = SimulatorState.activeGlobalWattage || 600;
    const input = prompt("Enter solar panel rating in Watts (e.g., 400, 550, 600, 700, 1000):", defaultW);
    if (input === null) return; // User cancelled
    w = parseInt(input, 10);
    if (isNaN(w) || w <= 0) {
      alert("Please enter a valid positive panel wattage.");
      return;
    }
  }
  const newId = SimulatorState.panels.length > 0 ? (SimulatorState.panels[SimulatorState.panels.length - 1].id + 1) : 1;
  SimulatorState.panels.push({ id: newId, watts: w });
  renderPhotorealisticRack();
};

window.deleteIndividualPanel = function(id) {
  if (SimulatorState.panels.length <= 1) {
    alert('At least 1 solar panel must remain in the array.');
    return;
  }

  const card = document.getElementById(`panel-card-${id}`);
  if (card) {
    card.style.transition = 'all 180ms ease';
    card.style.transform = 'scale(0.5)';
    card.style.opacity = '0';
    setTimeout(() => {
      SimulatorState.panels = SimulatorState.panels.filter(p => p.id !== id);
      renderPhotorealisticRack();
    }, 160);
  } else {
    SimulatorState.panels = SimulatorState.panels.filter(p => p.id !== id);
    renderPhotorealisticRack();
  }
};

window.removeSinglePanel = function(index) {
  if (SimulatorState.panels.length <= 1) {
    alert('At least 1 solar panel must remain in the array.');
    return;
  }
  const targetId = SimulatorState.panels[index] ? SimulatorState.panels[index].id : null;
  if (targetId) {
    deleteIndividualPanel(targetId);
  } else {
    SimulatorState.panels.splice(index, 1);
    renderPhotorealisticRack();
  }
};

window.removeLastPanel = function() {
  if (SimulatorState.panels.length <= 1) return;
  SimulatorState.panels.pop();
  renderPhotorealisticRack();
};

window.updateSinglePanelWattage = function(index, value) {
  const w = Math.min(2500, Math.max(50, parseInt(value) || 600));
  if (SimulatorState.panels[index]) {
    SimulatorState.panels[index].watts = w;
    calculateAll();
  }
};

window.setQuickPanelCount = function(count) {
  const c = parseInt(count) || 20;
  const w = SimulatorState.activeGlobalWattage || 600;
  SimulatorState.panels = Array.from({ length: c }, (_, i) => ({ id: i + 1, watts: w }));
  
  document.querySelectorAll('.control-pill-group button').forEach(b => {
    if (b.id && b.id.startsWith('pill-count-')) b.classList.remove('active');
  });
  const activeBtn = document.getElementById(`pill-count-${c}`);
  if (activeBtn) activeBtn.classList.add('active');

  renderPhotorealisticRack();
};

window.setGlobalPanelWattage = function(watts) {
  const w = parseInt(watts) || 600;
  SimulatorState.activeGlobalWattage = w;
  SimulatorState.panels.forEach(p => p.watts = w);

  document.querySelectorAll('.control-pill-group button').forEach(b => {
    if (b.id && b.id.startsWith('pill-watt-')) b.classList.remove('active');
  });
  const activeBtn = document.getElementById(`pill-watt-${w}`);
  if (activeBtn) activeBtn.classList.add('active');

  renderPhotorealisticRack();
};

window.clearAllPanels = function() {
  SimulatorState.panels = [{ id: 1, watts: SimulatorState.activeGlobalWattage || 600 }];
  renderPhotorealisticRack();
};

/* ══════════════════════════════════════════════════════════════
   MASTER CALCULATION ENGINE (CHAPTER 3 & 4 METHODOLOGY)
   ══════════════════════════════════════════════════════════════ */

function calculateAll() {
  const { months, avgWh, avgPSH } = getMonthlySolarData();
  const avgDisplay = document.getElementById('calculated-avg-psh');
  const pshHoursDisplay = document.getElementById('metric-psh-hours');
  if (avgDisplay) avgDisplay.textContent = `${avgPSH} hrs/day`;
  if (pshHoursDisplay) pshHoursDisplay.textContent = `${avgPSH}`;

  // 1. Array Electrical Parameters
  let totalWatts = 0;
  SimulatorState.panels.forEach(p => totalWatts += (p.watts || 600));

  // Installed kW
  const installedKW = Number((totalWatts / 1000).toFixed(2));
  SimulatorState.installedKW = installedKW;

  // Expected Power Output (kW) = Installed kW * 0.80 (losses / power factor)
  const expectedKW = Number((installedKW * 0.80).toFixed(2));
  SimulatorState.expectedKW = expectedKW;

  // Daily Energy Generation (kWh/day)
  const dailyKWh = Number((expectedKW * avgPSH).toFixed(2));
  const annualEnergyKWh = dailyKWh * 365;

  // Battery Energy Storage Capacity (kWh & Ah at 48V DC bus)
  const battKWh = Number((dailyKWh * 1.5 / 0.85).toFixed(1));
  const battAh = Math.round((battKWh * 1000) / 48);

  // Matched Inverter Rating = Installed kW / 0.8
  const reqInverterKVA = Number(((installedKW / 0.8)).toFixed(1));
  const standardInverterKVA = roundToStandardInverter(reqInverterKVA);

  // Matched MPPT Controller = Total Watts / 48V DC
  const mpptAmps = Math.ceil((totalWatts / 48) / 10) * 10;

  // Backup Diesel Generator Sizing = (Expected kW * 1.25) / 0.8
  const reqGenKVA = Number(((expectedKW * 1.25) / 0.8).toFixed(1));
  const standardGenKVA = roundToStandardGenerator(reqGenKVA);

  // Update Simulation Output Displays
  const invKW = Number((standardInverterKVA * 0.8).toFixed(1));
  document.getElementById('metric-installed-kw').textContent = `${installedKW} kW`;
  document.getElementById('metric-expected-kw').textContent = `${expectedKW} kW`;
  const elDailyKwh = document.getElementById('metric-daily-kwh');
  if (elDailyKwh) elDailyKwh.textContent = `${dailyKWh} kWh`;
  document.getElementById('metric-inverter-kva').textContent = `${invKW} kW (${standardInverterKVA} kVA)`;
  document.getElementById('metric-mppt-amps').textContent = `${mpptAmps}A MPPT`;
  document.getElementById('metric-gen-kva').textContent = `${standardGenKVA} kVA`;

  // 2. Techno-Economic Parameters (Megaloite Case Study Methodology)
  const studyPeriodYears = 7; // 7-year life cycle horizon
  const discountRate = 0.10;  // 10% real discount rate
  const dieselPrice = 2100;   // ₦2,100 per Litre

  // Capital Costs:
  // For 10-12kW array, turnkey PV subsystem = ₦9,850,000 (scaled by capacity)
  const solarCapex = Math.round((installedKW / 12.0) * 9850000);
  const solarOM = Math.round(90000); // dry season cleaning + quarterly inspections
  const batteryRepCost = Math.round(solarCapex * 0.35);

  // Diesel-Only Scenario (30 kVA Genset, 1,000 L/month baseline)
  const dieselMonthlyLiters = Math.round((expectedKW / 9.6) * 1000);
  const dieselAnnualFuelLiters = dieselMonthlyLiters * 12;
  const dieselAnnualFuelCost = dieselAnnualFuelLiters * dieselPrice;
  const dieselAnnualServicing = Math.round((12 * 250 / 250) * 45000 * 4); // 250-hr services
  const dieselAnnualTotal = dieselAnnualFuelCost + dieselAnnualServicing;

  // 7-Year Cumulative Undiscounted Diesel Fuel
  const dieselCumulativeFuel = dieselAnnualFuelCost * studyPeriodYears;

  // Present Value Discounting (7 Years)
  let dieselPVTotal = 0;
  let solarPVTotal = solarCapex;
  let discountedEnergySum = 0;
  const solarCashFlows = [];
  const dieselCashFlows = [];

  for (let t = 1; t <= studyPeriodYears; t++) {
    const df = 1 / Math.pow(1 + discountRate, t);
    discountedEnergySum += annualEnergyKWh * df;

    // Diesel Cost
    const dieselYearCost = dieselAnnualTotal;
    dieselPVTotal += dieselYearCost * df;

    // Solar Cost
    let solarYearCost = solarOM;
    if (t === 5) solarYearCost += batteryRepCost * 0.5;
    solarPVTotal += solarYearCost * df;

    dieselCashFlows.push({
      year: t,
      fuelCost: dieselAnnualFuelCost,
      annualCost: dieselYearCost,
      cumulativeDiscounted: Math.round(dieselPVTotal)
    });

    solarCashFlows.push({
      year: t,
      annualCost: solarYearCost,
      cumulativeDiscounted: Math.round(solarPVTotal)
    });
  }

  const totalSolarLCC = Math.round(solarPVTotal);
  const totalDieselLCC = Math.round(dieselPVTotal);
  const solarLCOE = Number((totalSolarLCC / Math.max(1, discountedEnergySum)).toFixed(1));
  const dieselLCOE = Number((totalDieselLCC / Math.max(1, discountedEnergySum)).toFixed(1));

  // Net Savings & Payback
  const netSavings = Math.max(0, totalDieselLCC - totalSolarLCC);
  const paybackYears = Number((solarCapex / Math.max(1, (dieselAnnualTotal - solarOM))).toFixed(1));

  // 3. Update LCCA Summary Cards
  const fmtNaira = (val) => `₦${Number(val || 0).toLocaleString('en-NG')}`;
  const fmtNairaM = (val) => `₦${((val || 0) / 1e6).toFixed(2)} Million`;

  // Solar Card
  document.getElementById('box-solar-lcc').textContent = fmtNairaM(totalSolarLCC);
  document.getElementById('box-solar-lcoe').textContent = `₦${solarLCOE} / kWh`;
  document.getElementById('box-solar-capex').textContent = fmtNaira(solarCapex);

  // Diesel Card
  document.getElementById('box-diesel-lcc').textContent = fmtNairaM(totalDieselLCC);
  document.getElementById('box-diesel-lcoe').textContent = `₦${dieselLCOE} / kWh`;
  document.getElementById('box-diesel-capex').textContent = `₦0 (Existing 30kVA)`;
  document.getElementById('box-diesel-fuel').textContent = `${fmtNaira(dieselAnnualFuelCost)} / yr`;
  document.getElementById('box-diesel-25yr-fuel').textContent = `${fmtNairaM(dieselCumulativeFuel)} (7-Yr)`;

  // Savings Card
  document.getElementById('box-total-savings').textContent = fmtNairaM(netSavings);
  document.getElementById('box-payback-time').textContent = `${paybackYears} Years`;
  document.getElementById('box-annual-savings').textContent = `${fmtNairaM(dieselAnnualFuelCost - solarOM)} / yr`;
  document.getElementById('box-lcoe-diff').textContent = `₦${Math.abs(Number((dieselLCOE - solarLCOE).toFixed(1)))}/kWh cheaper`;

  // 4. Update Page 4 Connections Diagram & Table Elements
  const elSolarKw = document.getElementById('conn-solar-kw');
  const elMpptAmps = document.getElementById('conn-mppt-amps');
  const elBattStore = document.getElementById('conn-batt-storage');
  const elInvKva = document.getElementById('conn-inverter-kva');
  const elGenKva = document.getElementById('conn-gen-kva');
  if (elSolarKw) elSolarKw.textContent = `${installedKW} kWp DC`;
  if (elMpptAmps) elMpptAmps.textContent = `${mpptAmps}A MPPT`;
  if (elBattStore) elBattStore.textContent = `${battKWh} kWh (48V Bus)`;
  if (elInvKva) elInvKva.textContent = `${invKW} kW Inverter`;
  if (elGenKva) elGenKva.textContent = `${standardGenKVA} kVA Generator`;

  const tblSolar = document.getElementById('table-conn-solar');
  const tblMppt = document.getElementById('table-conn-mppt');
  const tblBatt = document.getElementById('table-conn-batt');
  const tblInv = document.getElementById('table-conn-inv');
  const tblGen = document.getElementById('table-conn-gen');

  if (tblSolar) tblSolar.textContent = `${installedKW} kWp (${SimulatorState.panels.length} Modules)`;
  if (tblMppt) tblMppt.textContent = `${mpptAmps}A MPPT Controller`;
  if (tblBatt) tblBatt.textContent = `${battKWh} kWh Bank (${battAh} Ah @ 48V DC)`;
  if (tblInv) tblInv.textContent = `${invKW} kW Pure Sine Wave Inverter`;
  if (tblGen) tblGen.textContent = `${standardGenKVA} kVA Generator`;

  // 5. Update Report Elements
  document.getElementById('rep-installed-kw').textContent = `${installedKW} kW`;
  document.getElementById('rep-expected-kw').textContent = `${expectedKW} kW`;
  const repInstalledMeta = document.getElementById('rep-installed-meta');
  if (repInstalledMeta) repInstalledMeta.textContent = `${installedKW} kW Array`;

  document.getElementById('rep-solar-capex').textContent = fmtNaira(solarCapex);
  document.getElementById('rep-solar-lcc').textContent = fmtNairaM(totalSolarLCC);
  document.getElementById('rep-solar-lcoe').textContent = `₦${solarLCOE} / kWh`;
  document.getElementById('rep-solar-payback').textContent = `${paybackYears} Years`;

  document.getElementById('rep-diesel-capex').textContent = `₦0 (Sunk)`;
  document.getElementById('rep-diesel-fuel').textContent = `${fmtNaira(dieselAnnualFuelCost)} / yr`;
  document.getElementById('rep-diesel-lcc').textContent = fmtNairaM(totalDieselLCC);
  document.getElementById('rep-diesel-lcoe').textContent = `₦${dieselLCOE} / kWh`;

  document.getElementById('rep-hybrid-capex').textContent = fmtNaira(solarCapex);
  document.getElementById('rep-hybrid-fuel').textContent = `${fmtNaira(Math.round(dieselAnnualFuelCost * 0.25))} / yr`;
  document.getElementById('rep-hybrid-lcc').textContent = fmtNairaM(Math.round(totalSolarLCC * 0.85 + totalDieselLCC * 0.25));
  document.getElementById('rep-hybrid-lcoe').textContent = `₦${(solarLCOE * 0.85).toFixed(1)} / kWh`;
  document.getElementById('rep-hybrid-payback').textContent = `${(paybackYears * 0.8).toFixed(1)} Years`;

  // Monthly Table in Report
  const monthlyTbody = document.getElementById('rep-monthly-tbody');
  if (monthlyTbody) {
    monthlyTbody.innerHTML = `
      <tr>
        ${months.map(m => `<td><strong>${m.toLocaleString()}</strong></td>`).join('')}
        <td style="color: var(--solar); font-weight: 800;">${avgPSH} PSH</td>
      </tr>
    `;
  }

  // Cash Flow Table in Report (7-Year Schedule)
  const cashflowTbody = document.getElementById('rep-cashflow-tbody');
  if (cashflowTbody) {
    cashflowTbody.innerHTML = solarCashFlows.map((s, idx) => {
      const d = dieselCashFlows[idx];
      const hCum = Math.round(s.cumulativeDiscounted + (d.cumulativeDiscounted * 0.25));

      return `
        <tr>
          <td><strong>Year ${s.year}</strong></td>
          <td>${fmtNaira(s.annualCost)}</td>
          <td>${fmtNaira(s.cumulativeDiscounted)}</td>
          <td>${fmtNaira(d.fuelCost)}</td>
          <td>${fmtNaira(d.cumulativeDiscounted)}</td>
          <td>${fmtNaira(hCum)}</td>
        </tr>
      `;
    }).join('');
  }

  lastCalculatedData = {
    solarCashFlows,
    dieselCashFlows
  };
}

function roundToStandardInverter(reqKVA) {
  const standards = [1.0, 1.5, 2.5, 3.5, 5.0, 7.5, 10.0, 15.0, 20.0, 25.0, 30.0, 45.0, 60.0];
  for (let s of standards) {
    if (s >= reqKVA) return s;
  }
  return Math.ceil(reqKVA / 10) * 10;
}

function roundToStandardGenerator(reqKVA) {
  const standards = [3.5, 5.0, 6.5, 7.5, 8.5, 10.0, 15.0, 18.75, 20.0, 25.0, 30.0, 40.0, 50.0, 65.0, 80.0, 100.0];
  for (let s of standards) {
    if (s >= reqKVA) return s;
  }
  return Math.ceil(reqKVA / 10) * 10;
}

window.exportCSV = function() {
  if (!lastCalculatedData) return;
  const { solarCashFlows, dieselCashFlows } = lastCalculatedData;

  let csv = 'Year,Solar Annual Cost (NGN),Solar Cumulative LCC (NGN),Diesel Annual Fuel (NGN),Diesel Cumulative LCC (NGN)\n';
  for (let i = 0; i < solarCashFlows.length; i++) {
    const s = solarCashFlows[i];
    const d = dieselCashFlows[i];
    csv += `${s.year},${s.annualCost},${s.cumulativeDiscounted},${d.fuelCost},${d.cumulativeDiscounted}\n`;
  }

  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  link.download = `solar_diesel_lcca_data.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
