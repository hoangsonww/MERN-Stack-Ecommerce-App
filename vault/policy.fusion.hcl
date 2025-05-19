# Allow the app to read its secrets under secret/data/fusion-electronics/*
path "secret/data/fusion-electronics/*" {
  capabilities = ["read", "list"]
}

# Allow dynamic database credentials
path "database/creds/fusion-electronics-db" {
  capabilities = ["read"]
}

# Deny access to all other secret paths
path "*" {
  capabilities = ["deny"]
}
