/**
 * Flat illustration for the landing hero: a tutor points to a page in an open book while the
 * learner beside them has an idea. Colours come from the landing tokens in `landing.css`
 * (classes on each shape), so it recolours with the palette.
 */
export default function HeroIllustration() {
  return (
    <figure className="lp-art">
      <svg viewBox="0 0 480 420" role="img" aria-labelledby="lp-art-title">
        <title id="lp-art-title">
          A tutor points to a page in an open book while the learner beside them has an idea.
        </title>
        <circle className="art-bg" cx="240" cy="220" r="185" />

        {/* idea above the learner */}
        <g strokeWidth="4" strokeLinecap="round" fill="none">
          <line className="art-ray" x1="150" y1="58" x2="150" y2="46" />
          <line className="art-ray" x1="124" y1="68" x2="116" y2="60" />
          <line className="art-ray" x1="176" y1="68" x2="184" y2="60" />
        </g>
        <circle className="art-bulb" cx="150" cy="96" r="18" strokeWidth="4" />
        <rect className="art-ink" x="142" y="116" width="16" height="7" rx="2" />

        {/* learner */}
        <path className="art-learner" d="M98 300 C98 238 118 212 150 212 C182 212 202 238 202 300 Z" />
        <circle className="art-skin-a" cx="150" cy="172" r="28" />
        <path className="art-ink" d="M122 176 A28 28 0 0 1 178 172 C166 158 140 156 122 176 Z" />

        {/* tutor */}
        <path className="art-tutor" d="M278 300 C278 230 298 202 330 202 C362 202 382 230 382 300 Z" />
        <circle className="art-skin-b" cx="330" cy="162" r="28" />
        <path className="art-ink" d="M302 160 A28 28 0 0 1 358 160 C340 150 320 150 302 160 Z" />

        {/* open book */}
        <path className="art-page" strokeWidth="3" strokeLinejoin="round" d="M188 292 Q213 280 240 288 L240 250 Q213 242 188 254 Z" />
        <path className="art-page" strokeWidth="3" strokeLinejoin="round" d="M240 288 Q267 280 292 292 L292 254 Q267 242 240 250 Z" />
        <g className="art-line" strokeWidth="3" strokeLinecap="round">
          <line x1="198" y1="264" x2="230" y2="258" />
          <line x1="198" y1="274" x2="224" y2="270" />
          <line x1="250" y1="258" x2="282" y2="264" />
        </g>

        {/* arms drawn over the book: the learner rests a hand on the page, the tutor points */}
        <path className="art-arm-learner" d="M176 246 Q190 274 206 280" fill="none" strokeWidth="16" strokeLinecap="round" />
        <circle className="art-skin-a" cx="208" cy="280" r="8" />
        <path className="art-arm-tutor" d="M306 238 Q292 258 268 264" fill="none" strokeWidth="16" strokeLinecap="round" />
        <circle className="art-skin-b" cx="264" cy="265" r="8" />

        {/* table */}
        <rect className="art-table" x="64" y="296" width="352" height="14" rx="7" />
        <rect className="art-table" x="104" y="310" width="10" height="64" rx="5" />
        <rect className="art-table" x="366" y="310" width="10" height="64" rx="5" />
      </svg>
    </figure>
  );
}
