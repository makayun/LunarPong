FROM hashicorp/vault

# ENV VAULT_LOCAL_CONFIG="{\
#   \"api_addr\": \"http://vault:8200\",\
#   \"storage\": {\"file\": {\"path\": \"/vault/file\"}},\
#   \"listener\": [{\"tcp\": {\"address\": \"0.0.0.0:8200\", \"tls_disable\": true}}],\
#   \"default_lease_ttl\": \"168h\",\
#   \"max_lease_ttl\": \"720h\",\
#   \"ui\": true\
# }"

# ENV VAULT_LOCAL_CONFIG="{\
#   \"api_addr\": \"http://vault:8200\",\
#   \"listener\": [{\"tcp\": {\"address\": \"0.0.0.0:8200\", \"tls_disable\": true}}],\
#   \"seal\": {\
#     \"gcpckms\": {\
#       \"credentials\": \"/vault/config/vault-gcp-creds.json\",\
#       \"project\": \"pong-463310\",\
#       \"region\": \"global\",\
#       \"key_ring\": \"vault-keyring\",\
#       \"crypto_key\": \"vault-key\"\
#     }\
#   },\
#   \"storage\": {\"file\": {\"path\": \"/vault/file\"}},\
#   # \"storage\": {\
#   #   \"gcs\": {\
#   #     \"bucket\": \"pong-vault-storage\",\
#   #     \"credentials\": \"/vault/config/vault-gcp-creds.json\"\
#   #   }\
#   # },\
#   \"default_lease_ttl\": \"168h\",\
#   \"max_lease_ttl\": \"720h\",\
#   \"ui\": true\
# }"
# Copy the GCP credentials file into the container
RUN apk add curl
COPY --chmod=0444 vault-gcp-creds.json /vault/config/vault-gcp-creds.json
# COPY --chmod=0444 local.json /vault/config/local.json


# LABEL keep=true
