---
title: "Migrating CI/CD from Jenkins to Tekton on EKS"
date: "2025-08-12"
tags: ["tekton", "jenkins", "cicd", "kubernetes", "aws"]
description: "How we migrated 3 pipelines from Jenkins to cloud-native Tekton, cutting build times by 30%"
published: true
---

# Migrating CI/CD from Jenkins to Tekton on EKS

Jenkins served us well for two years. But managing a Jenkins server on Kubernetes felt increasingly wrong — a stateful Java monolith with a filesystem-backed configuration, running on a platform designed for stateless containers. Every Jenkins upgrade was a gamble. Plugin compatibility issues. Groovy scripts that nobody understood. A 4GB JVM heap that ballooned to 8GB during parallel builds and got OOM-killed by Kubernetes.

The final straw was a Monday morning where Jenkins refused to start after a weekend node migration. The persistent volume corrupted during the move. We spent 6 hours rebuilding the Jenkins config from memory and Slack messages. That afternoon, I opened a Jira ticket: "Evaluate Tekton as Jenkins replacement."

This is the story of that migration — the evaluation, the incremental approach, the technical challenges, and the results after 4 months of running Tekton in production.

## Why Tekton Won the Evaluation

At Smart Loyalty, we evaluated three options over a 2-week spike:

| Criteria | Jenkins | GitHub Actions | Tekton |
|----------|---------|---------------|--------|
| **Runs on** | Separate server (stateful pod) | GitHub's cloud infra | Inside our EKS cluster |
| **Cost** | EC2 instance 24/7 ($150/mo) | Per-minute billing (~$200/mo est.) | Uses existing cluster resources |
| **Configuration** | Groovy + XML + UI clicking | YAML in .github/ | Kubernetes CRDs |
| **Secrets** | Jenkins credentials store | GitHub secrets | K8s secrets (already managed) |
| **Scaling** | Jenkins agents (complex) | Auto (GitHub-managed) | Kubernetes pods (native) |
| **Debugging** | Blue Ocean UI / console output | Web UI / logs API | `kubectl logs` / `tkn` CLI |
| **Vendor lock-in** | Low (self-hosted) | High (GitHub-specific) | Low (K8s-native CRDs) |
| **Idle cost** | $150/mo (runs 24/7) | $0 (pay per use) | $0 (KEDA scales to zero) |

GitHub Actions was the easy choice — familiar, well-documented, great ecosystem. But we rejected it for two reasons:

1. **Cost at scale**: Our build times averaged 12 minutes. With 3 pipelines running ~40 times/day, GitHub Actions would cost ~$200/month. Tekton uses existing EKS compute that we're already paying for.

2. **Secrets management**: We already managed secrets in Kubernetes (ExternalSecrets + AWS Secrets Manager). GitHub Actions would require duplicating secrets in GitHub's secrets store — a second source of truth, a second rotation process, a second audit trail.

Tekton won because it's Kubernetes-native: pipelines are CRDs, execution is pods, secrets are K8s secrets, scaling is K8s autoscaling. `kubectl` is the CLI. If you know Kubernetes, you know Tekton.

## Understanding Tekton's Architecture

Tekton's core concepts map to Kubernetes primitives:

```
Tekton Concept     K8s Primitive     Description
─────────────────────────────────────────────────────
Task               Pod spec          A sequence of steps (containers)
TaskRun            Pod               An execution of a Task
Pipeline           No direct equiv.  A DAG of Tasks
PipelineRun        Set of Pods       An execution of a Pipeline
Workspace          PVC / ConfigMap   Shared storage between Tasks
Trigger            EventListener     Webhook → PipelineRun creator
```

The key mental model: a Task is a pod template. Each step in a Task runs as a container in that pod. Steps share the pod's filesystem (`/workspace`). Tasks in a Pipeline each get their own pod — sharing data between Tasks requires a Workspace (typically a PersistentVolumeClaim).

```yaml
# A simple Task: run npm test
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-test
spec:
  workspaces:
    - name: source    # Where the code lives
  steps:
    - name: install
      image: node:20-alpine
      workingDir: $(workspaces.source.path)
      command: ["npm", "ci"]

    - name: lint
      image: node:20-alpine
      workingDir: $(workspaces.source.path)
      command: ["npm", "run", "lint"]

    - name: test
      image: node:20-alpine
      workingDir: $(workspaces.source.path)
      command: ["npm", "test"]
      env:
        - name: NODE_ENV
          value: test
```

Each step runs in sequence within the same pod. The `source` workspace is a shared volume mount — `npm ci` installs node_modules, and subsequent steps can use them because they share the filesystem.

## The Incremental Migration Strategy

We migrated 3 pipelines over 3 weeks, running old and new in parallel before each cutover. This was non-negotiable — simultaneous migration of all pipelines was too risky.

### Week 1: Lint + Test Pipeline (Lowest Risk)

