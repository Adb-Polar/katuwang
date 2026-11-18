import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ClassCatalogCard from "../ClassCatalogCard";

const base: ComponentProps<typeof ClassCatalogCard> = {
  href: "/tutor/classes/c1",
  subject: "MATHEMATICS",
  gradeLevel: "GRADE_7",
  topics: ["Fractions"],
  sessions: [{ scheduledAt: new Date(Date.now() + 86_400_000).toISOString(), duration: 60, status: "SCHEDULED" }],
  status: "SCHEDULED",
  enrolledCount: 2,
  maxStudents: 10,
  showSeats: true,
};

const text = (html: string) => html.replace(/<[^>]+>/g, "");

describe("ClassCatalogCard", () => {
  it("shows seats left when browsing", () => {
    expect(text(renderToStaticMarkup(<ClassCatalogCard {...base} />))).toContain("8 seats left");
  });

  it("lets the tutor list replace the status text and add the class code and a notice", () => {
    const html = text(
      renderToStaticMarkup(
        <ClassCatalogCard {...base} code="C-0007" aside="2 of 10 enrolled" notice="Reason: Off-topic" />,
      ),
    );
    expect(html).toContain("Grade 7");
    expect(html).toContain("· C-0007");
    expect(html).toContain("2 of 10 enrolled");
    expect(html).not.toContain("seats left");
    expect(html).toContain("Reason: Off-topic");
  });

  it("makes the first topic the title and lists the others under it", () => {
    const html = renderToStaticMarkup(
      <ClassCatalogCard {...base} topics={["Fractions", "Decimals", "Ratios", "Percent"]} />,
    );
    const title = html.match(/<span class="font-serif text-lg[^"]*">([^<]*)/)?.[1];
    expect(title).toBe("Fractions");
    expect(html).toContain("<span>Decimals</span>");
    expect(html).toContain("<span>Ratios</span>");
    expect(text(html)).toContain("+1 more");
    expect(text(html)).not.toContain("Percent");
  });
});
