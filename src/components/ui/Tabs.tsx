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
    <div className="tabs tabs-lifted mt-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`tab tab-sm h-auto min-h-8 py-1.5 text-xs font-semibold leading-tight whitespace-normal ${
            active === tab.key ? "tab-active font-bold" : ""
          }`}
        >
          <span className="flex flex-col items-center">
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-2xs font-normal opacity-60">({tab.count})</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
