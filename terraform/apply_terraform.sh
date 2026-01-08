#!/bin/bash
# Wrapper to run Terraform apply with auto-approval

# Ensure Terraform is initialized
terraform init

# Apply the configuration using values from terraform.tfvars
echo "Applying Terraform configuration..."
terraform apply -auto-approve
