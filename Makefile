NIBBLER:=./nibbler.js

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
	@if [ -z $(OUT_PATH) ]; then					\
		echo 'Error: `OUT_PATH` undefined!' >& 2;	\
		exit 2;											\
	fi
	@$(NIBBLER) $(GITHUB_USR) $(GITHUB_TOKEN) $(OUT_PATH) $(SSH_CONF_ALIAS)
