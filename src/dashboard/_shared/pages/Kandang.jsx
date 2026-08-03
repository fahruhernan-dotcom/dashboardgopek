import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Home as HomeIcon, Calendar, Weight, ChevronRight, AlertTriangle, MapPin, Phone } from 'lucide-react';
import { useFarms } from '@/lib/hooks/useFarms';
import { formatWeight, formatDate } from '@/lib/format';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Kandang() {
  const navigate = useNavigate();
  const { data: farms, isLoading } = useFarms();
  const [filter, setFilter] = useState('all'); // 'all', 'ready', 'harvested'

  const filtered = farms?.filter(f => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return '#10B981';
      case 'harvested': return '#94A3B8';
      case 'empty': return '#4B6478';
      default: return '#F59E0B';
    }
  };

  return (
    <div style={{ background: '#06090F', minHeight: '100vh' }}>
      <TopBar 
        title="Kandang Rekanan" 
        subtitle="Pantau stok & jadwal panen" 
        rightAction={
          <button style={actionBtnStyle}>
            <Plus size={14} /> Baru
          </button>
        }
      />

      {/* Filter Chips */}
      <div style={{ padding: '0 20px', margin: '16px 0', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['all', 'ready', 'harvested', 'empty'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              background: filter === f ? '#10B981' : '#111C24',
              color: filter === f ? 'white' : '#94A3B8',
              border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer'
            }}
          >
            {f === 'all' ? 'Semua' : f}
          </button>
        ))}
      </div>

      <main style={{ padding: '0 20px 20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState title="Belum ada data" desc="Tambahkan kandang rekanan untuk mulai memantau stok." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((farm) => (
              <motion.div
                key={farm.id}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: '#111C24',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px', height: '44px',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: getStatusColor(farm.status),
                      overflow: 'hidden'
                    }}>
                      {farm.profile_img ? (
                        <img src={farm.profile_img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <HomeIcon size={22} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>{farm.farm_name}</div>
                      <div style={{ fontSize: '12px', color: '#4B6478', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{farm.owner_name || 'Tanpa Nama'}</span>
                        <span style={{ fontSize: '10px', opacity: 0.5 }}>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {farm.distance_km || 0} km</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: `${getStatusColor(farm.status)}20`,
                    color: getStatusColor(farm.status),
                    textTransform: 'uppercase'
                  }}>
                    {farm.status}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="#4B6478" />
                    <div>
                      <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 600, textTransform: 'uppercase' }}>Panen</div>
                      <div style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: 600 }}>{farm.harvest_date ? formatDate(farm.harvest_date) : '-'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Weight size={14} color="#4B6478" />
                    <div>
                      <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 600, textTransform: 'uppercase' }}>Estimasi</div>
                      <div style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: 600 }}>{farm.available_stock ? formatWeight(farm.available_stock) : '0 kg'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button 
                    onClick={() => window.open(`tel:${farm.owner_phone}`, '_self')}
                    style={{ flex: 1, padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '12px', color: '#10B981', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '8px' }}
                  >
                    <Phone size={14} /> Hubungi
                  </button>
                  <button 
                    onClick={() => navigate(`/kandang/${farm.id}`)}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', color: '#F1F5F9', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    Detail <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const actionBtnStyle = {
  background: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  borderRadius: '10px',
  padding: '8px 12px',
  color: '#10B981',
  fontSize: '12px',
  fontWeight: 700,
  display: 'flex', alignItems: 'center', gap: '6px'
};
