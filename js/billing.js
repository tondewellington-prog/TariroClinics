const SERVICE_FEES = {
  "Clinic Fee": 25.0,
  Consultation: 30.0,
  "Bill Payment": 40.0
};

export function generateBill(customerData) {
  const fallback = SERVICE_FEES[customerData.service] ?? 0;
  const billAmount = Number(customerData.amount_due || fallback);

  return {
    customer_id: customerData.customer_id,
    service: customerData.service,
    bill_amount: billAmount
  };
}
