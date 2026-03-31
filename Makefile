# Kubernetes / Helm targets
NAMESPACE ?= meme-trader-ai
RELEASE   ?= meme-trader-ai
CHART     := ./helm/meme-trader-ai

.PHONY: k8s-create-ns k8s-deploy k8s-upgrade k8s-status k8s-logs k8s-delete helm-lint helm-dry-run

k8s-create-ns:
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -

helm-lint:
	helm lint $(CHART)

helm-dry-run:
	helm install $(RELEASE) $(CHART) --namespace $(NAMESPACE) --dry-run --debug

k8s-deploy: k8s-create-ns
	helm upgrade --install $(RELEASE) $(CHART) \
	  --namespace $(NAMESPACE) \
	  --create-namespace \
	  --wait

k8s-upgrade:
	helm upgrade $(RELEASE) $(CHART) --namespace $(NAMESPACE) --wait

k8s-status:
	kubectl get all -n $(NAMESPACE)

k8s-logs-api:
	kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/component=api -f --tail=100

k8s-logs-worker:
	kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/component=behavioral-worker -f --tail=100

k8s-delete:
	helm uninstall $(RELEASE) --namespace $(NAMESPACE)
