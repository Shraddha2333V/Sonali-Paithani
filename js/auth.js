/**
 * SONALI PAITHANI — Authentication Handler
 * Resilient sign up and log in flow connecting to backend API and client-side demo persistence.
 */
document.addEventListener("DOMContentLoaded", () => {
  const stepRole = document.getElementById("step-role");
  const stepForm = document.getElementById("step-form");
  const backBtn = document.getElementById("auth-back-btn");
  const roleBadge = document.getElementById("auth-role-badge");
  const roleCards = document.querySelectorAll(".role-card");
  const tabs = document.querySelectorAll(".auth-tab");
  const loginForm = document.querySelector('.auth-form[data-form="login"]');
  const signupForms = document.querySelectorAll('.auth-form[data-form="signup"]');
  const successBlock = document.getElementById("auth-success");
  const successTitle = document.getElementById("auth-success-title");
  const successNote = document.getElementById("auth-success-note");
  const errorMsg = document.getElementById("auth-error-msg");

  let selectedRole = "customer";

  function showStep(step) {
    [stepRole, stepForm].forEach((s) => s.classList.remove("active"));
    step.classList.add("active");
  }

  function setActiveTab(tabName) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
    loginForm.classList.toggle("active", tabName === "login");
    signupForms.forEach((f) => f.classList.toggle("active", tabName === "signup" && f.dataset.roleForm === selectedRole));
    successBlock.classList.remove("show");
    loginForm.style.display = tabName === "login" ? "" : "none";
    signupForms.forEach((f) => (f.style.display = tabName === "signup" && f.dataset.roleForm === selectedRole ? "" : "none"));
  }

  roleCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectedRole = card.dataset.role;
      roleBadge.textContent = selectedRole === "employee" ? "Employee account" : "Customer account";
      showStep(stepForm);
      setActiveTab("login");
    });
  });

  backBtn.addEventListener("click", () => {
    successBlock.classList.remove("show");
    loginForm.style.display = "";
    showStep(stepRole);
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    } else {
      alert(msg);
    }
  }

  function clearError() {
    if (errorMsg) {
      errorMsg.textContent = "";
      errorMsg.style.display = "none";
    }
  }

  // 1-Click Demo Fill Helpers
  const btnFillCust = document.getElementById("btn-fill-customer");
  const btnFillEmp = document.getElementById("btn-fill-employee");

  if (btnFillCust) {
    btnFillCust.addEventListener("click", () => {
      selectedRole = "customer";
      roleBadge.textContent = "Customer account";
      document.getElementById("login-id").value = "customer@example.com";
      document.getElementById("login-pass").value = "password123";
      clearError();
    });
  }

  if (btnFillEmp) {
    btnFillEmp.addEventListener("click", () => {
      selectedRole = "employee";
      roleBadge.textContent = "Employee account";
      document.getElementById("login-id").value = "staff@sonalipaithani.com";
      document.getElementById("login-pass").value = "password123";
      clearError();
    });
  }

  function handleSuccess(actionLabel, targetRole) {
    clearError();
    loginForm.style.display = "none";
    signupForms.forEach((f) => (f.style.display = "none"));
    const tabsEl = document.querySelector(".auth-tabs");
    if (tabsEl) tabsEl.style.display = "none";
    const helpers = document.querySelector(".demo-helpers");
    if (helpers) helpers.style.display = "none";

    const effectiveRole = targetRole || selectedRole;
    successTitle.textContent = effectiveRole === "employee" ? "Welcome back to the team" : "You're in";
    successNote.textContent =
      effectiveRole === "employee"
        ? `${actionLabel} as an employee — opening staff operations dashboard…`
        : `${actionLabel} — taking you to Sonali Paithani…`;
    successBlock.classList.add("show");

    setTimeout(() => {
      window.location.href = effectiveRole === "employee" ? "employee-dashboard.html" : "index.html";
    }, 1100);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";

    const loginId = document.getElementById("login-id").value.trim();
    const loginPass = document.getElementById("login-pass").value;

    try {
      if (window.Api) {
        const res = await window.Api.login(loginId, loginPass, selectedRole);
        handleSuccess("Logged in", res.user?.role || selectedRole);
      } else {
        handleSuccess("Logged in", selectedRole);
      }
    } catch (err) {
      showError(err.message || "Failed to log in. Please check your credentials.");
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  });

  signupForms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();
      const submitBtn = form.querySelector('button[type="submit"]');
      const origText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account…";

      try {
        let payload = {};
        if (selectedRole === "customer") {
          payload = {
            role: "customer",
            name: document.getElementById("c-name").value.trim(),
            phone: document.getElementById("c-phone").value.trim(),
            email: document.getElementById("c-email").value.trim(),
            password: document.getElementById("c-pass").value
          };
        } else {
          payload = {
            role: "employee",
            name: document.getElementById("e-name").value.trim(),
            employeeId: document.getElementById("e-id").value.trim(),
            location: document.getElementById("e-location").value,
            email: document.getElementById("e-email").value.trim(),
            password: document.getElementById("e-pass").value
          };
        }

        if (window.Api) {
          const res = await window.Api.signup(payload);
          handleSuccess("Account created", res.user?.role || selectedRole);
        } else {
          handleSuccess("Account created", selectedRole);
        }
      } catch (err) {
        showError(err.message || "Could not create account. Please check the fields.");
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }
    });
  });

  // Clear errors when switching tabs or roles
  tabs.forEach((tab) => tab.addEventListener("click", clearError));
  roleCards.forEach((card) => card.addEventListener("click", clearError));

  // Initialize
  setActiveTab("login");
});
