type DeletionClient = {
  is_test_account?: boolean | null;
  vapi_assistant_id?: string | null;
  vapi_phone_number_id?: string | null;
};

function isLegacyPlaceholder(value: string | null | undefined): boolean {
  return !value || value.startsWith("asst_demo_") || value.startsWith("pn_demo_");
}

export function isClientDeletionLocked(client: DeletionClient): boolean {
  if (client.is_test_account) return true;
  return !isLegacyPlaceholder(client.vapi_assistant_id) || !isLegacyPlaceholder(client.vapi_phone_number_id);
}
