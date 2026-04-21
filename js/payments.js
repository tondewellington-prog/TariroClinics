import { API_PLACEHOLDERS } from "./config.js";

async function callExternalApi(url, payload) {
  // Replace this with secured backend proxy call in production.
  console.log("API Placeholder:", url, payload);
  return { ok: true, provider_reference: "PLACEHOLDER_REF_001" };
}

export async function processPayment(method, amount, customerId) {
  const payload = { method, amount, customer_id: customerId };

  if (method === "EcoCash") {
    return callExternalApi(API_PLACEHOLDERS.ecocashEndpoint, payload);
  }
  if (method === "Card") {
    return callExternalApi(API_PLACEHOLDERS.cardGatewayEndpoint, payload);
  }
  if (method === "Cash") {
    return { ok: true, provider_reference: "CASH_ENTRY" };
  }

  throw new Error("Unsupported payment method.");
}
