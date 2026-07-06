export default function CategoryBadge({ category }) {
  if (!category) {
    return <span className="badge badge-muted">Uncategorized</span>;
  }

  const normalized = category.toLowerCase();
  let badgeClass = 'badge-muted';

  if (normalized.includes('news')) {
    badgeClass = 'badge-news';
  } else if (normalized.includes('job') || normalized.includes('recruit')) {
    badgeClass = 'badge-recruit';
  } else if (normalized.includes('finance')) {
    badgeClass = 'badge-finance';
  } else if (normalized.includes('notify') || normalized.includes('notification')) {
    badgeClass = 'badge-notify';
  } else if (normalized.includes('personal')) {
    badgeClass = 'badge-personal';
  } else if (normalized.includes('work') || normalized.includes('professional')) {
    badgeClass = 'badge-work';
  }

  return <span className={`badge ${badgeClass}`}>{category}</span>;
}
