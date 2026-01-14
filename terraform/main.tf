# Use existing subaccount instead of creating new one
data "btp_subaccount" "existing" {
  id = var.existing_subaccount_id
}

resource "btp_subaccount_entitlement" "kyma" {
  subaccount_id = data.btp_subaccount.existing.id
  service_name  = "kymaruntime"
  plan_name     = var.kyma_plan
  amount        = 1
}

resource "btp_subaccount_environment_instance" "kyma" {
  subaccount_id    = data.btp_subaccount.existing.id
  name             = var.kyma_instance_name
  environment_type = "kyma"
  service_name     = "kymaruntime"
  plan_name        = var.kyma_plan
  parameters       = jsonencode({
    name = var.kyma_instance_name
  })

  depends_on = [btp_subaccount_entitlement.kyma]
}

