import { useTenantTable } from './useTenantTable'

export function useEggSales() {
  return useTenantTable('egg_sales', {
    select: '*, egg_customers(name), egg_sale_items(*, egg_inventory(product_name))',
    orderBy: 'created_at',
    ascending: false,
    queryKeyPrefix: 'egg-sales',
  })
}

