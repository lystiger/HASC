// frontend/src/pages/AboutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const milestones = [
  { year: '2012', title: 'Founded in Hanoi', detail: 'Started as a focused industrial packaging supplier.' },
  { year: '2016', title: 'ISO 9001 Certified', detail: 'Quality system formalized for enterprise partners.' },
  { year: '2020', title: 'Expanded into Filters', detail: 'Broadened product range for manufacturing clients.' },
  { year: '2023', title: 'Chemicals Line Added', detail: 'Launched compliant specialty chemical offerings.' },
];

const gallery = [
  { src: '/img.webp', label: 'Warehouse Operations' },
  { src: '/hero-placeholder.svg', label: 'Quality Control Lab' },
  { src: '/hero-placeholder.svg', label: 'Logistics Fleet' },
  { src: '/hero-placeholder.svg', label: 'Packaging Line' },
];

const certifications = [
  { title: 'ISO 9001:2015', issuer: 'ISO', year: '2016', src: '/hero-placeholder.svg' },
  { title: 'Safety Compliance', issuer: 'Local Authority', year: '2021', src: '/hero-placeholder.svg' },
];

const AboutPage: React.FC = () => {
  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="/img.webp"
            alt="HASC VN headquarters"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/70" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-screen-xl flex-col gap-6 px-6 py-16">
          <p className="text-xs uppercase tracking-[0.4em] text-orange-200">
            Corporate Heritage
          </p>
          <h1 className="max-w-3xl text-4xl font-bold text-white md:text-5xl">
            Built for industrial scale with a focus on reliability and compliance.
          </h1>
          <p className="max-w-2xl text-base text-slate-100 md:text-lg">
            We support large-volume industrial contracts with disciplined operations, verified
            standards, and an infrastructure designed for long-term partnerships.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Foundations</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-industrial">
              Proof of momentum, year by year.
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              A concise view of the milestones that shaped our industrial readiness.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="border-l border-slate-200 pl-6">
              <ul className="space-y-6">
                {milestones.map((item) => (
                  <li key={item.year} className="relative">
                    <span className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-orange-500" />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                      <span className="timeline-year text-sm text-slate-500">{item.year}</span>
                      <div>
                        <p className="text-base font-semibold text-slate-800">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-screen-xl px-6 py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Infrastructure</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-industrial">
                Infrastructure in motion.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                A minimal glimpse behind the scenes of our operational backbone.
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {gallery.map((item) => (
              <figure
                key={item.label}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <img src={item.src} alt={item.label} className="h-56 w-full object-cover" loading="lazy" />
                <figcaption className="px-4 py-3 text-sm font-medium text-slate-700">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Standards</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-industrial">
              Commitment to verified standards.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Documentation that reflects operational maturity and compliance.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {certifications.map((cert) => (
                <div key={cert.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <img
                    src={cert.src}
                    alt={cert.title}
                    className="h-32 w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-slate-800">{cert.title}</p>
                    <p className="text-xs text-slate-500">
                      Issued by {cert.issuer} · {cert.year}
                    </p>
                  </div>
                </div>
              ))}
              {certifications.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Compliance documentation available on request.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Next Step</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-industrial">
              Ready to discuss enterprise supply needs?
            </h3>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md bg-orange-safety px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
