import { useState } from "react";

interface FetchStatus {
  initialError?: boolean;
}
export const useFetchStatus = ({ initialError = false }: FetchStatus = {}) => {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(initialError);
  const [error, setError] = useState<string | null | undefined>(
    initialError ? "Initial error" : null,
  );

  const onStart = () => {
    setPending(true);
    setFailed(false);
  };

  const onSuccess = () => {
    setPending(false);
    setFailed(false);
  };

  const onError = (err?: string) => {
    setPending(false);
    setFailed(true);
    setError(err);
  };

  return { pending, failed, error, onStart, onSuccess, onError };
};