The simplest pipeline: clone repo, install dependencies, run linter, run tests, report results. No side effects (no Docker push, no deployment).

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: lint-and-test
spec:
  params:
    - name: repo-url
      type: string
    - name: revision
      type: string
      default: main
  workspaces:
    - name: source
    - name: npm-cache
  tasks:
    - name: clone
      taskRef:
        name: git-clone    # From Tekton Catalog
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: $(params.revision)
      workspaces:
        - name: output
          workspace: source

    - name: install-and-test
      taskRef:
        name: npm-test     # Our custom Task
      runAfter: [clone]
      workspaces:
        - name: source
          workspace: source
```

We ran this in parallel with Jenkins for 1 week. Results were identical. We cut over on Friday, monitored over the weekend, and decommissioned the Jenkins lint job on Monday.

### Week 2: Docker Build + Push Pipeline

More complex — this pipeline builds a Docker image, pushes to ECR, and scans with Trivy. Side effects: an image in the registry.

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: build-and-push
spec:
  params:
    - name: repo-url
      type: string
    - name: image-tag
      type: string
    - name: dockerfile
      type: string
      default: Dockerfile
  workspaces:
    - name: source
    - name: docker-config    # ECR credentials
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
        name: kaniko         # Builds Docker images without Docker daemon
      runAfter: [clone]
      params:
        - name: IMAGE
          value: "123456789.dkr.ecr.ap-southeast-1.amazonaws.com/app:$(params.image-tag)"
        - name: DOCKERFILE
          value: $(params.dockerfile)
        - name: EXTRA_ARGS
          value:
            - "--cache=true"
            - "--cache-repo=123456789.dkr.ecr.ap-southeast-1.amazonaws.com/cache"
      workspaces:
        - name: source
          workspace: source
        - name: dockerconfig
          workspace: docker-config

    - name: scan
      taskRef:
        name: trivy-scanner
      runAfter: [build-push]
      params:
        - name: IMAGE
          value: "123456789.dkr.ecr.ap-southeast-1.amazonaws.com/app:$(params.image-tag)"
        - name: SEVERITY
          value: "CRITICAL,HIGH"
```

We use Kaniko instead of Docker-in-Docker for image builds. Kaniko runs as a regular container — no privileged mode, no Docker socket mounting. This is a significant security improvement over Jenkins, which required Docker socket access.

### Week 3: Full Deploy Pipeline with Helm

The most complex pipeline: build, push, scan, then deploy to EKS via Helm upgrade.

```yaml
    - name: deploy
      taskRef:
        name: helm-upgrade
      runAfter: [scan]
      params:
        - name: release-name
          value: my-app
        - name: chart
          value: ./helm/my-app
        - name: namespace
          value: production
        - name: values
          value: |
            image.tag=$(params.image-tag)
            image.repository=123456789.dkr.ecr.ap-southeast-1.amazonaws.com/app
      workspaces:
        - name: source
          workspace: source
        - name: kubeconfig
          workspace: kubeconfig
```

## Challenges We Hit (And How We Solved Them)

### Challenge 1: No Built-In Caching

Jenkins had a workspace that persisted between builds — node_modules from the last build were still there. Tekton pods are ephemeral. Every PipelineRun gets a fresh workspace.

**Solution**: A custom Task that saves/restores node_modules to a PVC:

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-cache-restore
spec:
  workspaces:
    - name: source
    - name: cache
  steps:
    - name: restore
      image: alpine
      script: |
        #!/bin/sh
        CACHE_KEY=$(md5sum $(workspaces.source.path)/package-lock.json | awk '{print $1}')
        CACHE_DIR="$(workspaces.cache.path)/${CACHE_KEY}"
        if [ -d "${CACHE_DIR}/node_modules" ]; then
          echo "Cache hit: ${CACHE_KEY}"
          cp -r "${CACHE_DIR}/node_modules" "$(workspaces.source.path)/"
        else
          echo "Cache miss: ${CACHE_KEY}"
        fi
```

Cache hit rate: ~85% (misses only when package-lock.json changes). Build time with cache: 3 minutes vs. 8 minutes without.

### Challenge 2: No Dashboard Notifications

Jenkins had built-in Slack notifications and Blue Ocean for visual pipeline status. Tekton has `tkn` CLI and raw Kubernetes events.

**Solution**: A Tekton EventListener that watches PipelineRun status and posts to Slack:

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: pipeline-notifications
spec:
  triggers:
    - name: notify-slack
      interceptors:
        - ref:
            name: cel
          params:
            - name: filter
              value: >-
                body.status.conditions[0].reason in ['Succeeded', 'Failed']
      bindings:
        - ref: pipeline-binding
      template:
        ref: slack-notification
```

This sends a Slack message with pipeline name, status (green check or red X), duration, and a link to the logs. Not as pretty as Blue Ocean, but functional.

### Challenge 3: Workspace Volume Management

Tekton Workspaces backed by PVCs with `ReadWriteOnce` access mode mean only one pod can use the workspace at a time. This serializes builds — no parallel PipelineRuns sharing a workspace.

**Solution**: We use `volumeClaimTemplate` instead of pre-created PVCs. Each PipelineRun gets its own dynamically provisioned PVC:

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: build-
spec:
  pipelineRef:
    name: build-and-push
  workspaces:
    - name: source
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 5Gi
          storageClassName: gp3    # EBS gp3 for fast I/O
