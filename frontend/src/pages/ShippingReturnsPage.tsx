// frontend/src/pages/ShippingReturnsPage.tsx
import React from 'react';

const ShippingReturnsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans min-h-screen">
      <h1 className="text-4xl font-bold text-slate-industrial mb-8">Shipping & Returns</h1>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto space-y-4 text-gray-700">
        <p>
          This section outlines our policies regarding shipping and returns for products purchased through our service.
          Please review this information carefully.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Shipping Information</h2>
        <h3 className="text-xl font-semibold mb-1">Processing Time</h3>
        <p>
          All orders are processed within 1-3 business days. Orders are not shipped or delivered on weekends or holidays.
        </p>
        <h3 className="text-xl font-semibold mb-1">Shipping Rates & Delivery Estimates</h3>
        <p>
          Shipping charges for your order will be calculated and displayed at checkout.
          Delivery delays can occasionally occur.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Returns & Refunds Policy</h2>
        <h3 className="text-xl font-semibold mb-1">Return Eligibility</h3>
        <p>
          To be eligible for a return, your item must be unused and in the same condition that you received it.
          It must also be in the original packaging.
        </p>
        <h3 className="text-xl font-semibold mb-1">Refunds</h3>
        <p>
          Once your return is received and inspected, we will send you an email to notify you that we have received your returned item.
          We will also notify you of the approval or rejection of your refund.
        </p>
        <p>
          This is placeholder content. The full Shipping & Returns Policy will be provided upon legal review and business decision.
        </p>
      </div>
    </div>
  );
};

export default ShippingReturnsPage;
