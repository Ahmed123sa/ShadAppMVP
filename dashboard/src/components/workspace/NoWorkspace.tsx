'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import type { Client } from '@/types';

export default function NoWorkspace({ client }: { client: Client }) {
  useEffect(() => {
    api.post('/workspaces', { client_id: client.id }).then(() => window.location.reload());
  }, [client.id]);

  return (
    <div className="text-center py-16">
      <p className="text-zinc-500 mb-4">جاري إنشاء مساحة العمل...</p>
    </div>
  );
}
