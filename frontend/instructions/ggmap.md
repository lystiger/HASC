To finalize Phase 1, this document defines the map + contact integration for HASC VN.

LOCATION_SPEC.md - Map & Contact Architecture

1. Geographical Authority
Target: Công ty TNHH HASC Việt Nam
Verified Address: Cạnh Gara Oto 360, Thôn như Quỳnh, TT Như Quỳnh, Văn Lâm, Hưng Yên

2. Integration Logic (React/Vite)
The map must be a lazy-loaded component to protect the 300ms interaction goal.

3. Styling Hook (Industrial Blueprint Theme)
Palette: "Industrial Slate" (#0F172A)
Monochromatic map style:
- CSS Filter: grayscale(100%) invert(5%) contrast(1.1)
- Border: 1px solid #E2E8F0

4. Footer Placement (Updated)
Place the map beside the Contact Us content in the footer.
The map height should align with the contact block height for a balanced row.

Feature Implementation
Interactive Map: iframe using the verified address string.
Quick Action: "Open in Google Maps" button using a public share link (no API key).
Locale Support: labels must switch based on `en.json` / `vi.json`.
Contact Info: display Phone, Email, and Address in JetBrains Mono for technical clarity.

5. Execution Code Block for AI (No API Key)
TypeScript
/**
 * IMPLEMENTATION NOTE:
 * Use the public Google Maps Embed (no API key) for:
 * "Cạnh Gara Oto 360, Thôn như Quỳnh, TT Như Quỳnh, Văn Lâm, Hưng Yên"
 */

const MapSection = () => (
  <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
    <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-inter font-bold text-slate-900 mb-2">HASC VN Contact</h3>
      <p className="font-mono text-sm text-slate-600 leading-relaxed">
        Cạnh Gara Oto 360, Thôn như Quỳnh, TT Như Quỳnh, Văn Lâm, Hưng Yên
      </p>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-sm font-bold text-orange-600">Avg. Response: 24h</p>
      </div>
    </div>
    <div className="flex-1 overflow-hidden rounded-lg border border-slate-200">
      <iframe
        className="h-full w-full grayscale opacity-90 contrast-110"
        src="https://www.google.com/maps?q=C%E1%BA%A1nh+Gara+Oto+360,+Th%C3%B4n+nh%C6%B0+Qu%E1%BB%B3nh,+TT+Nh%C6%B0+Qu%E1%BB%B3nh,+V%C4%83n+L%C3%A2m,+H%C6%B0ng+Y%C3%AAn&output=embed"
        allowFullScreen
        loading="lazy"
      />
    </div>
  </div>
);

6. Acceptance Criteria
[ ] Map renders without blocking the main thread.
[ ] Grayscale styling is applied successfully.
[ ] Mobile users can "Long Press" to open the location in native maps.
[ ] Address matches the footer text exactly.
