/**
 * Solar & Diesel Generator LCCA - Academic Report & Export Engine
 * Clean, printable report for final year engineering project.
 */

class AcademicReportEngine {
  /**
   * Render the complete Academic Project Defense Report / Dossier
   */
  static renderReport(containerId, results) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { solar, diesel, savings, payback, dailyKWh, peakKW, siteData, params } = results;

    const fmtNaira = (val) => `₦${Number(val || 0).toLocaleString('en-NG')}`;
    const fmtNairaM = (val) => `₦${((val || 0) / 1e6).toFixed(2)}M`;

    // 25-Year Cash flow table rows (sampling key years: 0, 1, 3, 5, 10, 15, 20, 25)
    const sampleYears = [0, 1, 3, 5, 10, 15, 20, 25];
    const cashFlowRows = sampleYears.map(yr => {
      const sFlow = solar.financials.cashFlows[yr];
      const dFlow = diesel.financials.cashFlows[yr];

      return `
        <tr>
          <td><strong>Year ${yr}</strong></td>
          <td>${fmtNaira(sFlow.netCashFlow)}</td>
          <td>${fmtNaira(sFlow.cumulativeDiscountedLCC)}</td>
          <td>${fmtNaira(dFlow.fuelCost)}</td>
          <td>${fmtNaira(dFlow.netCashFlow)}</td>
          <td>${fmtNaira(dFlow.cumulativeDiscountedLCC)}</td>
        </tr>
      `;
    }).join('');

    // BEME (Bill of Engineering Measurement & Evaluation)
    const bemeRows = `
      <tr>
        <td>1.0</td>
        <td>Monocrystalline Solar PV Modules (${solar.sizing.moduleWattage}W Tier-1 Mono-PERC)</td>
        <td>${solar.sizing.moduleCount} Units (${solar.sizing.installedArrayKWp} kWp)</td>
        <td>${fmtNaira(params.pvCostPerKWp || 350000)} / kWp</td>
        <td>${fmtNaira(solar.financials.capex.pvCost)}</td>
      </tr>
      <tr>
        <td>2.0</td>
        <td>Battery Energy Storage Bank (${params.batteryType === 'lifepo4' ? 'Lithium LiFePO4' : 'Tubular Gel'} @ 48V DC)</td>
        <td>${solar.sizing.batteryKWh} kWh (${solar.sizing.batteryAh} Ah)</td>
        <td>${fmtNaira(params.lithiumBatteryCostPerKWh || 380000)} / kWh</td>
        <td>${fmtNaira(solar.financials.capex.battCost)}</td>
      </tr>
      <tr>
        <td>3.0</td>
        <td>Pure Sine Wave Inverter + MPPT Charge Controller</td>
        <td>${solar.sizing.inverterKVA} kVA / ${solar.sizing.mpptAmps}A MPPT</td>
        <td>${fmtNaira(params.inverterCostPerKVA || 165000)} / kVA</td>
        <td>${fmtNaira(solar.financials.capex.invCost)}</td>
      </tr>
      <tr>
        <td>4.0</td>
        <td>Balance of System (BOS), Racking, DC/AC Switchgear & Installation</td>
        <td>1 Lot (Lump Sum)</td>
        <td>15% of Equipment</td>
        <td>${fmtNaira(solar.financials.capex.bosAndLabor)}</td>
      </tr>
      <tr style="background: rgba(0,0,0,0.03); font-weight: bold;">
        <td colspan="4" style="text-align: right;">TOTAL INITIAL SOLAR PV INVESTMENT (₦):</td>
        <td style="color: var(--primary); font-size: 0.95rem;">${fmtNaira(solar.financials.capex.total)}</td>
      </tr>
    `;

