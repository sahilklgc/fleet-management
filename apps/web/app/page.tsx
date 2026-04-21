import { APP_SECTIONS, DAILY_PRIORITIES } from "../src/lib/content";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">LGC Fleet Management</p>
          <h1>Build the operations control center first.</h1>
          <p className="lede">
            The first release should make dispatch, managers, and workers faster today while keeping the
            backend ready for Geotab, geofencing, and mobile workflows later.
          </p>
        </div>

        <div className="hero-panel">
          <h2>First milestone</h2>
          <p>
            Import stops, create routes, assign workers and vehicles, complete stops, and let managers see
            daily progress with a full audit trail.
          </p>
        </div>
      </section>

      <section className="grid">
        {APP_SECTIONS.map((section) => (
          <article className="card" key={section.title}>
            <p className="card-kicker">{section.kicker}</p>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </article>
        ))}
      </section>

      <section className="roadmap">
        <div>
          <p className="eyebrow">Next up</p>
          <h2>Daily operating priorities</h2>
        </div>

        <ol className="priority-list">
          {DAILY_PRIORITIES.map((priority) => (
            <li key={priority}>{priority}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
