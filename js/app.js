import { generateBill } from "./billing.js";
import { processPayment } from "./payments.js";
import { generateReceipt, sendReceiptChannels } from "./receipts.js";
import {
  getCurrentSession,
  getTodayRevenue,
  getUserRole,
  login,
  logout,
  syncTransaction
} from "./supabaseClient.js";

const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const authStatus = document.getElementById("auth-status");
const adminPanel = document.getElementById("admin-panel");
const customerForm = document.getElementById("customer-form");
const billOutput = document.getElementById("bill-output");
const selectedMethodText = document.getElementById("selected-method");
const processBtn = document.getElementById("process-payment");
const receiptOutput = document.getElementById("receipt-output");
const dashboardOutput = document.getElementById("dashboard-output");
const refreshDashboardBtn = document.getElementById("refresh-dashboard");
const paymentButtons = document.querySelectorAll(".payment-btn");

let currentCustomer = null;
let currentBill = null;
let selectedMethod = null;
let currentRole = null;

function setCollectionActionsEnabled(enabled) {
  customerForm.querySelectorAll("input, select, button").forEach((el) => {
    el.disabled = !enabled;
  });
  paymentButtons.forEach((btn) => {
    btn.disabled = !enabled;
  });
  processBtn.disabled = !enabled || !selectedMethod;
}

function applyRoleUi(role, email) {
  currentRole = role;
  authStatus.textContent = `Logged in as ${email} (${role})`;
  logoutBtn.classList.remove("hidden");
  setCollectionActionsEnabled(true);

  if (role === "admin") {
    adminPanel.classList.remove("hidden");
  } else {
    adminPanel.classList.add("hidden");
    dashboardOutput.textContent = "Admin dashboard is only available to admin role.";
  }
}

function setLoggedOutUi() {
  currentRole = null;
  authStatus.textContent = "Not logged in.";
  logoutBtn.classList.add("hidden");
  adminPanel.classList.add("hidden");
  setCollectionActionsEnabled(false);
}

async function loadInitialSession() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      setLoggedOutUi();
      return;
    }
    const role = await getUserRole(session.user.id);
    applyRoleUi(role, session.user.email);
  } catch (error) {
    authStatus.textContent = `Auth error: ${error.message}`;
    setLoggedOutUi();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await login(email, password);
    const session = await getCurrentSession();
    const role = await getUserRole(session.user.id);
    applyRoleUi(role, session.user.email);
    loginForm.reset();
  } catch (error) {
    authStatus.textContent = `Login failed: ${error.message}`;
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await logout();
    setLoggedOutUi();
  } catch (error) {
    authStatus.textContent = `Logout failed: ${error.message}`;
  }
});

customerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  currentCustomer = {
    customer_id: document.getElementById("customer-id").value.trim(),
    name: document.getElementById("customer-name").value.trim(),
    account_number: document.getElementById("account-number").value.trim(),
    service: document.getElementById("service").value,
    amount_due: document.getElementById("amount-due").value
  };

  currentBill = generateBill(currentCustomer);
  billOutput.textContent = JSON.stringify(currentBill, null, 2);
});

paymentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    paymentButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedMethod = button.dataset.method;
    selectedMethodText.textContent = `Selected payment method: ${selectedMethod}`;
    processBtn.disabled = false;
  });
});

processBtn.addEventListener("click", async () => {
  if (!currentRole) {
    alert("Please login first.");
    return;
  }
  if (!currentCustomer || !currentBill || !selectedMethod) {
    alert("Please enter customer details, generate a bill, and choose a payment method.");
    return;
  }

  processBtn.disabled = true;
  processBtn.textContent = "Processing...";

  try {
    const result = await processPayment(selectedMethod, currentBill.bill_amount, currentCustomer.customer_id);
    if (!result.ok) {
      throw new Error("Payment failed.");
    }

    const transaction = {
      transaction_id: `TXN-${Date.now()}`,
      customer_id: currentCustomer.customer_id,
      service: currentCustomer.service,
      amount: currentBill.bill_amount,
      payment_method: selectedMethod,
      provider_reference: result.provider_reference,
      timestamp: new Date().toISOString()
    };

    await syncTransaction(transaction);
    const receipt = generateReceipt(transaction);
    receiptOutput.textContent = receipt;

    // Optional fields for future integration.
    await sendReceiptChannels(currentCustomer.phone || "PASTE_PHONE_HERE", receipt);

    alert("Payment successful and synced to Supabase.");
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    processBtn.disabled = false;
    processBtn.textContent = "Process Payment";
  }
});

refreshDashboardBtn.addEventListener("click", async () => {
  if (currentRole !== "admin") {
    dashboardOutput.textContent = "Only admin can view dashboard revenue.";
    return;
  }
  try {
    const total = await getTodayRevenue();
    dashboardOutput.textContent = `Today's revenue: $${total.toFixed(2)}`;
  } catch (error) {
    dashboardOutput.textContent = `Revenue error: ${error.message}`;
  }
});

setLoggedOutUi();
loadInitialSession();
