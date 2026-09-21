import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import TopicChip from "@/components/ui/TopicChip";
import SessionsList from "@/components/classes/SessionsList";
import { SAMPLE_SUBJECT, SAMPLE_TOPIC, SAMPLE_TUTOR_ID, sampleSessions } from "./sampleData";

const VERIFIED_TOPICS = [SAMPLE_TOPIC, "Algebraic Expressions"];

/** A tutor as a learner sees them (`/learner/tutors/[id]`): anonymous ID, Verified Topics card, sessions. */
export default function TutorProfileSample() {
  return (
    <div className="space-y-3">
      <section className="card kt-card">
        <div className="card-body gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">Verified Topics</h3>
            <AnonymousIdBadge id={SAMPLE_TUTOR_ID} role="TUTOR" size="md" showIcon />
          </div>
          <div className="border border-base-200 bg-base-200/20 rounded-lg p-3 space-y-1.5">
            <span className="badge badge-neutral badge-sm text-2xs font-bold">{SAMPLE_SUBJECT}</span>
            <div className="flex flex-wrap gap-1">
              {VERIFIED_TOPICS.map((topic) => (
                <TopicChip key={topic} topic={topic} verified />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-3 p-5">
          <h3 className="text-sm font-bold">Upcoming sessions</h3>
          <SessionsList sessions={sampleSessions()} />
        </div>
      </section>
    </div>
  );
}
