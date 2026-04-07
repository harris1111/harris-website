---
title: "Migrating CI/CD from Jenkins to Tekton on EKS"
date: "2025-08-12"
tags: ["tekton", "jenkins", "cicd", "kubernetes", "aws"]
description: "How we migrated 3 pipelines from Jenkins to cloud-native Tekton, cutting build times by 30%"
published: true
---

# Migrating CI/CD from Jenkins to Tekton on EKS

Jenkins served us well, but managing a Jenkins server on Kubernetes felt wrong — a stateful Java monolith running on a platform designed for stateless containers. We migrated to Tekton.

## Why Tekton Over GitHub Actions

At Smart Loyalty we evaluated three options:

| | Jenkins | GitHub Actions | Tekton |
|--|---------|---------------|--------|
| Runs on | Separate server | GitHub cloud | Inside our K8s cluster |
| Cost | EC2 instance 24/7 | Per-minute billing | Uses existing cluster resources |
| Customization | Groovy scripts | YAML actions | K8s-native CRDs |
| Secrets | Jenkins credentials | GitHub secrets | K8s secrets (already managed) |

Tekton won because:
- Runs inside EKS — no separate infrastructure
- Uses Kubernetes secrets we already managed
- Pipelines are CRDs — `kubectl` is the CLI
- Scales to zero when idle (with KEDA)

## Migration Strategy

We migrated 3 pipelines incrementally:

**Week 1:** Simplest pipeline (lint + test for a Node.js service)
**Week 2:** Docker build + push pipeline
**Week 3:** Full deployment pipeline with Helm

Each pipeline ran in parallel with Jenkins for 1 week before we cut over.

## Tekton Pipeline Example

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: build-and-deploy
spec:
  params:
    - name: repo-url
    - name: image-tag
  workspaces:
    - name: source
  tasks:
    - name: clone
      taskRef:
        name: git-clone
      params:
        - name: url
          value: $(params.repo-url)
      workspaces:
        - name: output
          workspace: source

    - name: build-push
      taskRef:
        name: kaniko
      runAfter: [clone]
      params:
        - name: IMAGE
          value: "registry.example.com/app:$(params.image-tag)"
      workspaces:
        - name: source
          workspace: source

    - name: deploy
      taskRef:
        name: helm-upgrade
      runAfter: [build-push]
```

## Challenges

### Early Ecosystem

Tekton was still maturing when we adopted it. Missing features we had to build ourselves:

- **No built-in caching.** We wrote a custom Task that saves/restores node_modules to a PVC.
- **No dashboard notifications.** Built a Tekton EventListener that posts to Slack.
- **Limited debugging.** `tkn logs` was our best friend. No equivalent of Jenkins' Blue Ocean UI.

### Workspace Management

Tekton workspaces (shared volumes between tasks) were the trickiest part. We settled on using PVCs with `ReadWriteOnce` — one build at a time per workspace, but simple.

## Results

- **Build time:** 30% faster (no Jenkins startup overhead)
- **Resource efficiency:** 25% improvement (KEDA scales Tekton pods to zero)
- **Cost:** Eliminated dedicated Jenkins EC2 instance ($150/month saved)
- **Developer experience:** `tkn pipeline start build-and-deploy` replaces clicking through Jenkins UI

## Lessons

1. **Migrate incrementally.** Run old and new in parallel before cutting over.
2. **Tekton's learning curve is steep** if your team doesn't know Kubernetes. It's powerful but assumes K8s fluency.
3. **KEDA scale-to-zero is the killer feature.** Our Tekton pods only consume resources during actual builds.
