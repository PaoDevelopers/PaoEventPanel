import api from "./client";

export interface AutocompleteEntry {
  id: string;
  english_name: string;
  chinese_name: string;
  system_name: string;
}

export interface AutocompleteStatus {
  loaded: boolean;
  count: number;
}

export async function searchAutocomplete(query: string): Promise<AutocompleteEntry[]> {
  const { data } = await api.get<AutocompleteEntry[]>("/autocomplete/search", {
    params: { q: query },
  });
  return data;
}

export async function getAutocompleteStatus(): Promise<AutocompleteStatus> {
  const { data } = await api.get<AutocompleteStatus>("/autocomplete/status");
  return data;
}

export async function uploadAutocompleteCSV(file: File): Promise<{ count: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ message: string; count: number }>(
    "/autocomplete/upload",
    formData,
  );
  return data;
}

export async function downloadAutocompleteTemplate(): Promise<void> {
  const { data } = await api.get("/autocomplete/template", { responseType: "blob" });
  const url = window.URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students_template.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}
