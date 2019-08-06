#!/usr/bin/env sh

set -e -u -o pipefail

echo "KUBE_CERTIFICATE_AUTHORITY to disk"
echo -n "$KUBE_CERTIFICATE_AUTHORITY" | base64 -d > /root/.kube_certificate_authority

echo "kubectl configure cluster"
kubectl config set-cluster "$KUBE_CLUSTER" --certificate-authority="/root/.kube_certificate_authority" --server="$KUBE_SERVER"

echo "kubectl configure credentials"
kubectl config set-credentials "circleci" --token="$KUBE_TOKEN"

echo "kubectl configure context"
kubectl config set-context "circleci" --cluster="$KUBE_CLUSTER" --user="circleci" --namespace="formbuilder-repos"

echo "kubectl use circleci context"
kubectl config use-context circleci

echo "build and push docker images"
cd ~/project && ./scripts/build_platform_images.sh -p $1
