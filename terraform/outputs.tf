output "subaccount_id" {
  value = data.btp_subaccount.existing.id
}

output "kyma_dashboard_url" {
  value = btp_subaccount_environment_instance.kyma.dashboard_url
}

