import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePurchases } from '@/lib/hooks/usePurchases';
import { formatIDR } from '@/lib/format';
import { DatePicker } from '@/components/ui/DatePicker';
import SlideModal from '../components/SlideModal';

const jualSchema = z.object({
  rpa_id: z.string().min(1, 'Pilih RPA pembeli'),
  purchase_id: z.string().min(1, 'Pilih sumber pembelian'),
  total_birds: z.number().min(1, 'Minimal 1 ekor'),
  avg_weight: z.number().min(0.1, 'Minimal 0.1 kg'),
  price_per_kg: z.number().min(1000, 'Harga tidak valid'),
  shipping_cost: z.number().default(0),
  payment_status: z.enum(['lunas', 'belum_lunas', 'sebagian']),
  paid_amount: z.number().default(0),
  transaction_date: z.string(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export default function FormJualModal({ isOpen, onClose }) {
  const rpas = [];
  const { data: purchases } = usePurchases();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, reset, setValue, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(jualSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      payment_status: 'belum_lunas',
      total_birds: '',
      avg_weight: '',
      price_per_kg: '',
      shipping_cost: 0,
      paid_amount: 0,
    }
  });

  const watched = watch();
  const selectedPurchase = purchases?.find(p => p.id === watched.purchase_id);
  
  const totalWeight = (Number(watched.total_birds) || 0) * (Number(watched.avg_weight) || 0);
  const revenue = totalWeight * (Number(watched.price_per_kg) || 0);
  const netRevenue = revenue - (Number(watched.shipping_cost) || 0);
  
  // Profit calculation logic
  const modalPerKg = selectedPurchase ? (selectedPurchase.total_modal / selectedPurchase.total_weight) : 0;
  const totalModalCost = totalWeight * modalPerKg;
  const profit = netRevenue - totalModalCost;
  const roi = totalModalCost > 0 ? (profit / totalModalCost) * 100 : 0;
  const marginPerKg = totalWeight > 0 ? profit / totalWeight : 0;

  const onSubmit = async (data) => {
    try {
      const remainingAmount = netRevenue - (Number(data.paid_amount) || 0);
      
      const { error } = await supabase.from('sales').insert([{
        ...data,
        total_revenue: revenue,
        net_revenue: netRevenue,
        remaining_amount: remainingAmount,
        is_deleted: false
      }]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Penjualan berhasil dicatat! 🚀');
      reset();
      onClose();
    } catch (_err) {
      toast.error('Gagal menyimpan data.');
    }
  };

  return (
    <SlideModal isOpen={isOpen} onClose={onClose} title="Catat Penjualan Ayam">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Pilih RPA */}
        <div>
          <label htmlFor="rpa_id" style={labelStyle}>RPA Pembeli</label>
          <select id="rpa_id" {...register('rpa_id')} style={inputStyle}>
            <option value="">-- Pilih RPA --</option>
            {rpas?.map(r => (
              <option key={r.id} value={r.id}>{r.rpa_name} (Hutang: {formatIDR(r.total_outstanding)})</option>
            ))}
          </select>
          {errors.rpa_id && <p style={errorStyle}>{errors.rpa_id.message}</p>}
        </div>

        {/* Sumber Pembelian */}
        <div>
          <label htmlFor="purchase_id" style={labelStyle}>Sumber Pembelian (Stok)</label>
          <select id="purchase_id" {...register('purchase_id')} style={inputStyle}>
            <option value="">-- Pilih Stok --</option>
            {purchases?.map(p => (
              <option key={p.id} value={p.id}>{p.farms?.farm_name} · {p.transaction_date} · {p.total_birds} ekor</option>
            ))}
          </select>
          {errors.purchase_id && <p style={errorStyle}>{errors.purchase_id.message}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label htmlFor="jual_total_birds" style={labelStyle}>Jumlah Ekor</label>
            <input id="jual_total_birds" type="number" {...register('total_birds', { valueAsNumber: true })} placeholder="0" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="jual_avg_weight" style={labelStyle}>Rata-rata (kg)</label>
            <input id="jual_avg_weight" type="number" step="0.01" {...register('avg_weight', { valueAsNumber: true })} placeholder="0.00" style={inputStyle} />
          </div>
        </div>

        <div>
          <label htmlFor="jual_price_per_kg" style={labelStyle}>Harga Jual (Rp/kg)</label>
          <input id="jual_price_per_kg" type="number" {...register('price_per_kg', { valueAsNumber: true })} placeholder="24000" style={inputStyle} />
        </div>

        <div>
          <label htmlFor="shipping_cost" style={labelStyle}>Ongkos Kirim / Susut (Rp)</label>
          <input id="shipping_cost" type="number" {...register('shipping_cost', { valueAsNumber: true })} placeholder="0" style={inputStyle} />
        </div>

        <div style={{ padding: '12px', background: '#0C1319', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <label style={labelStyle}>Status Bayar</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {['lunas', 'belum_lunas', 'sebagian'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setValue('payment_status', status)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  background: watched.payment_status === status ? '#10B981' : 'rgba(255,255,255,0.05)',
                  color: watched.payment_status === status ? 'white' : '#4B6478',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          {watched.payment_status === 'sebagian' && (
            <div style={{ marginTop: '16px' }}>
              <label htmlFor="paid_amount" style={labelStyle}>Sudah Dibayar (Rp)</label>
              <input id="paid_amount" type="number" {...register('paid_amount', { valueAsNumber: true })} style={inputStyle} />
            </div>
          )}
          
          {watched.payment_status !== 'lunas' && (
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Tanggal Jatuh Tempo</label>
              <Controller
                control={control}
                name="due_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Live Profit Preview */}
        {totalWeight > 0 && selectedPurchase && (
          <div style={{
            background: profit >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${profit >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(248,113,113,0.2)'}`,
            borderRadius: '16px',
            padding: '16px',
            marginTop: '8px'
          }}>
            <div style={previewRow}>
              <span>Total Penjualan:</span>
              <span>{formatIDR(revenue)} ({totalWeight.toFixed(1)}kg)</span>
            </div>
            <div style={previewRow}>
              <span>Modal Pembelian:</span>
              <span>{formatIDR(totalModalCost)}</span>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '12px 0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#4B6478', marginBottom: '2px' }}>PROFIT ESTIMASI</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: profit >= 0 ? '#10B981' : '#F87171', fontFamily: 'Sora' }}>
                    {profit >= 0 ? '+' : ''}{formatIDR(profit)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: profit >= 0 ? '#10B981' : '#F87171' }}>
                    ROI: {roi.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#4B6478' }}>
                    {formatIDR(marginPerKg)}/kg
                  </div>
                </div>
              </div>
            </div>
            
            {profit < 0 && <div style={{ fontSize: '11px', color: '#F87171', fontWeight: 700, textAlign: 'center', marginTop: '8px' }}>⚠️ Transaksi ini merugi!</div>}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={submitBtnStyle(isSubmitting)}
        >
          {isSubmitting ? 'Menyimpan...' : 'Catat Penjualan'}
        </button>
      </form>
    </SlideModal>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px 14px', background: '#111C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F1F5F9', fontSize: '16px', fontFamily: 'DM Sans', outline: 'none' };
const errorStyle = { fontSize: '12px', color: '#F87171', marginTop: '4px' };
const previewRow = { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', margin: '3px 0' };
const submitBtnStyle = (loading) => ({ marginTop: '12px', padding: '16px', background: '#10B981', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)' });
