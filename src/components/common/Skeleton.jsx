import React, { memo } from 'react';

/**
 * High-performance, theme-adaptive Skeleton component.
 * Shimmer matches exact layout shapes (KPI, Card, Table) to prevent layout shifts.
 */
function BaseSkeleton({ className = '', style, width, height, radius, circle = false, ...props }) {
  const customStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(radius ? { borderRadius: radius } : {}),
    ...(circle ? { borderRadius: '50%', width: width || height, height: height || width } : {}),
  };

  return <div className={`skeleton-shimmer ${className}`} style={customStyle} aria-hidden="true" {...props} />;
}

const SkeletonLine = memo(function SkeletonLine({ width = '100%', height = '16px', style, className = '', ...props }) {
  return <BaseSkeleton width={width} height={height} style={style} className={`skeleton-line-item ${className}`} {...props} />;
});

const SkeletonKpi = memo(function SkeletonKpi({ count = 3, className = '' }) {
  const gridClass = count === 2 ? 'kpi-grid-2' : count === 4 ? 'kpi-grid-4' : 'kpi-grid-3';

  return (
    <div className={`kpi-grid ${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ui-card skeleton-kpi-card">
          <div className="skeleton-kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonLine width="45%" height="13px" />
            <BaseSkeleton width="36px" height="36px" radius="var(--radius-sm)" />
          </div>
          <SkeletonLine width="65%" height="28px" style={{ margin: '12px 0 6px 0' }} />
          <SkeletonLine width="40%" height="12px" />
        </div>
      ))}
    </div>
  );
});

const SkeletonCard = memo(function SkeletonCard({ lines = 3, hasHeader = true, className = '', ...props }) {
  return (
    <div className={`ui-card skeleton-card-box ${className}`} {...props}>
      {hasHeader && (
        <div className="skeleton-card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <SkeletonLine width="35%" height="20px" />
          <SkeletonLine width="20%" height="16px" />
        </div>
      )}
      <div className="skeleton-card-body">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 ? '60%' : '100%'}
            height="14px"
            style={{ marginBottom: i === lines - 1 ? 0 : '10px' }}
          />
        ))}
      </div>
    </div>
  );
});

const SkeletonTable = memo(function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`data-table-container skeleton-table-container ${className}`}>
      <div
        className="skeleton-table-header"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          padding: '14px 16px',
          background: 'var(--bg-table-header)',
          borderBottom: '1px solid var(--border-color)',
          gap: '12px',
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width="65%" height="13px" />
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="skeleton-table-row"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              padding: '14px 16px',
              borderBottom: r === rows - 1 ? 'none' : '1px solid var(--border-subtle)',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} width={c === 0 ? '75%' : '50%'} height="14px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

const ScreenSkeleton = memo(function ScreenSkeleton() {
  return (
    <div className="screen-skeleton-wrapper" aria-busy="true" aria-label="Loading content...">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <SkeletonLine width="220px" height="28px" style={{ marginBottom: '8px' }} />
        <SkeletonLine width="340px" height="15px" />
      </div>
      <SkeletonKpi count={3} />
      <div style={{ marginTop: '24px' }}>
        <SkeletonTable rows={4} cols={4} />
      </div>
    </div>
  );
});

const Skeleton = Object.assign(BaseSkeleton, {
  Line: SkeletonLine,
  Card: SkeletonCard,
  Table: SkeletonTable,
  Kpi: SkeletonKpi,
  Screen: ScreenSkeleton,
});

export default Skeleton;
