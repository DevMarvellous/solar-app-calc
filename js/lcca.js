/**
 * Solar PV & Diesel Generator LCCA - Life Cycle Cost Analysis Engine
 * Direct comparison between Solar Photovoltaic and Diesel Generator systems in Nigeria.
 */

class LccaEngine {
  /**
   * Run full comparative LCCA
   */
  static runComparativeAnalysis(dailyKWh, peakKW, siteData, params) {
    const solarSizing = SystemSizingEngine.sizeSolarPvSystem(dailyKWh, peakKW, siteData, params);
    const dieselSizing = SystemSizingEngine.sizeDieselSystem(dailyKWh, peakKW, params);

    const solarFinancials = this.calculateSolarLCCA(solarSizing, dailyKWh, params);
    const dieselFinancials = this.calculateDieselLCCA(dieselSizing, dailyKWh, params);

    // Payback calculation (Solar vs Diesel)
    const payback = this.calculatePayback(
      solarFinancials.capex.total,
      dieselFinancials.capex.total,
      solarFinancials.cashFlows,
      dieselFinancials.cashFlows,
      params.discountRate || 0.12
    );

    // Annual comparison
    const annualDieselFuel = dieselSizing.annualFuelCost;
    const annualDieselOM = Math.round(dieselSizing.annualGenHours * (params.genMaintenanceCostPerHour || 150));
    const annualDieselTotal = annualDieselFuel + annualDieselOM;

    const annualSolarOM = Math.round(solarFinancials.capex.total * 0.01);
    const annualNetSavings = Math.max(0, annualDieselTotal - annualSolarOM);
    const monthlyNetSavings = Math.round(annualNetSavings / 12);
    const dailyNetSavings = Math.round(annualNetSavings / 365);

    // 25-Year Net Present Savings
    const total25YearSavings = Math.max(0, dieselFinancials.totalLCC - solarFinancials.totalLCC);

    return {
      solar: { sizing: solarSizing, financials: solarFinancials },
      diesel: { sizing: dieselSizing, financials: dieselFinancials },
      payback,
      savings: {
        dailyNetSavings,
        monthlyNetSavings,
        annualNetSavings,
        total25YearSavings,
        annualDieselTotal,
        annualSolarOM
      },
      dailyKWh,
      peakKW,
      siteData,
      params
    };
  }

  /**
   * Calculate 25-Year Life Cycle Cost for Solar PV System
   */
  static calculateSolarLCCA(sizing, dailyKWh, params) {
    const nYears = params.projectLifetimeYears || 25;
    const d = params.discountRate || 0.12;
    const inf = params.inflationRate || 0.10;
    const isLithium = params.batteryType === 'lifepo4';
    const battLifespan = isLithium ? 10 : 4;
    const battUnitCost = isLithium ? (params.lithiumBatteryCostPerKWh || 380000) : (params.leadAcidBatteryCostPerKWh || 190000);

    // Initial Capital Cost
    const pvCost = sizing.installedArrayKWp * (params.pvCostPerKWp || 350000);
    const battCost = sizing.batteryKWh * battUnitCost;
    const invCost = sizing.inverterKVA * (params.inverterCostPerKVA || 165000);
    const equipSubtotal = pvCost + battCost + invCost;
    const bosAndLabor = equipSubtotal * 0.15; // 15% Balance of system & installation
    const totalCapex = Math.round(equipSubtotal + bosAndLabor);

    // 25-Year Cash Flows
    const annualEnergyKWh = dailyKWh * 365;
    const cashFlows = [];
    let discountedCumulativeCost = totalCapex;
    let discountedEnergySum = 0;

    cashFlows.push({
      year: 0,
      capex: totalCapex,
      fuelCost: 0,
      omCost: 0,
      replacementCost: 0,
      netCashFlow: totalCapex,
      discountedCost: totalCapex,
      cumulativeDiscountedLCC: totalCapex
    });

    for (let t = 1; t <= nYears; t++) {
      // Annual cleaning/maintenance: 1% of solar equipment escalated with inflation
      const omCost = (pvCost * 0.01) * Math.pow(1 + inf, t - 1);

      // Component Replacements
      let replacementCost = 0;
      if (t % battLifespan === 0 && t < nYears) {
        replacementCost += (sizing.batteryKWh * battUnitCost) * Math.pow(1 + inf, t);
      }
      if (t % 10 === 0 && t < nYears) {
        replacementCost += (sizing.inverterKVA * (params.inverterCostPerKVA || 165000)) * Math.pow(1 + inf, t);
      }

      let salvage = (t === nYears) ? totalCapex * 0.08 : 0;
      const netCashFlow = omCost + replacementCost - salvage;
      const discountFactor = 1 / Math.pow(1 + d, t);
      const discountedCost = netCashFlow * discountFactor;

      discountedCumulativeCost += discountedCost;
      discountedEnergySum += annualEnergyKWh * discountFactor;

      cashFlows.push({
        year: t,
        capex: 0,
        fuelCost: 0,
        omCost: Math.round(omCost),
        replacementCost: Math.round(replacementCost),
        netCashFlow: Math.round(netCashFlow),
        discountedCost: Math.round(discountedCost),
        cumulativeDiscountedLCC: Math.round(discountedCumulativeCost)
      });
    }

    const totalLCC = Math.round(discountedCumulativeCost);
    const lcoe = Number((totalLCC / Math.max(1, discountedEnergySum)).toFixed(1));

    return {
      capex: {
        pvCost: Math.round(pvCost),
        battCost: Math.round(battCost),
        invCost: Math.round(invCost),
        bosAndLabor: Math.round(bosAndLabor),
        total: totalCapex
      },
      totalLCC,
      lcoe,
      annualEnergyKWh,
      cashFlows
    };
  }

