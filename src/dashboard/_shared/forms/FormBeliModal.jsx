import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useFarms } from '@/lib/hooks/useFarms';
import { formatIDR } from '@/lib/format';
import { DatePicker } from '@/components/ui/DatePicker';
import SlideModal from '../components/SlideModal';

const beliSchema = z.object({
  farm_id: z.string().min(1, 'Pilih kandang'),
  total_birds: z.number().min(1, 'Minimal 1 ekor'),
  avg_weight: z.number().min(0.1, 'Minimal 0.1 kg'),
  price_per_kg: z.number().min(1000, 'Harga tidak valid'),
  transport_cost: z.number().default(0),
  transaction_date: z.string(),
  notes: z.string().optional(),
});

export default function FormBeliModal({ isOpen, onClose }) {
  const { data: farms } = useFarms();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(beliSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      total_birds: '',
      avg_weight: '',
      price_per_kg: '',
      transport_cost: 0,
    }
  });

  const watched = watch();
  const totalWeight = (Number(watched.total_birds) || 0) * (Number(watched.avg_weight) || 0);
  const purchaseAmount = totalWeight * (Number(watched.price_per_kg) || 0);
  const totalModal = purchaseAmount + (Number(watched.transport_cost) || 0);

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.from('purchases').insert([{
        ...data,
        total_weight: totalWeight,
        total_price: purchaseAmount,
        total_modal: totalModal,
        is_deleted: false
      }]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Pembelian berhasil dicatat! 💸');
      reset();
      onClose();
    } catch (_err) {
      toast.error('Gagal menyimpan data.');
    }
  };

  return (
    <SlideModal isOpen={isOpen} onClose={onClose} title="Catat Pembelian Ayam">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Pilih Kandang */}
        <div>
          <label htmlFor="farm_id" style={labelStyle}>Kandang Rekanan</label>
          <select id="farm_id" {...register('farm_id')} style={inputStyle}>
            <option value="">-- Pilih Kandang --</option>
            {farms?.map(f => (
              <option key={f.id} value={f.id}>{f.farm_name} ({f.status})</option>
            ))}
          </select>
          {errors.farm_id && <p style={errorStyle}>{errors.farm_id.message}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label htmlFor="total_birds" style={labelStyle}>Jumlah Ekor</label>
            <input id="total_birds" type="number" {...register('total_birds', { valueAsNumber: true })} placeholder="0" style={inputStyle} />
            {errors.total_birds && <p style={errorStyle}>{errors.total_birds.message}</p>}
          </div>
          <div>
            <label htmlFor="avg_weight" style={labelStyle}>Rata-rata (kg)</label>
            <input id="avg_weight" type="number" step="0.01" {...register('avg_weight', { valueAsNumber: true })} placeholder="0.00" style={inputStyle} />
            {errors.avg_weight && <p style={errorStyle}>{errors.avg_weight.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="price_per_kg" style={labelStyle}>Harga Beli (Rp/kg)</label>
          <input id="price_per_kg" type="number" {...register('price_per_kg', { valueAsNumber: true })} placeholder="22000" style={inputStyle} />
          {errors.price_per_kg && <p style={errorStyle}>{errors.price_per_kg.message}</p>}
        </div>

        <div>
          <label htmlFor="transport_cost" style={labelStyle}>Biaya Transport & Operasional (Rp)</label>
          <input id="transport_cost" type="number" {...register('transport_cost', { valueAsNumber: true })} placeholder="0" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Tanggal Transaksi</label>
          <Controller
            control={control}
            name="transaction_date"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Live Preview */}
        {totalWeight > 0 && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '8px'
          }}>
            <div style={previewRow}>
              <span>Total Berat:</span>
              <span style={{ fontWeight: 700 }}>{totalWeight.toFixed(2)} kg</span>
            </div>
            <div style={previewRow}>
              <span>Subtotal Beli:</span>
              <span style={{ fontWeight: 700 }}>{formatIDR(purchaseAmount)}</span>
            </div>
            <div style={{ ...previewRow, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '8px' }}>
              <span style={{ color: '#F1F5F9' }}>TOTAL MODAL:</span>
              <span style={{ fontWeight: 800, color: '#10B981', fontSize: '16px' }}>{formatIDR(totalModal)}</span>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            marginTop: '12px',
            padding: '16px',
            background: '#10B981',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 800,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </form>
    </SlideModal>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#4B6478',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#F1F5F9',
  fontSize: '16px',
  fontFamily: 'DM Sans',
  outline: 'none'
};

const errorStyle = {
  fontSize: '12px',
  color: '#F87171',
  marginTop: '4px'
};

const previewRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  color: '#94A3B8',
  margin: '4px 0'
};
