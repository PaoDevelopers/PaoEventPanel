import api from "@/api/client";

export interface RelayRanking {
  house_id: number;
  name: string;
  color: string;
  laps: number;
  rank: number;
}

export async function getRelayRankings(): Promise<RelayRanking[]> {
  const { data } = await api.get<RelayRanking[]>("/relay");
  return data;
}

export async function addRelayLaps(houseId: number, delta: number): Promise<RelayRanking[]> {
  const { data } = await api.post<RelayRanking[]>(`/relay/${houseId}/laps`, { delta });
  return data;
}

export async function setRelayLaps(houseId: number, laps: number): Promise<RelayRanking[]> {
  const { data } = await api.put<RelayRanking[]>(`/relay/${houseId}/laps`, { laps });
  return data;
}

export async function resetRelay(): Promise<RelayRanking[]> {
  const { data } = await api.delete<RelayRanking[]>("/relay");
  return data;
}
