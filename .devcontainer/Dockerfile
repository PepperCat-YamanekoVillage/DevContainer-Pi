FROM mcr.microsoft.com/devcontainers/python:3.12-bookworm

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Only Python is included as a project language. Node.js runs pi itself.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install --global @earendil-works/pi-coding-agent \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*


# Pueue client + daemon (official prebuilt binaries, no Rust build required).
ARG PUEUE_VERSION=4.0.4
RUN set -eux; \
  case "$(dpkg --print-architecture)" in \
  amd64) target=x86_64-unknown-linux-musl ;; \
  arm64) target=aarch64-unknown-linux-musl ;; \
  *) exit 1 ;; \
  esac; \
  for bin in pueue pueued; do \
  curl -fSL \
  --retry 5 \
  --retry-all-errors \
  --retry-delay 2 \
  --connect-timeout 15 \
  "https://github.com/Nukesor/pueue/releases/download/v${PUEUE_VERSION}/${bin}-${target}" \
  -o "/usr/local/bin/${bin}"; \
  chmod 0755 "/usr/local/bin/${bin}"; \
  done


USER vscode
ENV MISE_DATA_DIR=/home/vscode/.local/share/mise
ENV PATH=/home/vscode/.local/bin:${PATH}
RUN curl -fsSL https://mise.run | sh \
  && mkdir -p /home/vscode/.local/share/mise \
  && printf '\n# Activate project-local mise tools.\neval "$(mise activate bash)"\n' >> /home/vscode/.bashrc

WORKDIR /workspaces/project
