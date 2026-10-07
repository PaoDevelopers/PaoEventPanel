import { isAxiosError } from "axios";
import { toast } from "sonner";

// Report a failed admin action; 401s are skipped because they already show the session-expired notice
export function notifyActionError(error: unknown, message: string) {
  if (isAxiosError(error) && error.response?.status === 401) return;
  toast.error(message);
}
