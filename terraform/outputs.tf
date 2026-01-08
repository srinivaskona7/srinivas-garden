output "subaccount_id" {
  value = btp_subaccount.kyma.id
}

output "kyma_dashboard_url" {
  value = btp_subaccount_environment_instance.kyma.dashboard_url
}
