/** The red asterisk that marks a required form field. */
export default function RequiredMark() {
  return (
    <span className="text-error ml-0.5" aria-hidden="true">
      *
    </span>
  );
}
