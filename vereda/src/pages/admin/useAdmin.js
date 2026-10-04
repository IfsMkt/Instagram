import { useCallback, useEffect, useState } from 'react';
import { backend } from '../../api/backend.js';

export function useAdminContent() {
  const [state, setState] = useState({ status: 'loading' });
  const load = useCallback(async () => {
    try {
      const data = await backend.fn('admin-content', { action: 'list' });
      setState({ status: 'ready', ...data });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return [state, load];
}

export const admin = (action, payload = {}) => backend.fn('admin-content', { action, ...payload });

export const STATUS_LABEL = { rascunho: 'Rascunho', revisado: 'Revisado', publicado: 'Publicado' };
