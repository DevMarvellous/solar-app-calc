/**
 * Solar PV & Diesel Generator LCCA - Technical Sizing Engine
 * Clean, human-understandable calculations for electrical engineering project.
 */

class SystemSizingEngine {
  /**
   * Sizing calculations for Solar Photovoltaic (PV) + Battery System
   */
  static sizeSolarPvSystem(dailyKWh, peakKW, siteData, params) {
    const dailyWh = dailyKWh * 1000;
    const psh = siteData.avgPSH || 4.89; // Peak sun hours per day
    const derating = params.pvDeratingFactor || 0.80; // Dirt, temperature, wire losses
    const invEff = params.inverterEfficiency || 0.92; // 92% inverter efficiency
    const moduleWatt = params.pvModuleWattage || 550; // 550W panel

    // 1. Solar PV Array
    // Required PV Watts = Daily Wh / (Sun Hours * Derating * Inverter Efficiency)
    const systemEfficiency = derating * invEff;
    const rawArrayWatts = dailyWh / (psh * systemEfficiency);
    const rawArrayKWp = rawArrayWatts / 1000;
    const moduleCount = Math.max(1, Math.ceil(rawArrayWatts / moduleWatt));
    const installedArrayWatts = moduleCount * moduleWatt;
    const installedArrayKWp = Number((installedArrayWatts / 1000).toFixed(2));

    // 2. Battery Storage
    const isLithium = params.batteryType === 'lifepo4';
    const dod = isLithium ? (params.batteryDoD || 0.85) : 0.50; // 85% for Lithium, 50% for Lead Acid
    const battRoundTrip = params.batteryRoundTripEff || 0.90;
    const autonomy = params.autonomyDays || 1.5;
    const vBus = params.batteryVoltage || 48; // 48V DC bus

    // Battery Storage kWh = (Daily kWh * Days of Autonomy) / (DoD * Battery Eff * Inverter Eff)
    const totalBattEff = dod * battRoundTrip * invEff;
    const requiredBattKWh = (dailyKWh * autonomy) / totalBattEff;
    const roundedBattKWh = Number((Math.ceil(requiredBattKWh * 10) / 10).toFixed(1));
    const battAhAt48V = Math.round((roundedBattKWh * 1000) / vBus);
    const usableBattKWh = Number((roundedBattKWh * dod).toFixed(1));

    const standardLithiumPackKWh = 5.12; // 5.12kWh standard Lithium module
    const lithiumPacksCount = Math.max(1, Math.ceil(roundedBattKWh / standardLithiumPackKWh));
    const gelBatteriesCount = Math.max(4, Math.ceil(battAhAt48V / 200) * 4); // 12V 200Ah batteries

    // 3. Inverter Sizing
    const safetyFactor = params.inverterSafetyFactor || 1.25;
    const reqInverterKVA = (peakKW * safetyFactor) / 0.8;
    const standardInverterKVA = this.roundToStandardInverter(reqInverterKVA);
    const continuousKW = Number((standardInverterKVA * 0.8).toFixed(1));

    // 4. Charge Controller (MPPT)
    const mpptAmps = Math.ceil((installedArrayWatts / vBus) / 10) * 10;

    // 5. Human-Readable Step-by-Step Mathematical Explanation
    const stepByStep = [
      {
        step: 1,
        title: 'Solar PV Array Sizing',
        formula: 'Required Solar Array (Watts) = Daily Energy (Wh) ÷ (Sun Hours per Day × Total System Efficiency)',
        calculation: `= ${dailyWh.toLocaleString()} Wh ÷ (${psh} hrs × ${derating} derating × ${invEff} inverter eff) = ${Math.round(rawArrayWatts).toLocaleString()} Watts (${rawArrayKWp.toFixed(2)} kWp)`,
        result: `${installedArrayKWp} kWp (Selected: ${moduleCount} panels of ${moduleWatt}W Mono-PERC)`
      },
      {
        step: 2,
        title: 'Battery Energy Storage Sizing',
        formula: 'Battery Bank Capacity (kWh) = (Daily Energy × Days of Backup) ÷ (Depth of Discharge × Battery Efficiency × Inverter Efficiency)',
        calculation: `= (${dailyKWh} kWh × ${autonomy} days) ÷ (${dod} DoD × ${battRoundTrip} batt eff × ${invEff} inv eff) = ${requiredBattKWh.toFixed(1)} kWh`,
        result: `${roundedBattKWh} kWh Storage (${battAhAt48V} Ah at 48V DC bus — ${isLithium ? `${lithiumPacksCount} × 5.12kWh Lithium packs` : `${gelBatteriesCount} × 12V 200Ah Gel batteries`})`
      },
      {
        step: 3,
        title: 'Pure Sine Wave Inverter Sizing',
        formula: 'Inverter Rating (kVA) = (Peak Power kW × 1.25 Safety Surge Factor) ÷ 0.8 Power Factor',
        calculation: `= (${peakKW} kW × ${safetyFactor}) ÷ 0.8 = ${reqInverterKVA.toFixed(2)} kVA`,
        result: `${standardInverterKVA} kVA Inverter (${continuousKW} kW Continuous Power @ 48V DC)`
      },
      {
        step: 4,
        title: 'MPPT Charge Controller Sizing',
        formula: 'Controller Current (Amps) = Total Solar Array Watts ÷ Battery DC Voltage (48V)',
        calculation: `= ${installedArrayWatts.toLocaleString()} Watts ÷ 48 Volts = ${(installedArrayWatts / 48).toFixed(1)} Amps`,
        result: `${mpptAmps} Amps MPPT Charge Controller`
      }
    ];

    return {
      installedArrayKWp,
      moduleCount,
      moduleWattage: moduleWatt,
      batteryKWh: roundedBattKWh,
      batteryAh: battAhAt48V,
      usableBattKWh,
      lithiumPacksCount,
      gelBatteriesCount,
      inverterKVA: standardInverterKVA,
      continuousKW,
      mpptAmps,
      stepByStep
    };
  }