  /**
   * Calculate 25-Year Life Cycle Cost for Diesel Generator System
   */
  static calculateDieselLCCA(sizing, dailyKWh, params) {
    const nYears = params.projectLifetimeYears || 25;
    const d = params.discountRate || 0.12;
    const fuelEsc = params.fuelEscalationRate || 0.08;
    const inf = params.inflationRate || 0.10;

    const genCost = sizing.generatorKVA * (params.generatorCostPerKVA || 145000);
    const installCost = genCost * 0.10;
    const totalCapex = Math.round(genCost + installCost);

    const annualEnergyKWh = dailyKWh * 365;
    const cashFlows = [];
    let discountedCumulativeCost = totalCapex;
    let discountedEnergySum = 0;

    cashFlows.push({
      year: 0,
      capex: totalCapex,
      fuelCost: 0,
      omCost: 0,
      replacementCost: 0,
      netCashFlow: totalCapex,
      discountedCost: totalCapex,
      cumulativeDiscountedLCC: totalCapex
    });

    let cumulativeGenHours = 0;

    for (let t = 1; t <= nYears; t++) {
      cumulativeGenHours += sizing.annualGenHours;

      // Fuel cost with annual escalation
      const currentFuelPrice = (params.dieselFuelPricePerLiter || 1200) * Math.pow(1 + fuelEsc, t - 1);
      const fuelCost = sizing.annualFuelLiters * currentFuelPrice;

      // Maintenance (oil, filters, servicing)
      const omCost = (sizing.annualGenHours * (params.genMaintenanceCostPerHour || 150)) * Math.pow(1 + inf, t - 1);

      // Overhauls every 8000 hours / New Gen every 20,000 hours
      let replacementCost = 0;
      if (cumulativeGenHours >= 20000 && t < nYears) {
        replacementCost += totalCapex * Math.pow(1 + inf, t);
        cumulativeGenHours = 0;
      } else if (cumulativeGenHours % 8000 < sizing.annualGenHours && t < nYears) {
        replacementCost += (genCost * 0.25) * Math.pow(1 + inf, t);
      }

      let salvage = (t === nYears) ? totalCapex * 0.05 : 0;
      const netCashFlow = fuelCost + omCost + replacementCost - salvage;
      const discountFactor = 1 / Math.pow(1 + d, t);
      const discountedCost = netCashFlow * discountFactor;

      discountedCumulativeCost += discountedCost;
      discountedEnergySum += annualEnergyKWh * discountFactor;

      cashFlows.push({
        year: t,
        capex: 0,
        fuelCost: Math.round(fuelCost),
        omCost: Math.round(omCost),
        replacementCost: Math.round(replacementCost),
        netCashFlow: Math.round(netCashFlow),
        discountedCost: Math.round(discountedCost),
        cumulativeDiscountedLCC: Math.round(discountedCumulativeCost)
      });
    }

    const totalLCC = Math.round(discountedCumulativeCost);
    const lcoe = Number((totalLCC / Math.max(1, discountedEnergySum)).toFixed(1));

    return {
      capex: {
        genCost: Math.round(genCost),
        installCost: Math.round(installCost),
        total: totalCapex
      },
      totalLCC,
      lcoe,
      annualEnergyKWh,
      cashFlows
    };
  }

  /**
   * Calculate Payback Period
   */
  static calculatePayback(solarCapex, dieselCapex, solarFlows, dieselFlows, discountRate) {
    const extraInitialInvestment = Math.max(0, solarCapex - dieselCapex);
    let simpleCumulativeSavings = 0;
    let discountedCumulativeSavings = 0;
    let simplePaybackYear = null;
    let discountedPaybackYear = null;

    for (let t = 1; t < solarFlows.length; t++) {
      const saving = dieselFlows[t].netCashFlow - solarFlows[t].netCashFlow;
      const discountFactor = 1 / Math.pow(1 + discountRate, t);
      const discountedSaving = saving * discountFactor;

      simpleCumulativeSavings += saving;
      discountedCumulativeSavings += discountedSaving;

      if (simplePaybackYear === null && simpleCumulativeSavings >= extraInitialInvestment) {
        const prevSaving = simpleCumulativeSavings - saving;
        const fraction = (extraInitialInvestment - prevSaving) / Math.max(1, saving);
        simplePaybackYear = Number(((t - 1) + fraction).toFixed(1));
      }

      if (discountedPaybackYear === null && discountedCumulativeSavings >= extraInitialInvestment) {
        const prevDiscSaving = discountedCumulativeSavings - discountedSaving;
        const fraction = (extraInitialInvestment - prevDiscSaving) / Math.max(1, discountedSaving);
        discountedPaybackYear = Number(((t - 1) + fraction).toFixed(1));
      }
    }

    const simpleMonths = simplePaybackYear !== null ? Math.round(simplePaybackYear * 12) : null;

    return {
      extraInitialInvestment,
      simplePaybackYears: simplePaybackYear !== null ? simplePaybackYear : '> 25',
      simpleMonths: simpleMonths,
      discountedPaybackYears: discountedPaybackYear !== null ? discountedPaybackYear : '> 25'
    };
  }
}
