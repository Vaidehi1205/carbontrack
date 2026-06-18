import { factors } from "../data/factors.js";
import { sanitizePlainText } from "./helpers.js";

export function sanitizeActivityInput(input) {
  return {
    category: sanitizePlainText(input.category, 40),
    type: sanitizePlainText(input.type, 80),
    date: sanitizePlainText(input.date, 10),
    value: Number(input.value),
    notes: sanitizePlainText(input.notes || "", 90)
  };
}

export function validateActivity(input) {
  const errors = [];
  const cleaned = sanitizeActivityInput(input);
  if (!cleaned.category || !factors[cleaned.category]) errors.push("Choose a category.");
  if (!cleaned.type || !factors[cleaned.category]?.[cleaned.type]) errors.push("Choose an activity type.");
  if (!cleaned.date || !/^\d{4}-\d{2}-\d{2}$/.test(cleaned.date) || Number.isNaN(new Date(cleaned.date).getTime())) errors.push("Choose a valid date.");
  if (!Number.isFinite(cleaned.value) || cleaned.value <= 0) errors.push("Amount must be greater than zero.");
  if (cleaned.value > 100000) errors.push("Amount is too large.");
  if (cleaned.notes.length > 90) errors.push("Notes must be 90 characters or fewer.");
  if (cleaned.date && new Date(cleaned.date) > new Date()) errors.push("Date cannot be in the future.");
  return errors;
}

export function sanitizeProfileInput(input) {
  return {
    name: sanitizePlainText(input.name, 80),
    location: sanitizePlainText(input.location || "", 120),
    country: sanitizePlainText(input.country, 5),
    household: Number(input.household),
    motivation: sanitizePlainText(input.motivation || "climate", 40),
    commute: sanitizePlainText(input.commute || "car_petrol", 80),
    renewable: Number(input.renewable),
    target: Number(input.target),
    consent: Boolean(input.consent),
    theme: sanitizePlainText(input.theme || "light", 20)
  };
}

export function validateProfile(input, { requireTarget = false } = {}) {
  const errors = [];
  const cleaned = sanitizeProfileInput(input);
  if (cleaned.name.length < 2) errors.push("Name must be at least 2 characters.");
  if (cleaned.location.length > 120) errors.push("Location is too long.");
  if (!["IN", "US", "UK", "CA", "AU"].includes(cleaned.country)) errors.push("Choose a valid country.");
  if (!Number.isInteger(cleaned.household) || cleaned.household < 1 || cleaned.household > 8) errors.push("Household must be between 1 and 8.");
  if (!["climate", "cost", "health", "social"].includes(cleaned.motivation)) errors.push("Choose a valid motivation.");
  if (!factors.transportation[cleaned.commute]) errors.push("Choose a valid commute.");
  if (!Number.isFinite(cleaned.renewable) || cleaned.renewable < 0 || cleaned.renewable > 100) errors.push("Renewable energy must be between 0 and 100%.");
  if (requireTarget && (!Number.isFinite(cleaned.target) || cleaned.target < 1000)) errors.push("Annual target must be at least 1000 kg.");
  if (!["light", "dark"].includes(cleaned.theme)) errors.push("Choose a valid theme.");
  return errors;
}
