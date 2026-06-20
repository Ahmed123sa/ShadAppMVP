'use client';

import api from '@/lib/api';
import type { Client } from '@/types';

export default function NoWorkspace({ client }: { client: Client }) {
  const createWorkspace = async () => {
    const { data } = await api.post(`/workspaces`, { client_id: client.id }).catch(() => ({ data: null }));
    if (data) window.location.reload();
  };

  return (
    <div className="text-center py-16">
      <p className="text-zinc-500 mb-4">هذا العميل لا يمتلك مساحة عمل بعد</p>
      <button onClick={createWorkspace} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700">إنشاء مساحة عمل</button>
    </div>
  );
}
