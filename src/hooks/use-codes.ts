import { useState, useEffect } from "react";

interface CodeItem {
  id: number;
  code_value: string;
  code_label: string;
  sort_order: number;
}

export function useCodes(groupCode: string) {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/codes?group=${groupCode}`)
      .then((r) => r.json())
      .then((data) => setCodes(Array.isArray(data) ? data : []))
      .catch(() => setCodes([]))
      .finally(() => setLoading(false));
  }, [groupCode]);

  return { codes, loading };
}
