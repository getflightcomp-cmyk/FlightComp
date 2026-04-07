export type ClaimStatus =
  | 'authorized'          // User signed assignment of rights
  | 'letter_generated'    // Claim letter created by Claude
  | 'submitted'           // Sent to airline
  | 'awaiting_response'   // Waiting for airline reply
  | 'accepted'            // Airline agreed to pay
  | 'rejected'            // Airline denied the claim
  | 'more_info_needed'    // Airline requested additional info
  | 'followup_sent'       // We sent a follow-up
  | 'escalated'           // Sent to national aviation authority
  | 'resolved';           // Final state — paid out or withdrawn

export interface ClaimEvent {
  timestamp: string;
  action: string;         // e.g. "claim_created", "letter_generated", "email_sent"
  details: string;
  triggeredBy: 'system' | 'admin' | 'airline';
}

export interface Claim {
  id: string;                    // UUID, matches authorization ID
  authorizationId: string;       // from /authorize submission
  status: ClaimStatus;
  regulation: 'EU261' | 'UK261' | 'APPR' | 'SHY';

  // Passenger info
  passengerName: string;
  passengerEmail: string;
  passengerAddress: string;

  // Flight info
  airline: string;
  airlineIataCode: string | null;
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  disruptionType: string;
  bookingReference: string | null;
  scheduledArrival: string | null;
  actualArrival: string | null;
  description: string | null;

  // Compensation
  estimatedCompensation: number | null;  // in EUR, GBP, or CAD
  currency: 'EUR' | 'CAD' | 'GBP';
  feePercentage: number;                 // 29

  // Claim letter
  claimLetterText: string | null;
  claimLetterGeneratedAt: string | null;

  // Submission
  airlineEmail: string | null;
  airlineFormUrl: string | null;
  submittedAt: string | null;
  submittedVia: 'email' | 'form_manual' | null;

  // Response tracking
  airlineResponseReceived: boolean;
  airlineResponseDate: string | null;
  airlineResponseSummary: string | null;
  airlineResponseClassification: 'accepted' | 'rejected' | 'more_info' | null;

  // Follow-up
  followUpCount: number;
  lastFollowUpDate: string | null;
  escalatedToAuthority: boolean;
  escalationAuthority: string | null;    // e.g. "UK CAA", "CTA", "SHGM"
  escalationDate: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;

  // History log
  history: ClaimEvent[];

  // Test mode
  isTestClaim: boolean;
}
