// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useSubjectCatalog } from "@/hooks/useSubjectCatalog";
import CatalogLoadState from "@/components/ui/CatalogLoadState";
it("offers no static choices on failure and loads only live choices after retry", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ subjects: [{ slug: "CUSTOM", name: "School-added subject", topics: ["School-added topic"] }] }) });
  vi.stubGlobal("fetch", fetchMock);
  function Picker() {
    const catalog = useSubjectCatalog();
    return <><CatalogLoadState {...catalog} /><select>{catalog.subjects.map(subject => <option key={subject.slug}>{subject.name}</option>)}</select></>;
  }
  const host = document.createElement("div");document.body.append(host);const root = createRoot(host);
  try {
    await act(async () => root.render(<Picker />));
    expect(host.querySelectorAll("option")).toHaveLength(0);
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("unavailable");
    await act(async () => host.querySelector("button")!.click());
    expect([...host.querySelectorAll("option")].map(option => option.textContent)).toEqual(["School-added subject"]);
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally { await act(async () => root.unmount());host.remove();vi.unstubAllGlobals(); }
});
