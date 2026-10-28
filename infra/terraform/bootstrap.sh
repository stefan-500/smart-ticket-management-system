#!/bin/bash
set -euo pipefail

# Infrastructure preparation only: application credentials stay out of user data.
for attempt in {1..5}; do
  if dnf install -y docker git openssl; then break; fi
  if [[ "$attempt" == 5 ]]; then exit 1; fi
  sleep 10
done
systemctl enable --now docker

# Amazon Linux supplies Docker; install the build and Compose plugins for all users.
buildx_version=v0.37.2
compose_version=v5.6.0
plugin_dir=/usr/local/lib/docker/cli-plugins
install -d -m 755 "$plugin_dir"
curl --fail --location --retry 5 \
  "https://github.com/docker/buildx/releases/download/${buildx_version}/buildx-${buildx_version}.linux-amd64" \
  -o "$plugin_dir/docker-buildx"
chmod 755 "$plugin_dir/docker-buildx"
docker buildx version
curl --fail --location --retry 5 \
  "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-linux-x86_64" \
  -o "$plugin_dir/docker-compose"
chmod 755 "$plugin_dir/docker-compose"
docker compose version

# Serial image builds plus swap keep builds practical on a demo instance.
if [[ ! -f /swapfile ]]; then
  dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile
fi
if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
  swapon /swapfile
fi
if ! grep -q '^/swapfile ' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

install -d -m 700 -o ec2-user -g ec2-user /opt/smart-ticket
