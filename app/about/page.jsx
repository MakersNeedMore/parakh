import Navbar from '../../components/Navbar';
import './about.css';

export const metadata = {
  title: 'About',
  description:
    'Parakh detects deepfake images using AI/ML models. Learn about the problem we are solving, what each team member has built, and who we are.',
};

const contributions = [
     {
    work: 'Built the landing page, about page and login page, and handled model testing.',
    name: 'Yash Gupta',
  },
  {
    work:
      'Researched open-source models , built the backend .',
    name: 'Shivang Saxena',
  },
  {
    work:
      'Working on the data analytics part and handling the database.',
    name: 'Charvi Goyal',
  },
  {
    work: 'AI/ML model training.',
    name: 'Aditya Verma',
  },
   {
    work: 'Technical writer: documentation and project write-ups.',
    name: 'Agrima Tripathi',
  },
];

const team = [
  { name: 'Yash Gupta', role: 'Frontend Developer', img: '/assets/team/yash-gupta.jpg' },
  { name: 'Aditya Verma', role: 'AI/ML & Backend', img: '/assets/team/aditya-verma.jpg' },
  { name: 'Shivang Saxena', role: 'Backend & Auth', img: '/assets/team/shivang-saxena.png' },
  { name: 'Tanu Thakur', role: 'Backend, Database & Auth', img: '/assets/team/tanu.jpg' },
  { name: 'Charvi Goyal', role: 'Data Science & Database', img: '/assets/team/charvi-goyal.jpg' },
  { name: 'Agrima Tripathi', role: 'Technical Writer', img: '/assets/team/agrima-tripathi.jpg' },

];

export default function AboutPage() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="about-main">
        {/* ---------- Project summary ---------- */}
        <section className="about-hero">
          <span className="about-kicker">About Parakh</span>
          <h1 className="about-title">Telling real images from fake ones.</h1>
        </section>

        <section className="about-summary">
          <div className="about-card">
            <span className="about-card-label">The problem</span>
            <p>
              Deepfake images are getting more realistic every day. They are used to spread
              misinformation, impersonate people and damage trust in what we see online, and
              they are very hard to spot with the naked eye.
            </p>
          </div>
          <div className="about-card">
            <span className="about-card-label">What we are solving</span>
            <p>
              Parakh catches deepfake images using our AI/ML models. Upload an image and the
              models analyse it and return a clear result with a confidence score, so you can
              tell whether it is authentic or synthetic.
            </p>
          </div>
        </section>

        {/* ---------- Contributions ---------- */}
        <section className="about-section" aria-labelledby="contrib-title">
          <h2 id="contrib-title" className="about-section-title">Contributions</h2>
          <ol className="contrib-list">
            {contributions.map((c) => (
              <li key={c.name} className="contrib-item">
                <span className="contrib-dot" aria-hidden="true" />
                <p className="contrib-work">{c.work}</p>
                <span className="contrib-name">{c.name}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Team ---------- */}
        <section className="about-section" aria-labelledby="team-title">
          <h2 id="team-title" className="about-section-title">MnM Developers </h2>
          <div className="about-team-grid">
            {team.map((m) => (
              <div key={m.name} className="about-team-card">
                <img src={m.img} alt={m.name} className="about-team-img" />
                <span className="about-team-name">{m.name}</span>
                <span className="about-team-role">{m.role}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}