    container.innerHTML = `
      <div style="max-width: 950px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem;">
        
        <!-- Action Bar -->
        <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 0.85rem 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div>
            <h3 style="font-size: 0.95rem; font-weight: 700;">Academic Technical Report & Dossier</h3>
            <p style="font-size: 0.75rem; color: var(--text-muted);">Formatted for project defense presentation & supervisor review.</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="window.print()">
              🖨️ Print / Save PDF
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AcademicReportEngine.exportCSV()">
              📥 Export CSV
            </button>
          </div>
        </div>

        <!-- Academic Dossier Header -->
        <div class="card" style="border-top: 3px solid var(--primary);">
          <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
            <span style="font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; color: var(--primary); text-transform: uppercase;">FINAL YEAR ENGINEERING PROJECT DEFENSE REPORT</span>
            <h2 style="font-size: 1.2rem; margin: 0.35rem 0 0.5rem 0; color: var(--text-main); font-weight: 800; line-height: 1.35;">
              ${params.projectTitle}
            </h2>
            <p style="font-size: 0.825rem; color: var(--text-secondary);">${params.department} • ${params.institution}</p>
          </div>

          <!-- Academic Metadata Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.825rem; background: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md);">
            <div><span style="color: var(--text-muted);">Student Name:</span> <br><strong>${params.studentName}</strong></div>
            <div><span style="color: var(--text-muted);">Matriculation Number:</span> <br><strong style="color: var(--primary);">${params.matricNo}</strong></div>
            <div><span style="color: var(--text-muted);">Project Supervisor:</span> <br><strong>${params.supervisor}</strong></div>
            <div><span style="color: var(--text-muted);">Location / Solar Resource:</span> <br><strong>${siteData.name} (${siteData.avgPSH} sun hrs/day)</strong></div>
          </div>
        </div>

        <!-- 1. Executive Summary -->
        <div class="card">
          <h3 class="card-title">1.0 Executive Summary & Life Cycle Cost Findings</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-top: 0.4rem;">
            A comprehensive 25-year Life Cycle Cost Analysis (LCCA) was conducted for an electrical load demand of 
            <strong>${dailyKWh} kWh/day</strong> (peak demand: <strong>${peakKW} kW</strong>) at 
            <strong>${siteData.name}</strong>. 
            Under Nigerian economic conditions (Diesel pump price: ₦${params.dieselFuelPricePerLiter || 1200}/Liter, 12% discount rate), the 
            <strong>Solar PV System</strong> demonstrates significant economic advantage over the standalone diesel generator.
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 0.85rem;">
            <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md);">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Solar 25-Yr Cost (LCC)</span>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--solar-color);">${fmtNairaM(solar.financials.totalLCC)}</div>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">₦${solar.financials.lcoe}/kWh</span>
            </div>

            <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md);">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Diesel 25-Yr Cost (LCC)</span>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--diesel-color);">${fmtNairaM(diesel.financials.totalLCC)}</div>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">₦${diesel.financials.lcoe}/kWh</span>
            </div>

            <div style="background: var(--success-bg); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--success-border);">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Money Saved</span>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--success-color);">${fmtNairaM(savings.total25YearSavings)}</div>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">Payback in ${payback.discountedPaybackYears} Years</span>
            </div>
          </div>
        </div>

        <!-- 2. Technical Sizing Summary -->
        <div class="card">
          <h3 class="card-title">2.0 Technical Sizing Comparison</h3>
          <div class="table-responsive" style="margin-top: 0.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Solar PV System</th>
                  <th>Diesel Generator System</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Primary Power Source</td>
                  <td><strong>${solar.sizing.installedArrayKWp} kWp</strong> (${solar.sizing.moduleCount} × 550W Panels)</td>
                  <td><strong>${diesel.sizing.generatorKVA} kVA</strong> Generator</td>
                </tr>
                <tr>
                  <td>Battery Energy Storage</td>
                  <td><strong>${solar.sizing.batteryKWh} kWh</strong> (${solar.sizing.batteryAh} Ah @ 48V)</td>
                  <td>None (0 kWh)</td>
                </tr>
                <tr>
                  <td>Inverter / Power Conditioning</td>
                  <td><strong>${solar.sizing.inverterKVA} kVA</strong> Pure Sine Wave</td>
                  <td>Built-in AVR</td>
                </tr>
                <tr>
                  <td>Annual Diesel Fuel Consumption</td>
                  <td><strong style="color: var(--success-color);">0 Liters / Year</strong></td>
                  <td><strong style="color: var(--diesel-color);">${diesel.sizing.annualFuelLiters.toLocaleString()} Liters / Year</strong></td>
                </tr>
                <tr>
                  <td>Annual Fuel Expenditure</td>
                  <td><strong style="color: var(--success-color);">₦0 / Year</strong></td>
                  <td><strong style="color: var(--diesel-color);">${fmtNaira(diesel.sizing.annualFuelCost)} / Year</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Bill of Quantities (BEME) -->
        <div class="card">
          <h3 class="card-title">3.0 Bill of Engineering Measurement & Evaluation (BEME)</h3>
          <div class="table-responsive" style="margin-top: 0.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity / Rating</th>
                  <th>Unit Rate (₦)</th>
                  <th>Total Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                ${bemeRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Cash Flow Summary -->
        <div class="card">
          <h3 class="card-title">4.0 25-Year Life Cycle Cash Flow Schedule</h3>
          <div class="table-responsive" style="margin-top: 0.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Solar Annual Cost (₦)</th>
                  <th>Solar Cum. LCC (₦)</th>
                  <th>Diesel Fuel (₦)</th>
                  <th>Diesel Annual Cost (₦)</th>
                  <th>Diesel Cum. LCC (₦)</th>
                </tr>
              </thead>
              <tbody>
                ${cashFlowRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sign-off Block -->
        <div class="card" style="background: var(--bg-subtle);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 0.5rem 0;">
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid var(--border-strong); height: 40px; margin-bottom: 6px;"></div>
              <strong>${params.studentName}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Student Researcher (${params.matricNo})</div>
            </div>
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid var(--border-strong); height: 40px; margin-bottom: 6px;"></div>
              <strong>${params.supervisor}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Project Supervisor Certification</div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Export CSV
   */
  static exportCSV() {
    if (!window.currentResults) return;
    const { solar, diesel, siteData } = window.currentResults;

    let csv = 'Year,Solar Annual Cash Flow (NGN),Solar Cumulative LCC (NGN),Diesel Fuel Cost (NGN),Diesel Annual Cost (NGN),Diesel Cumulative LCC (NGN)\n';
    solar.financials.cashFlows.forEach((sFlow, idx) => {
      const dFlow = diesel.financials.cashFlows[idx];
      csv += `${sFlow.year},${sFlow.netCashFlow},${sFlow.cumulativeDiscountedLCC},${dFlow.fuelCost},${dFlow.netCashFlow},${dFlow.cumulativeDiscountedLCC}\n`;
    });

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = `solar_diesel_lcca_${siteData.code}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
