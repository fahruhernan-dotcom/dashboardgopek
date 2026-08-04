import { useTenantTable } from './useTenantTable'

export function useEggInventory() {
  return useTenantTable('egg_inventory', { orderBy: 'product_name', ascending: true, queryKeyPrefix: 'egg-inventory' })
}

