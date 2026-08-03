import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useFarms() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['farms', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select(`
          id, 
          farm_name, 
          owner_name, 
          phone, 
          location, 
          chicken_type, 
          status, 
          available_stock, 
          avg_weight_kg, 
          harvest_date, 
          capacity, 
          quality_rating, 
          quality_notes, 
          notes,
          created_at,
          province,
          tenant_id
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('farm_name', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id && ['broker', 'poultry_broker', 'egg_broker'].includes(tenant?.business_vertical)
  })
}
