/**
 * Single source of truth for the legal/company details shown on the About,
 * Terms and Privacy pages.
 *
 * TODO before going live: the values marked PLACEHOLDER must be replaced with
 * the real registered details. Razorpay checks these during activation, and
 * publishing a wrong CIN/GSTIN is worse than publishing none.
 */
export const COMPANY = {
  legalName: "ConstroBID Technologies Pvt. Ltd.",
  brandName: "ConstroBID",

  // PLACEHOLDER — from the Certificate of Incorporation
  cin: "[CIN — add before going live]",
  // PLACEHOLDER — omit the line entirely if not GST registered
  gstin: "[GSTIN — add before going live]",

  registeredAddress:
    "12th Floor, Trade Towers, Outer Ring Road, Bangalore, Karnataka, India",

  supportEmail: "Anirban@constrobid.com",
  // PLACEHOLDER — Razorpay expects a reachable support number
  supportPhone: "[Support phone — add before going live]",

  // India's DPDP Act requires a named contact for data grievances.
  grievanceOfficer: {
    name: "[Grievance Officer name — add before going live]",
    email: "Anirban@constrobid.com",
  },

  jurisdiction: "Bengaluru, Karnataka",

  boqUnlockFeeInr: 29,

  lastUpdated: "18 August 2026",
} as const;
