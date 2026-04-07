import Link from "next/link";
import { Card, Badge, Avatar, Stars } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

// TODO: Replace with Prisma query + Meilisearch
// import { prisma } from "@/lib/prisma";
// import { searchFreelancers } from "@/lib/search";

const freelancers = [
  { id: "1", name: "Lena Bergström", country: "Sweden", flag: "🇸🇪", title: "Senior React & TypeScript Developer", bio: "Full-stack developer with 8 years of experience. Specializing in React, TypeScript, and Node.js for logistics and fintech.", skills: ["React", "TypeScript", "Node.js", "AWS", "Tailwind CSS"], hourlyRate: 95, rating: 4.9, reviews: 47, completedProjects: 52, availability: "available" as const },
  { id: "2", name: "Marco Rossi", country: "Italy", flag: "🇮🇹", title: "UI/UX Designer & Brand Strategist", bio: "Award-winning designer helping European startups build memorable brands. Expert in Figma and design systems.", skills: ["Figma", "UI/UX", "Branding", "Illustration", "Webflow"], hourlyRate: 85, rating: 4.8, reviews: 31, completedProjects: 38, availability: "available" as const },
  { id: "3", name: "Clara Jansen", country: "Netherlands", flag: "🇳🇱", title: "Data Scientist & ML Engineer", bio: "Specializing in predictive analytics, NLP, and recommendation systems for e-commerce and fintech.", skills: ["Python", "TensorFlow", "SQL", "Spark", "NLP"], hourlyRate: 110, rating: 4.9, reviews: 22, completedProjects: 24, availability: "busy" as const },
  { id: "4", name: "Erik Müller", country: "Germany", flag: "🇩🇪", title: "DevOps & Cloud Infrastructure", bio: "AWS certified architect. Kubernetes, Terraform, and CI/CD specialist for enterprise-scale applications.", skills: ["AWS", "Kubernetes", "Terraform", "Docker", "Go"], hourlyRate: 100, rating: 4.9, reviews: 29, completedProjects: 31, availability: "available" as const },
  { id: "5", name: "Isabelle Dupont", country: "France", flag: "🇫🇷", title: "SEO & Content Strategist", bio: "Multilingual content expert helping businesses grow organic traffic across European markets.", skills: ["SEO", "Content Strategy", "Copywriting", "Analytics", "WordPress"], hourlyRate: 75, rating: 4.7, reviews: 19, completedProjects: 22, availability: "available" as const },
];

export const metadata = { title: "Find Talent" };

export default function FreelancersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight font-serif mb-4">
        Find Talent
      </h1>

      {/* Search — will be a client component with debounced Meilisearch */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cream-200 bg-white">
          <span className="text-midnight-200">🔍</span>
          <input
            placeholder="Search by name, skill, or title..."
            className="flex-1 border-none outline-none text-sm font-sans bg-transparent placeholder:text-cream-300"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        {freelancers.map((f) => (
          <Link key={f.id} href={`/freelancers/${f.id}`}>
            <Card hover className="h-full">
              <div className="flex gap-3 mb-3">
                <Avatar name={f.name} size="lg" online={f.availability === "available"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-midnight font-serif truncate">
                      {f.name}
                    </span>
                    <span>{f.flag}</span>
                    {f.rating >= 4.8 && (
                      <Badge variant="info">Top Rated</Badge>
                    )}
                  </div>
                  <div className="text-xs text-midnight-300 truncate">
                    {f.title}
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-midnight-300 leading-relaxed mb-3 line-clamp-2">
                {f.bio}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {f.skills.slice(0, 4).map((s) => (
                  <Badge key={s} variant="muted">{s}</Badge>
                ))}
                {f.skills.length > 4 && (
                  <Badge variant="muted">+{f.skills.length - 4}</Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-midnight-300">
                  <span className="flex items-center gap-1">
                    <Stars rating={f.rating} size="xs" />
                    {f.rating} ({f.reviews})
                  </span>
                  <span>{f.completedProjects} projects</span>
                </div>
                <span className="text-base font-bold text-midnight font-serif">
                  {formatCurrency(f.hourlyRate)}/hr
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
