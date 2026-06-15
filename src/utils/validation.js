export function validateActivity(input) {
  const errors = [];
  if (!input.category) errors.push("Choose a category.");
  if (!input.type) errors.push("Choose an activity type.");
  if (!input.date || Number.isNaN(new Date(input.date).getTime())) errors.push("Choose a valid date.");
  if (!Number.isFinite(Number(input.value)) || Number(input.value) <= 0) errors.push("Amount must be greater than zero.");
  if (input.date && new Date(input.date) > new Date()) errors.push("Date cannot be in the future.");
  return errors;
}
