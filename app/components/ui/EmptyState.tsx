import { Icon, type IconName } from "./Icon";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-slate-400">
      <div className="flex justify-center">
        <Icon name={icon} size={48} />
      </div>
      <p className="mt-3 text-lg">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
}
