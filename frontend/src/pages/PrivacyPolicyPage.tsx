// frontend/src/pages/PrivacyPolicyPage.tsx
import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans min-h-screen">
      <h1 className="text-4xl font-bold text-slate-industrial mb-8">Privacy Policy</h1>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto space-y-4 text-gray-700">
        <p>
          This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information
          when You use the Service and tells You about Your privacy rights and how the law protects You.
        </p>
        <p>
          We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection
          and use of information in accordance with this Privacy Policy.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Interpretation and Definitions</h2>
        <h3 className="text-xl font-semibold mb-1">Interpretation</h3>
        <p>
          The words of which the initial letter is capitalized have meanings defined under the following conditions.
          The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
        </p>
        <h3 className="text-xl font-semibold mb-1">Definitions</h3>
        <ul>
          <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
          <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to HASC VN.</li>
          <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website,
            containing the details of Your browsing history on that website among its many uses.</li>
          <li><strong>Country</strong> refers to: Vietnam</li>
        </ul>
        <p>
          This is placeholder content. The full Privacy Policy will be provided upon legal review.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
