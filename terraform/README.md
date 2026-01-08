# Terraform Setup for Kyma on SAP BTP

This directory contains Terraform configuration to provision a Kyma environment on SAP Business Technology Platform (BTP).

## Prerequisites

1.  **Terraform Installed**: Ensure you have Terraform installed (`brew install terraform`).
2.  **SAP BTP Access**: You need a Global Account and permissions to create subaccounts and assign entitlements.
3.  **BTP Credentials**: You must be authenticated. You can set environment variables or use the BTP CLI login.
    *   `BTP_USERNAME`
    *   `BTP_PASSWORD`
    *   `BTP_GLOBALACCOUNT` (optional, can be passed as var)

## Files

*   `main.tf`: Defines resources (Subaccount, Entitlement, Environment Instance).
*   `variables.tf`: Input variables (Global Account, Region, etc.).
*   `versions.tf`: Provider configuration.
*   `outputs.tf`: Outputs (Subaccount ID, Dashboard URL).

## Usage

1.  **Initialize Terraform**:
    ```bash
    terraform init
    ```

2.  **Plan**:
    Create a `terraform.tfvars` file or pass variables via command line.
    ```bash
    terraform plan -var="globalaccount=YOUR_GLOBAL_ACCOUNT_SUBDOMAIN" \
                   -var="region=us10" \
                   -var="subaccount_name=my-kyma-test" \
                   -var="subaccount_subdomain=my-kyma-test-sd"
    ```

3.  **Apply**:
    ```bash
    terraform apply -var="globalaccount=YOUR_GLOBAL_ACCOUNT_SUBDOMAIN"
    ```

## Notes

*   Ensure your Global Account has enough quotas for the Kyma Runtime in the specified region.
*   The default plan is set to `free`. Change it to `azure`, `aws`, etc., if using a paid tier.
