import { profile } from "@my-portfolio/content";
import ContactForm from "./ContactForm";
import CopyEmail from "./CopyEmail";
import Cta from "./Cta";
import Reveal from "./Reveal";
import TimeZoneFit from "./TimeZoneFit";
import { CONTACT_FORM_ENABLED, HAS_RESUME, RESUME_URL } from "../lib/site";

/** Shared by the home page and every project page. */
export default function Contact() {
  const { availability: a } = profile;
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <Reveal className={CONTACT_FORM_ENABLED ? "contact-grid contact-grid-form" : "contact-grid"}>
          <div>
            <p className="lbl">Contact</p>
            <h2>
              Hiring for a <span>backend or full-stack</span> role? Let's talk.
            </h2>
            <p className="s">
              {a.relocation
                ? "Open to relocation with visa sponsorship, or remote work"
                : "Open to remote work"}{" "}
              across time zones. Email is the fastest way to reach me.
            </p>
          </div>
          <div>
            <div className="mail">
              <span>
                {profile.email.split("@")[0]}
                <span className="at">@</span>
                {profile.email.split("@")[1]}
              </span>
              <CopyEmail email={profile.email} />
            </div>
            <div className="links">
              <Cta kind="mail" email={profile.email} variant="primary">
                Email me
              </Cta>
              {HAS_RESUME && (
                <Cta
                  kind="download"
                  href={RESUME_URL}
                  fileName="Chandra_Moorthy_Resume.pdf"
                >
                  Resume (PDF)
                </Cta>
              )}
              <Cta
                kind="external"
                href={profile.linkedin}
                label={`${profile.name} on LinkedIn`}
              >
                LinkedIn
              </Cta>
              <Cta
                kind="external"
                href={profile.github}
                label={`${profile.name} on GitHub`}
              >
                GitHub
              </Cta>
            </div>
            <p className="hours">
              Replies within <b>{profile.replyTime}</b> · Working hours{" "}
              <b>{profile.workingHours}</b>
            </p>
            <TimeZoneFit />
          </div>
          {CONTACT_FORM_ENABLED && (
            <div className="contact-form">
              <ContactForm />
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
