export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="kt-tabs mt-2 flex-wrap" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          data-active={active === tab.key ? "true" : "false"}
          onClick={() => onChange(tab.key)}
          className="kt-tab"
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 font-normal opacity-60">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
