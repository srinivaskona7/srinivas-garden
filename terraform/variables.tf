variable "globalaccount" {
  description = "The subdomain of the global account."
  type        = string
}

variable "region" {
  description = "The region where the subaccount shall be created."
  type        = string
  default     = "us10"
}

variable "subaccount_name" {
  description = "The name of the subaccount."
  type        = string
  default     = "my-kyma-subaccount"
}

variable "subaccount_subdomain" {
  description = "The subdomain of the subaccount."
  type        = string
  default     = "my-kyma-subaccount-sd"
}

variable "kyma_instance_name" {
  description = "The name of the Kyma environment instance."
  type        = string
  default     = "my-kyma-environment"
}

variable "kyma_plan" {
    description = "The plan for Kyma environment (e.g., free, azure, aws)."
    type        = string
    default     = "free"
}
