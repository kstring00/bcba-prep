import Script from "next/script";

// Microsoft Clarity project IDs are public tracking identifiers, not secrets.
//
// There is no hardcoded default. A previous fallback meant analytics ran
// against one specific project from every environment — including local and
// preview builds — polluting the production figures and making the tag
// impossible to turn off without a code change. Tracking is now off unless
// NEXT_PUBLIC_CLARITY_PROJECT_ID is set for that environment.
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

function validProjectId(value: string | undefined): value is string {
  return Boolean(value && /^[a-zA-Z0-9]+$/.test(value));
}

export function MicrosoftClarity() {
  if (!validProjectId(CLARITY_PROJECT_ID)) return null;

  const snippet = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
  `;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
