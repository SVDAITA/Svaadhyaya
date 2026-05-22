// All quotes are managed from the Admin page → stored in custom_quotes table.
// Built-in array is intentionally empty — add quotes via Admin UI.

export const QUOTES = [];

// Async: fetch from DB. Falls back to a single placeholder if table is empty or unavailable.
export async function getAllQuotesAsync(supabase) {
  try {
    const { data } = await supabase.from("custom_quotes").select("text,translation,source");
    const all = [...(data || [])];
    return all.length > 0 ? all : [{ text: "The practice continues.", source: "Svadhyaya" }];
  } catch {
    return [{ text: "The practice continues.", source: "Svadhyaya" }];
  }
}

// Sync fallback — returns placeholder when async not feasible
export function getAllQuotes() {
  return [{ text: "The practice continues.", source: "Svadhyaya" }];
}
