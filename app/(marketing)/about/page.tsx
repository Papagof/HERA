import { Card } from "@/components/ui/Card";

const AMENITIES = [
  "Modern residential buildings with contemporary architecture",
  "24/7 security and surveillance system",
  "Well-maintained paved roads and street lighting",
  "Water supply and waste management systems",
  "Recreational facilities including green spaces",
  "Community center for social gatherings",
  "Reliable power supply infrastructure",
  "School proximity and educational facilities",
];

export default function AboutPage() {
  return (
    <div className="px-5 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">About Happyland Estate</h1>

        <Card className="mt-8 leading-relaxed text-slate-700 dark:text-slate-300">
          <h2 className="mb-5 text-xl font-bold text-slate-900 dark:text-white">Welcome to Happyland Estate</h2>
          <p className="mb-5">
            Happyland Estate is a premier residential community located at Oko-Ado along the
            Lekki-Epe Expressway in Lagos, Nigeria. Established with a vision to provide
            affordable yet quality living spaces, we have grown to become one of the most
            sought-after residential addresses in the Lekki axis.
          </p>

          <h3 className="mt-8 mb-3 text-lg font-bold text-slate-900 dark:text-white">Our Vision</h3>
          <p className="mb-5">
            To create a vibrant, secure, and sustainable residential community where families can
            thrive, and property owners can enjoy excellent returns on their investments.
          </p>

          <h3 className="mt-8 mb-3 text-lg font-bold text-slate-900 dark:text-white">Our Mission</h3>
          <p className="mb-5">
            To provide world-class estate management services, maintain high standards of security
            and infrastructure, and foster a strong sense of community among all residents and
            stakeholders.
          </p>

          <h3 className="mt-8 mb-3 text-lg font-bold text-slate-900 dark:text-white">Estate Amenities</h3>
          <ul className="mb-5 list-disc space-y-2 pl-5">
            {AMENITIES.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>

          <h3 className="mt-8 mb-3 text-lg font-bold text-slate-900 dark:text-white">
            Location & Accessibility
          </h3>
          <p className="mb-5">
            Situated at Oko-Ado on the Lekki-Epe Expressway, Happyland Estate enjoys excellent
            accessibility to major business districts, shopping centers, restaurants, and
            educational institutions.
          </p>

          <h3 className="mt-8 mb-3 text-lg font-bold text-slate-900 dark:text-white">Community Living</h3>
          <p>
            At Happyland Estate, we believe in building more than just houses — we build
            communities. Regular community events, neighborhood associations, and active
            engagement in estate development ensure that every resident is part of a thriving,
            supportive environment.
          </p>
        </Card>
      </div>
    </div>
  );
}