```

The PVC is created when the PipelineRun starts and deleted when it completes. No contention, full parallelism. The trade-off: a few seconds of PVC provisioning overhead per run.

### Challenge 4: Limited Debugging

Jenkins's Blue Ocean UI showed real-time log streaming with step-by-step visualization. Tekton's debugging is `tkn logs` in the terminal.

We partially solved this with the Tekton Dashboard (a web UI that shows PipelineRuns, TaskRuns, and logs). It's not as polished as Blue Ocean, but it shows pipeline structure and real-time logs:

```bash
# Install Tekton Dashboard
kubectl apply -f https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

# Port-forward to access
kubectl port-forward svc/tekton-dashboard -n tekton-pipelines 9097:9097
```

For daily use, `tkn` CLI is fast enough:

```bash
# Watch a running pipeline
tkn pipelinerun logs build-abc123 -f

# List recent runs
tkn pipelinerun list --limit 10

# Describe a failed run
tkn pipelinerun describe build-abc123
```

## KEDA Scale-to-Zero: The Killer Feature

This is why Tekton beat GitHub Actions on cost. Tekton's controller pods and webhook pods are always running (~200MB RAM total), but the actual build pods only exist during pipeline execution.

With KEDA (Kubernetes Event-Driven Autoscaling), we scale the Tekton worker nodes to zero when no pipelines are running:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: tekton-workers
  namespace: tekton-pipelines
spec:
  scaleTargetRef:
    name: tekton-workers     # Node group or deployment
  minReplicaCount: 0
  maxReplicaCount: 5
  cooldownPeriod: 300        # 5 min after last build before scaling down
  triggers:
    - type: kubernetes-workload
      metadata:
        podSelector: "tekton.dev/pipelineRun"
        value: "1"
```

During working hours (9 AM - 7 PM), builds run frequently — worker nodes stay warm. Nights and weekends, nodes scale to zero. We only pay for compute during actual builds.

## Webhook Triggers: Git Push → PipelineRun

The final piece: automatically trigger pipelines on git push. Tekton's Triggers component listens for webhooks and creates PipelineRuns:

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: github-listener
spec:
  triggers:
    - name: push-to-main
      interceptors:
        - ref:
            name: github
          params:
            - name: secretRef
              value:
                secretName: github-webhook-secret
                secretKey: token
            - name: eventTypes
              value: ["push"]
        - ref:
            name: cel
          params:
            - name: filter
              value: "body.ref == 'refs/heads/main'"
      bindings:
        - ref: github-push-binding
      template:
        ref: build-and-deploy-template
```

GitHub sends a webhook on push to main → Tekton EventListener receives it → validates the GitHub signature → CEL filter checks it's a push to main → creates a PipelineRun with the repo URL and commit SHA as parameters.

## Results After 4 Months

- **Build time**: 30% faster on average. Jenkins had ~45 seconds of startup overhead (JVM boot, agent connection, workspace checkout). Tekton pods start in ~5 seconds.
- **Resource efficiency**: 25% improvement in cluster resource utilization. KEDA scales worker nodes to zero outside business hours. Jenkins consumed $150/month 24/7.
- **Cost savings**: Eliminated dedicated Jenkins EC2 instance ($150/month). Tekton uses existing EKS capacity — incremental cost is near-zero during business hours, zero outside.
- **Security improvement**: No Docker socket mounting (Kaniko). No Jenkins admin credentials to manage. Secrets are K8s-native.
- **Developer experience**: `tkn pipeline start build-and-push -p repo-url=... -p image-tag=...` replaces clicking through Jenkins UI. Everything is scriptable.
- **Reliability**: Zero pipeline infrastructure failures in 4 months. Jenkins had ~2 incidents/month (OOM, plugin conflicts, PV issues).

## Lessons Learned

**1. Migrate incrementally — always.** Run old and new in parallel for at least 1 week before cutting over. We caught 3 issues during parallel runs that would have been production incidents: a missing environment variable, a cache path difference, and a Docker credential format incompatibility.

**2. Tekton's learning curve is steep if your team doesn't know Kubernetes.** Tekton is powerful, but it assumes Kubernetes fluency. Concepts like PVCs, workspaces, service accounts, and RBAC are prerequisites, not things Tekton teaches you. For teams without K8s experience, GitHub Actions is a better choice.

**3. KEDA scale-to-zero is the killer feature for cost.** Our Tekton build pods only consume resources during actual builds. Nights and weekends = zero compute cost. This single feature justified the migration effort, even ignoring the reliability and DX improvements.

**4. Invest in the Tekton Catalog.** Reusable Tasks from the Tekton Catalog (`git-clone`, `kaniko`, `helm-upgrade`) saved us weeks of writing Tasks from scratch. Contribute your custom Tasks back — we open-sourced our `npm-cache-restore` Task.

**5. Kaniko over Docker-in-Docker, always.** DinD requires privileged mode — a security nightmare on shared clusters. Kaniko builds images in userspace with zero privilege escalation. The 10% build speed difference is a worthwhile trade-off for the security improvement.
