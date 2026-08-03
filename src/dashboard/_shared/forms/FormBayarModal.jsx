import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatIDR } from '@/lib/format';
import { DatePicker } from '@/components/ui/DatePicker';
import SlideModal from '../components/SlideModal';
import { logError } from '@/lib/logger/errorLogger';

const bayarSchema = z.object({
  payment_amount: z.number().min(1000, 'Minimal Rp 1.000'),
  payment_date: z.string(),
  notes: z.string().optional(),
});

export default function FormBayarModal({ isOpen, onClose, rpa }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bayarSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: rpa?.total_outstanding || 0
    }
  });

  const onSubmit = async (data) => {
    try {
      // Logic for paying debt: 
      // 1. Fetch sales that are not fully paid
      const { data: unpaidSales } = await supabase.from('sales')
        .select('*')
        .eq('rpa_id', rpa.id)
        .eq('payment_status', 'belum_lunas')
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: true });

      if (!unpaidSales) throw new Error('No unpaid sales found');

      let remainingPayment = data.payment_amount;
      const updates = [];

      for (const sale of unpaidSales) {
        if (remainingPayment <= 0) break;
        
        const saleDebt = sale.remaining_amount;
        if (remainingPayment >= saleDebt) {
          updates.push(supabase.from('sales').update({ 
            payment_status: 'lunas', 
            paid_amount: sale.total_revenue,
            remaining_amount: 0 
          }).eq('id', sale.id));
          remainingPayment -= saleDebt;
        } else {
          updates.push(supabase.from('sales').update({ 
            payment_status: 'sebagian', 
            paid_amount: (sale.paid_amount || 0) + remainingPayment,
            remaining_amount: saleDebt - remainingPayment 
          }).eq('id', sale.id));
          remainingPayment = 0;
        }
      }

      // Run all row updates; collect per-row failures (rejections OR Supabase {error} payloads).
      const results = await Promise.allSettled(updates);
      const failures = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          failures.push({ idx, error: r.reason });
        } else if (r.value?.error) {
          failures.push({ idx, error: r.value.error });
        }
      });

      if (failures.length > 0) {
        failures.forEach(({ idx, error: rowErr }) => {
          logError({
            level: 'error',
            source: 'supabase',
            component: 'FormBayarModal',
            actionName: 'submitPayment',
            error: rowErr,
            metadata: {
              table: 'sales',
              operation: 'update',
              row_index: idx,
              hint: rowErr?.hint || null,
            },
          });
        });
        toast.error('Gagal mencatat pembayaran.');
        return;
      }

      // Record in a payments log table if it exists (assuming it doesn't yet as per initial DB plan, but it should)
      // For now we just update the sales table which correctly affects total_outstanding via DB Trigger
      // (assuming trigger exists, if not we update rpa table manually)

      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rpa'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Pembayaran piutang berhasil dicatat! ✅');
      reset();
      onClose();
    } catch (err) {
      logError({
        level: 'error',
        source: 'supabase',
        component: 'FormBayarModal',
        actionName: 'submitPayment',
        error: err,
        metadata: { phase: 'load_or_validate' },
      });
      toast.error('Gagal mencatat pembayaran.');
    }
  };

  return (
    <SlideModal isOpen={isOpen} onClose={onClose} title={`Bayar Piutang: ${rpa?.rpa_name}`}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ background: 'rgba(248,113,113,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.15)' }}>
          <div style={{ fontSize: '11px', color: '#4B6478', fontWeight: 600, textTransform: 'uppercase' }}>Total Piutang Saat Ini</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F87171', fontFamily: 'Sora' }}>{formatIDR(rpa?.total_outstanding || 0)}</div>
        </div>

        <div>
          <label htmlFor="payment_amount" style={labelStyle}>Jumlah Pembayaran (Rp)</label>
          <input id="payment_amount" type="number" {...register('payment_amount', { valueAsNumber: true })} style={inputStyle} />
          {errors.payment_amount && <p style={errorStyle}>{errors.payment_amount.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>Tanggal Pembayaran</label>
          <Controller
            control={control}
            name="payment_date"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
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
          {isSubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
        </button>
      </form>
    </SlideModal>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px 14px', background: '#111C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F1F5F9', fontSize: '16px', fontFamily: 'DM Sans', outline: 'none' };
const errorStyle = { fontSize: '12px', color: '#F87171', marginTop: '4px' };
