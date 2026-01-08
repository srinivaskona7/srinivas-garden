resource "btp_subaccount" "kyma" {
  name      = var.subaccount_name
  subdomain = var.subaccount_subdomain
  region    = var.region
}

resource "btp_subaccount_entitlement" "kyma" {
  subaccount_id = btp_subaccount.kyma.id
  service_name  = "kymaruntime"
  plan_name     = var.kyma_plan
  amount        = 1
}

resource "btp_subaccount_environment_instance" "kyma" {
  subaccount_id    = btp_subaccount.kyma.id
  name             = var.kyma_instance_name
  environment_type = "kyma"
  service_name     = "kymaruntime"
  plan_name        = var.kyma_plan
  parameters       = jsonencode({
    name = var.kyma_instance_name
  })

  depends_on = [btp_subaccount_entitlement.kyma]
}
