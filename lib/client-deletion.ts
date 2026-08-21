type DeletionClient = {
  is_test_account?: boolean | null;
  provisioned_phone_number?: string | null;
};

export function isClientDeletionLocked(client: DeletionClient): boolean {
  if (client.is_test_account) return true;
  return Boolean(client.provisioned_phone_number);
}
