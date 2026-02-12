const INSURANCE_RATES_2026 = {
  nationalPension: 0.045,
  healthInsurance: 0.03545,
  longTermCareOnHealth: 0.1295,
  employmentInsurance: 0.009,
};

const TAX_BRACKETS = [
  { max: 14_000_000, rate: 0.06, quickDeduction: 0 },
  { max: 50_000_000, rate: 0.15, quickDeduction: 1_260_000 },
  { max: 88_000_000, rate: 0.24, quickDeduction: 5_760_000 },
  { max: 150_000_000, rate: 0.35, quickDeduction: 15_440_000 },
  { max: 300_000_000, rate: 0.38, quickDeduction: 19_940_000 },
  { max: 500_000_000, rate: 0.4, quickDeduction: 25_940_000 },
  { max: 1_000_000_000, rate: 0.42, quickDeduction: 35_940_000 },
  { max: Infinity, rate: 0.45, quickDeduction: 65_940_000 },
];

const KRW = new Intl.NumberFormat("ko-KR");

const state = {
  payMode: "monthly",
};

function getEl(id) {
  return document.getElementById(id);
}

function onlyDigits(value) {
  return (value || "").replace(/[^\d]/g, "");
}

function toNumber(value) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : 0;
}

function formatKRW(value) {
  return `${KRW.format(Math.round(value))}원`;
}

function formatInputOnType(e) {
  const raw = onlyDigits(e.target.value);
  e.target.value = raw ? KRW.format(Number(raw)) : "";
}

function earnedIncomeDeduction(totalSalaryAnnual) {
  if (totalSalaryAnnual <= 0) return 0;
  if (totalSalaryAnnual <= 5_000_000) return totalSalaryAnnual * 0.7;
  if (totalSalaryAnnual <= 15_000_000) {
    return 3_500_000 + (totalSalaryAnnual - 5_000_000) * 0.4;
  }
  if (totalSalaryAnnual <= 45_000_000) {
    return 7_500_000 + (totalSalaryAnnual - 15_000_000) * 0.15;
  }
  if (totalSalaryAnnual <= 100_000_000) {
    return 12_000_000 + (totalSalaryAnnual - 45_000_000) * 0.05;
  }
  return 14_750_000 + (totalSalaryAnnual - 100_000_000) * 0.02;
}

function progressiveIncomeTax(taxBase) {
  if (taxBase <= 0) return 0;
  const bracket = TAX_BRACKETS.find((b) => taxBase <= b.max) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
  return Math.max(0, taxBase * bracket.rate - bracket.quickDeduction);
}

function toMonthlyFromMode(pay, mode) {
  return mode === "annual" ? pay / 12 : pay;
}

function readInputState() {
  return {
    payMode: state.payMode,
    pay: toNumber(getEl("pay").value),
    nontaxAnnual: toNumber(getEl("nontaxAnnual").value),
    deps: Math.max(0, Number(getEl("deps").value || 0)),
    taxMode: getEl("taxMode").value,
    manualIncomeTax: toNumber(getEl("manualIncomeTax").value),
  };
}

function updateManualTaxVisibility() {
  const isManual = getEl("taxMode").value === "manual";
  getEl("manualTaxWrap").style.display = isManual ? "" : "none";
}

