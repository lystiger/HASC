To finalize your Phase 1 setup, I have combined the map integration strategy with your verified UI layout. This .md serves as the official instruction set for your AI/developers to execute the location and contact logic.LOCATION_SPEC.md - Map & Contact Architecture1. Geographical AuthorityTarget: Công ty TNHH HASC Việt NamVerified Address: Canh Gara Oto 360, Thôn như Quỳnh, TT Như Quỳnh , Văn Lâm Hưng Yên Integration Logic (React/Vite)The map must be implemented as a Lazy-Loaded component to protect the 300ms interaction goal.Styling Hook (Industrial Blueprint Theme)To match the "Industrial Slate" palette (#0F172A) and the monochromatic Partner Network style:CSS Filter: grayscale(100%) invert(5%) contrast(1.1)Border: 1px solid #E2E8F03. Contact Component StructurePlace this section between the Product Catalog and the Partner Network ribbon.FeatureImplementationInteractive Map100% Width iframe with the verified address stringQuick Action"Open in Google Maps" button using https://goo.gl/maps/... linkLocale SupportMap labels must switch based on en.json or vi.json settingsContact InfoDisplay Phone, Email, and Address in JetBrains Mono for technical clarity4. Execution Code Block for AITypeScript/**
 * IMPLEMENTATION NOTE:
 * Use the Google Maps Embed API with the following Address String:
 * "Canh Gara Oto 360, Thôn như Quỳnh, TT Như Quỳnh , Văn Lâm Hưng Yên"
 * or let me do the location marking for you, just implement the system
 */

const MapSection = () => (

  <div className="relative w-full h-[450px] bg-slate-100 overflow-hidden">
    {/* Overlaying Info Card for Desktop */}
    <div className="absolute top-10 left-10 z-10 p-6 bg-white/95 border border-slate-200 shadow-xl max-w-sm hidden lg:block">
      <h3 className="font-inter font-bold text-slate-900 mb-2">Hanoi Headquarters</h3>
      <p className="font-mono text-sm text-slate-600 leading-relaxed">
        Room 1002, 10th Floor, 27 Le Van Luong St.
      </p>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-sm font-bold text-orange-600">Avg. Response: 24h</p>
      </div>
    </div>
    
    <iframe
      className="w-full h-full grayscale opacity-90 contrast-110"
      src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=27+Le+Van+Luong+Hanoi`}
      allowFullScreen
    />
  </div>
);
5. Acceptance Criteria[ ] Map renders without blocking the main thread.[ ] Grayscale styling is applied successfully.[ ] Mobile users can "Long Press" to open the location in native maps.[ ] Address matches the footer text exactly.