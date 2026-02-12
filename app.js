const RATES = {
  nationalPension: 0.0475,
  healthInsurance: 0.03595,
  longTermCareOnHealth: 0.1314,
  employmentInsurance: 0.009,
};

const TAX_BRACKETS = [
  { upTo: 14_000_000, rate: 0.06, deduction: 0 },
  { upTo: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { upTo: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { upTo: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { upTo: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { upTo: 500_000_000, rate: 0.4, deduction: 25_940_000 },
  { upTo: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { upTo: Infinity, rate: 0.45, deduction: 65_940_000 },
];

const DEFAULTS = {
  salaryBasis: "annual",
  severanceMode: "separate",
  salaryAmount: 50_000_000,
  dependents: 1,
  children: 0,
  nontaxMonthly: 200_000,
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

const dom = {
  salaryInput: document.getElementById("salaryInput"),
  nontaxInput: document.getElementById("nontaxInput"),
  dependentsInput: document.getElementById("dependentsInput"),
  childrenInput: document.getElementById("childrenInput"),
  netMonthly: document.getElementById("netMonthly"),
  nationalPension: document.getElementById("nationalPension"),
  healthInsurance: document.getElementById("healthInsurance"),
  longTermCare: document.getElementById("longTermCare"),
  employmentInsurance: document.getElementById("employmentInsurance"),
  incomeTax: document.getElementById("incomeTax"),
  localIncomeTax: document.getElementById("localIncomeTax"),
  totalDeduction: document.getElementById("totalDeduction"),
  copyBtn: document.getElementById("copyBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

const state = {
  salaryBasis: DEFAULTS.salaryBasis,
  severanceMode: DEFAULTS.severanceMode,
  salaryAmount: DEFAULTS.salaryAmount,
  dependents: DEFAULTS.dependents,
  children: DEFAULTS.children,
  nontaxMonthly: DEFAULTS.nontaxMonthly,
  animationValues: {
    netMonthly: 0,
    nationalPension: 0,
    healthInsurance: 0,
    longTermCare: 0,
    employmentInsurance: 0,
    incomeTax: 0,
    localIncomeTax: 0,
    totalDeduction: 0,
  },
};

let recalcTimer = null;

function parseNumber(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function clampInt(value, min, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function formatWon(value) {
  return `${numberFormatter.format(Math.round(value))}원`;
}

function formatInputValue(element, value) {
  element.value = value > 0 ? numberFormatter.format(value) : "0";
}

function getAnnualTaxEstimate(annualTaxableBase, dependents, children) {
  const dependentDeduction = dependents * 1_500_000;
  const childDeduction = children * 1_000_000;
  const adjustedBase = Math.max(0, annualTaxableBase - dependentDeduction - childDeduction);

  const bracket = TAX_BRACKETS.find((item) => adjustedBase <= item.upTo) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const estimated = adjustedBase * bracket.rate - bracket.deduction;
  return Math.max(0, estimated);
}

function calculateFromState() {
  const monthlyBasePay = state.salaryBasis === "annual"
    ? state.salaryAmount / 12
    : state.salaryAmount;

  const severanceMonthlyAddon = state.salaryBasis === "annual" && state.severanceMode === "included"
    ? monthlyBasePay / 12
    : 0;

  const monthlyGross = monthlyBasePay + severanceMonthlyAddon;
  const monthlyTaxable = Math.max(0, monthlyGross - state.nontaxMonthly);

  const nationalPension = monthlyTaxable * RATES.nationalPension;
  const healthInsurance = monthlyTaxable * RATES.healthInsurance;
  const longTermCare = healthInsurance * RATES.longTermCareOnHealth;
  const employmentInsurance = monthlyTaxable * RATES.employmentInsurance;

  const annualTaxableBase = monthlyTaxable * 12;
  const annualIncomeTax = getAnnualTaxEstimate(annualTaxableBase, state.dependents, state.children);
  const incomeTax = annualIncomeTax / 12;
  const localIncomeTax = incomeTax * 0.1;

  const totalDeduction = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;
  const netMonthly = Math.max(0, monthlyGross - totalDeduction);

  return {
    monthlyGross,
    monthlyTaxable,
    netMonthly,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeduction,
  };
}

function animateNumber(key, nextValue, element, duration = 360) {
  const startValue = state.animationValues[key] || 0;
  const diff = nextValue - startValue;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startValue + diff * eased;
    element.textContent = formatWon(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    state.animationValues[key] = nextValue;
    element.textContent = formatWon(nextValue);
  }

  requestAnimationFrame(tick);
}

function render(result) {
  animateNumber("netMonthly", result.netMonthly, dom.netMonthly);
  animateNumber("nationalPension", result.nationalPension, dom.nationalPension, 280);
  animateNumber("healthInsurance", result.healthInsurance, dom.healthInsurance, 280);
  animateNumber("longTermCare", result.longTermCare, dom.longTermCare, 280);
  animateNumber("employmentInsurance", result.employmentInsurance, dom.employmentInsurance, 280);
  animateNumber("incomeTax", result.incomeTax, dom.incomeTax, 280);
  animateNumber("localIncomeTax", result.localIncomeTax, dom.localIncomeTax, 280);
  animateNumber("totalDeduction", result.totalDeduction, dom.totalDeduction, 280);
}

function recalculate() {
  const result = calculateFromState();
  render(result);
}

function scheduleRecalculate() {
  window.clearTimeout(recalcTimer);
  recalcTimer = window.setTimeout(recalculate, 220);
}

function updateToggle(group, value) {
  document.querySelectorAll(`.toggle-btn[data-group="${group}"]`).forEach((button) => {
    const selected = button.dataset.value === value;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function sanitizeInputs() {
  state.salaryAmount = Math.max(0, parseNumber(dom.salaryInput.value));
  state.nontaxMonthly = Math.max(0, parseNumber(dom.nontaxInput.value));
  state.dependents = clampInt(Number(dom.dependentsInput.value), 1, 20);
  state.children = clampInt(Number(dom.childrenInput.value), 0, 20);

  formatInputValue(dom.salaryInput, state.salaryAmount);
  formatInputValue(dom.nontaxInput, state.nontaxMonthly);
  dom.dependentsInput.value = String(state.dependents);
  dom.childrenInput.value = String(state.children);
}

function attachTooltips() {
  const tips = {
    nationalPension: "비과세 제외 과세금액 x 4.75%",
    healthInsurance: "비과세 제외 과세금액 x 3.595%",
    longTermCare: "건강보험료 x 13.14%",
    employmentInsurance: "비과세 제외 과세금액 x 0.9%",
    incomeTax: "연 과세표준 추정값에 누진세율을 적용한 월 환산액",
    localIncomeTax: "소득세의 10%",
    totalDeduction: "국민연금+건강보험+장기요양+고용보험+소득세+지방소득세",
  };

  const template = document.getElementById("tooltipTemplate");
  Object.entries(tips).forEach(([id, text]) => {
    const amountNode = document.getElementById(id);
    const labelNode = amountNode?.closest("li")?.querySelector("span");
    if (!labelNode || !template) return;

    const tip = template.content.firstElementChild.cloneNode(true);
    tip.dataset.tip = text;
    tip.setAttribute("aria-label", `${labelNode.textContent} 계산 기준`);

    const wrap = document.createElement("span");
    wrap.className = "label-wrap";
    wrap.textContent = labelNode.textContent;
    wrap.appendChild(tip);

    labelNode.replaceWith(wrap);
  });
}

function copyResult() {
  const result = calculateFromState();
  const basisText = state.salaryBasis === "annual" ? "연봉" : "월급";
  const severanceText = state.severanceMode === "included" ? "퇴직금 포함" : "퇴직금 별도";

  const lines = [
    `[페이체크 계산 결과]`,
    `급여 기준: ${basisText}, ${severanceText}`,
    `입력 금액: ${formatWon(state.salaryAmount)}`,
    `월 실수령액: ${formatWon(result.netMonthly)}`,
    `공제합계: ${formatWon(result.totalDeduction)}`,
    `국민연금 ${formatWon(result.nationalPension)} | 건강보험 ${formatWon(result.healthInsurance)} | 장기요양 ${formatWon(result.longTermCare)}`,
    `고용보험 ${formatWon(result.employmentInsurance)} | 소득세 ${formatWon(result.incomeTax)} | 지방소득세 ${formatWon(result.localIncomeTax)}`,
  ];

  navigator.clipboard.writeText(lines.join("\n"))
    .then(() => {
      dom.copyBtn.textContent = "복사 완료";
      window.setTimeout(() => {
        dom.copyBtn.textContent = "결과 복사";
      }, 1200);
    })
    .catch(() => {
      dom.copyBtn.textContent = "복사 실패";
      window.setTimeout(() => {
        dom.copyBtn.textContent = "결과 복사";
      }, 1200);
    });
}

function resetAll() {
  state.salaryBasis = DEFAULTS.salaryBasis;
  state.severanceMode = DEFAULTS.severanceMode;
  state.salaryAmount = DEFAULTS.salaryAmount;
  state.dependents = DEFAULTS.dependents;
  state.children = DEFAULTS.children;
  state.nontaxMonthly = DEFAULTS.nontaxMonthly;

  updateToggle("salaryBasis", state.salaryBasis);
  updateToggle("severanceMode", state.severanceMode);

  formatInputValue(dom.salaryInput, state.salaryAmount);
  formatInputValue(dom.nontaxInput, state.nontaxMonthly);
  dom.dependentsInput.value = String(state.dependents);
  dom.childrenInput.value = String(state.children);

  recalculate();
}

function bindEvents() {
  document.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const { group, value } = button.dataset;
      state[group] = value;
      updateToggle(group, value);
      scheduleRecalculate();
    });
  });

  document.querySelectorAll(".quick-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const addValue = Number(button.dataset.add);
      state.salaryAmount = Math.max(0, state.salaryAmount + addValue);
      formatInputValue(dom.salaryInput, state.salaryAmount);
      scheduleRecalculate();
    });
  });

  dom.salaryInput.addEventListener("input", () => {
    state.salaryAmount = Math.max(0, parseNumber(dom.salaryInput.value));
    dom.salaryInput.value = state.salaryAmount > 0 ? numberFormatter.format(state.salaryAmount) : "";
    scheduleRecalculate();
  });

  dom.nontaxInput.addEventListener("input", () => {
    state.nontaxMonthly = Math.max(0, parseNumber(dom.nontaxInput.value));
    dom.nontaxInput.value = state.nontaxMonthly > 0 ? numberFormatter.format(state.nontaxMonthly) : "";
    scheduleRecalculate();
  });

  dom.dependentsInput.addEventListener("input", () => {
    sanitizeInputs();
    scheduleRecalculate();
  });

  dom.childrenInput.addEventListener("input", () => {
    sanitizeInputs();
    scheduleRecalculate();
  });

  document.querySelectorAll(".stepper").forEach((stepper) => {
    stepper.addEventListener("click", (event) => {
      const target = event.target.closest(".step-btn");
      if (!target) return;

      const type = stepper.dataset.stepper;
      const action = target.dataset.action;

      if (type === "dependents") {
        state.dependents = action === "increase" ? state.dependents + 1 : state.dependents - 1;
        state.dependents = clampInt(state.dependents, 1, 20);
        dom.dependentsInput.value = String(state.dependents);
      }

      if (type === "children") {
        state.children = action === "increase" ? state.children + 1 : state.children - 1;
        state.children = clampInt(state.children, 0, 20);
        dom.childrenInput.value = String(state.children);
      }

      scheduleRecalculate();
    });
  });

  dom.copyBtn.addEventListener("click", copyResult);
  dom.resetBtn.addEventListener("click", resetAll);
}

function init() {
  attachTooltips();
  updateToggle("salaryBasis", state.salaryBasis);
  updateToggle("severanceMode", state.severanceMode);
  sanitizeInputs();
  bindEvents();
  recalculate();
}

init();
