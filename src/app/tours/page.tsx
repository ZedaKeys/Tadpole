'use client';


import { Map, Clock, Layers } from 'lucide-react';
import { tours } from '@/data/tours';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AppShell } from '@/components/layout/AppShell';

export default function ToursPage() {
  return (
    <AppShell title="Guided Tours">
      {/* Count */}
      <p
        className="stagger-in mb-5"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {tours.length} tour{tours.length !== 1 ? 's' : ''}
      </p>

      {/* Tour cards */}
      <div className="space-y-4">
        {tours.map((tour, i) => (
          <Card
            key={tour.id}
            title={tour.name}
            href={`/tours/${tour.id}`}
            accentColor="#a855f7"
            delay={i * 0.06}
            description={
              <>
                <span
                  className="flex flex-wrap items-center gap-2 mb-1"
                >
                  <Badge label={`Act ${tour.act}`} color="var(--gold)" />
                  <span
                    className="flex items-center gap-1"
                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
                  >
                    <Layers size={12} />
                    {tour.steps.length} steps
                  </span>
                  <span
                    className="flex items-center gap-1"
                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
                  >
                    <Clock size={12} />
                    {tour.estimatedTime}
                  </span>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {tour.description.slice(0, 120) + (tour.description.length > 120 ? '...' : '')}
                </span>
              </>
            }
            icon={<Map size={20} style={{ color: 'var(--gold-bright)' }} />}
          />
        ))}
      </div>
    </AppShell>
  );
}
