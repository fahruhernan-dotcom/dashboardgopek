import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useEggInventory() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['egg-inventory', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('egg_inventory')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('product_name', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
