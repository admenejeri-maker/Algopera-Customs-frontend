---
name: infrastructure-as-code
description: >
  Infrastructure as Code with Terraform, Pulumi, and CloudFormation.
  Covers cloud resource provisioning, state management, and IaC best
  practices. Use when provisioning or managing cloud infrastructure.
---

# Infrastructure as Code

Provision and manage cloud infrastructure declaratively using Terraform,
Pulumi, or CloudFormation.

## Use this skill when

- Provisioning cloud resources (compute, storage, networking)
- Setting up Terraform or Pulumi projects
- Managing infrastructure state
- Creating reusable infrastructure modules
- Migrating manual infrastructure to code

## Do not use this skill when

- Writing application Docker files — use `containerization`
- Setting up CI/CD — use `ci-cd-pipelines`
- Managing application deployments — use `deployment-strategies`

## Instructions

### 1. Terraform Basics

```hcl
# main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "prod"
  }
}

resource "google_cloud_run_v2_service" "api" {
  name     = "tax-agent-api"
  location = "europe-west1"

  template {
    containers {
      image = "gcr.io/my-project/api:latest"
      resources {
        limits = { memory = "512Mi", cpu = "1" }
      }
      env {
        name  = "MONGO_URI"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mongo_uri.id
            version = "latest"
          }
        }
      }
    }
  }
}
```

### 2. IaC Principles

- **Idempotent:** Running twice produces same result
- **Version controlled:** All infra in Git
- **Modular:** Reusable modules for common patterns
- **State managed:** Remote state with locking
- **Plan before apply:** Always review `terraform plan`

### 3. State Management

| Approach | Pros | Cons |
|----------|------|------|
| Local state | Simple | No sharing, no locking |
| GCS/S3 backend | Shared, versioned | Setup required |
| Terraform Cloud | Managed, UI | Vendor lock-in |

### 4. Directory Structure

```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf
│       └── terraform.tfvars
├── modules/
│   ├── cloud-run/
│   ├── database/
│   └── networking/
└── shared/
    └── variables.tf
```

## Workflow Integration

**Invoked by:**
- `/ops-check` — infrastructure audit
- `/opus-planning` — infrastructure architecture planning

**After using this skill:** Apply with `terraform plan` → `terraform apply`, verify with `verification-before-completion`.

**Related skills:** `containerization`, `ci-cd-pipelines`, `deployment-strategies`
