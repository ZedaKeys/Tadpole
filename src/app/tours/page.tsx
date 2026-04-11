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
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {tours.length} tour{tours.length !== 1 ? 's' : ''}
      </p>

      {/* Tour cards */}
      <div className="space-y-3">
        {tours.map((tour) => (
          <Card
            key={tour.id}
            title={tour.name}
            href={`/tours/${tour.id}`}
            description={tour.description.slice(0, 120) + (tour.description.length > 120 ? '...' : '')}
            icon={
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge label={`Act ${tour.act}`} color="var(--accent)" />
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
                >
                  <Layers size={12} />
                  {tour.steps.length} steps
                </span>
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
                >
                  <Clock size={12} />
                  {tour.estimatedTime}
                </span>
              </div>
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