  /**
   * Sizing and fuel calculations for Diesel Generator System
   */
  static sizeDieselSystem(dailyKWh, peakKW, params, runHoursPerDay = 16) {
    const reqGenKVA = (peakKW * 1.25) / 0.8;
    const standardGenKVA = this.roundToStandardGenerator(reqGenKVA);

    // Standard diesel fuel formula: F_hourly = (F0 * Gen_kVA) + (F1 * Avg_Load_kW)
    const avgLoadKW = Math.min(peakKW * 0.7, (dailyKWh / Math.max(1, runHoursPerDay)));
    const f0 = 0.08; // 0.08 L/kVA/hr no-load fuel slope
    const f1 = 0.24; // 0.24 L/kWh generated under load

    const fuelLitersPerHour = Number(((f0 * standardGenKVA) + (f1 * avgLoadKW)).toFixed(2));
    const dailyFuelLiters = Number((fuelLitersPerHour * runHoursPerDay).toFixed(1));
    const monthlyFuelLiters = Math.round(dailyFuelLiters * 30.5);
    const annualFuelLiters = Math.round(dailyFuelLiters * 365);

    const fuelPrice = params.dieselFuelPricePerLiter || 1200;
    const dailyFuelCost = Math.round(dailyFuelLiters * fuelPrice);
    const monthlyFuelCost = Math.round(monthlyFuelLiters * fuelPrice);
    const annualFuelCost = Math.round(annualFuelLiters * fuelPrice);

    const stepByStep = {
      step: 5,
      title: 'Diesel Generator Sizing & Fuel Model',
      formula: 'Hourly Fuel Burn (L/hr) = (0.08 × Generator kVA) + (0.24 × Average Load kW)',
      calculation: `= (0.08 × ${standardGenKVA} kVA) + (0.24 × ${avgLoadKW.toFixed(2)} kW) = ${fuelLitersPerHour} Liters/hour\n` +
                   `Daily Fuel: ${fuelLitersPerHour} L/hr × ${runHoursPerDay} hrs/day = ${dailyFuelLiters} Liters/day\n` +
                   `Annual Fuel: ${dailyFuelLiters} L/day × 365 days = ${annualFuelLiters.toLocaleString()} Liters/year\n` +
                   `Annual Fuel Bill: ${annualFuelLiters.toLocaleString()} Liters × ₦${fuelPrice.toLocaleString()}/L = ₦${annualFuelCost.toLocaleString()}/year`,
      result: `${standardGenKVA} kVA Generator consuming ${dailyFuelLiters} L/day (₦${monthlyFuelCost.toLocaleString()}/month)`
    };

    return {
      generatorKVA: standardGenKVA,
      runHoursPerDay,
      annualGenHours: runHoursPerDay * 365,
      avgLoadKW: Number(avgLoadKW.toFixed(2)),
      fuelLitersPerHour,
      dailyFuelLiters,
      monthlyFuelLiters,
      annualFuelLiters,
      dailyFuelCost,
      monthlyFuelCost,
      annualFuelCost,
      stepByStep
    };
  }

  static roundToStandardInverter(reqKVA) {
    const standard = [1.0, 1.5, 2.5, 3.5, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0, 50.0];
    for (let s of standard) {
      if (s >= reqKVA) return s;
    }
    return Math.ceil(reqKVA / 5) * 5;
  }

  static roundToStandardGenerator(reqKVA) {
    const standard = [3.5, 5.0, 6.5, 8.5, 10.0, 15.0, 20.0, 25.0, 30.0, 40.0, 50.0, 65.0, 80.0, 100.0];
    for (let s of standard) {
      if (s >= reqKVA) return s;
    }
    return Math.ceil(reqKVA / 10) * 10;
  }
}
