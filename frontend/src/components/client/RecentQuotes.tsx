import React from "react";

export default function RecentQuotes({
  quotes = [],
}: {
  quotes?: any[];
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-primary">
          Recent Quotations
        </h2>

        <button className="text-sm font-semibold text-primary">
          View All
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No quotations found.
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote: any) => (
            <div
              key={quote.projectId}
              className="border rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-primary text-base">
                    {quote.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {quote.city} • {quote.propertyType}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    Verified Quotes
                  </p>

                  <p className="font-bold text-primary">
                    {quote.quotationCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <p className="text-xs text-gray-400">
                    Lowest Quote
                  </p>

                  <p className="font-bold text-green-600">
                    ₹{quote.lowestQuote?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Highest Quote
                  </p>

                  <p className="font-bold text-red-600">
                    ₹{quote.highestQuote?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Latest
                  </p>

                  <p className="font-semibold">
                    {new Date(
                      quote.latestQuotationDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}