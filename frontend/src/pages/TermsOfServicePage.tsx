// frontend/src/pages/TermsOfServicePage.tsx
import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans min-h-screen">
      <h1 className="text-4xl font-bold text-slate-industrial mb-8">Terms of Service</h1>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto space-y-4 text-gray-700">
        <p>
          Please read these terms and conditions carefully before using Our Service.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Acknowledgement</h2>
        <p>
          These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company.
          These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
        </p>
        <p>
          Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions.
          These Terms and Conditions apply to all visitors, users and others who access or use the Service.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Links to Other Websites</h2>
        <p>
          Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company.
        </p>
        <p>
          The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.
          You further acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such web sites or services.
        </p>
        <p>
          This is placeholder content. The full Terms of Service will be provided upon legal review.
        </p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
