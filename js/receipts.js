import { API_PLACEHOLDERS } from "./config.js";

export function generateReceipt(transaction) {
  return [
    "===== TariroClinincs Receipt =====",
    `Receipt No: ${transaction.transaction_id}`,
    `Customer ID: ${transaction.customer_id}`,
    `Service: ${transaction.service}`,
    `Amount Paid: $${transaction.amount.toFixed(2)}`,
    `Payment Method: ${transaction.payment_method}`,
    `Status: SUCCESS`,
    `Timestamp: ${transaction.timestamp}`,
    "=================================="
  ].join("\n");
}

export async function sendReceiptChannels(phone, receiptText) {
  // Placeholder: add SMS provider API call here.
  console.log("SMS Placeholder:", API_PLACEHOLDERS.smsGatewayEndpoint, { phone, receiptText });

  // Placeholder: add receipt printer API call here.
  console.log("Print Placeholder:", API_PLACEHOLDERS.receiptPrintEndpoint, { receiptText });
}
