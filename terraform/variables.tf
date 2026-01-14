variable "globalaccount" {
  description = "The subdomain of the global account."
  type        = string
}

variable "existing_subaccount_id" {
  description = "The ID of the existing subaccount to use for Kyma."
  type        = string
}

variable "kyma_instance_name" {
  description = "The name of the Kyma environment instance."
  type        = string
  default     = "my-kyma-environment"
}

variable "kyma_plan" {
  description = "The plan for Kyma environment (e.g., free, azure, aws, trial)."
  type        = string
  default     = "trial"
}

