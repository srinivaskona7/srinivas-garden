terraform {
  required_providers {
    btp = {
      source  = "SAP/btp"
      version = "~> 1.0"
    }
  }
}

provider "btp" {
  globalaccount = var.globalaccount
  # Credentials can be sourced from env vars BTP_USERNAME, BTP_PASSWORD or via CLI login
}
