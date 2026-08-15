/**
 * Solar PV & Diesel Generator LCCA - Nigerian Meteorological & Engineering Database
 */

const NIGERIAN_SITES = [
  {
    id: 'lagos-industrial',
    name: 'Lagos Industrial Site (Case Study)',
    code: 'NG-001',
    state: 'Lagos',
    zone: 'South-West',
    latitude: 6.5355,
    longitude: 3.3515,
    // Monthly solar insolation values in Wh/m²/day
    monthlyInsolation: [5976, 5380, 5631, 5256, 4740, 3746, 3891, 4329, 4188, 4772, 5048, 5694],
    avgPSH: 4.89, // kWh/m²/day
    avgTemp: 28.5
  },
  {
    id: 'lagos-ikeja',
    name: 'Lagos (Ikeja / Coastal)',
    code: 'LOS-01',
    state: 'Lagos',
    zone: 'South-West',
    latitude: 6.5954,
    longitude: 3.3364,
    monthlyInsolation: [5850, 5420, 5510, 5180, 4690, 3680, 3820, 4210, 4100, 4710, 5100, 5620],
    avgPSH: 4.77,
    avgTemp: 27.8
  },
  {
    id: 'abuja-fct',
    name: 'Abuja (Federal Capital Territory)',
    code: 'ABJ-01',
    state: 'FCT',
    zone: 'North-Central',
    latitude: 9.0765,
    longitude: 7.3986,
    monthlyInsolation: [6120, 6240, 6080, 5750, 5320, 4850, 4350, 4200, 4680, 5350, 6010, 6150],
    avgPSH: 5.42,
    avgTemp: 29.2
  },
  {
    id: 'kano-city',
    name: 'Kano (Metropolis)',
    code: 'KAN-01',
    state: 'Kano',
    zone: 'North-West',
    latitude: 12.0022,
    longitude: 8.5920,
    monthlyInsolation: [6350, 6650, 6720, 6480, 6150, 5820, 5210, 4980, 5450, 6120, 6420, 6280],
    avgPSH: 6.05,
    avgTemp: 31.0
  },
  {
    id: 'port-harcourt',
    name: 'Port Harcourt (Rivers)',
    code: 'PHC-01',
    state: 'Rivers',
    zone: 'South-South',
    latitude: 4.8156,
    longitude: 7.0498,
    monthlyInsolation: [5120, 5210, 4980, 4750, 4320, 3510, 3210, 3350, 3620, 4150, 4650, 5080],
    avgPSH: 4.33,
    avgTemp: 26.9
  },
  {
    id: 'enugu-capital',
    name: 'Enugu (Coal City)',
    code: 'ENG-01',
    state: 'Enugu',
    zone: 'South-East',
    latitude: 6.4584,
    longitude: 7.5464,
    monthlyInsolation: [5620, 5740, 5450, 5120, 4780, 4120, 3750, 3810, 4050, 4620, 5180, 5540],
    avgPSH: 4.81,
    avgTemp: 28.0
  },
  {
    id: 'ibadan-city',
    name: 'Ibadan (Oyo)',
    code: 'IBD-01',
    state: 'Oyo',
    zone: 'South-West',
    latitude: 7.3775,
    longitude: 3.9470,
    monthlyInsolation: [5890, 5620, 5580, 5210, 4820, 4050, 3680, 3850, 4180, 4820, 5320, 5780],
    avgPSH: 4.90,
    avgTemp: 28.1
  },
  {
    id: 'sokoto-north',
    name: 'Sokoto (North-West)',
    code: 'SKT-01',
    state: 'Sokoto',
    zone: 'North-West',
    latitude: 13.0059,
    longitude: 5.2476,
    monthlyInsolation: [6420, 6780, 6890, 6650, 6310, 5980, 5320, 5050, 5620, 6280, 6540, 6350],
    avgPSH: 6.18,
    avgTemp: 32.5
  },
  {
    id: 'jos-plateau',
    name: 'Jos (Plateau Highlands)',
    code: 'JOS-01',
    state: 'Plateau',
    zone: 'North-Central',
    latitude: 9.8965,
    longitude: 8.8583,
    monthlyInsolation: [6480, 6620, 6450, 6120, 5650, 5080, 4420, 4280, 4820, 5680, 6380, 6510],
    avgPSH: 5.71,
    avgTemp: 23.5
  }
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const APPLIANCE_PRESETS = [
  { name: 'LED Bulbs (Indoor/Outdoor)', power: 15, qty: 10, hours: 8, surge: 1.0, icon: 'lightbulb' },
  { name: 'Ceiling / Standing Fans', power: 65, qty: 4, hours: 12, surge: 1.5, icon: 'fan' },
  { name: 'Inverter Air Conditioner (1.5 HP)', power: 1100, qty: 1, hours: 6, surge: 1.8, icon: 'air-vent' },
  { name: 'Double Door Inverter Refrigerator', power: 160, qty: 1, hours: 24, surge: 2.0, icon: 'refrigerator' },
  { name: 'Deep Freezer (Chest)', power: 220, qty: 1, hours: 14, surge: 2.5, icon: 'snowflake' },
  { name: 'Smart LED TV 55" + Soundbar', power: 140, qty: 1, hours: 7, surge: 1.1, icon: 'tv' },
  { name: 'Water Pumping Machine (1 HP)', power: 750, qty: 1, hours: 1.5, surge: 3.0, icon: 'droplet' },
  { name: 'Laptops & Workstations', power: 75, qty: 2, hours: 8, surge: 1.1, icon: 'laptop' },
  { name: 'Wi-Fi Router & Security System', power: 45, qty: 1, hours: 24, surge: 1.0, icon: 'wifi' },
  { name: 'Microwave Oven', power: 1200, qty: 1, hours: 0.5, surge: 1.5, icon: 'microwave' }
];

const CASE_STUDIES = [
  {
    id: 'industrial-facility',
    title: 'Industrial Processing Facility (NG-001)',
    category: 'Commercial / Industrial',
    siteId: 'lagos-industrial',
    dailyKWh: 48.5,
    peakKW: 7.2,
    autonomyDays: 1.5,
    generatorSizeKVA: 15,
    generatorRunHoursPerDay: 16,
    description: 'Medium industrial processing facility requiring 24/7 continuous reliable power.'
  },
  {
    id: 'nigerian-residential',
    title: 'Standard 3-Bedroom Residential Flat',
    category: 'Residential',
    siteId: 'lagos-ikeja',
    dailyKWh: 16.5,
    peakKW: 3.5,
    autonomyDays: 1.0,
    generatorSizeKVA: 6.5,
    generatorRunHoursPerDay: 10,
    description: 'Typical urban home with inverter AC, freezer, lighting, entertainment, and pumping machine.'
  },
  {
    id: 'telecom-bts',
    title: 'Telecom BTS Tower (5kW Continuous Load)',
    category: 'Telecommunications',
    siteId: 'abuja-fct',
    dailyKWh: 72.0,
    peakKW: 5.5,
    autonomyDays: 2.0,
    generatorSizeKVA: 20,
    generatorRunHoursPerDay: 24,
    description: 'Off-grid cellular base station requiring uninterrupted power with dual generator backup.'
  },
  {
    id: 'commercial-office',
    title: 'Commercial Office Building / Branch',
    category: 'Commercial Office',
    siteId: 'kano-city',
    dailyKWh: 110.0,
    peakKW: 18.0,
    autonomyDays: 1.0,
    generatorSizeKVA: 40,
    generatorRunHoursPerDay: 12,
    description: 'Office building with HVAC, IT servers, computers, lighting, and general utilities.'
  },
  {
    id: 'rural-health-clinic',
    title: 'Primary Healthcare Clinic & Maternity',
    category: 'Healthcare Facility',
    siteId: 'enugu-capital',
    dailyKWh: 24.0,
    peakKW: 4.2,
    autonomyDays: 2.0,
    generatorSizeKVA: 10,
    generatorRunHoursPerDay: 14,
    description: 'Primary healthcare center with vaccine refrigeration, emergency lighting, and laboratory equipment.'
  }
];

// Default Nigerian Economic & Technical Parameters (2025/2026 Nigerian Benchmark)
const DEFAULT_PARAMETERS = {
  // Academic & Student Meta
  projectTitle: 'Development of Software for Life Cycle Cost Analysis of Solar Photovoltaic and Diesel Generator System in Nigeria',
  studentName: 'Ayomide',
  matricNo: 'FTP/EEE/24/0089285',
  supervisor: 'Engr. Osokoya, S.O.',
  department: 'Department of Electrical & Electronics Engineering',
  institution: 'Faculty of Engineering, Nigeria',

  // Site selection
  selectedSiteId: 'lagos-industrial',

  // Technical defaults
  pvModuleWattage: 550, // 550W Mono-PERC
  pvDeratingFactor: 0.80, // Temperature, dirt, cable losses (80% efficiency)
  inverterEfficiency: 0.92, // 92%
  batteryType: 'lifepo4', // 'lifepo4' (Lithium) or 'lead_acid' (Tubular Gel)
  batteryDoD: 0.85, // 85% for Lithium, 50% for Lead-Acid
  batteryRoundTripEff: 0.90, // 90%
  batteryVoltage: 48, // 48V DC Bus
  autonomyDays: 1.5, // Days of backup autonomy
  inverterSafetyFactor: 1.25, // 25% surge safety headroom

  // Generator parameters
  generatorLoadingFactor: 0.75, // Operating at 75% load
  genSpecificFuelSlope: 0.24, // Liters per kWh generated
  genNoLoadFuelSlope: 0.08, // Liters per rated kVA per hour at idle
  genMaintenanceCostPerHour: 150, // ₦150 per running hour (oil, filter, servicing)
  genOverhaulIntervalHours: 8000, // Hours before major engine overhaul
  genLifetimeHours: 20000, // Generator total operational lifespan

  // Financial & Economic Parameters
  currency: 'NGN',
  exchangeRateUSD: 1500, // ₦1500 = $1 USD
  projectLifetimeYears: 25, // 25-year standard LCCA timeframe
  discountRate: 0.12, // 12% annual discount rate (Central Bank of Nigeria / Commercial rate)
  inflationRate: 0.10, // 10% annual general inflation
  fuelEscalationRate: 0.08, // 8% annual diesel price escalation

  // Unit Capital Costs (Nigerian Market Benchmark in Naira ₦)
  dieselFuelPricePerLiter: 1200, // ₦1,200 / Liter
  pvCostPerKWp: 350000, // ₦350,000 per kWp installed
  lithiumBatteryCostPerKWh: 380000, // ₦380,000 per kWh
  leadAcidBatteryCostPerKWh: 190000, // ₦190,000 per kWh
  inverterCostPerKVA: 165000, // ₦165,000 per kVA
  generatorCostPerKVA: 145000, // ₦145,000 per kVA
  installationAndBosPercent: 0.15, // 15% of equipment cost for Balance of System & Installation

  // Component Lifespans
  lithiumBatteryLifespanYears: 10,
  leadAcidBatteryLifespanYears: 4,
  inverterLifespanYears: 10,
  pvPanelLifespanYears: 25,

  // Environmental Constants
  co2PerLiterDieselKg: 2.68, // 2.68 kg CO2 per liter of diesel combusted
  treesPerTonCO2: 45 // 45 tree seedlings planted per metric ton of CO2
};
