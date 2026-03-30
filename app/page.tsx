import { AuthTools } from "@/components/auth-tools";
import { MemoryFolders } from "@/components/memory-folders";
import { LogoutButton } from "@/components/logout-button";
import { UploadForm } from "@/components/upload-form";
import { HeartIcon, LockIcon } from "@/components/ui-icons";
import { getAiProviderStatus } from "@/lib/ai";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isSupabaseAuthConfigured } from "@/lib/supabase";
import { listMemories } from "@/lib/memory-store";

const defaultHeroSlides = [
  {
    id: "default-hero-1",
    imageUrl: "/hero-defaults/hero-1.jpg"
  },
  {
    id: "default-hero-2",
    imageUrl: "/hero-defaults/hero-2.jpg"
  }
];

export default async function HomePage() {
  const memories = await listMemories();
  const aiProvider = getAiProviderStatus();
  const heroSlides = defaultHeroSlides;

  return (
    <main className="page-shell">
      <header className="top-bar">
        <div className="brand-mark">
          <div className="brand-badge">♡</div>
          <div>
            <p className="brand-title">Naveen &amp; Aishwarya</p>
            <p className="brand-subtitle">
              {isSupabaseConfigured() ? "Cloud-backed private gallery" : "Private local gallery"}
            </p>
          </div>
        </div>

        <div className="top-actions">
          <div className="profile-pill">
            <span className="profile-avatar">N</span>
            <span>Naveen Kumar</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="story-hero story-hero-split">
        <div className="story-hero-copy">
          <div className="story-copy-inner">
            <p className="story-kicker">Planning your forever can feel beautifully simple</p>
            <h1>Our Love Story</h1>
            <p className="story-quote">Start our journey together.</p>
            <p className="story-body">
              Save your favourite photographs in elegant folders by date, and let
              each chapter hold the place, the day, and the feeling behind it.
            </p>
          </div>
        </div>
        <div className="story-hero-visual">
          {heroSlides.length > 0 ? (
            <div className="story-slider">
              {heroSlides.map((memory, index) => (
                <img
                  alt={`Memory slide ${index + 1}`}
                  className="story-hero-image story-slide"
                  key={memory.id}
                  src={memory.imageUrl}
                  style={{ animationDelay: `${index * 4}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="story-hero-placeholder">Upload your first photo to begin</div>
          )}
        </div>
      </section>

      <section className="upload-stage">
        <div className={`provider-status provider-status-${aiProvider.mode}`}>
          <span className="provider-status-dot" />
          <span>AI provider: {aiProvider.label}</span>
        </div>
        <UploadForm />
      </section>

      <section className="timeline-section access-section">
        <div className="section-heading section-heading-inline">
          <div>
            <p className="eyebrow section-icon-heading">
              <LockIcon className="inline-section-icon" />
              Access Tools
            </p>
            <h2>Private account controls</h2>
          </div>
          <p>Send reset links or invite a trusted user when cloud auth is active.</p>
        </div>
        <AuthTools allowSupabase={isSupabaseAuthConfigured()} />
      </section>

      <section className="timeline-section memories-section">
        <div className="section-heading section-heading-inline">
          <div>
            <p className="eyebrow section-icon-heading">
              <HeartIcon className="inline-section-icon" />
              Shared Memories
            </p>
            <h2>Folders by date</h2>
          </div>
          <p>
            Each folder opens a chapter from that day and reveals every photo
            with place, date, and romantic context.
          </p>
        </div>
        <MemoryFolders memories={memories} />
      </section>
    </main>
  );
}
