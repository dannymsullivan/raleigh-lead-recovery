export const messagingConsentVersion = "2026-10-27";

export const verificationConsentText = "I agree to receive one-time verification and account-access text messages from Snappy Leads at the mobile number provided. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. Consent is not a condition of purchase.";

export const alertConsentText = "I confirm that I control the alert number or have the recipient's express consent, and I agree that Snappy Leads may send transactional lead alerts and account notifications to that number. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. Consent is not a condition of purchase.";

export function buildVerificationSms(otp: string): string {
  return `Snappy Leads: Your verification code is ${otp}. It expires shortly. Reply STOP to unsubscribe; HELP for help.`;
}

export function buildLeadAlertSms(input: { businessName: string; contactName: string; phone: string; requestedTiming: string | null; dashboardUrl: string }): string {
  return `Snappy Leads alert for ${input.businessName}: ${input.contactName} wants to reconnect${input.requestedTiming ? ` (${input.requestedTiming})` : ""}. Call ${input.phone}. Open: ${input.dashboardUrl}. Reply STOP to unsubscribe; HELP for help.`;
}

export function hasAlertSmsConsent(client: { alert_phone?: string | null; owner_phone: string; alert_sms_consent_at?: string | null; alert_sms_consent_phone?: string | null }): boolean {
  const destination = normalizePhoneNumber(client.alert_phone || client.owner_phone);
  const consentedPhone = normalizePhoneNumber(client.alert_sms_consent_phone || "");
  return Boolean(client.alert_sms_consent_at && destination && consentedPhone === destination);
}
import { normalizePhoneNumber } from "./phone";
