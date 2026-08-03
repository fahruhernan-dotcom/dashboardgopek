import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useEggSuppliers() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['egg-suppliers', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('egg_suppliers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
