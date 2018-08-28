NIBBLER:=./nibbler.js

# Path in local filesystem where all gists are stored.
OUT_PATH:=../github-gists

# Alias under which the SSH connection configuration is stored.
SSH_CONF_ALIAS:=github


.PHONY: all

all:
	@if [ -z $(GITHUB_USR) ]; then					\
		echo 'Error: `GITHUB_USR` undefined!' >& 2; \
		exit 2;										\
	fi
	@if [ -z $(GITHUB_TOKEN) ]; then					\
		echo 'Error: `GITHUB_TOKEN` undefined!' >& 2;	\
		exit 2;											\
	fi
	@$(NIBBLER) $(GITHUB_USR) $(GITHUB_TOKEN) $(OUT_PATH) $(SSH_CONF_ALIAS)
