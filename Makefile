NIBBLER:=./nibbler.js

# Path in local filesystem where all gists are stored.
OUT_PATH:=../github-gists

# Alias under which the SSH connection configuration is stored.
SSH_CONF_ALIAS:=github


.PHONY: all

all:
	@[ -z $(GITHUB_USR) ] && \
		echo 'Error: `GITHUB_USR` undefined!' >& 2 && exit 2
	@[ -z $(GITHUB_TOKEN) ] && \
		echo 'Error: `GITHUB_TOKEN` undefined!' >& 2 && exit 2
	@$(NIBBLER) $(GITHUB_USR) $(GITHUB_TOKEN) $(OUT_PATH) $(SSH_CONF_ALIAS)
