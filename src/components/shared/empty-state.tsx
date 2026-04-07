export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold font-serif text-midnight mb-2">{title}</h3>
      <p className="text-sm text-midnight-300 max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}
