FROM hashicorp/vault

ENV VAULT_LOCAL_CONFIG="{\"api_addr\": \"http://vault:8200\",\"storage\":{\"file\":{\"path\":\"/vault/file\"}},\"listener\":[{\"tcp\":{\"address\":\"0.0.0.0:8200\",\"tls_disable\":true}}],\"default_lease_ttl\":\"168h\",\"max_lease_ttl\":\"720h\",\"ui\":true}"

# LABEL keep=true
