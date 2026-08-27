import { notFound } from 'next/navigation';
import { getMentorBySlug, getAllMentors } from '@/data/mentors';
import MentorCredentialClient from './MentorCredentialClient';

export async function generateStaticParams() {
  const allMentors = getAllMentors();
  return allMentors.map((m) => ({
    slug: m.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const mentor = getMentorBySlug(slug);

  if (!mentor) {
    return {
      title: "Mentor Credential Not Found | Hacker's Unity",
      description: "The requested mentor credential could not be verified on Hacker's Unity.",
    };
  }

  return {
    title: `${mentor.name} — Official Mentor Credential | Hacker's Unity`,
    description: `Official Verified Credential for ${mentor.name}, ${mentor.designation} at ${mentor.company}. Credential ID: ${mentor.credentialId}. Verified by Hacker's Unity.`,
    keywords: [
      mentor.name,
      mentor.shortName,
      'Hackers Unity Mentor',
      'Verified Mentor',
      'Hackathon Jury',
      mentor.company,
      mentor.credentialId,
      'Technical Credential',
      'Software Architecture',
    ],
    openGraph: {
      title: `Official Credential: ${mentor.name} | Hacker's Unity`,
      description: `Verified Official Mentor & Jury Credential (${mentor.credentialId}). ${mentor.designation} at ${mentor.company}.`,
      type: 'profile',
      images: [
        {
          url: mentor.photo,
          alt: `${mentor.name} - Hacker's Unity Verified Mentor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Official Credential: ${mentor.name} | Hacker's Unity`,
      description: `Verified Official Mentor & Jury Credential (${mentor.credentialId}).`,
      images: [mentor.photo],
    },
  };
}

export default async function MentorCredentialPage({ params }) {
  const { slug } = await params;
  const mentor = getMentorBySlug(slug);

  if (!mentor) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Mentor Credential Not Found
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '24px' }}>
          The credential identifier or URL slug provided does not match an active official record in the Hacker&apos;s Unity Mentor Registry.
        </p>
      </div>
    );
  }

  // Structured Data Schema for Search Engines & Verification Robots
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: mentor.name,
    jobTitle: mentor.designation,
    worksFor: {
      '@type': 'Organization',
      name: mentor.company,
    },
    image: mentor.photo,
    description: mentor.headline,
    knowsAbout: mentor.skills,
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name: 'Official Verified Mentor & Hackathon Jury',
      credentialCategory: 'Technical Mentorship & Jury Recognition',
      recognizedBy: {
        '@type': 'Organization',
        name: "Hacker's Unity",
        url: 'https://www.hackersunity.com',
      },
      validIn: {
        '@type': 'AdministrativeArea',
        name: 'India & Global',
      },
      identifier: mentor.credentialId,
      dateCreated: '2026-08',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MentorCredentialClient mentor={mentor} />
    </>
  );
}