function setMode(mode) {
  state.payMode = mode;
  const isAnnual = mode === "annual";
  getEl("payLabel").textContent = isAnnual ? "연봉(세전)" : "월급(세전)";
  document.querySelectorAll(".segbtn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

function renderResult(result) {
  getEl("netMonthly").textContent = formatKRW(result.netMonthly);
  getEl("netAnnual").textContent = formatKRW(result.netAnnual);
  getEl("deductMonthly").textContent = formatKRW(result.totalDeductMonthly);

  getEl("netMonthlyDesc").textContent = `세전 ${formatKRW(result.grossMonthly)} - 공제 ${formatKRW(result.totalDeductMonthly)}`;
  getEl("netAnnualDesc").textContent = `세전 ${formatKRW(result.grossAnnual)} - 공제 ${formatKRW(result.totalDeductAnnual)}`;
  getEl("deductMonthlyDesc").textContent = `연 ${formatKRW(result.totalDeductAnnual)} 기준`;

  const breakdown = [
    ["국민연금", result.nationalPensionMonthly],
    ["건강보험", result.healthInsuranceMonthly],
    ["장기요양보험", result.longTermCareMonthly],
    ["고용보험", result.employmentInsuranceMonthly],
    ["소득세", result.incomeTaxMonthly],
    ["지방소득세", result.localIncomeTaxMonthly],
  ];

  const breakdownHtml = breakdown
    .map(
      ([name, value]) =>
        `<li class="item"><span class="l">${name}</span><span class="r">${formatKRW(value)}</span></li>`,
    )
    .join("");
  getEl("breakdown").innerHTML = breakdownHtml;

  const assumptions = [
    `국민연금 근로자 부담 ${Math.round(INSURANCE_RATES_2026.nationalPension * 10000) / 100}%`,
    `건강보험 근로자 부담 ${Math.round(INSURANCE_RATES_2026.healthInsurance * 10000) / 100}%`,
    `장기요양보험 건강보험료의 ${Math.round(INSURANCE_RATES_2026.longTermCareOnHealth * 10000) / 100}%`,
    `고용보험 근로자 부담 ${Math.round(INSURANCE_RATES_2026.employmentInsurance * 10000) / 100}%`,
    "기본공제: 본인 + 부양가족 1인당 연 1,500,000원",
    "소득세: 종합소득세 과세표준 구간(누진공제) 기반 추정",
  ];
  getEl("assumptions").innerHTML = assumptions
    .map((text) => `<li class="item"><span class="l">${text}</span></li>`)
    .join("");
}

function calculate() {
  const input = readInputState();
  if (!input.pay || input.pay <= 0) {
    alert("급여를 입력해주세요.");
    return;
  }

  const grossMonthly = toMonthlyFromMode(input.pay, input.payMode);
  const grossAnnual = grossMonthly * 12;
  const nontaxAnnual = Math.min(input.nontaxAnnual, grossAnnual);

  const nationalPensionMonthly = grossMonthly * INSURANCE_RATES_2026.nationalPension;
  const healthInsuranceMonthly = grossMonthly * INSURANCE_RATES_2026.healthInsurance;
  const longTermCareMonthly = healthInsuranceMonthly * INSURANCE_RATES_2026.longTermCareOnHealth;
  const employmentInsuranceMonthly = grossMonthly * INSURANCE_RATES_2026.employmentInsurance;
  const socialInsuranceMonthly =
    nationalPensionMonthly + healthInsuranceMonthly + longTermCareMonthly + employmentInsuranceMonthly;
  const socialInsuranceAnnual = socialInsuranceMonthly * 12;

  let incomeTaxMonthly = 0;
  let localIncomeTaxMonthly = 0;
  if (input.taxMode === "manual") {
    incomeTaxMonthly = input.manualIncomeTax;
    localIncomeTaxMonthly = incomeTaxMonthly * 0.1;
  } else {
    const salaryIncomeAnnual = Math.max(0, grossAnnual - nontaxAnnual);
    const earnedDeduction = earnedIncomeDeduction(salaryIncomeAnnual);
    const personalDeduction = (1 + input.deps) * 1_500_000;
    const taxBase = Math.max(0, salaryIncomeAnnual - earnedDeduction - personalDeduction - socialInsuranceAnnual);
    const incomeTaxAnnual = progressiveIncomeTax(taxBase);
    const localIncomeTaxAnnual = incomeTaxAnnual * 0.1;
    incomeTaxMonthly = incomeTaxAnnual / 12;
    localIncomeTaxMonthly = localIncomeTaxAnnual / 12;
  }

  const totalDeductMonthly =
    socialInsuranceMonthly + incomeTaxMonthly + localIncomeTaxMonthly;
  const totalDeductAnnual = totalDeductMonthly * 12;
  const netMonthly = Math.max(0, grossMonthly - totalDeductMonthly);
  const netAnnual = Math.max(0, grossAnnual - totalDeductAnnual);

  renderResult({
    grossMonthly,
    grossAnnual,
    nontaxAnnual,
    nationalPensionMonthly,
    healthInsuranceMonthly,
    longTermCareMonthly,
    employmentInsuranceMonthly,
    incomeTaxMonthly,
    localIncomeTaxMonthly,
    totalDeductMonthly,
    totalDeductAnnual,
    netMonthly,
    netAnnual,
  });
}

function copyLink() {
  const input = readInputState();
  const params = new URLSearchParams({
    mode: input.payMode,
    pay: String(input.pay),
    nontaxAnnual: String(input.nontaxAnnual),
    deps: String(input.deps),
    taxMode: input.taxMode,
    manualIncomeTax: String(input.manualIncomeTax),
  });
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  navigator.clipboard
    .writeText(url)
    .then(() => alert("입력값 링크를 복사했습니다."))
    .catch(() => alert("클립보드 복사에 실패했습니다."));
}

function restoreFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  if (mode === "monthly" || mode === "annual") setMode(mode);

  const pay = Number(params.get("pay") || 0);
  const nontaxAnnual = Number(params.get("nontaxAnnual") || 0);
  const deps = Number(params.get("deps") || 0);
  const taxMode = params.get("taxMode");
  const manualIncomeTax = Number(params.get("manualIncomeTax") || 0);

  if (pay > 0) getEl("pay").value = KRW.format(pay);
  if (nontaxAnnual > 0) getEl("nontaxAnnual").value = KRW.format(nontaxAnnual);
  if (deps >= 0) getEl("deps").value = String(deps);
  if (taxMode === "estimate" || taxMode === "manual") getEl("taxMode").value = taxMode;
  if (manualIncomeTax > 0) getEl("manualIncomeTax").value = KRW.format(manualIncomeTax);
  updateManualTaxVisibility();
}

function init() {
  setMode("monthly");
  restoreFromQuery();
  updateManualTaxVisibility();

  getEl("pay").addEventListener("input", formatInputOnType);
  getEl("nontaxAnnual").addEventListener("input", formatInputOnType);
  getEl("manualIncomeTax").addEventListener("input", formatInputOnType);
  getEl("taxMode").addEventListener("change", updateManualTaxVisibility);
  getEl("calc").addEventListener("click", calculate);
  getEl("copyLink").addEventListener("click", copyLink);

  document.querySelectorAll(".segbtn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
}

init();
