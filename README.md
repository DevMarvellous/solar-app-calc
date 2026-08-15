# Solar & Diesel Life Cycle Cost Analyzer (LCCA)

A modern, high-performance web software application for **Photovoltaic Solar Panel Array Simulation** and **25-Year Life Cycle Cost Analysis (LCCA)** comparing Solar PV, Diesel Generators, and Hybrid systems in Nigeria.

---

## ⚡ Key Features

1. **🔬 Photorealistic Solar Panel Array Simulator**:
   - Realistic monocrystalline silicon solar module graphics with crystalline cells, silver busbars, and aluminum frames.
   - **Interactive Drag-and-Drop**: Drag panels directly onto the mounting rack or click `+ Add Panel`.
   - **Custom Wattages (up to 2000W)**: Set global ratings (`450W`, `550W`, `600W`, `612W`, `700W`, `1000W`, `2000W`) or edit individual panels.
   - **Real-Time Electrical Metrics**:
     - $\text{Installed Solar Capacity (kW)} = \frac{\sum \text{Watts}}{1000}$
     - $\text{Expected Power Output (kW)} = \text{Installed kW} \times 0.80$ (System losses factor)
     - $\text{Daily Energy Generation (kWh/day)} = \text{Expected kW} \times \text{Sun Hours}$
     - $\text{Matched Inverter (kVA)}$ & $\text{MPPT Controller (A)}$
     - $\text{Backup Diesel Generator (kVA)}$

2. **💰 25-Year Life Cycle Cost Analysis (LCCA)**:
   - **Option 1: Standalone Solar PV System** (Turnkey installation + Battery replacement @ Yr 10 + ₦0 fuel).
   - **Option 2: Standalone Diesel Generator** (Purchase cost + 25-Year daily fuel bill + Servicing).
   - **Option 3: Hybrid Solar-Diesel System** (Solar handles daytime load + Diesel runs 4 hours peak, cutting fuel by 75%).
   - Levelized Cost of Energy (LCOE in ₦/kWh) and Payback Period.

3. **☀️ 12-Month Solar Radiation Inputs**:
   - Editable Jan to Dec monthly insolation values (preloaded with `5976` ... `5694` Wh/m²/day).
   - Quick Nigerian state presets (Lagos, Abuja, Kano, Port Harcourt, Enugu, Sokoto, Jos).

4. **📄 Technical & Financial Report Export**:
   - 1-Click **Print / Save as PDF** formatted for A4 reports.
   - **Download CSV Data** for spreadsheet analysis.

---

## 🚀 Running the App Locally

### Option 1: Direct in Browser
Simply open `index.html` in any web browser. No installation or build steps required.

### Option 2: Using NPM
```bash
npm run dev
```
Runs a local development server at `http://localhost:3000`.
# solar-app-calc